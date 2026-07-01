import express from 'express';
import cors from 'cors';
import http from 'http';
import { config } from './config/config.js';
import { connectDatabase } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import boardRoutes from './routes/board.routes.js';
import { initSocketIO } from './websocket/socket-server.js';
import { startYjsWebSocket } from './websocket/yjs-server.js';

async function startServer() {
  // Connect to database
  await connectDatabase();

  // Create Express app
  const app = express();
  const httpServer = http.createServer(app);

  // Middleware
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/boards', boardRoutes);

  // Initialize WebSocket servers
  initSocketIO(httpServer);
  startYjsWebSocket(httpServer);

  // Start server
  httpServer.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════╗
║        LayerBoard Server v1.0.0          ║
║                                          ║
║  HTTP:    http://localhost:${config.port}         ║
║  API:     http://localhost:${config.port}/api      ║
║  Socket:  ws://localhost:${config.port}/socket.io  ║
║  Yjs WS:  ws://localhost:${config.port}/yjs        ║
║                                          ║
║  Environment: ${config.nodeEnv}                    ║
╚══════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    httpServer.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    httpServer.close();
    process.exit(0);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
