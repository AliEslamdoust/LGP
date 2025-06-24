// Copyright (c) 2025 Ali Eslamdoust
// MIT License

// main entry
require("dotenv").config();
const express = require("express");
const app = express();
const ws = require("ws");
const http = require("http");
const authRoutes = require("./routes/auth");
const metricsRoutes = require("./routes/metrics");
const databaseRoutes = require("./routes/database");
const commonRoutes = require("./routes/common");
const cliRoutes = require("./routes/commands");
const authenticateToken = require("./middlewares/jwt_auth");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const recordLoadsData = require("./helper/recordMetrics");
const logger = require("./helper/logger");
const jwt = require("./helper/jwt");
const url = require("url");
const network = require("./metrics/network");
const system = require("./metrics/system");
const recordNetStat = require("./helper/recordNetStat");
const port = process.env.PORT || 3013;
const rateLimit = require("express-rate-limit");

const _platform = process.platform;

const server = http.createServer(app);
const wss = new ws.Server({ server });

let wsLogins = new Map();

try {
  wss.on("connection", async (ws, req) => {
    cookieParser()(req, {}, () => {});

    const token = req.cookies?.jwt;
    const verifyToken = await jwt.verifyToken(token);
    if (!verifyToken.success) {
      ws.close();
    }

    const existingWS = wsLogins.get(token);
    if (existingWS) {
      existingWS.close();
    }
    wsLogins.set(token, ws);

    let queryParams = url.parse(req.url, true).query;
    let partName = queryParams?.part || "",
      timer = queryParams?.timer || 5,
      sysInfoInterval;

    let lastDataUsed;

    let lastRequestIsFinished;

    async function retrieveSysInfo() {
      try {
        lastRequestIsFinished = false;
        let sysInfo;

        if (partName === "network") {
          const [currentDataUsed, ping] = await Promise.all([
            network.usage(),
            network.ping(),
          ]);
          if (!lastDataUsed) {
            lastDataUsed = currentDataUsed;
          }

          sysInfo = { upload: 0, download: 0, ping: ping };
          sysInfo.upload = currentDataUsed.txBytes - lastDataUsed.txBytes;
          sysInfo.download = currentDataUsed.rxBytes - lastDataUsed.rxBytes;

          lastDataUsed = { ...currentDataUsed };
        } else if (partName === "cpu" || partName === "ram") {
          let processes = await system.process();

          sysInfo = recordLoadsData.get(partName);
          sysInfo.processes = processes;
        } else if (partName === "disk") {
          let newData = await system.diskLoad();
          if (_platform === "win32") {
            sysInfo = newData;
            sysInfo.read = Math.ceil(sysInfo.read / 1024);
            sysInfo.write = Math.ceil(sysInfo.write / 1024);
          } else {
            lastDataUsed = lastDataUsed
              ? lastDataUsed
              : await system.diskLoad();

            let newData = await system.diskLoad();

            sysInfo = {
              read: Math.abs(((newData.read - lastDataUsed.read) * 8) / timer),
              write: Math.abs(
                ((newData.write - lastDataUsed.write) * 8) / timer
              ),
            };
          }
        } else {
          sysInfo = recordLoadsData.get(partName);
        }

        if (sysInfo) {
          ws.send(JSON.stringify({ type: "data", data: sysInfo }));
          lastRequestIsFinished = true;
        }
      } catch (err) {
        logger.error(
          "There was an error in retrieving last system information: ",
          err
        );
      }
    }

    ws.on("message", (message) => {
      let data = JSON.parse(message);
      let action = data?.action;

      switch (action) {
        case "start":
          retrieveSysInfo();

          timer = Math.abs(Math.ceil(timer));
          timer = timer < 5 ? 5 : timer;
          clearInterval(sysInfoInterval);

          sysInfoInterval = setInterval(() => {
            if (lastRequestIsFinished) retrieveSysInfo();
          }, timer * 1000);

          break;
        case "stop":
          clearInterval(sysInfoInterval);
          break;
      }
    });

    ws.on("close", () => {
      wsLogins.delete(token);
      clearInterval(sysInfoInterval);

      return;
    });
  });
} catch (err) {
  logger.error("There was an error in WebSocket connection:", err);
}

app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: "http://localhost:3000",
  allowedHeaders: ["Content-Type"],
  preflightContinue: true,
  credentials: true,
};

app.use(cors(corsOptions));

app.use("/api/auth", authRoutes);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: "Too many requests, please try again later.",
});

app.use(limiter);
app.use(authenticateToken);
app.use("/api/metrics", metricsRoutes);
app.use("/api/common", commonRoutes);
app.use("/api/history", databaseRoutes);
app.use("/api/cli", cliRoutes);

recordLoadsData.start();
recordNetStat.start();

server.listen(port, console.log("server started on port", port));
