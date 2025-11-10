const tripModel = require("../models/tripModel");
const http = require("../utils/http");
const metrics = require("../utils/metrics");
const prometheus = require("../utils/prometheus");
const DRIVER_SERVICE_URL = process.env.DRIVER_SERVICE_URL;
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL;

exports.getAllTrips = async () => {
  return tripModel.getAllTrips();
};

exports.getTripById = async (trip_id) => {
  if (!trip_id || Number.isNaN(Number(trip_id))) {
    const err = new Error("Trip not found");
    err.status = 404;
    throw err;
  }

  const trip = await tripModel.getTripByID(trip_id);
  if (!trip) {
    const err = new Error("Trip not found");
    err.status = 404;
    throw err;
  }

  return trip;
};

exports.createAndAssignDriver = async (rider_id, pickup_zone, drop_zone) => {
  const trip = await tripModel.createTrip(rider_id, pickup_zone, drop_zone);

  // Fetch active drivers
  const driverRes = await http.get(`${DRIVER_SERVICE_URL}/v1/drivers`);
  const activeDriver = driverRes.data.find(d => d.isActive);

  if (!activeDriver) {
    const err = new Error("No active drivers available");
    err.status = 503;
    throw err;
  }

  // Mark driver inactive (busy)
  await http.patch(
    `${DRIVER_SERVICE_URL}/v1/drivers/${activeDriver.driver_id}/status?active=false`
  );

  // Assign driver to trip
  await tripModel.assignDriver(trip.trip_id, activeDriver.driver_id);

  // Auto-accept trip
  const acceptedTrip = await tripModel.acceptTrip(trip.trip_id);

  metrics.trips_created_total++;
  metrics.logMetrics();
  prometheus.tripsCreated.inc();

  return acceptedTrip;
};

exports.acceptTrip = async (tripId) => {
  if (!tripId || Number.isNaN(Number(tripId))) {
    const err = new Error("Trip not found");
    err.status = 404;
    throw err;
  }
  return tripModel.acceptTrip(tripId);
};

exports.cancelTrip = async (tripId) => {
  if (!tripId || Number.isNaN(Number(tripId))) {
    const err = new Error("Trip not found");
    err.status = 404;
    throw err;
  }

  const trip = await tripModel.getTripByID(tripId);

  if (!trip) {
    const err = new Error("Trip not found");
    err.status = 404;
    throw err;
  }

  // Not allowed: ongoing or completed trips
  if (["ONGOING", "COMPLETED"].includes(trip.status)) {
    const err = new Error("Trip cannot be cancelled");
    err.status = 400;
    throw err;
  }

  // Already cancelled
  if (trip.status === "CANCELLED") {
    return trip; // No-op
  }

   metrics.trips_cancelled_total++;
   metrics.logMetrics();
   prometheus.tripsCancelled.inc();

  // Allowed: REQUESTED or ACCEPTED
  return tripModel.cancelTrip(tripId);
};


exports.calculateFare = async (distance_km) => {
  const baseFare = 50;
  const perKmRate = 10;
  const minimumFare = 75;

  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  let surgeMultiplier = 1.0;

  const isPeak = (hour >= 8 && hour < 10) || (hour >= 18 && hour < 21);
  const isNight = hour >= 22 || hour < 6;
  const isWeekend = day === 0 || day === 6;

  if (isPeak) surgeMultiplier = 1.5;
  else if (isNight || isWeekend) surgeMultiplier = 1.2;

  let calculatedFare = (baseFare + perKmRate * distance_km) * surgeMultiplier;

  const minimumApplied = calculatedFare < minimumFare;
  calculatedFare = Math.max(calculatedFare, minimumFare);

  return {
    distance_km,
    base_fare: baseFare,
    per_km_rate: perKmRate,
    surge_multiplier: surgeMultiplier,
    minimum_fare_applied: minimumApplied,
    calculated_fare: Number(calculatedFare.toFixed(2)),
    currency: "INR",
  };
};


exports.completeTripAndCharge = async (tripId, distance_km, method = "CASH") => {
  const trip = await tripModel.completeTrip(tripId);
  metrics.trips_completed_total++;
  const fareDetails = await exports.calculateFare(distance_km);

  try {
    const paymentRes = await http.post(
      `${PAYMENT_SERVICE_URL}/v1/payments/charge`,
      {
        trip_id: trip.trip_id,
        amount: fareDetails.calculated_fare,
        method,
        status: trip.status
      }
    );
  metrics.payments_success_total++;
  metrics.logMetrics();
  prometheus.paymentsSuccess.inc();
    return { trip, payment: paymentRes.data, fare: fareDetails };

  } catch (err) {
    metrics.payments_failed_total++;
    metrics.logMetrics();
    prometheus.paymentsFailed.inc();
    return { trip, fare: fareDetails, payment_error: err.message };
  }
};


exports.refundTrip = async (tripId) => {
  const trip = await tripModel.getTripByID(tripId);

  if (!trip) {
    const err = new Error("Trip not found");
    err.status = 404;
    throw err;
  }

  if (trip.status !== "COMPLETED") {
    const err = new Error("Only completed trips can be refunded");
    err.status = 400;
    throw err;
  }

  //  Fetch payment info from PaymentService
  const paymentRes = await http.get(
    `${PAYMENT_SERVICE_URL}/v1/payments/trip/${tripId}`
  );

  if (!paymentRes.data || paymentRes.data.status !== "SUCCESS") {
    const err = new Error("No successful payment found");
    err.status = 404;
    throw err;
  }

  const paymentId = paymentRes.data.payment_id;

  // Call refund API
  const refundRes = await http.patch(
    `${PAYMENT_SERVICE_URL}/v1/payments/${paymentId}/refund`
  );

  return {
    trip_id: tripId,
    refund: refundRes.data
  };
};


