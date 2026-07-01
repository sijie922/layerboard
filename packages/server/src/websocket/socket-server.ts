import { Server as SocketServer } from 'socket.io';
import type { Server } from 'http';
import { config } from '../config/config.js';

let io: SocketServer | null = null;

export function initSocketIO(httpServer: Server): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Join a board room
    socket.on('board:join', (boardId: string) => {
      socket.join(`board:${boardId}`);
      console.log(`👤 ${socket.id} joined board:${boardId}`);
    });

    // Leave a board room
    socket.on('board:leave', (boardId: string) => {
      socket.leave(`board:${boardId}`);
      console.log(`👤 ${socket.id} left board:${boardId}`);
    });

    // Broadcast cursor position
    socket.on('cursor:move', (data: { boardId: string; userId: string; x: number; y: number }) => {
      socket.to(`board:${data.boardId}`).emit('cursor:update', {
        userId: data.userId,
        x: data.x,
        y: data.y,
      });
    });

    // Broadcast area changes
    socket.on('area:update', (data: { boardId: string; areaId: string; update: unknown }) => {
      socket.to(`board:${data.boardId}`).emit('area:updated', {
        areaId: data.areaId,
        update: data.update,
      });
    });

    // Broadcast layer changes
    socket.on('layer:update', (data: { boardId: string; areaId: string; layerId: string; update: unknown }) => {
      socket.to(`board:${data.boardId}`).emit('layer:updated', {
        areaId: data.areaId,
        layerId: data.layerId,
        update: data.update,
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketServer | null {
  return io;
}
