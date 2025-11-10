const axios = require("axios");
const { getCorrelationId } = require("../middleware/correlation");
const http = axios.create();

http.interceptors.request.use((config) => {
  const cid = getCorrelationId();
  if (cid) {
    config.headers["X-Correlation-Id"] = cid;
  }
  return config;
});

module.exports = http;
