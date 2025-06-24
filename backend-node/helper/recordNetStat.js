// Copyright (c) 2025 Ali Eslamdoust
// MIT License

const networkDB = require("../database/network");
const network = require("../metrics/network");
const logger = require("./logger");

const recordNetStat = {
  start: startUsageInterval,
  stop: stopUsageInterval,
};

let lastNetUsage = { rxBytes: 0, txBytes: 0, interface: "" };

async function getLastNetworkUsage() {
  try {
    let data = await networkDB.last();
    if (!data)
      throw new Error(
        "Exiting the app, the last network usage was not reachable"
      );

    lastNetUsage.rxBytes = data.rx_bytes;
    lastNetUsage.txBytes = data.tx_bytes;
    lastNetUsage.interface = data.interface;

    startUsageInterval();
  } catch (err) {
    logger.error(
      "Error in setting previous network usage data to a local variable: ",
      err
    );
  }
}
getLastNetworkUsage();

async function getNetworkUsage() {
  try {
    let usage = await network.usage();
    if (!usage) return;

    processNewNetworkUsage(usage);
  } catch (err) {
    logger.error("Error getting network usage in recordNetStat", err);
  }
}

let getUsageInterval;
function startUsageInterval(timer = 30000) {
  clearInterval(getUsageInterval);
  getNetworkUsage();
  getUsageInterval = setInterval(getNetworkUsage, timer);
}

function stopUsageInterval() {
  clearInterval(getUsageInterval);
}

/**
 * @param {{ interface: string, rxBytes: number, txBytes: number}} An object containing an array of system loads objects. Each system load object includes the timestamp and the system load at that time.
 */

async function processNewNetworkUsage(data) {
  try {
    let allTimeLoad = await networkDB.total();

    if (!allTimeLoad) return;

    let newRx = data.rxBytes;
    let newTx = data.txBytes;

    if (newRx < lastNetUsage.rxBytes) {
      allTimeLoad.rx_bytes += newRx;
    } else {
      allTimeLoad.rx_bytes += newRx - lastNetUsage.rxBytes;
    }
    if (newTx < lastNetUsage.txBytes) {
      allTimeLoad.tx_bytes += newTx;
    } else {
      allTimeLoad.tx_bytes += newTx - lastNetUsage.txBytes;
    }
    allTimeLoad.interface = data.interface;

    lastNetUsage.rxBytes = data.rxBytes;
    lastNetUsage.txBytes = data.txBytes;
    lastNetUsage.interface = data.interface;

    await networkDB.update(1, allTimeLoad);
    await networkDB.update(2, {
      rx_bytes: lastNetUsage.rxBytes,
      tx_bytes: lastNetUsage.txBytes,
      interface: lastNetUsage.interface,
    });
  } catch (err) {
    logger.error("Error processing new received network usage data", err);
  }
}

module.exports = recordNetStat;
