const { successResponse, errorResponse } = require("../utils/response");
const logger = require("../utils/logger");
const tripService = require("../services/tripService");

exports.getAllTrips = async (req, res) => {
  try {
    const trips = await tripService.getAllTrips();
    logger.logInfo("Fetched all trips");
    successResponse(res, trips, "Trips fetched successfully");
  } catch (error) {
    logger.logError("Error fetching all trips", error);
    errorResponse(res, "Internal server error");
  }
};

exports.getTripByID = async (req, res) => {
  const tripId = parseInt(req.params.trip_id);
  try {
    const trip = await tripService.getTripById(tripId);
    logger.logInfo(`Fetched trip with ID: ${tripId}`);
    successResponse(res, trip, "Trip fetched successfully");
  } catch (error) {
    logger.logError(`Error fetching trip with ID: ${tripId}`, error);
    if (error.message === "Trip not found") {
      errorResponse(res, "Trip not found", 404);
    } else {
      errorResponse(res, "Internal server error");
    }
  }
};

exports.createTrip = async (req, res) => {
  const { rider_id, pickup_zone, drop_zone } = req.body || {};
  try {
    if (!rider_id || !pickup_zone || !drop_zone) {
      return errorResponse(res, "rider_id, pickup_zone, drop_zone required", 400);
    }
    const trip = await tripService.createAndAssignDriver(rider_id, pickup_zone, drop_zone);
    logger.logSuccess(`Trip ${trip.trip_id} created, driver assigned, and accepted`);
    successResponse(res, trip, "Trip created and driver assigned", 201);
  } catch (err) {
    logger.logError("Error creating trip", err);
    errorResponse(res, err.message || "Internal server error", err.status || 500);
  }
};

exports.acceptTrip = async (req, res) => {
  const tripId = parseInt(req.params.trip_id);
  try {
    const acceptedTrip = await tripService.acceptTrip(tripId);
    logger.logSuccess(`Accepted trip with ID: ${tripId}`);
    successResponse(res, acceptedTrip, "Trip accepted successfully");
  } catch (error) {
    logger.logError(`Error accepting trip with ID: ${tripId}`, error);
    if (error.message === "Trip not found") {
      errorResponse(res, "Trip not found", 404);
    } else if (error.message === "Trip cannot be accepted") {
      errorResponse(res, "Trip cannot be accepted", 400);
    } else {
      errorResponse(res, "Internal server error");
    }
  }
};

exports.completeTrip = async (req, res) => {
  const tripId = parseInt(req.params.trip_id);
  const { distance_km } = req.body || {};
  if (!distance_km || isNaN(distance_km) || distance_km <= 0) {
    return errorResponse(res, "Valid distance_km is required", 400);
  }

  try {
    const result = await tripService.completeTripAndCharge(tripId, distance_km);
    logger.logSuccess(`Trip ${tripId} completed and payment processed`);
    successResponse(res, result, "Trip completed and payment processed");
  } catch (err) {
    logger.logError(`Error completing trip ${tripId}`, err);
    errorResponse(res, err.message || "Internal server error", err.status || 500);
  }
};

exports.cancelTrip = async (req, res) => {
  const tripId = parseInt(req.params.trip_id);
  try {
    const cancelledTrip = await tripService.cancelTrip(tripId);
    logger.logSuccess(`Cancelled trip with ID: ${tripId}`);
    successResponse(res, cancelledTrip, "Trip cancelled successfully");
  } catch (error) {
    logger.logError(`Error cancelling trip with ID: ${tripId}`, error);
    if (error.message === "Trip not found") {
      errorResponse(res, "Trip not found", 404);
    } else if (error.message === "Trip cannot be cancelled") {
      errorResponse(res, "Trip cannot be cancelled", 400);
    } else {
      errorResponse(res, "Internal server error");
    }
  }
};

exports.calculateFare = async (req, res) => {
  try {
    const { distance_km } = req.body || {};
    if (!distance_km || isNaN(distance_km) || distance_km <= 0) {
      return errorResponse(res, "Valid distance_km is required", 400);
    }
    const fareDetails = await tripService.calculateFare(distance_km);
    logger.logSuccess(`Calculated fare for ${distance_km} km`);
    successResponse(res, fareDetails, "Fare calculated successfully");
  } catch (error) {
    logger.logError("Error calculating fare", error);
    errorResponse(res, error.message || "Internal server error", error.status || 500);
  }
};
