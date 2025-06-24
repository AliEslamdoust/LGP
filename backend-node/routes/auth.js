// Copyright (c) 2025 Ali Eslamdoust
// MIT License

const express = require("express");
const rateLimit = require("express-rate-limit");
const user = require("../database/users");
const logger = require("../helper/logger");
const { verifyHash, createHash } = require("../helper/passEncryption");
const { generateToken } = require("../helper/jwt");
const authenticateToken = require("../middlewares/jwt_auth");
const logins = require("../database/logins");
const router = express.Router();

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Or even lower, e.g., 5
  message: "Too many requests, please try again later.",
});

router.use(generalLimiter);

router.post(
  "/register-owner",
  sensitiveLimiter,
  authenticateToken,
  async (req, res) => {
    let data = { success: false, message: "" };

    try {
      let getOwner = await user.owner();
      if (getOwner) {
        return res
          .status(401)
          .json({ success: false, message: "An owner has already been set" });
      }

      if (req.tokenData?.userid != "owner")
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized Access" });

      if (!req.body || !req.body.username || !req.body.password) {
        data.message = "Missing username or password";
        return res.status(400).json(data);
      }

      const { username, password } = req.body;
      let passwordHash = await createHash(password);

      let addUser = await user.create(username, passwordHash, true);
      if (!addUser.success) {
        data.message = "Please try again, there was an error in registering.";
        return res.status(500).json(data);
      }

      let getNewUser = await user.get(username);

      let jwt_token = generateToken(getNewUser.id);

      res.cookie("jwt", jwt_token, {
        path: process.env.COOKIE_PATH,
        httpOnly: process.env.COOKIE_HTTP,
        secure: process.env.COOKIE_SECURE,
        sameSite: process.env.COOKIE_SAME_SITE,
        maxAge: process.env.COOKIE_AGE,
      });

      data.message = "New Owner has been set.";
      data.success = true;
      res.json(data);
    } catch (err) {
      logger.error("Error in registering user", err);
      data.message = "There was a mistake, please try again later.";
      res.status(500).json(data);
    }
  }
);

router.post("/login", sensitiveLimiter, async (req, res) => {
  let message = "";
  let data = { id: 0, username: "", ip: "", success: true };

  try {
    const ip =
      req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    data.ip = ip;

    if (!req.body || !req.body.username || !req.body.password) {
      message = "Missing username or password";
      data.success = false;
      return res.status(400).json({ success: false, message });
    }

    const { username, password } = req.body;

    let getOwner = await user.owner();
    if (
      username === process.env.OWNER_KEY &&
      password === process.env.OWNER_KEY &&
      !getOwner
    ) {
      let jwt_token = generateToken("owner");

      res.cookie("jwt", jwt_token, {
        path: process.env.COOKIE_PATH,
        httpOnly: process.env.COOKIE_HTTP,
        secure: process.env.COOKIE_SECURE,
        sameSite: process.env.COOKIE_SAME_SITE,
        maxAge: process.env.REGISTER_COOKIE_AGE,
      });

      return res.json({
        success: true,
        redirect: true,
        message:
          "/register-owner access token has been created. Expiration: 15Mins",
      });
    }

    data.username = username;

    let userdata = await user.get(username);

    if (!userdata || !userdata.password) {
      message = "Username or Password was incorrect";
      data.success = false;
      return res.status(401).json({ success: false, message });
    }

    data.id = userdata.id;

    let verifyPassword = await verifyHash(password, userdata.password);

    if (!verifyPassword) {
      message = "Username or Password was incorrect";
      data.success = false;
      return res.status(401).json({ success: false, message });
    }

    let jwt_token;
    if (verifyPassword) {
      jwt_token = generateToken(userdata.id);
    }
    message = "Verification was successful";

    res.cookie("jwt", jwt_token, {
      path: process.env.COOKIE_PATH,
      httpOnly: process.env.COOKIE_HTTP,
      secure: process.env.COOKIE_SECURE,
      sameSite: process.env.COOKIE_SAME_SITE,
      maxAge: process.env.COOKIE_AGE,
    });

    res.json({ success: true, message });
  } catch (err) {
    logger.error("Error in logging in", err);
    message = "There was a mistake, please try again later.";
    data.success = false;
    res.status(500).json({ success: false, message });
  } finally {
    logins.record(data.id, data.username, data.ip, data.success);
  }
});

