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

exports.getTripsByID = async (req, res) => {
  const tripId = parseInt(req.params.id);
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
  const { pickup_zone, drop_zone } = req.body || {};
  try {
    const newTrip = await tripService.createTrip(pickup_zone, drop_zone);
    logger.logSuccess(`Created new trip with ID: ${newTrip.id}`);
    successResponse(res, newTrip, "Trip created successfully", 201);
  } catch (error) {
    logger.logError("Error creating trip", error);
    const status = error.status || 500;
    const message =
      status === 500 && process.env.NODE_ENV !== "development"
        ? "Internal server error"
        : error.message || "Error creating trip";
    errorResponse(res, message, status);
  }
};

exports.acceptTrip = async (req, res) => {
  const tripId = parseInt(req.params.id);
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
  const tripId = parseInt(req.params.id);
  try {
    const completedTrip = await tripService.completeTrip(tripId);
    logger.logSuccess(`Completed trip with ID: ${tripId}`);
    successResponse(res, completedTrip, "Trip completed successfully");
  } catch (error) {
    logger.logError(`Error completing trip with ID: ${tripId}`, error);
    if (error.message === "Trip not found") {
      errorResponse(res, "Trip not found", 404);
    } else if (error.message === "Trip cannot be completed") {
      errorResponse(res, "Trip cannot be completed", 400);
    } else {
      errorResponse(res, "Internal server error");
    }
  }
};

exports.cancelTrip = async (req, res) => {
  const tripId = parseInt(req.params.id);
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
