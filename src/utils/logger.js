const { getCorrelationId } = require("../middleware/correlation");

function baseLog(level, message, meta = {}) {
  const correlationId = getCorrelationId();

  const logObject = {
    level,
    timestamp: new Date().toISOString(),
    correlationId,   // always included
    message,
    ...meta
  };

  console.log(JSON.stringify(logObject));
}

function logInfo(message, meta = {}) {
  baseLog("INFO", message, meta);
}

function logError(message, error = null) {
  baseLog("ERROR", message, {
    error: error ? (error.stack || error.toString()) : null
  });
}

function logSuccess(message, meta = {}) {
  baseLog("SUCCESS", message, meta);
}

module.exports = { logInfo, logError, logSuccess };
