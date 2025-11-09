const pool = require("../config/db");

exports.getAllTrips = async () => {
  const result = await pool.query("SELECT * FROM trips LIMIT 5;");
  return result.rows;
};

exports.getTripByID = async (tripId) => {
  const result = await pool.query("SELECT * FROM trips WHERE trip_id = $1", [
    tripId,
  ]);
  return result.rows[0];
};

exports.createTrip = async (rider_id,pickup_zone, drop_zone) => {
  const result = await pool.query(
    `INSERT INTO trips (rider_id, pickup_zone, drop_zone,  status, requested_at)
         VALUES ($1, $2, $3,'REQUESTED', NOW()) RETURNING *;`,
    [rider_id, pickup_zone, drop_zone]
  );
  return result.rows[0];
};

exports.assignDriver = async (tripId, driverId) => {
  const result = await pool.query(
    `UPDATE trips SET driver_id = $1 WHERE trip_id = $2 RETURNING *;`,
    [driverId, tripId]
  );
  return result.rows[0];
};

exports.acceptTrip = async (tripId) => {
  const trip = await pool.query("SELECT * FROM trips WHERE trip_id = $1", [tripId]);
  if (trip.rows.length === 0) {
    throw new Error("Trip not found");
  }
  if (trip.rows[0].status !== "REQUESTED") {
    throw new Error("Trip cannot be accepted");
  }
  const updated = await pool.query(
    `UPDATE trips SET status = 'ACCEPTED', accepted_at = NOW()
         WHERE trip_id = $1 RETURNING *;`,
    [tripId]
  );
  return updated.rows[0];
};

exports.completeTrip = async (tripId) => {
  const trip = await pool.query("SELECT * FROM trips WHERE trip_id = $1", [tripId]);
  if (trip.rows.length === 0) {
    throw new Error("Trip not found");
  }
  if (trip.rows[0].status !== "ACCEPTED") {
    throw new Error("Trip cannot be completed");
  }
  const updated = await pool.query(
    `UPDATE trips SET status = 'COMPLETED', completed_at = NOW()
         WHERE trip_id = $1 RETURNING *;`,
    [tripId]
  );
  return updated.rows[0];
};

exports.cancelTrip = async (tripId) => {
  const trip = await pool.query("SELECT * FROM trips WHERE trip_id = $1", [tripId]);
  if (trip.rows.length === 0) {
    throw new Error("Trip not found");
  }
  if (
    trip.rows[0].status === "COMPLETED" ||
    trip.rows[0].status === "CANCELLED"
  ) {
    throw new Error("Trip cannot be cancelled");
  }
  const updated = await pool.query(
    `UPDATE trips SET status = 'CANCELLED', cancelled_at = NOW()
         WHERE trip_id = $1 RETURNING *;`,
    [tripId]
  );
  return updated.rows[0];
};
