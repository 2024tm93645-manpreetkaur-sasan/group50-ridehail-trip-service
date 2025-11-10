# **Minikube + Trip Service Monitoring Setup Guide**

This guide explains how to:

1. Start Minikube
2. Build/load Docker images inside Minikube
3. Deploy Trip DB, Trip Service, Prometheus, and Grafana
4. Import Grafana Dashboard
5. Enable Kubernetes Dashboard (visual UI)

It is intentionally minimal and easy to follow.

---

# **1. Start Minikube**

```bash
minikube start
```

---

# **2. Build Docker Image INSIDE Minikube**

Minikube cannot access your normal Docker Desktop images, so you must build inside Minikube’s Docker daemon.

Enable Minikube Docker env:

```bash
eval $(minikube docker-env)
```

Build Trip Service image:

```bash
docker build -t trip-service:latest -f Dockerfile.trip-service .
```

(Optional) build Trip DB:

```bash
docker build -t trip-db:latest -f Dockerfile.trip-db .
```

---

# **Alternative Option: Load Images Into Minikube**

If you built images in Docker Desktop:

```bash
minikube image load trip-service:latest
minikube image load trip-db:latest
```

---

# ✅ **3. Apply All Kubernetes Manifests**

```bash
kubectl apply -f k8s/
```

This deploys:

* Trip DB
* Trip Service
* Prometheus
* Grafana

---

# **4. Verify Deployments**

```bash
kubectl get pods
```

All pods should be:

```
Running
```

List all services:

```bash
kubectl get svc
```

Port-forward Trip Service (for Postman):

```bash
kubectl port-forward svc/trip-service 9082:9082
```

---

# **5. Port-Forward Prometheus**

Prometheus → [http://localhost:9090](http://localhost:9090)

```bash
kubectl port-forward svc/prometheus 9090:9090
```

---

# ✅ **6. Port-Forward Grafana**

Grafana → [http://localhost:3000](http://localhost:3000)

```bash
kubectl port-forward svc/grafana 3000:3000
```

Login:

```
admin / admin
```

---

# 📊 **Grafana Dashboard Import Instructions**

## **1. Open Grafana**

Visit:

```
http://localhost:3000
```

Login with `admin/admin`.

---

## **2. Import Trip Dashboard**

1. Click **Dashboards**
2. Click **Import**
3. Click **Upload JSON file**
4. Choose:

```
monitoring/trip-dashboard.json
```

5. Select **Prometheus** as data source
6. Click **Import**

---

## **3. Dashboard Ready**

You will now see:

* Trips Created
* Trips Completed
* Trips Cancelled
* Payment Success / Failed
* Custom counters exported at `/metrics`

---

# 🚀 **7. Enable Kubernetes Dashboard (Optional)**

Enable dashboard add-on:

```bash
minikube addons enable dashboard
```

Enable metrics:

```bash
minikube addons enable metrics-server
```

Open dashboard:

```bash
minikube dashboard
```

If browser doesn't auto-open:

```bash
minikube dashboard --url
```

This gives you a GUI to see:

* Pods
* Logs
* Events
* Resource Usage
* Deployments
* Services


