// Copyright (c) 2025 Ali Eslamdoust
// MIT License

const jwt = require("jsonwebtoken");
const logger = require("./logger");
const user = require("../database/users");

/**
 * @param {string} userid - The userid to include in the JWT payload.
 * @returns { token: string } A  JWT as a string.
 */

function generateToken(userid) {
  try {
    const payload = {
      userid: userid,
    };
    const secretKey = process.env.JWT_SECRET;
    const options = {
      expiresIn: "1h",
    };

    const token = jwt.sign(payload, secretKey, options);
    return token;
  } catch (err) {
    logger.error("There was an error in creating a new token", err);
    throw err;
  }
}

function verifyToken(token) {
  return new Promise((resolve, reject) => {
    let data = {
      success: false,
      status: 403,
      message: "Invalid authentication token",
      data: {},
    };

    try {
      if (!token) {
        data.status = 401;
        data.message = "Authentication token missing";
        resolve(data);
        return;
      }

      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          data.status = 403;
          data.message = "Invalid authentication token";
          resolve(data);
          return;
        }

        data.data = decoded;
        const userid = data.data.userid;

        user
          .getId(userid)
          .then((res) => {
            if (!res && userid !== "owner") {
              data.data = {};
              resolve(data);
              return;
            }

            data.message = "Authentication was successful.";
            data.status = 200;
            data.success = true;
            resolve(data);
          })
          .catch((dbErr) => {
            logger.error("Database error during authentication:", dbErr);
            data.status = 500;
            data.message = "Database error during authentication.";
            resolve(data);
          });
      });
    } catch (err) {
      logger.error("There was an error in checking users token: ", err);
      data.status = 500;
      data.message = "There was a mistake, please try again later.";
      resolve(data);
    }
  });
}

module.exports = { generateToken, verifyToken };
