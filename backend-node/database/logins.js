// Copyright (c) 2025 Ali Eslamdoust
// MIT License

// database handler

const logger = require("../helper/logger");
const db = require("./db");

const logins = {
  time: getLastLoginsByTime,
  order: getLastLoginsByOrder,
  record: recordLogin,
  user: getUserLogins,
  delete: deleteLoginRecords,
};

/**
 * @param {timestamp} time - The starting timestamp for retrieving user logins. Loads will be fetched from this time up to the current time.
 * @returns { object[] } An object containing an array of data objects.
 */

async function getLastLoginsByTime(time) {
  let data = {};

  try {
    await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM login WHERE time > ?`, [time], (err, res) => {
        if (err) {
          reject(new Error());
        } else {
          data = res;
          resolve();
        }
      });
    });

    return data;
  } catch (err) {
    logger.error("Error in getting last logins from database", err, time);
    throw err;
  }
}

/**
 * @param {number} length - The number of rows to retrieve.
 * @returns { object[] } An object containing an array of data objects.
 */

async function getLastLoginsByOrder(length) {
  let data = {};

  try {
    await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM login ORDER BY id DESC LIMIT ?`,
        [length],
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

    return data;
  } catch (err) {
    logger.error("Error in getting last logins from database", err, length);
    throw err;
  }
}

/**
 * @typedef {object} loginOptions - time, username, ip, success
 * @property {timestamp} time - The starting timestamp for retrieving user's logins. Loads will be fetched from this time up to the current time.
 * @property {string} username - The username of the user to retrieve their logins.
 * @property {string} ip - The IPV4 address to filter logins by. Only logins from this IPV4 address will be returned.
 * @property {string} success - The success status of the logins to retrieve. This should be either 'true' or 'false'.
 * @returns {{ timestamp: number, ip: string, success: boolean }} An object containing an array of login objects. Each login object includes the timestamp, IP address, and success status of the login attempt.
 */

async function getUserLogins(filters) {
  let data = {};
  if (!filters) filters = new Object();

  try {
    let { time, username, ip, success, userid } = filters;
    let filterQuery = "";

    let isFiltered = false;

    if (time !== undefined) {
      filterQuery += `time > ${time}`;
      isFiltered = true;
    }

    if (username !== undefined) {
      if (isFiltered) filterQuery += " AND ";
      filterQuery += `username = \"${username}\"`;
      isFiltered = true;
    }

    if (userid !== undefined) {
      if (isFiltered) filterQuery += " AND ";
      filterQuery += `userid = \"${userid}\"`;
      isFiltered = true;
    }

    if (ip !== undefined) {
      if (isFiltered) filterQuery += " AND ";
      filterQuery += `ip = \"${ip}\"`;
      isFiltered = true;
    }

    if (success !== undefined) {
      success = success ? 1 : 0;
      if (isFiltered) filterQuery += " AND ";
      filterQuery += `success = ${success}`;
    }

    if (!isFiltered) throw new Error("Input is empty, no filter found");

    await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM login WHERE ${filterQuery}`, [], (err, res) => {
        if (err) {
          reject(new Error());
        } else {
          data = res;
          resolve();
        }
      });
    });

    return data;
  } catch (err) {
    logger.error(
      "Error in getting last logins of a user from database",
      err,
      loginOptions
    );
    throw err;
  }
}

/**
 * @param {string} table - The name of the table to add the load to.
 * @param {number} load - The load value, which should be a number between 0 and 1.
 * @returns {{ success: boolean }} An object containing a success flag.
 */

async function recordLogin(userid, username, ip, success) {
  let isSuccess = true;

  try {
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT into login (userid, username, ip, time, success) VALUES (?, ?, ?, ?, ?)`,
        [userid, username, ip, Date.now(), success],
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

async function deleteLoginRecords(filters) {
  if (!filters) filters = new Object();

  try {
    let { time, username, ip, success, userid } = filters;
    let filterQuery = "";

    let isFiltered = false;

    if (time !== undefined) {
      filterQuery += `time > ${time}`;
      isFiltered = true;
    }

    if (username !== undefined) {
      if (isFiltered) filterQuery += " AND ";
      filterQuery += `username = \"${username}\"`;
      isFiltered = true;
    }

    if (userid !== undefined) {
      if (isFiltered) filterQuery += " AND ";
      filterQuery += `userid = \"${userid}\"`;
      isFiltered = true;
    }

    if (ip !== undefined) {
      if (isFiltered) filterQuery += " AND ";
      filterQuery += `ip = \"${ip}\"`;
      isFiltered = true;
    }

    if (success !== undefined) {
      success = success ? 1 : 0;
      if (isFiltered) filterQuery += " AND ";
      filterQuery += `success = ${success}`;
    }

    if (!isFiltered) throw new Error("Input is empty, no filter found");

    await new Promise((resolve, reject) => {
      db.run(`DELETE FROM login WHERE ${filterQuery}`, [], (err) => {
        if (err) {
          reject(new Error());
        } else {
          resolve();
        }
      });
    });

    return true;
  } catch (err) {
    logger.error(
      "Error in deleting user login records from database",
      err,
      filters
    );
    throw err;
  }
}

module.exports = logins;
