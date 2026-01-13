const createWebsocketServer = require('./config/websocket');
const PresenceService = require('./services/presenceService');
const PresenceGateway = require('./gateways/presenceGateway');
const { WS_PORT } = require('./utils/constants');

const presenceService = new PresenceService();
const presenceGateway = new PresenceGateway(presenceService);
const app = createWebsocketServer(presenceGateway);

app.listen('0.0.0.0', WS_PORT, (token) => {
  if (token) {
    console.log(`Presence WebSocket listening on port ${WS_PORT}`);
  } else {
    console.error('Failed to bind WebSocket server');
    process.exit(1);
  }
});

const shutdown = async (signal) => {
  console.log(`\nReceived ${signal}, shutting down...`);
  try {
    await presenceService.shutdown();
  } catch (err) {
    console.error('Error during shutdown', err);
  } finally {
    process.exit(0);
  }
};

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});
