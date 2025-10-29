const express = require("express");
const router = express.Router();
const tripController = require("../controllers/tripController");

router.get("/", tripController.getAllTrips);
router.get("/:id", tripController.getTripsByID);
router.post("/", tripController.createTrip);
router.post("/:id/accept", tripController.acceptTrip);
router.post("/:id/complete", tripController.completeTrip);
router.post("/:id/cancel", tripController.cancelTrip);

module.exports = router;