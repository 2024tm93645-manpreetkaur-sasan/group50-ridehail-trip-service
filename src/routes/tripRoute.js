const express = require("express");
const router = express.Router();
const tripController = require("../controllers/tripController");

router.get("/v1/trips", tripController.getAllTrips);
router.get("/v1/trips/:id", tripController.getTripsByID);
router.post("/v1/trips", tripController.createTrip);
router.post("/v1/trips/:id/accept", tripController.acceptTrip);
router.post("/v1/trips/:id/complete", tripController.completeTrip);
router.post("/v1/trips/:id/cancel", tripController.cancelTrip);
router.post("/v1/trips/calculate", tripController.calculateFare);

module.exports = router;