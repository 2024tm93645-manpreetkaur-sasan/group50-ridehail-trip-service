const fs = require("fs");
const path = require("path");
const csv = require("csv-parse/sync");
const pool = require("../config/db");
const { logInfo, logError } = require("../utils/logger");

async function runSeed() {
  try {
    logInfo("Ensuring database schema...");

    const schemaPath = path.join(__dirname, "../../sql/schema.sql");
    let schemaSQL = fs.readFileSync(schemaPath, "utf8");

    // Remove comments and split into statements by semicolon + newline(s)
    // (simple splitter is fine since we don't have functions/procedures here)
    const statements = schemaSQL
      .split(/;\s*(?:\r?\n|$)/)
      .map(s => s.trim())
      .filter(Boolean);

    for (const [i, stmt] of statements.entries()) {
      try {
        await pool.query(stmt);
      } catch (e) {
        logError(`Schema statement #${i + 1} failed`, e);
        throw e;
      }
    }

    // Check if trips already has data
    const { rows } = await pool.query("SELECT COUNT(*)::int AS cnt FROM trips;");
    const count = rows[0].cnt;

    if (count > 0) {
      logInfo(`Trips table already has ${count} records — skipping seed.`);
      return;
    }

    logInfo("Trips table empty — seeding CSV...");

    const filePath = path.join(__dirname, "../data/rhfd_trips.csv");
    const csvBuffer = fs.readFileSync(filePath);

    const rowsCsv = csv.parse(csvBuffer, { columns: true, skip_empty_lines: true });

    for (const row of rowsCsv) {
      await pool.query(
        `INSERT INTO trips (
           trip_id, rider_id, driver_id, pickup_zone, drop_zone, status,
           requested_at, distance_km, base_fare, surge_multiplier, total_fare
         )
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (trip_id) DO NOTHING;`,
        [
          Number(row.trip_id),
          Number(row.rider_id),
          Number(row.driver_id),
          row.pickup_zone,
          row.drop_zone,
          row.status,
          new Date(row.requested_at),
          Number(row.distance_km),
          Number(row.base_fare),
          Number(row.surge_multiplier),
          Number(row.total_fare),
        ]
      );
    }

    logInfo(`Seeded ${rowsCsv.length} trip records.`);

    // Align identity sequence with max(trip_id)
    await pool.query(`
      SELECT setval(
        pg_get_serial_sequence('trips', 'trip_id'),
        COALESCE((SELECT MAX(trip_id) FROM trips), 1)
      );
    `);

    logInfo("Sequence successfully updated.");
  } catch (err) {
    logError("Seeding failed", err);
  }
}

module.exports = runSeed;
