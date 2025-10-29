function logInfo(message, data = null) {
  console.log(`${message}`, data ? JSON.stringify(data) : "");
}

function logError(message, error = null) {
  console.error(`${message}`, error ? error.stack || error : "");
}

function logSuccess(message) {
  console.log(`${message}`);
}

module.exports = { logInfo, logError, logSuccess };
