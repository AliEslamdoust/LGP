// Copyright (c) 2025 Ali Eslamdoust
// MIT License

const si = require("systeminformation");
const logger = require("../helper/logger");
const exec = require("child_process").exec;

const platform = process.platform;

const system = {
  currentLoad: getFullSystemLoad,
  process: getCurrentProcess,
  cpu: fullCpuDetail,
  ram: fullMemoryDetail,
  disk: fullDiskLayout,
  diskLoad: getDiskIOStats,
};

let lastData = { cpu: [0, {}], ram: [0, {}], disk: [0, {}] };

async function getDiskIOStats() {
  let data = { read: 0, write: 0 };
  try {
    if (platform === "win32") {
      const stdout = await new Promise((resolve, reject) => {
        exec(
          "wmic path Win32_PerfFormattedData_PerfDisk_PhysicalDisk get Name,DiskReadBytesPersec,DiskWriteBytesPersec /format:list",
          (error, stdout, stderr) => {
            if (error) {
              reject(error);
              return;
            }
            if (stderr) {
              reject(new Error(`CMD returned an error: ${stderr}`));
              return;
            }
            resolve(stdout);
          }
        );
      });

      const diskEntries = stdout.trim().split("\n\n");
      let totalRead = null;
      let totalWrite = null;

      for (const entry of diskEntries) {
        if (entry.includes("Name=_Total")) {
          const lines = entry.trim().split("\n");
          for (const line of lines) {
            if (line.startsWith("DiskReadBytesPersec=")) {
              totalRead = parseInt(line.split("=")[1]);
            } else if (line.startsWith("DiskWriteBytesPersec=")) {
              totalWrite = parseInt(line.split("=")[1]);
            }
          }
          break;
        }
      }

      if (totalRead === null || totalWrite === null) {
        throw new Error("Total disk I/O data not found.");
      }

      data = { read: totalRead, write: totalWrite };
    } else {
      const disksIOData = await si.disksIO();

      data = { read: disksIOData.rIO, write: disksIOData.wIO };
    }
    return data;
  } catch (error) {
    logger.error(
      "Error getting disk I/O stats:",
      error,
      "Error details: ",
      error.stack
    );
    return data;
  }
}

async function getFullSystemLoad() {
  try {
    const load = await si.currentLoad();
    const mem = await si.mem();
    const cpuLoad = load.currentLoad / 100;

    const ramUsed = mem.active / (1024 * 1024);
    const ramTotal = mem.total / (1024 * 1024);
    const ramLoad = ramUsed / ramTotal;

    return {
      cpuLoad: cpuLoad.toFixed(2),
      ramUsedMB: ramUsed.toFixed(2),
      ramTotal: ramTotal.toFixed(2),
      ramLoad: ramLoad.toFixed(2),
    };
  } catch (error) {
    logger.error("Error getting system metrics:", error);
    throw error;
  }
}

async function fullCpuDetail() {
  let data;
  try {
    if (Date.now() - lastData.cpu[0] < 24 * 60 * 60 * 1000) {
      data = lastData.cpu[1];
      return data;
    }

    const load = await si.currentLoad();
    const processData = await si.processes();
    const processCount = processData.list.length;
    const cpu = await si.cpu();

    const cpuLoad = load.currentLoad / 100;

    data = {
      cpuLoad: cpuLoad.toFixed(2),
      processCount,
      detailed: cpu,
    };

    lastData.cpu = [Date.now(), data];

    return data;
  } catch (error) {
    logger.error("Error getting cpu load:", error);
    throw error;
  }
}

async function getCurrentProcess() {
  try {
    const processData = await si.processes();

    return processData;
  } catch (error) {
    logger.error("Error getting cpu processes:", error);
    throw error;
  }
}

async function fullMemoryDetail() {
  let data;
  try {
    if (Date.now() - lastData.ram[0] < 24 * 60 * 60 * 1000) {
      data = lastData.ram[1];
      return data;
    }

    const mem = await si.mem();

    const ramUsed = mem.active / (1024 * 1024);
    const ramTotal = mem.total / (1024 * 1024);
    const ramLoad = ramUsed / ramTotal;

    const memLayout = await si.memLayout();

    data = {
      ramUsedMB: ramUsed.toFixed(2),
      ramTotal: ramTotal.toFixed(2),
      ramLoad: ramLoad.toFixed(2),
      detailed: memLayout,
    };

    lastData.ram = [Date.now(), data];

    return data;
  } catch (error) {
    logger.error("Error getting RAM load:", error);
    throw error;
  }
}

async function fullDiskLayout() {
  let data;
  try {
    if (Date.now() - lastData.disk[0] < 24 * 60 * 60 * 1000) {
      data = lastData.disk[1];
      return data;
    }
    const disk = await si.fsSize();

    let storageUsed = 0;
    let storageTotal = 0;

    let partitionDetails = new Array();

    disk.forEach((drive) => {
      let partition = {
        name: drive.fs.replace(":", ""),
        size: drive.size,
        used: drive.used,
        available: drive.available,
        use: drive.use,
      };
      partitionDetails.push(partition);

      storageUsed += drive.used;
      storageTotal += drive.size;
    });

    const storageUsedGB = storageUsed / (1024 * 1024 * 1024);
    const storageTotalGB = storageTotal / (1024 * 1024 * 1024);
    const storageLoad = storageUsed / storageTotal;

    const diskLayout = await si.diskLayout();

    data = {
      storageUsedGB: storageUsedGB.toFixed(2),
      storageTotalGB: storageTotalGB.toFixed(2),
      storageLoad: storageLoad.toFixed(2),
      partitions: partitionDetails,
      detailed: diskLayout,
    };

    lastData.disk = [Date.now(), data];

    return data;
  } catch (error) {
    logger.error("Error getting Disk load:", error);
    throw error;
  }
}

module.exports = system;
