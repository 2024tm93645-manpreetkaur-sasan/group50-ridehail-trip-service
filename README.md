# Trip Service

The Trip Service is the central **orchestrator** in the ride-hailing platform.
It manages the full lifecycle of a trip and coordinates with:

* **Driver Service** for driver retrieval and validation
* **Payment Service** for charging and refunding
* **Prometheus/Grafana** for metrics and dashboards
* **Kubernetes / Minikube** for deployment and monitoring

The service runs on **port 9082** and exposes REST APIs under `/v1/trips`.

---

# QuickStart (Docker Compose)

```bash
docker-compose build --no-cache
docker-compose up -d
docker-compose down -v
```

Base URL:

```
http://localhost:9082
```

---

# Exposed Endpoints

```
GET     /v1/trips
GET     /v1/trips/:trip_id
POST    /v1/trips
POST    /v1/trips/:trip_id/accept
POST    /v1/trips/:trip_id/complete
POST    /v1/trips/:trip_id/cancel
POST    /v1/trips/calculate-fare
POST    /v1/trips/:trip_id/refund
```

System:

```
GET /health
GET /metrics
```

---

# Endpoint Details

## 1. Get All Trips

**GET /v1/trips**

```bash
curl http://localhost:9082/v1/trips
```

---

## 2. Get Trip by ID

**GET /v1/trips/:trip_id**

```bash
curl http://localhost:9082/v1/trips/10
```

Returns `200` or `404`.

---

## 3. Create Trip

**POST /v1/trips**

Body:

```json
{
  "rider_id": 1,
  "pickup_zone": "A",
  "drop_zone": "B"
}
```

```bash
curl -X POST http://localhost:9082/v1/trips \
  -H "Content-Type: application/json" \
  -d '{"rider_id":1,"pickup_zone":"A","drop_zone":"B"}'
```

Flow:

1. Input validation
2. Driver Service is called to retrieve an available driver
3. Trip is created with assigned driver
4. Trip returned

---

## 4. Accept Trip

**POST /v1/trips/:trip_id/accept**

```bash
curl -X POST http://localhost:9082/v1/trips/10/accept
```

---

## 5. Complete Trip (Triggers Payment Charge)

**POST /v1/trips/:trip_id/complete**

Body:

```json
{
  "distance_km": 12.5,
  "method": "CARD"
}
```

```bash
curl -X POST http://localhost:9082/v1/trips/10/complete \
  -H "Content-Type: application/json" \
  -d '{"distance_km":12.5,"method":"CARD"}'
```

Flow:

1. Validate distance
2. Calculate fare
3. Mark trip COMPLETED
4. Call **Payment Service /charge**
5. Return trip + payment metadata

---

## 6. Cancel Trip

**POST /v1/trips/:trip_id/cancel**

```bash
curl -X POST http://localhost:9082/v1/trips/10/cancel
```

---

## 7. Calculate Fare

**POST /v1/trips/calculate-fare**

```bash
curl -X POST http://localhost:9082/v1/trips/calculate-fare \
  -H "Content-Type: application/json" \
  -d '{"distance_km":10}'
```

Returns fare + breakdown.

---

## 8. Refund Trip (Correct Behavior)

**POST /v1/trips/:trip_id/refund**

```bash
curl -X POST http://localhost:9082/v1/trips/10/refund
```

Flow:

1. Validate trip
2. Contact **Payment Service** to perform refund
3. Update trip state
4. Return refund status

Driver service is **NOT** involved in refunding.

---

# Orchestrator Behavior

## Driver Service Calls

Trip Service sends:

```
GET driver-service:9083/v1/drivers/{id}
```

Used to:

* Validate driver availability
* Attach a driver during trip creation

## Payment Service Calls

Charge on trip completion:

```
POST payment-service:9084/v1/payments/charge
```

Refund on demand:

```
PATCH payment-service:9084/v1/payments/{paymentId}/refund
```

Trip Service coordinates:

* status transitions
* fare logic
* external service calls
* final result aggregation

---

# JSON Logging + Correlation ID

Trip Service logs in structured JSON.

Every request includes:

* timestamp
* log level
* correlation ID
* endpoint
* service name
* message

If a client sends `X-Correlation-Id`, it is respected.
If not, a new UUID is generated.

Propagated to:

* Driver Service
* Payment Service

Example:

```json
{
  "timestamp": "2025-02-11T19:40:23Z",
  "correlationId": "0e21df9b-6211-4c9e-a8dd-cfda7343bf1e",
  "service": "trip-service",
  "action": "COMPLETE_TRIP",
  "trip_id": 10
}
```

---

# Prometheus Integration

Trip Service exposes:

```
GET /metrics
```

Prometheus job example:

```yaml
- job_name: "trip-service"
  static_configs:
    - targets: ["trip-service:9082"]
```

Metrics include:

* trips_created_total
* trips_completed_total
* trips_cancelled_total
* fare_calculated_total
* request durations
* driver service latency
* payment service latency

Install:

```bash
npm install prom-client
```

---

# Grafana Integration

Grafana URL:

```
http://localhost:3000
```

Login:

```
admin / admin
```

Import dashboard JSON:

```
monitoring/trip-dashboard.json
```

---

# Running in Minikube (Kubernetes)

### 1. Start Minikube

```bash
minikube start
```

### 2. Point Docker to Minikube

```bash
eval $(minikube docker-env)
```

### 3. Build inside Minikube

```bash
cd trip-service
docker build -t trip-service:latest .
cd ..
```

### 4. Apply manifests

```bash
kubectl apply -f k8s/trip/
kubectl apply -f k8s/prometheus/
kubectl apply -f k8s/grafana/
```

### 5. Expose LoadBalancer services

```bash
minikube tunnel
```

### 6. Open Kubernetes Dashboard

```bash
minikube dashboard
```

You can view:

* pods
* services
* logs
* metrics (Prometheus)
* dashboards (Grafana)

---

