const pool = require("../config/db");

// ------------------------------------------------------
// Get All Trips
// ------------------------------------------------------
exports.getAllTrips = async () => {
  const result = await pool.query("SELECT * FROM trips LIMIT 50;");
  return result.rows;
};

// ------------------------------------------------------
// Get Trip By ID
// ------------------------------------------------------
exports.getTripByID = async (tripId) => {
  const result = await pool.query(
    "SELECT * FROM trips WHERE trip_id = $1",
    [tripId]
  );
  return result.rows[0];
};

// ------------------------------------------------------
// Create Trip (auto-increment trip_id via IDENTITY)
// ------------------------------------------------------
exports.createTrip = async (rider_id, pickup_zone, drop_zone) => {
  const result = await pool.query(
    `INSERT INTO trips (
        rider_id,
        pickup_zone,
        drop_zone,
        status,
        requested_at
     ) VALUES (
        $1, $2, $3, 'REQUESTED', NOW()
     )
     RETURNING *;`,
    [rider_id, pickup_zone, drop_zone]
  );

  return result.rows[0];
};

// ------------------------------------------------------
// Assign Driver
// ------------------------------------------------------
exports.assignDriver = async (tripId, driverId) => {
  const result = await pool.query(
    `UPDATE trips
     SET driver_id = $1
     WHERE trip_id = $2
     RETURNING *;`,
    [driverId, tripId]
  );

  return result.rows[0];
};

// ------------------------------------------------------
// Accept Trip
// ------------------------------------------------------
exports.acceptTrip = async (tripId) => {
  const trip = await this.getTripByID(tripId);

  if (!trip) throw new Error("Trip not found");
  if (trip.status !== "REQUESTED")
    throw new Error("Trip cannot be accepted");

  const updated = await pool.query(
    `UPDATE trips
     SET status = 'ACCEPTED'
     WHERE trip_id = $1
     RETURNING *;`,
    [tripId]
  );

  return updated.rows[0];
};

// ------------------------------------------------------
// Complete Trip (fare fields updated by service layer)
// ------------------------------------------------------
exports.completeTrip = async (tripId, distance_km, base_fare, surge_multiplier, total_fare) => {
  const trip = await this.getTripByID(tripId);

  if (!trip) throw new Error("Trip not found");
  if (trip.status !== "ACCEPTED")
    throw new Error("Trip cannot be completed");

  const updated = await pool.query(
    `UPDATE trips
     SET
       status = 'COMPLETED',
       distance_km = $2,
       base_fare = $3,
       surge_multiplier = $4,
       total_fare = $5
     WHERE trip_id = $1
     RETURNING *;`,
    [tripId, distance_km, base_fare, surge_multiplier, total_fare]
  );

  return updated.rows[0];
};

// ------------------------------------------------------
// Cancel Trip
// ------------------------------------------------------
exports.cancelTrip = async (tripId) => {
  const trip = await this.getTripByID(tripId);

  if (!trip) throw new Error("Trip not found");
  if (["COMPLETED", "CANCELLED"].includes(trip.status))
    throw new Error("Trip cannot be cancelled");

  const updated = await pool.query(
    `UPDATE trips
     SET status = 'CANCELLED'
     WHERE trip_id = $1
     RETURNING *;`,
    [tripId]
  );

  return updated.rows[0];
};
