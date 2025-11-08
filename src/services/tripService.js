const tripModel = require("../models/tripModel");

exports.getAllTrips = async () => {
  return tripModel.getAllTrips();
};

exports.getTripById = async (id) => {
  if (!id || Number.isNaN(Number(id))) {
    const err = new Error("Trip not found");
    err.status = 404;
    throw err;
  }
  const trip = await tripModel.getTripByID(id);
  if (!trip) {
    const err = new Error("Trip not found");
    err.status = 404;
    throw err;
  }
  return trip;
};


exports.createTrip = async (pickup_zone, drop_zone) => {
  if (! pickup_zone || !drop_zone) {
    const err = new Error("pickup_zone=" , pickup_zone ,"drop_zone=", drop_zone, " are required");
    err.status = 400;
    throw err;
  }
  return tripModel.createTrip(pickup_zone, drop_zone);
};

exports.acceptTrip = async (tripId) => {
  if (!tripId || Number.isNaN(Number(tripId))) {
    const err = new Error("Trip not found");
    err.status = 404;
    throw err;
  }
  return tripModel.acceptTrip(tripId);
};

exports.completeTrip = async (tripId) => {
  if (!tripId || Number.isNaN(Number(tripId))) {
    const err = new Error("Trip not found");
    err.status = 404;
    throw err;
  }
  return tripModel.completeTrip(tripId);
};

exports.cancelTrip = async (tripId, cancellation_fee = null) => {
  if (!tripId || Number.isNaN(Number(tripId))) {
    const err = new Error("Trip not found");
    err.status = 404;
    throw err;
  }
  return tripModel.cancelTrip(tripId, cancellation_fee);
};

exports.calculateFare = async (distance_km) => {
  if (!distance_km || isNaN(distance_km) || distance_km <= 0) {
    const err = new Error("Invalid distance_km");
    err.status = 400;
    throw err;
  }

  const baseFare = 50;    
  const perKmRate = 10;   
  const currentHour = new Date().getHours();
  let surgeMultiplier = 1.0;

  if (currentHour >= 8 && currentHour < 10) {
    surgeMultiplier = 1.5; 
  } else if (currentHour >= 18 && currentHour < 21) {
    surgeMultiplier = 1.2; 
  }

  const calculatedFare = (baseFare + perKmRate * distance_km) * surgeMultiplier;

  return {
    distance_km,
    base_fare: baseFare,
    per_km_rate: perKmRate,
    surge_multiplier: surgeMultiplier,
    calculated_fare: calculatedFare.toFixed(2),
    currency: "INR",
  };
};
