# group50-ridehail-trip-service

Trip Service that manages trip requests, driver assignment, status updates, and completion. Exposes a small REST API under /v1/trips.

## QuickStart

- With Docker Compose:
  - docker-compose build --no-cache   (forces Docker to rebuild all images from scratch without using any cached layers.)
  - docker-compose up -d             (starts all services in detached mode, meaning containers run in the background and your terminal is freed up)
  -  docker-compose down -v         (removes all containers and also deletes the named and anonymous volumes associated with the project.)


## Prometheus Integration 

Add prom-client
npm install prom-client

## Grafana
http://localhost:3000

Login: admin / admin
