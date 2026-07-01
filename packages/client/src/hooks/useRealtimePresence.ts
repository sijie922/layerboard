import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/utils/env';

export interface OnlineUser {
  userId: string;
  username?: string;
  socketId: string;
}

export interface RemoteCursor {
  userId: string;
  x: number;
  y: number;
}

/**
 * Socket.IO connection hook for cursor broadcast + presence.
 * Cursors are throttled client-side (~30fps) before being sent.
 */
export function useRealtimePresence(boardId: string, userId: string, username: string) {
  const socketRef = useRef<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [cursors, setCursors] = useState<Record<string, RemoteCursor>>({});
  const lastSentRef = useRef(0);

  useEffect(() => {
    const socket = io(API_BASE_URL || undefined, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('board:join', boardId);
      // identify ourselves
      socket.emit('user:identity', { boardId, userId, username });
    });

    // Presence updates
    socket.on('presence:update', (users: OnlineUser[]) => {
      setOnlineUsers(users.filter((u) => u.userId !== userId));
    });

    // Cursor updates from other users
    socket.on('cursor:update', (data: RemoteCursor) => {
      if (data.userId === userId) return;
      setCursors((prev) => ({ ...prev, [data.userId]: data }));
    });

    socket.on('disconnect', () => {
      setOnlineUsers([]);
      setCursors({});
    });

    return () => {
      socket.emit('board:leave', boardId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [boardId, userId, username]);

  // Broadcast local cursor (throttled to ~30fps)
  const sendCursor = (x: number, y: number) => {
    const now = Date.now();
    if (now - lastSentRef.current < 33) return; // 33ms ≈ 30fps
    lastSentRef.current = now;
    socketRef.current?.emit('cursor:move', { boardId, userId, x, y });
  };

  return { onlineUsers, cursors, sendCursor };
}
