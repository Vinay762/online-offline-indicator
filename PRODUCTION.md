# Production Deployment Guide

This project ships a single WebSocket presence server backed by a Redis Cluster. The following checklist outlines how to run it in production instead of the local “all-in-one” Docker workflow.

## 1. Plan the Topology

- **Presence servers**: run multiple Node.js instances of this repo (containerized or bare metal) so each handles a portion of the WebSocket connections.
- **Load balancer**: place an L4/L7 balancer in front (e.g., Nginx, ALB, Envoy) with sticky sessions disabled—the gateway is stateless because data lives in Redis.
- **Redis Cluster**: host six Redis nodes (or a managed cluster) on dedicated machines/VMs separate from the WebSocket servers.
- **Observability**: provision metrics/log collection (e.g., Prometheus + Grafana, CloudWatch) and centralized logging.

## 2. Prepare the Redis Cluster

1. Provision six Redis nodes (3 masters + 3 replicas) with persistent storage and proper networking/firewalling.
2. Form the cluster using `redis-cli --cluster create host1:port1 ... host6:port6 --cluster-replicas 1`.
3. Note the node endpoints and expose them via an internal DNS name. These values feed the app’s `REDIS_NODES` env var (`host:port` comma list).

## 3. Build and Package the Presence Server

1. Install dependencies: `npm ci`.
2. Bundle the app (e.g., Docker image) that runs `npm start`.
3. Configure environment variables:
   - `WS_PORT`: external WebSocket listener port.
   - `REDIS_NODES`: comma-separated Redis node list from step 2.
   - `WS_MAX_PAYLOAD_BYTES` (optional): raise only if clients send larger payloads.

## 4. Deploy and Scale

1. Launch at least two replicas behind your load balancer.
2. Expose `/` as the WebSocket endpoint (`ws://<lb-host>?userId=<uuid>`).
3. Verify that each replica can reach all Redis nodes (firewall + security groups).
4. Set up horizontal scaling for CPU/connection pressure (Kubernetes HPA, auto-scaling groups, etc.).

## 5. Operations

- **Health monitoring**: track process uptime, event loop lag, WebSocket connection counts, and Redis latency.
- **Redis TTL sweeps**: ensure background TTL refresh jobs run (logs show `markOnline`/`markOffline` activity).
- **Disaster recovery**: snapshot Redis, keep infrastructure as code for fast redeploy.
- **Client rollout**: ensure clients reconnect automatically and send `ping` to hold the connection.

With this layout the WebSocket servers remain stateless and interchangeable, and Redis becomes the authoritative presence store shared across all replicas.
