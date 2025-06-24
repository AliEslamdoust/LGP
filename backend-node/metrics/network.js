// Copyright (c) 2025 Ali Eslamdoust
// MIT License

const si = require("systeminformation");

const logger = require("../helper/logger");

const network = {
  interface: getNetworkInterfaces,
  dInterface: getDefaultNetworkInterface,
  stat: getNetworkStats,
  connections: getNetworkConnections,
  ping: getInternetLatency,
  usage: getDefaultInterfaceNetworkUsage,
  fullDetail: getAllNetworkInfo,
};

async function getNetworkInterfaces() {
  try {
    return await si.networkInterfaces();
  } catch (e) {
    logger.error("Error getting network interfaces:", e);
    return null;
  }
}

async function getDefaultNetworkInterface() {
  try {
    return await si.networkInterfaceDefault();
  } catch (e) {
    logger.error("Error getting network interfaces:", e);
    return null;
  }
}

async function getNetworkStats() {
  try {
    return await si.networkStats();
  } catch (e) {
    logger.error("Error getting network stats:", e);
    return null;
  }
}

async function getNetworkConnections() {
  try {
    return await si.networkConnections();
  } catch (e) {
    logger.error("Error getting network connections:", e);
    return null;
  }
}

async function getInternetLatency(host = "8.8.8.8") {
  try {
    const latency = await si.inetLatency(host);
    return latency;
  } catch (e) {
    logger.error(`Error getting internet latency to ${host}:`, e);
    return null;
  }
}

async function getInternetSpeed(maxTime = 5000) {
  let data = { upload: 0, download: 0, ping: 0 };
  try {
    speedTest({ maxTime }, (err, speedData) => {
      data.download = speedData.speeds.download;
      data.upload = speedData.speeds.upload;
      data.ping = speedData.server.ping;
      if (err) {
        logger.error("Error getting internet speed: ", err);
        return data;
      }
    });

    return data;
  } catch (e) {
    logger.error("Error getting internet speed:", e);
    return data;
  }
}

async function getDefaultInterfaceNetworkUsage() {
  let data = {
    interface: 0,
    rxBytes: 0,
    txBytes: 0,
    rxDropped: 0,
    txDropped: 0,
    rxErrors: 0,
    txErrors: 0,
  };

  try {
    const defaultInterface = await si.networkInterfaceDefault();
    data.interface = defaultInterface;
    const networkStats = await si.networkStats(defaultInterface);

    if (networkStats && networkStats.length > 0) {
      const stats = networkStats[0];

      if (!stats) {
        return data;
      }

      data = {
        interface: defaultInterface,
        rxBytes: stats.rx_bytes,
        txBytes: stats.tx_bytes,
        rxDropped: stats.rx_dropped,
        txDropped: stats.tx_dropped,
        rxErrors: stats.rx_errors,
        txErrors: stats.tx_errors,
      };

      return data;
    } else {
      logger.error("No network stats available.");
      return data;
    }
  } catch (error) {
    logger.error("Error getting default interface network usage:", error);
    return data;
  }
}

async function getAllNetworkInfo() {
  try {
    const interfaces = await getNetworkInterfaces();
    const stats = await getNetworkStats();
    const connections = await getNetworkConnections();
    const latency = await getInternetLatency();
    const speed = await getInternetSpeed();
    const totalData = await getTotalDataTransferred();

    return {
      interfaces,
      stats,
      connections,
      latency,
      speed,
      totalData,
    };
  } catch (e) {
    logger.error("Error getting all network info:", e);
    return null;
  }
}

module.exports = network;
