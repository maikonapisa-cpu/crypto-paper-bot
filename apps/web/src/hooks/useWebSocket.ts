/**
 * apps/web/src/hooks/useWebSocket.ts
 * Maintains a WebSocket connection to the API and dispatches events to the store.
 */
import { useEffect, useRef } from 'react';
import { useDashboard } from '../stores/dashboard.store';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001/ws';
const RECONNECT_DELAY = 3000;

export function useWebSocket() {
  const { onWsMessage, setWsConnected } = useDashboard();
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const connect = () => {
      if (!mountedRef.current) return;
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!mountedRef.current) return;
          setWsConnected(true);
          console.log('[WS] Connected');
        };

        ws.onmessage = (ev) => {
          if (!mountedRef.current) return;
          try {
            const { type, payload } = JSON.parse(ev.data as string) as { type: string; payload: unknown };
            onWsMessage(type, payload);
          } catch { /* ignore */ }
        };

        ws.onclose = () => {
          if (!mountedRef.current) return;
          setWsConnected(false);
          console.log(`[WS] Disconnected. Reconnecting in ${RECONNECT_DELAY}ms...`);
          timerRef.current = setTimeout(connect, RECONNECT_DELAY);
        };

        ws.onerror = () => { ws.close(); };

      } catch (err) {
        console.error('[WS] Failed to connect:', err);
        timerRef.current = setTimeout(connect, RECONNECT_DELAY);
      }
    };

    connect();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, []); // eslint-disable-line

  const send = (action: string, payload?: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, payload }));
    }
  };

  return { send };
}
