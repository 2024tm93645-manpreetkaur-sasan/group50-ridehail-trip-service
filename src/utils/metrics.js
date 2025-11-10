const { logInfo } = require("./logger");

module.exports = {
  trips_created_total: 0,
  trips_completed_total: 0,
  trips_cancelled_total: 0,
  payments_success_total: 0,
  payments_failed_total: 0,

  logMetrics() {
    logInfo("metrics_update", {
      trips_created_total: this.trips_created_total,
      trips_completed_total: this.trips_completed_total,
      trips_cancelled_total: this.trips_cancelled_total,
      payments_success_total: this.payments_success_total,
      payments_failed_total: this.payments_failed_total
    });
  }
};
