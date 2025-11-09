const express = require("express");
const router = express.Router();
const tripController = require("../controllers/tripController");

router.get("/", tripController.getAllTrips);
router.get("/:trip_id", tripController.getTripByID);
router.post("/", tripController.createTrip);
router.patch("/:trip_id/accept", tripController.acceptTrip);
router.patch("/:trip_id/complete", tripController.completeTrip);
router.patch("/:trip_id/cancel", tripController.cancelTrip);
router.post("/calculate", tripController.calculateFare);

module.exports = router;