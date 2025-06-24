// Copyright (c) 2025 Ali Eslamdoust
// MIT License

const logger = require("../helper/logger");
const db = require("./db");

const networkDB = {
  total: getAllTimeNetworkUsage,
  last: getLastNetworkUsage,
  update: updateNetworkUsage,
};

/**
 * @param {string} table - The name of the table to add the load to.
 * @param {timestamp} time - The starting timestamp for retrieving system loads. Loads will be fetched from this time up to the current time.
 * @returns {{ id: number, time: number, rx_bytes: number, tx_bytes: number, interface: string }} An object containing an array of system loads objects. Each system load object includes the timestamp and the system load at that time.
 */

async function getAllTimeNetworkUsage() {
  let data = {};

  try {
    await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM network WHERE id = 1`, [], (err, res) => {
        if (err) {
          reject(new Error());
        } else {
          data = res;
          resolve();
        }
      });
    });
  } catch (err) {
    logger.error("Error in getting all time network usage from database", err);
  } finally {
    return data;
  }
}

/**
 * @returns {{ id: number, time: number, rx_bytes: number, tx_bytes: number, interface: string }} An object containing an array of system loads objects. Each system load object includes the timestamp and the system load at that time.
 */

async function getLastNetworkUsage() {
  let data = {};

  try {
    await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM network WHERE id = 2`, [], (err, res) => {
        if (err) {
          reject(new Error());
        } else {
          data = res;
          resolve();
        }
      });
    });
  } catch (err) {
    logger.error("Error in getting last network stats from database", err);
  } finally {
    return data;
  }
}

/**
 * @param {number} rowId - id of row
 * @param {{ rx_bytes: number, tx_bytes: number, interface: string }} data - update data
 * @returns {{ success: boolean }} An object indicating the success of the update operation.
 */

async function updateNetworkUsage(rowId, data) {
  let isSuccess = true;

  try {
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE network SET rx_bytes = ?, tx_bytes = ?, interface = ?, time = ? WHERE id = ?`,
        [data.rx_bytes, data.tx_bytes, data.interface, Date.now(), rowId],
        (err) => {
          if (err) {
            reject(new Error(err));
          } else {
            resolve();
          }
        }
      );
    });
  } catch (err) {
    logger.error(
      "Error in updating network usage in database",
      err,
      rowId,
      download,
      upload,
      interface
    );
    isSuccess = false;
  } finally {
    return { success: isSuccess };
  }
}

module.exports = networkDB;
