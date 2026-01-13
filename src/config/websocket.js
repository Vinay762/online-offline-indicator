const uWS = require('uWebSockets.js');
const { WS_MAX_PAYLOAD_BYTES } = require('../utils/constants');

const createWebsocketServer = (presenceGateway) => {
  const app = uWS.App();

  app.ws('/*', {
    compression: uWS.SHARED_COMPRESSOR,
    idleTimeout: 60,
    maxBackpressure: 1024 * 1024,
    maxPayloadLength: WS_MAX_PAYLOAD_BYTES,
    upgrade: (res, req, context) => presenceGateway.handleUpgrade(res, req, context),
    open: (ws) => presenceGateway.handleOpen(ws),
    close: (ws, code, message) => presenceGateway.handleClose(ws, code, message),
    message: (ws, message, isBinary) => presenceGateway.handleMessage(ws, message, isBinary),
    drain: (ws) => presenceGateway.handleDrain(ws)
  });

  return app;
};

module.exports = createWebsocketServer;
