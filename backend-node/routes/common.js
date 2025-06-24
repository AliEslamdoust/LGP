// Copyright (c) 2025 Ali Eslamdoust
// MIT License

const express = require("express");
const logger = require("../helper/logger");
const generateRandomString = require("../helper/random");
const router = express.Router();

router.get("/generate-random-number/:length", async (req, res) => {
  try {
    let length = req.params.length || 12;
    let newString = await generateRandomString(length);

    res.json({ success: true, data: newString });
  } catch (err) {
    logger.error("Error in generating new random number", err);
    let message = "There was a mistake, please try again later.";
    res.status(500).json({ success: false, message });
  }
});

module.exports = router;
