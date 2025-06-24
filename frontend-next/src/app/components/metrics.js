// Copyright (c) 2025 Ali Eslamdoust
// MIT License

"use client";

import { useEffect, useRef, useState } from "react";
import WithAuth from "./withAuth";
import MetricDetails from "./metricDetails";
import MetricHistory from "./metricHistory";
import Processes from "./processes";
import ChartMaker from "./chart";
import { LargestBit } from "../lib/utils";
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const backendWS = process.env.NEXT_PUBLIC_BACKEND_WS;

function Metrics() {
  const ws = useRef(null);
  const [processData, setProcessData] = useState(false);
  const [metricPart, setMetricPart] = useState("cpu");
  const [partDetails, setPartDetails] = useState([]);
  const [diskDetails, setDiskDetails] = useState([]);
  const [ramDetails, setRamDetails] = useState([]);
  const [chartName, setChartName] = useState(null);
  const [metric, setMetric] = useState([]);
  const [maxValue, setMaxValue] = useState(100);

  // useEffect hook to manage WebSocket connection and data handling
  useEffect(() => {
    if (metricPart === "cpu") {
      let fetchUrl = `${backendUrl}/api/metrics/current-load/ram`;

      fetch(fetchUrl, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setRamDetails([data.data?.detailed || ""]);
          }
        })
        .catch((err) => console.log(err));
    }

    ws.current = new WebSocket(`${backendWS}?part=${metricPart}`);

    ws.current.onopen = () => {
      setMetric([]);

      setTimeout(() => {
        sendData({ action: "start" });
      }, 500);
      getPartDetails();
    };

    ws.current.onmessage = handleMessage;

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [metricPart]);

  // Function to handle messages received from the WebSocket
  const handleMessage = (event) => {
    let result = JSON.parse(event.data);
    setProcessData([result.data]);

    if (!result) return;
    setMetric((prevMetric) => {
      const newMetric = [...prevMetric];

      if (newMetric.length >= 60) {
        newMetric.shift();
      }

      switch (metricPart) {
        case "ram":
          newMetric.push(result.data.ramLoad);
          break;
        case "disk":
          // for ease of use, read is set to down and write is set to up
          let diskData = {
            up: +result.data.write * 1024,
            down: +result.data.read * 1024,
          };
          newMetric.push(diskData);
          break;

        case "cpu":
          newMetric.push(result.data.cpuLoad);
          break;

        case "network":
          let networkData = {
            up: +result.data.upload / 1024,
            down: +result.data.download / 1024,
          };
          newMetric.push(networkData);

          break;
      }

      return newMetric;
    });
  };

  // useEffect to update max value for network/disk charts when new data arrives
  useEffect(() => {
    function handleNewNetworkMax() {
      let tempMax = LargestBit(metric);

      setMaxValue(tempMax === 0 ? 1 : tempMax);
    }

    if (metricPart === "network" || metricPart === "disk")
      handleNewNetworkMax();
  }, [metric]);

  let timer = 0;
  setInterval(() => {
    timer++;
  }, 1000);

  const sendData = (object) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(object));
    }
  };

  const getPartDetails = () => {
    let fetchUrl = `${backendUrl}/api/metrics/current-load/`;
    switch (metricPart) {
      case "ram":
        fetchUrl += "ram";
        break;
      case "disk":
        fetchUrl += "disk";
        break;

      case "cpu":
        fetchUrl += "cpu";
        break;

      case "network":
        fetchUrl = `${backendUrl}/api/metrics/network/default-interface`;
        break;
    }

    fetch(fetchUrl, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (metricPart === "network") {
            setPartDetails([data.data]);
          } else {
            setPartDetails([data.data.detailed]);
          }
          if (metricPart === "disk") {
            setDiskDetails(
              [
                {
                  load: data.data.storageLoad,
                  total: data.data.storageTotalGB,
                  used: data.data.storageUsedGB,
                },
              ] || []
            );
          }
        }
      })
      .catch((err) => console.log(err));
  };

  // useEffect to set chart name and labels based on selected metric part
  useEffect(() => {
    if (!partDetails[0]) return;

    switch (metricPart) {
      case "ram":
        let size = 0;
        for (let i = 0; i < partDetails[0].length; i++) {
          size += partDetails[0][i].size;
        }
        size = (size / (1024 * 1024 * 1024)).toFixed(1);
        setChartName(
          <div className="chart-header">
            <h3>Memory</h3>
            <span>{size} GB</span>
          </div>
        );
        break;
      case "disk":
        const names = partDetails[0].map((detail) => (
          <span key={detail.name}>{detail.name}</span>
        ));

        setChartName(
          <div className="chart-header">
            <h3>Storage</h3>
            <div className="chart-info-wrapper">
              <div className="storage-name">
                <span>{partDetails[0].length} Storage Units</span>
                <div>{names}</div>
              </div>
              <div className="chart-info">
                <span className="up">Write</span>
                <span className="down">Read</span>
              </div>
            </div>
          </div>
        );
        break;

      case "cpu":
        setChartName(
          <div className="chart-header">
            <h3>Processor</h3>
            <span>{partDetails[0].brand}</span>
          </div>
        );
        break;
      case "network":
        setChartName(
          <div className="chart-header">
            <h3>Network</h3>
            <div className="chart-info-wrapper">
              <span>{partDetails[0]}</span>
              <div className="chart-info">
                <span className="up">Upload</span>
                <span className="down">Download</span>
              </div>
            </div>
          </div>
        );
        break;
    }
  }, [partDetails]);

  const handlePartChange = (name) => {
    setMetricPart(name);
  };

  const [stopWS, setStopWS] = useState(false);
  const handleProcessDialog = (data) => {
    setStopWS(!!data);
  };

  useEffect(() => {
    if (!ws.current) return;

    if (stopWS) {
      sendData({ action: "stop" });
    } else {
      sendData({ action: "start" });
    }
  }, [stopWS]);

  return (
    <div className="metrics-container">
      <div className="chart-wrapper">
        {chartName}
        <div key="cw-t" className="top-info table-info">
          <span>
            {(() => {
              if (metricPart === "network" || metricPart === "disk") {
                if (maxValue > 1000000) {
                  return `${Math.ceil(maxValue / (1024 * 1024))} Gbps`;
                } else if (maxValue > 1000) {
                  return `${Math.ceil(maxValue / 1024)} Mbps`;
                } else {
                  return `${maxValue} Kbps`;
                }
              } else {
                return "100%";
              }
            })()}
          </span>
        </div>
        <div key="cw-c" className="chart-container">
          <ChartMaker data={metric} partName={metricPart} />
        </div>
        <div key="cw-b" className="bottom-info table-info">
          <span>60 Intervals</span>
          <span>0</span>
        </div>
        <MetricDetails
          key="cw-d"
          data={{ info: partDetails[0], all: processData[0] }}
          name={metricPart}
        />
      </div>
      <div className="choose-part">
        <div
          key="cp-0"
          className={"part-logo" + (metricPart === "cpu" ? " active" : "")}
          onClick={() => {
            handlePartChange("cpu");
          }}
        >
          <span>
            <i className="fa-solid fa-microchip"></i>
          </span>
          <span>Processor</span>
        </div>
        <div
          key="cp-1"
          className={"part-logo" + (metricPart === "ram" ? " active" : "")}
          onClick={() => {
            handlePartChange("ram");
          }}
        >
          <span>
            <i className="fa-solid fa-memory"></i>
          </span>
          <span>Memory</span>
        </div>
        <div
          key="cp-2"
          className={"part-logo" + (metricPart === "disk" ? " active" : "")}
          onClick={() => {
            handlePartChange("disk");
          }}
        >
          <span>
            <i className="fa-solid fa-floppy-disk"></i>
          </span>
          <span>Storage</span>
        </div>
        <div
          key="cp-3"
          className={"part-logo" + (metricPart === "network" ? " active" : "")}
          onClick={() => {
            handlePartChange("network");
          }}
        >
          <span>
            <i className="fa-solid fa-network-wired"></i>
          </span>
          <span>Network</span>
        </div>
      </div>
      <MetricHistory name={metricPart} diskData={diskDetails} />
      {metricPart === "cpu" || metricPart === "ram" ? (
        <Processes
          data={{
            ...(processData[0]?.processes || undefined),
            ram: ramDetails[0],
          }}
          onProcessDialog={handleProcessDialog}
        />
      ) : (
        ""
      )}
    </div>
  );
}

export default WithAuth(Metrics);
