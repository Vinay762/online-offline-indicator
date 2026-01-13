const { TextDecoder } = require('util');

const decoder = new TextDecoder('utf-8');

class PresenceGateway {
  constructor(presenceService) {
    this.presenceService = presenceService;
  }

  authenticate(req) {
    const userId = req.getQuery('userId') || req.getHeader('x-user-id');
    return userId && userId.trim() ? userId.trim() : null;
  }

  handleUpgrade(res, req, context) {
    const userId = this.authenticate(req);
    if (!userId) {
      res.writeStatus('401 Unauthorized');
      res.end('Missing userId');
      return;
    }

    res.upgrade(
      { userId },
      req.getHeader('sec-websocket-key'),
      req.getHeader('sec-websocket-protocol') || '',
      req.getHeader('sec-websocket-extensions') || '',
      context
    );
  }

  handleOpen(ws) {
    const { userId } = ws.getUserData();
    if (!userId) {
      ws.end(1008, 'Unauthorized');
      return;
    }

    this.presenceService
      .markOnline(userId)
      .then(() => {
        ws.send('ONLINE');
      })
      .catch((err) => {
        console.error('Failed to mark online', err);
        ws.end(1011, 'Presence failure');
      });
  }

  handleClose(ws) {
    const { userId } = ws.getUserData();
    if (!userId) {
      return;
    }
    this.presenceService.markOffline(userId).catch((err) => {
      console.error('Failed to mark offline', err);
    });
  }

  handleMessage(ws, message, isBinary) {
    if (isBinary) {
      return;
    }
    const payload = decoder.decode(new Uint8Array(message));
    if (payload === 'ping') {
      ws.send('pong');
    }
  }

  handleDrain() {
    // Backpressure is handled by uWebSockets.js, nothing needed for presence-only payloads.
  }
}

module.exports = PresenceGateway;
