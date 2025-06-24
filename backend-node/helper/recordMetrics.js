// Copyright (c) 2025 Ali Eslamdoust
// MIT License

const metrics = require("../database/metrics");
const system = require("../metrics/system");
const logger = require("./logger");

const recordLoadsData = {
  start: startInterval,
  stop: stopInterval,
  get: getLatestData,
};

let localLoadContainer = new Array();
let lastRetievedData;

let time = 0,
  isDoingInterval = true,
  setFullLoadTimeout;
async function getFullLoad(timer = 2000) {
  try {
    lastRetievedData = await system.currentLoad();
    localLoadContainer.push(lastRetievedData);
  } catch (err) {
    logger.error("There was an error receivinhg system information: ", err);
  } finally {
    if (time >= 60) {
      recordLoads();
    } else if (isDoingInterval) {
      setFullLoadTimeout = setTimeout(getFullLoad, timer);
    }
  }
}

let timerInterval;
function changeTimer() {
  timerInterval = setInterval(() => {
    time++;
  }, 1000);
}

function recordLoads() {
  clearTimeout(setFullLoadTimeout);
  time = 0;

  let average = {
    cpuLoad: 0,
    ramLoad: 0,
  };

  let keys = Object.keys(average);
  keys.forEach((el) => {
    localLoadContainer.forEach((e, i) => {
      average[el] += Number(e[el]);
    });

    average[el] /= localLoadContainer.length;
  });
  recordData(average);

  localLoadContainer = new Array();
  getFullLoad();
}

async function recordData(data) {
  try {
    await metrics.addLoad("cpu", data.cpuLoad.toFixed(2));
    await metrics.addLoad("memory", data.ramLoad.toFixed(2));

    deleteLoads();
  } catch (err) {
    logger.error(
      "There was an error in saving system loads data to database: ",
      err
    );
  }
}

function startInterval(timer) {
  isDoingInterval = true;
  getFullLoad(timer);
  changeTimer();
}

function stopInterval() {
  clearTimeout(setFullLoadTimeout);
  isDoingInterval = false;
  clearInterval(timerInterval);
  timer = 0;
}

async function deleteLoads() {
  try {
    let oneWeekTimestamp = Date.now() - 7 * 24 * 60 * 60 * 1000;
    await metrics.deleteLoads("cpu", oneWeekTimestamp);
    await metrics.deleteLoads("memory", oneWeekTimestamp);
  } catch (err) {
    logger.error(
      "There was an error in deleting old system loads data from database: ",
      err
    );
  }
}

function getLatestData(partName) {
  try {
    let result = new Object();

    switch (partName) {
      case "cpu":
        result = { cpuLoad: lastRetievedData.cpuLoad };
        break;

      case "ram":
        result = {
          ramUsedMB: lastRetievedData.ramUsedMB,
          ramTotal: lastRetievedData.ramTotal,
          ramLoad: lastRetievedData.ramLoad,
        };
        break;

      default:
        result = {
          cpuLoad: lastRetievedData.cpuLoad,
          ramUsedMB: lastRetievedData.ramUsedMB,
          ramTotal: lastRetievedData.ramTotal,
          ramLoad: lastRetievedData.ramLoad,
        };
        break;
    }

    return result;
  } catch (err) {
    logger.error(
      "There was an error in reading localLoadContainer",
      err,
      localLoadContainer
    );
    return null;
  }
}

module.exports = recordLoadsData;
