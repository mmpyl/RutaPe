import { WebSocketServer, WebSocket } from 'ws';

export type BroadcastPayload =
  | { type: 'INIT'; data: { orders: unknown[]; drivers: unknown[]; routes: unknown[] } }
  | { type: 'DRIVER_UPDATE'; data: unknown[] }
  | { type: 'ORDER_UPDATE'; data: unknown[] }
  | { type: 'ROUTE_UPDATE'; data: unknown[] };

export const createRealtimeService = (wss: WebSocketServer) => {
  const broadcast = (payload: BroadcastPayload): void => {
    const message = JSON.stringify(payload);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  const sendInit = (ws: WebSocket, data: { orders: unknown[]; drivers: unknown[]; routes: unknown[] }): void => {
    ws.send(JSON.stringify({ type: 'INIT', data }));
  };

  return { broadcast, sendInit };
};

export type RealtimeService = ReturnType<typeof createRealtimeService>;
