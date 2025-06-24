// Copyright (c) 2025 Ali Eslamdoust
// MIT License

"use client";

import { useEffect, useState } from "react";
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

function getTimestampsForPastWeek() {
  const timestamps = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() - i); // Go back i days
    day.setHours(0, 0, 0, 0); // Set to start of day

    timestamps.push(day.getTime());
  }

  return timestamps.reverse(); // Reverse to get timestamps in chronological order
}

function getLast7DaysStrings() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayString = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    days.push(dayString);
  }

  return days.reverse();
}

function calculateAverage(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return 0; // Return 0 for empty arrays or invalid input
  }

  let sum = 0;
  let validLength = arr.length;
  for (let i = 0; i < arr.length; i++) {
    const num = Number(arr[i]); // Coerce to number, handle non-numeric values
    if (isNaN(num)) {
      validLength--;
      continue;
    }
    sum += num;
  }

  return sum / validLength;
}

function MetricHistory({ name, diskData }) {
  const [history, setHistory] = useState(null);
  const [orderedHistory, setOrderedHistory] = useState(null);
  const pastWeekTimestamps = getTimestampsForPastWeek();
  const [fullDetails, setFullDetails] = useState(null);
  const [avgLoad, setAvgLoad] = useState(0);

  useEffect(() => {
    if (name === "network") {
      setFullDetails("");
      return;
    }
    getHistory(pastWeekTimestamps[0]);
  }, [name, diskData]);

  const getHistory = async (lastWeekTimestamp) => {
    let fetchUrl;
    if (name === "disk") fetchUrl = `${backendUrl}/api/history/disk`;
    else
      fetchUrl = `${backendUrl}/api/history/load-records/${name}?start=${lastWeekTimestamp}`;

    let historyRecord;
    if (name === "disk" && diskData) {
      historyRecord = [...diskData];
    } else {
      historyRecord = await fetch(fetchUrl, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) return data.data;
          else return [];
        });
    }

    setHistory([historyRecord]);
  };

  useEffect(() => {
    if (history) orderRecords();
  }, [history]);

  const orderRecords = () => {
    let weekDayString = getLast7DaysStrings();
    let weekDay = weekDayString.map((e) => {
      return e.split(",")[0];
    });
    let weekDate = weekDayString.map((e) => {
      return e.split(", ")[1];
    });

    if (name === "disk") {
      setOrderedHistory(history);
      return;
    }

    let newRecord = new Array();
    let averageLoadContainer = new Array();
    weekDayString.forEach((e, i) => {
      newRecord.push({ day: weekDay[i], date: weekDate[i], avg: 0 });

      let timestamp = pastWeekTimestamps[i];
      let timestampAfterDay = timestamp + 24 * 60 * 60 * 1000;
      let allRecords = [];
      history[0].forEach((e) => {
        if (e.time >= timestamp && e.time < timestampAfterDay) {
          allRecords.push(Math.round(e.load * 100));
        }
      });

      let averageLoad = calculateAverage(allRecords);
      averageLoadContainer.push(averageLoad);

      newRecord[newRecord.length - 1].avg = averageLoad.toFixed(2);
    });

    setAvgLoad(calculateAverage(averageLoadContainer).toFixed(2));
    setOrderedHistory(newRecord);
  };

  useEffect(() => {
    if (orderedHistory) makeChart();
  }, [orderedHistory]);

  const makeChart = () => {
    let maxLoad = 0;
    if (name === "cpu" || name === "ram") {
      orderedHistory.forEach((e) => {
        maxLoad = Math.max(maxLoad, e.avg);
      });
      maxLoad = Math.ceil(maxLoad);
    }

    switch (name) {
      case "cpu":
        setFullDetails(
          <div className="metric-history chart">
            <div className="header">
              <h3>CPU Load history</h3>
              <div className="avg-amount">
                <span>Average load:&nbsp;</span>
                <span>{avgLoad}%</span>
              </div>
            </div>
            <div className="chart-container">
              <div className="chart-row">
                <span>{maxLoad}%</span>
                <span>{((maxLoad / 4) * 3).toFixed(2)}%</span>
                <span>{((maxLoad / 4) * 2).toFixed(2)}%</span>
                <span>{((maxLoad / 4) * 1).toFixed(2)}%</span>
                <span>0</span>
              </div>
              <div className="chart">
                {orderedHistory.map((e, i) => {
                  return (
                    <div
                      key={"chartPoint-" + i}
                      className="chart-point"
                      style={{
                        height: `${(e.avg / maxLoad) * 100}%`,
                      }}
                    >
                      <span>{e.avg}</span>
                    </div>
                  );
                })}
                <div className="row-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className="chart-footer">
                {orderedHistory.map((e, i) => {
                  let today = orderedHistory.length - 1 === i ? "Today" : e.day;
                  return (
                    <span key={"footer-point-" + i} className="footer-point">
                      {today}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        );
        break;
      case "ram":
        setFullDetails(
          <div className="metric-history chart">
            <div className="header">
              <h3>RAM Load history</h3>
              <div className="avg-amount">
                <span>Average load:&nbsp;</span>
                <span>{avgLoad}&nbsp;GB</span>
              </div>
            </div>
            <div className="chart-container">
              <div className="chart-row">
                <span>{maxLoad}%</span>
                <span>{((maxLoad / 4) * 3).toFixed(1)}%</span>
                <span>{((maxLoad / 4) * 2).toFixed(1)}%</span>
                <span>{((maxLoad / 4) * 1).toFixed(1)}%</span>
                <span>0</span>
              </div>
              <div className="chart">
                {orderedHistory.map((e, i) => {
                  return (
                    <div
                      key={"chartPoint-" + i}
                      className="chart-point"
                      style={{
                        height: `${(e.avg / maxLoad) * 100}%`,
                      }}
                    >
                      <span>{e.avg}</span>
                    </div>
                  );
                })}
                <div className="row-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className="chart-footer">
                {orderedHistory.map((e, i) => {
                  let today = orderedHistory.length - 1 === i ? "Today" : e.day;
                  return (
                    <span key={"footer-point-" + i} className="footer-point">
                      {today}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        );
        break;
      case "disk":
        let diskInfo = { ...orderedHistory[0][0] };

        if (!diskInfo) return;

        setFullDetails(
          <div className="metric-history">
            <div className="header">
              <h3>Disk Load</h3>
            </div>
            <div className="disk-chart-container">
              <span className="disk-name">Storage Usage</span>
              <div className="disk-load">
                <span
                  className="load"
                  style={{
                    width: `${eval(diskInfo.load * 100)}%`,
                  }}
                ></span>
              </div>
              <div className="disk-info">
                {eval(diskInfo.total - diskInfo.used).toFixed(1)}
                &nbsp;GB free of&nbsp;
                {Math.round(eval(diskInfo.total))}
                &nbsp;GB
              </div>
            </div>
          </div>
        );
        break;
    }
  };

  return fullDetails;
}

export default MetricHistory;
