// Copyright (c) 2025 Ali Eslamdoust
// MIT License

const bcrypt = require("bcrypt");
const logger = require("./logger");

async function createHash(password) {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (err) {
    logger.error("Error in hashing password", err);
    throw err;
  }
}

async function verifyHash(password, hashedPassword) {
  try {
    const match = await bcrypt.compare(password, hashedPassword);
    return match;
  } catch (err) {
    logger.error("Error in comparing hashed passwords", err);
    throw err;
  }
}

module.exports = {
  createHash,
  verifyHash,
};
