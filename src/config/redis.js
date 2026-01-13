const Redis = require('ioredis');

const DEFAULT_CLUSTER_NODES = [
  { host: '127.0.0.1', port: 7000 },
  { host: '127.0.0.1', port: 7001 },
  { host: '127.0.0.1', port: 7002 },
  { host: '127.0.0.1', port: 7003 },
  { host: '127.0.0.1', port: 7004 },
  { host: '127.0.0.1', port: 7005 }
];

const parseClusterNodes = () => {
  if (!process.env.REDIS_NODES) {
    return DEFAULT_CLUSTER_NODES;
  }

  return process.env.REDIS_NODES
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [host, port] = entry.split(':');
      return { host, port: Number(port) };
    });
};

const cluster = new Redis.Cluster(parseClusterNodes(), {
  scaleReads: 'slave',
  redisOptions: {
    enableReadyCheck: true,
    maxRetriesPerRequest: 2
  }
});

cluster.on('error', (err) => {
  console.error('Redis cluster error:', err);
});

module.exports = cluster;
