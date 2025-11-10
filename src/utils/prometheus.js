const client = require("prom-client");

// Create a registry
const register = new client.Registry();

// Collect Node.js metrics
client.collectDefaultMetrics({ register });

// Define counters that match existing manual metrics
const tripsCreated = new client.Counter({
  name: "trips_created_total",
  help: "Total trips created",
});
const tripsCompleted = new client.Counter({
  name: "trips_completed_total",
  help: "Total trips completed",
});
const tripsCancelled = new client.Counter({
  name: "trips_cancelled_total",
  help: "Total trips cancelled",
});
const paymentsSuccess = new client.Counter({
  name: "payments_success_total",
  help: "Total successful payments",
});
const paymentsFailed = new client.Counter({
  name: "payments_failed_total",
  help: "Total failed payments",
});

// Register all counters
register.registerMetric(tripsCreated);
register.registerMetric(tripsCompleted);
register.registerMetric(tripsCancelled);
register.registerMetric(paymentsSuccess);
register.registerMetric(paymentsFailed);

module.exports = {
  register,
  tripsCreated,
  tripsCompleted,
  tripsCancelled,
  paymentsSuccess,
  paymentsFailed
};
