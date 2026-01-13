# Presence System

Production-grade WebSocket-based online/offline presence tracker backed by Redis Cluster and Node.js.

## Requirements

- Node.js 18+
- Docker + Docker Compose (v2)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the Redis Cluster locally (6 nodes + creator job):

   ```bash
   cd docker
   docker compose up -d
   ```

   The helper service `redis-cluster-create` initializes the cluster once the nodes are ready. Re-running the command is idempotent.

3. Launch the WebSocket presence server:

   ```bash
   npm start
   ```

   Environment variables:

   - `WS_PORT` (default `8080`)
   - `REDIS_NODES` (`host:port` comma list, default `localhost:7000-7005`)
   - `WS_MAX_PAYLOAD_BYTES` (default 4096)

## WebSocket Contract

- Connect to `ws://localhost:8080?userId=<uuid>`.
- Server writes the user's presence key with TTL 60s on connect.
- Clients may send `ping` to receive `pong`; no Redis writes occur during heartbeats.
- Server deletes the key when the last connection for the user closes.
- Background job refreshes TTLs every 30s using pipelined `EXPIRE` batches.

## Redis Keys

- `presence:{userId}` set to `"1"` with TTL 60 seconds.
- Keys use Redis hash tags to guarantee co-location per user within the Redis Cluster.

## Docker Services

- `redis-node-[1-6]`: Redis 7 nodes sharing the same cluster config.
- `redis-cluster-create`: one-shot job that runs `redis-cli --cluster create` for the six nodes.

Stop everything with:

```bash
cd docker
docker compose down -v
```
