// Copyright (c) 2025 Ali Eslamdoust
// MIT License

const express = require("express");
const logger = require("../helper/logger");
const system = require("../metrics/system");
const network = require("../metrics/network");
const router = express.Router();

router.get("/current-load/:part", async (req, res) => {
  try {
    let partName = req.params.part || "";
    let data;

    switch (partName) {
      case "cpu":
        data = await system.cpu();
        break;
      case "ram":
        data = await system.ram();
        break;
      case "disk":
        data = await system.disk();
        break;

      default:
        data = await system.currentLoad();
        break;
    }

    res.json({ success: true, data });
  } catch (err) {
    logger.error("Error in getting systems current load", err);
    res.status(500).json({
      success: false,
      message: "There was a mistake, please try again later.",
    });
  }
});

router.get("/network/:option", async (req, res) => {
  try {
    let option = req.params.option || "";
    let data;

    switch (option) {
      case "interface":
        data = await network.interface();
        break;
      case "default-interface":
        data = await network.dInterface();
        break;
      case "stat":
        data = await network.stat();
        break;
      case "connections":
        data = await network.connections();
        break;
      case "ping":
        data = await network.ping();
        break;
      case "usage":
        data = await network.usage();
        break;

      default:
        data = await network.fullDetail();
        break;
    }

    res.json({ success: true, data });
  } catch (err) {
    logger.error("Error in getting network status", err);
    res.status(500).json({
      success: false,
      message: "There was a mistake, please try again later.",
    });
  }
});

module.exports = router;
