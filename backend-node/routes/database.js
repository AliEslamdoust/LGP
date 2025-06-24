// Copyright (c) 2025 Ali Eslamdoust
// MIT License

const express = require("express");
const logger = require("../helper/logger");
const logins = require("../database/logins");
const user = require("../database/users");
const metrics = require("../database/metrics");
const networkDB = require("../database/network");
const system = require("../metrics/system");
const router = express.Router();

router.get("/all-logins", async (req, res) => {
  try {
    let loginsData = await logins.time(0);

    res.json({ success: true, data: loginsData });
  } catch (err) {
    logger.error("Error in getting previous login records", err);
    message = "There was a mistake, please try again later.";
    res.status(500).json({ success: false, message });
  }
});

router.get("/last-logins", async (req, res) => {
  try {
    let loginsData = await logins.order(50);

    res.json({ success: true, data: loginsData });
  } catch (err) {
    logger.error("Error in getting previous login records", err);
    message = "There was a mistake, please try again later.";
    res.status(500).json({ success: false, message });
  }
});

router.post("/user-logins", async (req, res) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ success: false, message: "Request body is missing." });
    }

    let { userid, username, ip, time, success } = req.body;

    if (
      userid === undefined &&
      username === undefined &&
      !ip &&
      !time &&
      success === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one filter parameter is required.",
      });
    }

    let filters = {};
    if (userid !== undefined) {
      filters.userid = userid;
    }
    if (username !== undefined) {
      filters.username = username;
    }
    if (ip !== undefined) {
      filters.ip = ip;
    }
    if (time !== undefined) {
      filters.time = time;
    }
    if (success !== undefined) {
      filters.success = success;
    }

    let loginsData = await logins.user(filters);

    res.json({ success: true, data: loginsData });
  } catch (err) {
    logger.error("Error in getting previous login records", err);
    message = "There was a mistake, please try again later.";
    res.status(500).json({ success: false, message });
  }
});

router.get("/user/:username", async (req, res) => {
  try {
    let partialUsername = req.params.username || "";

    let searchUsers = await user.search(partialUsername);

    res.json({ success: true, data: searchUsers });
  } catch (err) {
    logger.error("Error in getting users with this username", err);
    let message = "There was a mistake, please try again later.";
    res.status(500).json({ success: false, message });
  }
});

router.get("/load-records/:part", async (req, res) => {
  let data = { success: true, data: {} };

  try {
    let part = req.params.part || "";

    const start = req.query.start;
    const end = req.query.end;
    const timeStart = Number(start) || 0;
    const timeEnd = Number(end) || Date.now();

    switch (part) {
      case "cpu":
        data.data = await metrics.lastLoads("cpu", timeStart, timeEnd);
        break;
      case "ram":
        data.data = await metrics.lastLoads("memory", timeStart, timeEnd);
        break;
      case "disk":
        data.data = await system.disk()
        break;
    }

    res.json(data);
  } catch (err) {
    console.log(err);

    logger.error("Error in getting systems load record", err);
    data.message = "There was a mistake, please try again later.";
    data.success = false;
    res.status(500).json(data);
  }
});

router.delete("/delete-login-records", async (req, res) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ success: false, message: "Request body is missing." });
    }

    let { userid, username, ip, time, success } = req.body;

    if (
      userid === undefined &&
      username === undefined &&
      !ip &&
      !time &&
      success === undefined
    ) {
      console.log("ok");

      return res.status(400).json({
        success: false,
        message: "At least one filter parameter is required.",
      });
    }

    let filters = {};
    if (userid !== undefined) {
      filters.userid = userid;
    }
    if (username !== undefined) {
      filters.username = username;
    }
    if (ip !== undefined) {
      filters.ip = ip;
    }
    if (time !== undefined) {
      filters.time = time;
    }
    if (success !== undefined) {
      filters.success = success;
    }

    await logins.delete(filters);

    res.json({ success: true, message: "Login records deleted" });
  } catch (err) {
    logger.error("Error in deleting previous login records", err);
    let message = "There was a mistake, please try again later.";
    res.status(500).json({ success: false, message });
  }
});

router.get("/network-usage", async (req, res) => {
  let data = { success: true, data: {} };

  try {
    data.data = (await networkDB.total()) || {};

    res.json(data);
  } catch (err) {
    logger.error("Error in getting network total usage", err);
    data.message = "There was a mistake, please try again later.";
    data.success = false;
    res.status(500).json(data);
  }
});

module.exports = router;
