const { v4: uuidv4 } = require("uuid");
const { AsyncLocalStorage } = require("async_hooks");

const asyncLocalStorage = new AsyncLocalStorage();
const HEADER = "X-Correlation-Id";

function correlationMiddleware(req, res, next) {
  let cid = req.headers[HEADER.toLowerCase()];

  if (!cid) {
    cid = uuidv4();
  }

  // store correlation Id in the context
  asyncLocalStorage.run(new Map(), () => {
    asyncLocalStorage.getStore().set("correlationId", cid);

    // Add correlation ID back to response headers
    res.setHeader(HEADER, cid);

    next();
  });
}

function getCorrelationId() {
  const store = asyncLocalStorage.getStore();
  return store ? store.get("correlationId") : null;
}

module.exports = { correlationMiddleware, getCorrelationId };
