require("dotenv").config();
const express = require("express");
const app = express();

const runSeed = require("./src/scripts/seedTrips");
const pool = require("./src/config/db");
const logger = require("./src/utils/logger");
const prometheus = require("./src/utils/prometheus");

// Prometheus endpoint
app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", prometheus.register.contentType);
  res.send(await prometheus.register.metrics());
});


// Wait for Postgres to be ready
async function waitForDB(retries = 20, delay = 2000) {
  while (retries > 0) {
    try {
      await pool.query("SELECT NOW()");
      logger.logInfo("PostgreSQL is ready");
      return;
    } catch (err) {
      logger.logError(`⏳ Waiting for PostgreSQL... (${retries} retries left)`);
      retries--;
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error("PostgreSQL did not become ready in time");
}

(async () => {
  try {
    // 1. Wait for DB to be ready
    await waitForDB();

    // 2. Seed data
    await runSeed();

    // 3. Start middlewares
    app.use(express.json());
    const { correlationMiddleware } = require("./src/middleware/correlation");
    app.use(correlationMiddleware);

    // 4. Routes
    const tripRoute = require("./src/routes/tripRoute");
    app.use("/v1/trips", tripRoute);

    // 5. Health check
    app.get("/health", (req, res) => res.send("Trip Service running"));

    // 6. Start server
    const PORT = process.env.PORT || 9082;
    app.listen(PORT, () => {
      logger.logInfo(`Trip Service running on port ${PORT}`);
    });

  } catch (err) {
    logger.logError("Startup failed:", err);
    process.exit(1);
  }
})();
