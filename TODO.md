## Presence Service TODOs

- Support multiple simultaneous devices per user by tracking connection counts in Redis (e.g., `INCR`/`DECR` on a hash) so any gateway instance can tell when the global count hits zero before deleting presence keys.
- Add real authentication during the WebSocket upgrade (validate a signed token or session) to prevent arbitrary `userId` spoofing.
- Document and automate Redis self-hosting requirements: enable AOF/backup settings, cluster topology parsing, TLS (if needed), and health monitoring.
- Expose an HTTP health-check endpoint so load balancers can verify the instance before routing WebSocket traffic.
- Implement metrics/logging sinks (per-connection events, Redis errors, TTL refresh latency) for observability in production.
