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

  const driverRes = await axios.get(`${DRIVER_SERVICE_URL}/api/v1/drivers`);
  const activeDriver = driverRes.data.find(d => d.isActive);

  if (!activeDriver) {
    const err = new Error("No active drivers available");
    err.status = 503;
    throw err;
  }

  await axios.patch(`${DRIVER_SERVICE_URL}/api/v1/drivers/${activeDriver.trip_id}/status?active=false`);
  await tripModel.assignDriver(trip.trip_id, activeDriver.trip_id);
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
  return tripModel.cancelTrip(tripId);
};

exports.calculateFare = async (distance_km) => {
  const baseFare = 50;
  const perKmRate = 10;
  const currentHour = new Date().getHours();
  let surgeMultiplier = 1.0;

  if (currentHour >= 8 && currentHour < 10) surgeMultiplier = 1.5;
  else if (currentHour >= 18 && currentHour < 21) surgeMultiplier = 1.2;

  const calculatedFare = (baseFare + perKmRate * distance_km) * surgeMultiplier;

  return {
    distance_km,
    base_fare: baseFare,
    per_km_rate: perKmRate,
    surge_multiplier: surgeMultiplier,
    calculated_fare: Number(calculatedFare.toFixed(2)),
    currency: "INR",
  };
};

exports.completeTripAndCharge = async (tripId, distance_km) => {
  const trip = await tripModel.completeTrip(tripId);
  const fareDetails = await exports.calculateFare(distance_km);

  try {
    const paymentRes = await axios.post(`${PAYMENT_SERVICE_URL}/api/v1/payments`, {
      trip_id: trip.trip_id,
      amount: fareDetails.calculated_fare,
      method: "CASH",
      rider_id: trip.rider_id,
    });
    return { trip, payment: paymentRes.data, fare: fareDetails };
  } catch (err) {
    console.error(`Payment failed for trip ${tripId}:`, err.message);
    return { trip, fare: fareDetails, payment_error: err.message };
  }
};