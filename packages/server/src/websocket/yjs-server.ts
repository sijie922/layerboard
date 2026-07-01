import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';
import type { Server, IncomingMessage } from 'http';
import { URL } from 'url';

export function startYjsWebSocket(httpServer: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request: IncomingMessage, socket: unknown, head: Buffer) => {
    const reqUrl = request.url || '/';
    const parsedUrl = new URL(reqUrl, `http://${request.headers.host || 'localhost'}`);

    if (parsedUrl.pathname === '/yjs') {
      wss.handleUpgrade(request, socket as Parameters<typeof wss.handleUpgrade>[1], head, (ws) => {
        wss.emit('connection', ws, request);
        setupWSConnection(ws, request);
      });
    }
  });

  wss.on('connection', () => {
    console.log('🔗 Yjs WebSocket connected');
  });

  console.log('✅ Yjs WebSocket server ready on /yjs');
}
