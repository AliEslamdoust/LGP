// Copyright (c) 2025 Ali Eslamdoust
// MIT License

const rateLimit = require("express-rate-limit");
const cli = require("../command/cli");
const logger = require("../helper/logger");
const express = require("express");
const router = express.Router();

const extremeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many requests, please try again later.",
});
router.use(extremeLimiter);

router.post("/kill", async (req, res) => {
  try {
    let pid = req.body?.pid || undefined;
    if (!pid) {
      res.status(400).json({
        success: false,
        message: "Please enter a valid PID.",
      });
      return;
    }

    const result = await cli.kill(pid);
    res
      .status(result.status)
      .json({ success: result.success, message: result.message });
  } catch (err) {
    logger.error("Error in killing a process, error in router:", err);
    res.status(500).json({
      success: false,
      message: "There was a mistake, please try again later.",
    });
  }
});

module.exports = router;
