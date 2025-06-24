// Copyright (c) 2025 Ali Eslamdoust
// MIT License

// database handler

const logger = require("../helper/logger");
const db = require("./db");

const user = {
  get: getUser,
  getId: getUserById,
  update: updateUser,
  create: createUser,
  search: searchUser,
  delete: deleteUser,
  owner: getOwner,
  revokeToken: setRevokeUsersToken,
};

/**
 * @returns {object[]} An object containing an array of data objects.
 */

async function getOwner() {
  let data;

  try {
    await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE isOwner = 1`, [], (err, res) => {
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
    logger.error("Error in getting users info from database", err);
    throw err;
  }
}

/**
 * @param {string} username - The username of the user to get their information.
 * @returns {object[]} An object containing an array of data objects.
 */

async function getUser(username) {
  let data;

  try {
    await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM users WHERE username = ?`,
        [username],
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
    logger.error("Error in getting users info from database", err, username);
    throw err;
  }
}

/**
 * @param {number} userid - The id of the user to get their information.
 * @returns {object[]} An object containing an array of data objects.
 */

async function getUserById(userid) {
  let data;

  try {
    await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE id = ?`, [userid], (err, res) => {
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
    logger.error("Error in getting users info from database", err, userid);
    throw err;
  }
}

/**
 * @param {string} username - The partial username of the user to get their information.
 * @returns {object[]} An object containing an array of data objects.
 */

async function searchUser(username) {
  let data;

  try {
    await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM users WHERE username LIKE '%?%'`,
        [username],
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
    logger.error("Error in getting users info from database", err, username);
    throw err;
  }
}

/**
 * @param {string} username - The new username of the user.
 * @param {string} password - The new password of the user.
 * @param {string} userid - The id of the user.
 * @returns {{ success: boolean }} An object indicating the success of the update operation.
 */

async function updateUser(username, password, userid) {
  let isSuccess = true;

  try {
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET username = ?, password = ? WHERE id = ?`,
        [username, password, userid],
        (err) => {
          if (err) {
            reject(new Error());
          } else {
            resolve();
          }
        }
      );
    });
  } catch (err) {
    logger.error(
      "Error in updating users info in database",
      err,
      username,
      password,
      userid
    );
    isSuccess = false;
    throw err;
  } finally {
    return { success: isSuccess };
  }
}

/**
 * @param {boolean} revoke - Should users token be revoked.
 * @param {number} userid - The id of the user.
 * @returns {{ success: boolean }} An object indicating the success of the update operation.
 */

async function setRevokeUsersToken(revoke, userid) {
  let isSuccess = true;

  try {
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET revoke = ? WHERE id = ?`,
        [revoke, userid],
        (err) => {
          if (err) {
            reject(new Error());
          } else {
            resolve();
          }
        }
      );
    });
  } catch (err) {
    logger.error(
      "Error in updating users token revoke status in database",
      err,
      revoke,
      userid
    );
    isSuccess = false;
    throw err;
  } finally {
    return { success: isSuccess };
  }
}

/**
 * @param {string} username - The username of the user.
 * @param {string} password - The password of the user.
 * @returns {{ success: boolean }} An object indicating the success of the operation.
 */

async function createUser(username, password, isOwner) {
  let isSuccess = true;
  if (!isOwner) isOwner = false;

  try {
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT into users (username, password, isOwner) VALUES (?, ?, ?)`,
        [username, password, isOwner],
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
      "Error in adding a new user to database",
      err,
      username,
      password
    );
    isSuccess = false;
    throw err;
  } finally {
    return { success: isSuccess };
  }
}

/**
 * @param {number} userid - The id of the user.
 * @returns {{ success: boolean }} An object indicating the success of the operation.
 */

async function deleteUser(userid) {
  let isSuccess = true;

  try {
    await new Promise((resolve, reject) => {
      db.run(`DELETE FROM users WHERE id = ?`, [userid], (err) => {
        if (err) {
          isSuccess = false;
          reject(new Error());
        } else {
          resolve();
        }
      });
    });
  } catch (err) {
    logger.error("Error in deleting user from database", err, userid);
    isSuccess = false;
    throw err;
  } finally {
    return { success: isSuccess };
  }
}

module.exports = user;
