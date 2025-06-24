// Copyright (c) 2025 Ali Eslamdoust
// MIT License

const jwt = require("jsonwebtoken");
const logger = require("../helper/logger");
const user = require("../database/users");

async function authenticateToken(req, res, next) {
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  let data = { success: false, message: "Invalid authentication token" };
  let statusCode = 403;

  try {
    if (!req.cookies || !req.cookies.jwt) {
      data.message = "Authentication token missing";
      statusCode = 401;
      return res.status(statusCode).json(data);
    }

    const token = req.cookies.jwt;

    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          resolve({});
        } else {
          resolve(decoded);
        }
      });
    });

    if (!decoded) {
      return res.status(statusCode).json(data);
    }

    decoded.token = token;
    req.tokenData = decoded;

    let userid = req.tokenData.userid;
    const userData = await user.getId(userid);

    if ((!userData && userid !== "owner") || userData?.revoke) {
      res.clearCookie("jwt", {
        path: "/",
        sameSite: "none",
        secure: true,
      });
      return res.status(statusCode).json(data);
    }

    data.success = true;
    next();
  } catch (err) {
    logger.error("There was an error in checking users token: ", err);
    data.message = "There was a mistake, please try again later.";
    statusCode = 500;
    res.clearCookie("jwt", {
      path: "/",
      sameSite: "none",
      secure: true,
    });
    return res.status(statusCode).json(data);
  }
}

module.exports = authenticateToken;
