const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());
app.get("/", (req,res) => {
  res.send("Trip Service is running");
});

app.get("/v1/trips/:id", async (req, res) => {
  const tripId = parseInt(req.params.id);
  if(isNaN(tripId)) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }
  try {
    const result = await pool.query('SELECT * FROM trips WHERE id = $1;', [tripId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.status(200).json({ trip: result.rows[0] });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/v1/trips', async (req, res) => {
  const { rider_id, pickup, drop } = req.body;

  if (!rider_id || !pickup || !drop) {
    return res.status(400).json({ error: 'rider_id, pickup and drop are required' });
  }
  try {
    const result = await pool.query(
      "INSERT INTO trips (rider_id, pickup_zone , drop_zone, status, requested_at) VALUES ($1, $2, $3, 'REQUESTED', NOW()) RETURNING *;",
      [rider_id, pickup, drop]
    );
    res.status(201).json({ message: 'Trip created', trip: result.rows[0] });  
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/v1/trips/:id/accept', async (req, res) => {
  const tripId = parseInt(req.params.id);
  if(isNaN(tripId)) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }

  try{
    const trip = await pool.query('SELECT * FROM trips WHERE id = $1', [tripId]);
    if (trip.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });

    if (trip.rows[0].status !== 'REQUESTED'){
      return res.status(400).json({ error: 'Trip cannot be accepted' });
  }
  const updated = await pool.query(
      `UPDATE trips SET status = 'ACCEPTED', accepted_at = NOW()
       WHERE trip_id = $1 RETURNING *;`,
      [tripId]
    );
res.status(200).json({message: 'Trip accepted', trip: updated.rows[0] });

}
catch{
    res.status(500).json({ error: 'Internal server error' });
}
});


app.post('/v1/trips/:id/complete',async (req, res) => {
  const tripId = parseInt(req.params.id);
  if(isNaN(tripId)) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }
try{
  const trip = await pool.query('SELECT * FROM trips WHERE id = $1', [tripId]);
  if (trip.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });

  if (trip.rows[0].status !== 'ACCEPTED'){
    return res.status(400).json({ error: 'Trip cannot be completed' });
  }

  const updated = await pool.query(
      `UPDATE trips SET status = 'COMPLETED', completed_at = NOW()
       WHERE trip_id = $1 RETURNING *;`,
      [tripId]
    );
res.status(200).json({message: 'Trip completed', trip: updated.rows[0] });
}
catch{
res.status(500).json({ error: 'Internal server error' });
}
});

app.post("/v1/trips/:id/assign",async(req,res)=>{
const tripId = parseInt(req.params.id);
if(isNaN(tripId)) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }
  try{
    const trip = await pool.query('SELECT * FROM trips WHERE id = $1', [tripId]);
    if (trip.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });

    if (trip.rows[0].status !== 'REQUESTED'){
      return res.status(400).json({ error: `Cannot assign driver to the trip with status ${trip.rows[0].status}`});
    }
    const driverResult = await pool.query('SELECT * FROM drivers WHERE is_active = true LIMIT 1;');
    if (driverResult.rows.length === 0) {
      return res.status(404).json({ error: 'No available drivers' });
    }
    const availableDriver = driverResult.rows[0];

    const updated = await pool.query(
      `UPDATE trips SET driver_id = $1, status = 'ASSIGNED', assigned_at = NOW()
       WHERE id = $2 RETURNING *;`,
      [availableDriver.id, tripId]
    );
    res.status(200).json({ message: 'Driver assigned', trip: updated.rows[0] });

  }
  catch{
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/v1/trips", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM trips LIMIT 5;");
    const trips = Array.isArray(result.rows) ? result.rows : [];
    res.status(200).json({ trips});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/v1/trips/:id/cancel", async(req,res)=>{
const tripId = parseInt(req.params.id);
  if(isNaN(tripId)) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }

  try{
    const trip = await pool.query('SELECT * FROM trips WHERE id = $1', [tripId]);
    if (trip.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
    
    if (trip.rows[0].status === 'COMPLETED' || trip.rows[0].status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot cancel a completed or already cancelled trip' });
    }
    const cancellationFee = trip.rows[0].status === 'ACCEPTED' ? 5 : 0;

    const updated = await pool.query(
      `UPDATE trips SET status = 'CANCELLED', cancellation_fee = $1, cancelled_at = NOW()
       WHERE id = $2 RETURNING *;`,
      [cancellationFee, tripId]
    );
    res.status(200).json({ message: 'Trip cancelled', trip: updated.rows[0] });
  }
  catch{
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Trip Service running on http://localhost:${port}`);
});


app.listen(3000, () => console.log("Trip Service running on http://localhost:3000"));