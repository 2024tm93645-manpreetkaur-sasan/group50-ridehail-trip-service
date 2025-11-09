const express = require("express");
const router = express.Router();
const tripController = require("../controllers/tripController");

router.get("/v1/trips", tripController.getAllTrips);
router.get("/v1/trips/:trip_id", tripController.getTripByID);
router.post("/v1/trips", tripController.createTrip);
router.patch("/v1/trips/:trip_id/accept", tripController.acceptTrip);
router.patch("/v1/trips/:trip_id/complete", tripController.completeTrip);
router.patch("/v1/trips/:trip_id/cancel", tripController.cancelTrip);
router.post("/v1/trips/calculate", tripController.calculateFare);

module.exports = router;