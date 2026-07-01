declare module 'y-websocket/bin/utils' {
  import type { Doc } from 'yjs';
  import type { IncomingMessage } from 'http';
  import type WebSocket from 'ws';

  export function setupWSConnection(
    conn: WebSocket,
    req: IncomingMessage,
    options?: { docName?: string; gc?: boolean }
  ): void;

  export function getYDoc(docName: string, gc?: boolean): {
    doc: Doc;
    conns: Map<WebSocket, Set<number>>;
    awareness: unknown;
  };

  export const docs: Map<string, { doc: Doc; conns: Map<WebSocket, Set<number>>; awareness: unknown }>;
}