router.post(
  "/revoke-user-token",
  sensitiveLimiter,
  authenticateToken,
  async (req, res) => {
    let data = { success: false, message: "" };

    try {
      if (!req.body || !req.body.userid) {
        data.message = "Missing users id";
        return res.status(400).json({ success: false, message });
      }

      const { userid } = req.body;

      let revokeUserToken = user.revokeToken(userid);
      if (!revokeUserToken.success) {
        throw new Error();
      }

      message = "user token revoked successfully";
      res.json({ success: true, message });
    } catch (err) {
      logger.error("Error in revoking users token", err);
      data.message = "There was a mistake, please try again later.";
      res.status(500).json(data);
    }
  }
);

router.delete(
  "/remove-user",
  sensitiveLimiter,
  authenticateToken,
  async (req, res) => {
    let data = { success: false, message: "" };

    try {
      if (!req.body || !req.body.userid) {
        data.message = "Missing Info";
        return res.status(400).json(data);
      }

      const { userid } = req.body;

      let deleteUser = await user.delete(userid);
      if (!deleteUser.success) {
        data.message = "Couldn't remove user at the moment";
        return res.status(500).json(data);
      }

      data.success = true;
      data.message = "Successfully removed user from database.";
      res.json(data);
    } catch (err) {
      logger.error("Error in deleting user", err);
      data.message = "There was a mistake, please try again later.";
      res.status(500).json(data);
    }
  }
);

router.post(
  "/signup",
  sensitiveLimiter,
  authenticateToken,
  async (req, res) => {
    let data = { success: false, message: "" };

    try {
      if (!req.body || !req.body.username || !req.body.password) {
        data.message = "Missing username or password";
        return res.status(400).json(data);
      }

      const { username, password } = req.body;
      let passwordHash = await createHash(password);

      let addUser = await user.create(username, passwordHash);
      if (!addUser.success) {
        data.message = "Couldn't sign up a new user at the moment";
        return res.status(500).json(data);
      }

      data.success = true;
      data.message = "Added new user to database. They can login now.";
      res.json(data);
    } catch (err) {
      logger.error("Error in signing users up", err);
      data.message = "There was a mistake, please try again later.";
      res.status(500).json(data);
    }
  }
);

router.put(
  "/changeInfo",
  sensitiveLimiter,
  authenticateToken,
  async (req, res) => {
    let data = { success: false, message: "" };

    try {
      if (
        !req.body ||
        !req.body.userid ||
        !req.body.username ||
        !req.body.password
      ) {
        data.message = "Missing Info";
        return res.status(400).json(data);
      }

      const { username, password, userid } = req.body;
      let passwordHash = await createHash(password);

      let updateUser = await user.update(username, passwordHash, userid);
      if (!updateUser.success) {
        data.message = "Couldn't update user info at the moment";
        return res.status(500).json(data);
      }

      data.success = true;
      data.message =
        "Changed user info in database. They can log in with the new information now.";
      res.json(data);
    } catch (err) {
      logger.error("Error in updating user info", err);
      data.message = "There was a mistake, please try again later.";
      res.status(500).json(data);
    }
  }
);

router.get("/logout", async (req, res) => {
  let message = "";

  try {
    res.clearCookie("jwt", {
      path: process.env.COOKIE_PATH,
      secure: process.env.COOKIE_SECURE,
      sameSite: process.env.COOKIE_SAME_SITE,
    });

    message = "Logged out successfully";
    res.json({ success: true, message });
  } catch (err) {
    logger.error("Error in logging out", err);
    message = "There was a mistake, please try again later.";
    res.status(500).json({ success: false, message });
  }
});

router.get("/check-auth", authenticateToken, async (req, res) => {
  try {
    let userid = req.tokenData?.userid;
    let userInfo = await user.getId(userid);

    return res.json({
      success: true,
      id: userid,
      token: req.tokenData.token,
      owner: !!userInfo.isOwner,
      message: "current token is valid",
    });
  } catch (err) {
    logger.error("an error in checking the cookie", err);
    res.status(500).json({
      success: false,
      message: "There was a mistake, please try again later.",
    });
  }
});

module.exports = router;
