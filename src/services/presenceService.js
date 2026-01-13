const redis = require('../config/redis');
const { presenceKey } = require('../utils/keys');
const {
  PRESENCE_TTL_SECONDS,
  TTL_REFRESH_INTERVAL_MS,
  TTL_REFRESH_BATCH_SIZE
} = require('../utils/constants');

class PresenceService {
  constructor() {
    this.activeUsers = new Set();
    this.refreshInFlight = false;
    this.refreshTimer = setInterval(
      () => this.refreshAllTTLs().catch((err) => console.error('TTL refresh error', err)),
      TTL_REFRESH_INTERVAL_MS
    );
    if (typeof this.refreshTimer.unref === 'function') {
      this.refreshTimer.unref();
    }
  }

  async markOnline(userId) {
    const pipeline = redis.pipeline();
    pipeline.set(presenceKey(userId), '1', 'EX', PRESENCE_TTL_SECONDS);
    await pipeline.exec();
    this.activeUsers.add(userId);
  }

  async markOffline(userId) {
    if (!this.activeUsers.has(userId)) {
      return;
    }

    this.activeUsers.delete(userId);
    const pipeline = redis.pipeline();
    pipeline.del(presenceKey(userId));
    await pipeline.exec();
  }

  async refreshAllTTLs() {
    if (this.refreshInFlight) {
      return;
    }

    this.refreshInFlight = true;
    try {
      const userIds = Array.from(this.activeUsers.values());
      if (!userIds.length) {
        return;
      }

      for (let i = 0; i < userIds.length; i += TTL_REFRESH_BATCH_SIZE) {
        const batch = userIds.slice(i, i + TTL_REFRESH_BATCH_SIZE);
        const pipeline = redis.pipeline();
        batch.forEach((userId) => {
          pipeline.expire(presenceKey(userId), PRESENCE_TTL_SECONDS);
        });
        await pipeline.exec();
      }
    } finally {
      this.refreshInFlight = false;
    }
  }

  async shutdown() {
    clearInterval(this.refreshTimer);
    await redis.quit();
  }
}

module.exports = PresenceService;
