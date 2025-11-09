const tripModel = require("../models/tripModel");
const axios = require("axios");

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
  const driverRes = await axios.get(`${DRIVER_SERVICE_URL}/api/v1/drivers`);
  const activeDriver = driverRes.data.find(d => d.isActive);

  if (!activeDriver) {
    const err = new Error("No active drivers available");
    err.status = 503;
    throw err;
  }

  // Mark driver inactive (busy)
  await axios.patch(
    `${DRIVER_SERVICE_URL}/api/v1/drivers/${activeDriver.driver_id}/status?active=false`
  );

  // Assign driver to trip
  await tripModel.assignDriver(trip.trip_id, activeDriver.driver_id);

  // Auto-accept trip
  const acceptedTrip = await tripModel.acceptTrip(trip.trip_id);

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
  const fareDetails = await exports.calculateFare(distance_km);

  try {
    const paymentRes = await axios.post(
      `${PAYMENT_SERVICE_URL}/v1/payments/charge`,
      {
        trip_id: trip.trip_id,
        amount: fareDetails.calculated_fare,
        method,
        status: trip.status
      }
    );

    return { trip, payment: paymentRes.data, fare: fareDetails };

  } catch (err) {
    return { trip, fare: fareDetails, payment_error: err.message };
  }
};
