// Copyright (c) 2025 Ali Eslamdoust
// MIT License

const crypto = require("crypto");

async function generateRandomString(length) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  const charsetLength = charset.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charsetLength);
    password += charset.charAt(randomIndex);
  }

  return password;
}

module.exports = generateRandomString;
