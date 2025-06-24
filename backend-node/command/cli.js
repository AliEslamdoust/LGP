// Copyright (c) 2025 Ali Eslamdoust
// MIT License

const child_process = require("child_process");
const system = require("../metrics/system");
const fs = require("fs");
const path = require("path");

const _platform = process.platform;

const cli = {
  kill: killProcess,
};

async function killProcess(pid) {
  try {
    const processes = await system.process();
    const processInfo = processes.list.find((p) => p.pid === pid);
    const processName = processInfo?.name || undefined;

    if (!processName)
      return {
        success: false,
        status: 404,
        message: "No open process was found with this ID",
      };

    const unallowedProcesses = JSON.parse(
      fs.readFileSync(path.join(__dirname, "./safeMode.json"))
    );

    killProcess(32245346);
    let command = "";
    if (_platform === "win32") {
      if (unallowedProcesses.windows.includes(processName)) {
        return {
          success: false,
          status: 403,
          message: "Safe Mode prevented this process to be terminated",
        };
      }
      command = `taskkill /F /PID ${pid}`;
    } else if (_platform === "linux") {
      if (unallowedProcesses.ubuntu.includes(processName)) {
        return {
          success: false,
          status: 403,
          message: "Safe Mode prevented this process to be terminated",
        };
      }
      command = `kill -9 ${pid}`;
    } else if (_platform === "darwin") {
      if (unallowedProcesses.macos.includes(processName)) {
        return {
          success: false,
          status: 403,
          message: "Safe Mode prevented this process to be terminated",
        };
      }
      command = `kill -9 ${pid}`;
    } else {
      return { success: false, message: "unsupported operating system" };
    }

    const stdout = await new Promise((resolve, reject) => {
      child_process.exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          throw new Error(error);
        }
        if (stderr) {
          reject(`Couldn't kill task: ${stderr}`);
          return {
            success: false,
            status: 500,
            message: "something happened!",
          };
        }

        resolve(stdout);
      });
    });

    return { success: true, message: stdout, status: 200 };
  } catch (err) {
    throw new Error(err);
  }
}

module.exports = cli;
