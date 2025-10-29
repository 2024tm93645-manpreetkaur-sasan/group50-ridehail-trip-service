require("dotenv").config();
const express = require("express");
const app = express();

// try both common locations for routes to avoid module-not-found in container
let tripRoute;
try {
  tripRoute = require("./src/routes/tripRoute");
} catch (e1) {
  try {
    tripRoute = require("./routes/tripRoute");
  } catch (e2) {
    console.error("Missing tripRoute: create src/routes/tripRoute.js or routes/tripRoute.js (module.exports = router)");
    throw e2;
  }
}

const port = process.env.PORT || 3000;
app.use(express.json());

// mount under /v1/trips so curl /v1/trips works
app.use("/v1/trips", tripRoute);

// keep health check
app.get("/", (req, res) => {
  res.send("Trip Service is running");
});

app.listen(port, () => {
  console.log(`Trip Service running on http://localhost:${port}`);
});
