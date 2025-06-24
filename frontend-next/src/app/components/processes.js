// Copyright (c) 2025 Ali Eslamdoust
// MIT License

"use client";

import { useEffect, useRef, useState } from "react";
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

function sortProcesses(processes, sortBy, ascending = true) {
  return processes.slice().sort((a, b) => {
    let valueA = a[sortBy];
    let valueB = b[sortBy];

    if (typeof valueA === "string") {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }

    if (valueA < valueB) {
      return ascending ? -1 : 1;
    }
    if (valueA > valueB) {
      return ascending ? 1 : -1;
    }
    return 0;
  });
}

export default function Processes({ data, onProcessDialog }) {
  const [orderColumn, setOrderColumn] = useState("cpu");
  const [rows, setRows] = useState([]);
  const [isAscending, setIsAscending] = useState(false);
  const [processedData, setProcessedData] = useState([]);
  const [ramStorage, setRamStorage] = useState(0);
  const [processId, setProcessId] = useState(null);
  const [processName, setProcessName] = useState(null);
  const [confirmation, setConfirmation] = useState(false);

  const handleProcesses = () => {
    if (!data.list) {
      setProcessedData([]);
      return;
    }

    let orderedRows = new Array();
    data.list.forEach((e) => {
      orderedRows.push({
        pid: e.pid,
        name: e.name,
        cpu: e.cpu,
        mem: e.mem,
        user: e.user,
        state: e.state,
        started: e.started,
      });
    });

    setProcessedData(orderedRows);
  };

  useEffect(() => {
    if (data.ram?.length > 0) {
      let ramStorage = 0;
      data.ram.forEach((e) => {
        ramStorage += e.size;
      });
      setRamStorage(ramStorage);
    }

    handleProcesses();
  }, [data]);

  useEffect(() => {
    organizeProcesses();
  }, [orderColumn, processedData]);

  const organizeProcesses = () => {
    if (processedData.length === 0) {
      setRows(processedData);
      return;
    }

    let orderedRows = sortProcesses(processedData, orderColumn, isAscending);
    setRows(orderedRows);
  };

  const handleHeaderClick = (name) => {
    if (orderColumn === name) setIsAscending(!isAscending);
    else {
      setIsAscending(false);
      setOrderColumn(name);
    }
  };

  const dialog = useRef(null);

  const handleProcessClick = (pid, name) => {
    setProcessId(pid);
    setProcessName(name);
    onProcessDialog(pid);

    window.addEventListener("mousedown", (e) => {
      if (dialog.current && !dialog.current.contains(e.target)) {
        handlePopUpClose();
      }
    });
  };

  const handlePopUpClose = () => {
    setProcessId(null);
    setProcessName(null);
    onProcessDialog(null);

    window.removeEventListener("mousedown", handlePopUpClose);
  };

  useEffect(() => {
    const killProcess = async () => {
      const killFetch = await fetch(`${backendUrl}/api/cli/kill`, {
        method: "POST",
        body: JSON.stringify({ pid: processId }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }).then((res) => res.ok);

      if(killFetch){
        
      }
      handlePopUpClose()
    };

    if (confirmation) killProcess();
  }, [confirmation]);

  return (
    <div className="processes">
      <div
        className="kill-container"
        style={{ display: processId ? "flex" : "none" }}
      >
        <div className="kill-process" ref={dialog}>
          <h2>WARNING:</h2>
          <p>
            Terminating a process can lead to system instability, crashes, or
            data loss. Proceed with extreme caution. Are you absolutely sure you
            want to terminate process <span>{processName}</span>?
          </p>
          <div>
            <button className="cancel" onClick={handlePopUpClose}>
              Cancel
            </button>
            <button
              className="submit"
              onClick={() => {
                setConfirmation(true);
              }}
            >
              Confirm and Terminate
            </button>
          </div>
        </div>
      </div>
      <h3>Active Processes</h3>
      <div className="container">
        <table>
          <thead>
            <tr>
              <th
                onClick={() => {
                  handleHeaderClick("pid");
                }}
              >
                {orderColumn === "pid" ? (
                  <i
                    className="fa-solid fa-chevron-down"
                    style={{ transform: isAscending ? "rotate(180deg)" : "" }}
                  ></i>
                ) : (
                  ""
                )}{" "}
                Process Id
              </th>
              <th
                onClick={() => {
                  handleHeaderClick("name");
                }}
              >
                {orderColumn === "name" ? (
                  <i
                    className="fa-solid fa-chevron-down"
                    style={{ transform: isAscending ? "rotate(180deg)" : "" }}
                  ></i>
                ) : (
                  ""
                )}{" "}
                Process Name
              </th>
              <th
                onClick={() => {
                  handleHeaderClick("cpu");
                }}
              >
                {orderColumn === "cpu" ? (
                  <i
                    className="fa-solid fa-chevron-down"
                    style={{ transform: isAscending ? "rotate(180deg)" : "" }}
                  ></i>
                ) : (
                  ""
                )}{" "}
                CPU (%)
              </th>
              <th
                onClick={() => {
                  handleHeaderClick("mem");
                }}
              >
                {orderColumn === "mem" ? (
                  <i
                    className="fa-solid fa-chevron-down"
                    style={{ transform: isAscending ? "rotate(180deg)" : "" }}
                  ></i>
                ) : (
                  ""
                )}{" "}
                Memory (MB)
              </th>
              <th
                onClick={() => {
                  handleHeaderClick("state");
                }}
              >
                {orderColumn === "state" ? (
                  <i
                    className="fa-solid fa-chevron-down"
                    style={{ transform: isAscending ? "rotate(180deg)" : "" }}
                  ></i>
                ) : (
                  ""
                )}{" "}
                State
              </th>
              <th
                onClick={() => {
                  handleHeaderClick("user");
                }}
              >
                {orderColumn === "user" ? (
                  <i
                    className="fa-solid fa-chevron-down"
                    style={{ transform: isAscending ? "rotate(180deg)" : "" }}
                  ></i>
                ) : (
                  ""
                )}{" "}
                User
              </th>
              <th
                onClick={() => {
                  handleHeaderClick("started");
                }}
              >
                {orderColumn === "started" ? (
                  <i
                    className="fa-solid fa-chevron-down"
                    style={{ transform: isAscending ? "rotate(180deg)" : "" }}
                  ></i>
                ) : (
                  ""
                )}{" "}
                Started
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              if (e.pid == 0) return;

              return (
                <tr
                  key={e.pid}
                  onClick={() => {
                    handleProcessClick(e.pid, e.name);
                  }}
                >
                  <td>{e.pid}</td>
                  <td>{e.name}</td>
                  <td>{(+e.cpu).toFixed(2)}%</td>
                  <td>
                    {(e.mem * (ramStorage / (1024 * 1024) / 100)).toFixed(2)} MB
                  </td>
                  <td>{e.state === "unknown" ? "" : e.state}</td>
                  <td>{e.user}</td>
                  <td>{e.started}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// {
//     "pid": 0,
//     "parentPid": 0,
//     "name": "System Idle Process",
//     "cpu": 99.3455497382199,
//     "cpuu": 0,
//     "cpus": 99.3455497382199,
//     "mem": 0.000048448344859194574,
//     "priority": 0,
//     "memVsz": 60,
//     "memRss": 8,
//     "nice": 0,
//     "started": "2025-03-23 21:41:31",
//     "state": "unknown",
//     "tty": "",
//     "user": "",
//     "command": "System Idle Process",
//     "path": "",
//     "params": ""
// }
