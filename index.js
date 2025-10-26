const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());

app.listen(port, () => {
  console.log(`Trip Service running on http://localhost:${port}`);
});

app.get("/", (res) => {
  res.send("Trip Service is running");
});

const trips = []; 
const drivers = [
  { id: 'd1', name: 'Alice', is_active: true },
  { id: 'd2', name: 'Bob', is_active: true },
  { id: 'd3', name: 'Charlie', is_active: false },
];

app.post('/v1/trips', (req, res) => {
  const { rider_id, pickup, drop } = req.body;

  if (!rider_id || !pickup || !drop) {
    return res.status(400).json({ error: 'rider_id, pickup and drop are required' });
  }

  const newTrip = {
    id: trips.length + 1,
    rider_id,
    pickup,
    drop,
    status: 'REQUESTED',
    created_at: new Date().toISOString(),
    assigned_at: null,
    accepted_at: null,
    completed_at: null,
    cancelled_at: null,
    driver_id: null,
    cancellation_fee: 0
  };

  trips.push(newTrip);
  res.status(201).json(newTrip);
});

app.post('/v1/trips/:id/accept', (req, res) => {
  const tripId = parseInt(req.params.id);
  if(isNaN(tripId)) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }

  const trip = trips.find(t => t.id === tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  if (trip.status !== 'REQUESTED') {
    return res.status(400).json({ error: 'Trip cannot be accepted' });
  }

  trip.status = 'ACCEPTED';
  trip.accepted_at = new Date().toISOString()
  res.status(200).json({message: 'Trip accepted', trip });
});

app.post('/v1/trips/:id/complete', (req, res) => {
  const tripId = parseInt(req.params.id);
  if(isNaN(tripId)) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }

  const trip = trips.find(t => t.id === tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  if (trip.status !== 'ACCEPTED') {
    return res.status(400).json({ error: 'Trip cannot be completed' });
  }
  if (trip.status != 'COMPLETED') {
  trip.status = 'COMPLETED';
  trip.completed_at = new Date().toISOString()
  res.status(200).json({message: 'Trip completed', trip });
}
});

app.get("/v1/trips", (res) => {
  res.status(200).json({ trips });
});

app.get("/v1/trips/:id",  (req, res) => {
  const tripId = parseInt(req.params.id);
  if(isNaN(tripId)) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }

  const trip = trips.find(t => t.id === tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  res.status(200).json({message: 'Trip details', trip });
});

app.post("/v1/trips/:id/assign",(req,res)=>{
const tripId = parseInt(req.params.id);
if(isNaN(tripId)) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }
  
  const trip = trips.find(t => t.id === tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  if (trip.status !== 'REQUESTED') {  
    return res.status(400).json({ error: 'Cannot assign driver to the trip with status ${trip.status}'});
  }

  const availableDriver = drivers.find(d => d.is_active);
  if (!availableDriver) {
    return res.status(404).json({ error: 'No available drivers' });
  }
  
  trip.driver_id = availableDriver.id;
  trip.status = 'ASSIGNED';
  trip.assigned_at = new Date().toISOString();
  res.status(200).json({ message: 'Driver assigned', trip });
});

app.post("/v1/trips/:id/cancel",(req,res)=>{
const tripId = parseInt(req.params.id);
if(isNaN(tripId)) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }
  
  const trip = trips.find(t => t.id === tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
    return res.status(400).json({ error: 'Cannot cancel a completed or already cancelled trip' });
  }

  trip.status = 'CANCELLED';
  trip.cancellation_fee = trip.status === 'ACCEPTED' ? 5 : 0;
  trip.cancelled_at = new Date().toISOString();
  res.status(200).json({ message: 'Trip cancelled', trip });
});