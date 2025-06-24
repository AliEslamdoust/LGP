// Copyright (c) 2025 Ali Eslamdoust
// MIT License

"use client";

import { useEffect, useState } from "react";
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

function MetricDetails({ data, name }) {
  const [details, setDetails] = useState(null);
  const [networkStatus, setNetworkStatus] = useState([]);

  useEffect(() => {
    switch (name) {
      case "cpu":
        setDetails(
          <div className="detail-container">
            <div className="left-column">
              <div key="lc-0">
                <span>Utilization</span>
                <span>{Math.ceil((data.all?.cpuLoad || 0) * 100)}%</span>
              </div>
              <div key="lc-1">
                <span>Processes</span>
                <span>{data.all?.processes?.all || 0}</span>
              </div>
              <div key="lc-2">
                <span>Cores</span>
                <span>{data.info?.physicalCores || 0}</span>
              </div>
              <div key="lc-3">
                <span>Base Clock</span>
                <span>{data.info?.speedMin || 0} GHz</span>
              </div>
            </div>
            <div className="right-column">
              <div key="rc-0">
                <span>Logical Processors:</span>
                <span>{data.info?.cores || 0}</span>
              </div>
              {(() => {
                if (data.info?.cache?.l1i && data.info?.cache?.l1d) {
                  return (
                    <div key="rc-1">
                      <span>L1 Cache:</span>
                      <span>
                        {(
                          (data.info?.cache?.l1i + data.info?.cache?.l1d) /
                          1024 /
                          1024
                        ).toFixed(1) || 0}
                        &nbsp;MB
                      </span>
                    </div>
                  );
                }
              })()}
              {(() => {
                if (data.info?.cache?.l2) {
                  return (
                    <div key="rc-2">
                      <span>L2 Cache:</span>
                      <span>
                        {(data.info?.cache?.l2 / 1024 / 1024).toFixed(1) || 0}
                        &nbsp;MB
                      </span>
                    </div>
                  );
                }
              })()}
              {(() => {
                if (data.info?.cache?.l3) {
                  return (
                    <div key="rc-3">
                      <span>L3 Cache:</span>
                      <span>
                        {(data.info?.cache?.l3 / 1024 / 1024).toFixed(1) || 0}
                        &nbsp;MB
                      </span>
                    </div>
                  );
                }
              })()}
              {(() => {
                if (data.info?.cache?.l4) {
                  return (
                    <div key="rc-4">
                      <span>L4 Cache:</span>
                      <span>
                        {(data.info?.cache.l4 / 1024 / 1024).toFixed(1) || 0}
                        &nbsp;MB
                      </span>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        );
        break;
      case "ram":
        setDetails(
          <div className="detail-container">
            <div className="left-column">
              <div key="lc-0">
                <span>RAM Used</span>
                <span>
                  {(data.all?.ramUsedMB / 1024 || 0).toFixed(2)}&nbsp;GB
                </span>
              </div>
              <div key="lc-1">
                <span>Type</span>
                <span>{data.info[0]?.type || "Not Readable"}</span>
              </div>
            </div>
            <div className="right-column">
              <div key="rc-0">
                <span>Form Factor:</span>
                <span>{data.info[0]?.formFactor || "DIMM"}</span>
              </div>
              <div key="rc-1">
                <span>Sockets:</span>
                <span>{data.info?.length || 1}</span>
              </div>
              {(() => {
                let leastSpeed = 0;
                if (data.info[0]?.clockSpeed) {
                  data.info.forEach((e) => {
                    if (!leastSpeed) leastSpeed = e.clockSpeed;
                    leastSpeed =
                      leastSpeed < e.clockSpeed ? leastSpeed : e.clockSpeed;
                  });
                }

                return (
                  <div key="rc-2">
                    <span>Clock Speed:</span>
                    <span>{leastSpeed}&nbsp;MHz</span>
                  </div>
                );
              })()}
            </div>
          </div>
        );
        break;
      case "disk":
        setDetails(
          <div className="detail-container">
            <div className="left-column">
              {(() => {
                let names;
                if (data.info?.length > 0 && data.info[0]?.name) {
                  names = data.info.map((e, i) => (
                    <div key={"lc-" + i}>
                      <span>
                        Storage {i} -{" "}
                        {(e.type === "HD" ? "HDD (" : "SSD (") +
                          e.interfaceType +
                          ")"}
                      </span>
                      <span className="name">{e.name}</span>
                      <i>
                        {(e.type === "HD" ? "HDD (" : "SSD (") +
                          e.interfaceType +
                          ")"}
                        <br />
                        {e.name}
                      </i>
                    </div>
                  ));
                }

                return names;
              })()}
            </div>
            <div className="right-column">
              {(() => {
                let storage;
                if (data.info?.length > 0 && data.info[0]?.name) {
                  storage = data.info.map((e, i) => (
                    <div key={"rc-" + i}>
                      <span>Storage {i} Size:</span>
                      <span>
                        {Math.round(e.size / 1024 / 1024 / 1024)}&nbsp;GB
                      </span>
                    </div>
                  ));
                }

                return storage;
              })()}
            </div>
          </div>
        );
        break;
      case "network":
        let networkInfo = { ...networkStatus[0] };

        setDetails(
          <div className="detail-container">
            <div className="left-column">
              <div>
                <span>Latency</span>
                <span>{data.all?.ping || 0}&nbsp;ms</span>
              </div>
              <div>
                <span>Interface</span>
                <span>{networkInfo?.interface || ""}&nbsp;</span>
              </div>
              <div>
                <span>Total Download</span>
                <span>
                  {(networkInfo?.download / (1024 * 1024 * 1024)).toFixed(2) ||
                    0}
                  &nbsp;GB
                </span>
              </div>
              <div>
                <span>Total Upload</span>
                <span>
                  {(networkInfo?.upload / (1024 * 1024 * 1024)).toFixed(2) || 0}
                  &nbsp;GB
                </span>
              </div>
            </div>
          </div>
        );
        break;
    }
  }, [data]);

  useEffect(() => {
    const getNetworkUsage = async () => {
      let networkUsage = await fetch(
        `${backendUrl}/api/history/network-usage`,
        {
          credentials: "include",
        }
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.success) return data.data;
          else return [];
        });

      setNetworkStatus([
        {
          interface: networkUsage.interface,
          download: networkUsage.rx_bytes,
          upload: networkUsage.tx_bytes,
        },
      ]);
    };

    getNetworkUsage();
  }, [name]);

  return <div className="chart-data">{details}</div>;
}

export default MetricDetails;
