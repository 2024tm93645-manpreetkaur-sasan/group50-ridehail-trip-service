require("dotenv").config();
const express = require("express");
const app = express();

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

app.use("/v1/trips", tripRoute);

app.get("/", (req, res) => {
  res.send("Trip Service is running");
});

app.listen(port, () => {
  console.log(`Trip Service running on http://localhost:${port}`);
});
