import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { WS_BASE_HOST } from '@/utils/env';
import { IndexeddbPersistence } from 'y-indexeddb';
import type { Board } from '@/types';

interface YjsBoardState {
  doc: Y.Doc | null;
  provider: WebsocketProvider | null;
  awareness: { setLocalStateField: (key: string, value: unknown) => void; getStates: () => Map<number, unknown>; on: (event: string, cb: () => void) => void; off: (event: string, cb: () => void) => void } | null;
  isSynced: boolean;
  onlineCount: number;
}

/**
 * Yjs CRDT integration for real-time collaborative editing.
 *
 * The board document is structured as nested Y.Maps:
 *   root (Y.Map)
 *   ├─ meta      : Y.Map  (name, createdBy, ...)
 *   ├─ groups    : Y.Array<Y.Map>
 *   └─ areas     : Y.Array<Y.Map>
 *       └─ layers : Y.Array<Y.Map>
 *           └─ content : Y.Map (stickyNotes / tables / drawings / timestamps arrays)
 *
 * Each area's position/content changes are merged automatically via CRDT,
 * so concurrent edits never conflict.
 */
export function useYjsBoard(boardId: string) {
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const persistenceRef = useRef<IndexeddbPersistence | null>(null);

  const [state, setState] = useState<YjsBoardState>({
    doc: null,
    provider: null,
    awareness: null,
    isSynced: false,
    onlineCount: 0,
  });

  useEffect(() => {
    const doc = new Y.Doc();
    docRef.current = doc;

    // IndexedDB persistence for offline support
    const persistence = new IndexeddbPersistence(`layerboard-${boardId}`, doc);
    persistenceRef.current = persistence;

    // WebSocket provider connects to the Yjs WS server
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${WS_BASE_HOST}/yjs`;
    const provider = new WebsocketProvider(wsUrl, `board-${boardId}`, doc, {
      connect: true,
    });
    providerRef.current = provider;

    provider.on('sync', () => {
      setState((s) => ({ ...s, isSynced: true }));
    });

    const awareness = provider.awareness;
    const updateOnlineCount = () => {
      setState((s) => ({ ...s, onlineCount: awareness.getStates().size }));
    };
    awareness.on('change', updateOnlineCount);

    setState({ doc, provider, awareness, isSynced: false, onlineCount: 1 });

    return () => {
      awareness.off('change', updateOnlineCount);
      provider.destroy();
      persistence.destroy();
      doc.destroy();
      docRef.current = null;
      providerRef.current = null;
      persistenceRef.current = null;
    };
  }, [boardId]);

  // Set local user info in awareness (presence)
  const setLocalUser = useCallback(
    (user: { userId: string; username: string; color: string; cursor?: { x: number; y: number } }) => {
      state.awareness?.setLocalStateField('user', user);
    },
    [state.awareness]
  );

  // Initialize the Yjs doc from a server-fetched board (only if empty)
  const initFromBoard = useCallback(
    (board: Board) => {
      const doc = docRef.current;
      if (!doc) return;
      const meta = doc.getMap('meta');
      if (meta.size > 0) return; // already initialized

      doc.transact(() => {
        meta.set('name', board.name);
        meta.set('boardId', board._id);

        const groupsArray = doc.getArray('groups');
        (board.groups || []).forEach((g) => {
          const gm = new Y.Map();
          gm.set('id', g.id);
          gm.set('name', g.name);
          gm.set('color', g.color);
          groupsArray.push([gm]);
        });

        const areasArray = doc.getArray('areas');
        (board.areas || []).forEach((area) => {
          const am = new Y.Map();
          am.set('id', area.id);
          am.set('groupId', area.groupId);
          am.set('name', area.name);
          am.set('position', area.position);
          am.set('size', area.size);

          const layersArray = new Y.Array();
          area.layers.forEach((layer) => {
            const lm = new Y.Map();
            lm.set('id', layer.id);
            lm.set('label', layer.label);
            lm.set('index', layer.index);
            lm.set('content', layer.content);
            layersArray.push([lm]);
          });
          am.set('layers', layersArray);
          areasArray.push([am]);
        });
      });
    },
    []
  );

  return {
    ...state,
    setLocalUser,
    initFromBoard,
  };
}
