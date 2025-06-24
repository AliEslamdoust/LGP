// Copyright (c) 2025 Ali Eslamdoust
// MIT License

const logger = require("../helper/logger");
const db = require("./db");

const metrics = {
  lastLoads: getLastLoads,
  addLoad: addNewLoad,
  deleteLoads: deleteOldLoads,
};

/**
 * @param {string} table - The name of the table to add the load to.
 * @param {timestamp} timeStart - The starting timestamp for retrieving system loads. Loads will be fetched from this time up to the timeEnd.
 * @param {timestamp} timeEnd - The ending timestamp for retrieving system loads. Loads will be fetched from timeStart up to the this time.
 * @returns {{ time: number, load: number }} An object containing an array of system loads objects. Each system load object includes the timestamp and the system load at that time.
 */

async function getLastLoads(table, timeStart = 0, timeEnd = Date.now()) {
  let data = {};

  try {
    await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM ${table} WHERE time BETWEEN ? AND ?;`,
        [timeStart, timeEnd],
        (err, res) => {
          if (err) {
            reject(new Error());
          } else {
            data = res;
            resolve();
          }
        }
      );
    });
  } catch (err) {
    logger.error(
      "Error in getting previous system loads from database",
      err,
      table,
      timeStart,
      timeEnd
    );
    throw err;
  } finally {
    return data;
  }
}

/**
 * @param {string} table - The name of the table to add the load to.
 * @param {number} load - The load value, which should be a number between 0 and 1.
 * @returns {{ success: boolean }} An object containing a success flag.
 */

async function addNewLoad(table, load) {
  let isSuccess = true;

  try {
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT into ${table} (time, load) VALUES (?, ?)`,
        [Date.now(), load],
        (err) => {
          if (err) {
            isSuccess = false;
            reject(new Error());
          } else {
            resolve();
          }
        }
      );
    });
  } catch (err) {
    logger.error(
      "Error in adding a system load record to database",
      err,
      table,
      time
    );
    isSuccess = false;
    throw err;
  } finally {
    return { success: isSuccess };
  }
}

/**
 * @param {string} table - The name of the table from which to delete loads.
 * @param {number} time - Timestamp to delete system loads older than this.
 * @returns {{ success: boolean }} An object indicating the success of the deletion operation.
 */

async function deleteOldLoads(table, time) {
  let isSuccess = true;

  try {
    await new Promise((resolve, reject) => {
      db.run(`DELETE FROM ${table} WHERE time < ?`, [time], (err) => {
        if (err) {
          isSuccess = false;
          reject(new Error());
        } else {
          resolve();
        }
      });
    });
  } catch (err) {
    logger.error(
      "Error in deleting system loads from database",
      err,
      table,
      time
    );
    isSuccess = false;
    throw err;
  } finally {
    return { success: isSuccess };
  }
}

module.exports = metrics;
