// Copyright (c) 2025 Ali Eslamdoust
// MIT License

// connecting to database and creating one if it doesn't exist
const sqlite = require("sqlite3").verbose();
const logger = require("../helper/logger");

function connectToDatabase() {
  console.log(process.env.DB_PATH);
  
  const db = new sqlite.Database(process.env.DB_PATH, (err) => {
    if (err) {
      logger.error("Error while connecting to database ", err);
    } else {
      logger.info("Connected to database");
      createTables(db);
    }
  });

  return db;
}
const db = connectToDatabase();

async function createTables(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      let errorOccurred = false;

      const tables = [
        `"network" (
	"id" INTEGER PRIMARY KEY,
	"time"	INTEGER,
	"rx_bytes"	INTEGER,
	"tx_bytes"	INTEGER,
	"interface"	TEXT
)`,
        `"memory" (
	"time"	INTEGER,
	"load"	INTEGER
)`,
        `"login" (
	"userid"	INTEGER,
	"username"	TEXT,
	"ip"	TEXT,
	"time"	INTEGER,
  "source" TEXT DEFAULT 'manager',
	"success"	INTEGER
)`,
        `"cpu" (
	"time"	INTEGER,
	"load"	INTEGER
)`,
        `"users" (
	"id" INTEGER PRIMARY KEY,
	"username"	TEXT,
	"password"	TEXT,
  "revoke" INTEGER,
  "isOwner"	INTEGER)`,
      ];

      tables.forEach((tableQuery) => {
        db.run(`CREATE TABLE IF NOT EXISTS ${tableQuery}`, (err) => {
          if (err) {
            logger.error("Error in creating table: ", { query: tableQuery });
            errorOccurred = true;
          } else {
            logger.info("Table created or already existed: ", {
              query: tableQuery,
            });
          }
        });
      });

      if (errorOccurred) {
        logger.error("One or more tables failed to create.");
        reject(new Error("One or more tables failed to create."));
      } else {
        resolve();
      }
    });
  });
}

module.exports = db;
