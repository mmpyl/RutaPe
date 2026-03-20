import { Driver, Order, Route } from '../../types';
import { parseWsMessage } from '../contracts/guards';

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

interface InitPayload {
  orders: Order[];
  drivers: Driver[];
  routes: Route[];
}

export interface LogisticsSocketHandlers {
  onInit: (data: InitPayload) => void;
  onDriverUpdate: (data: Driver[]) => void;
  onOrderUpdate: (data: Order[]) => void;
  onRouteUpdate: (data: Route[]) => void;
  onError?: (error: Event) => void;
  onReconnecting?: (attempt: number) => void;
  onConnected?: () => void;
}

export interface LogisticsSocket {
  close: () => void;
}

// ---------------------------------------------------------------------------
// Config de reconexión
// ---------------------------------------------------------------------------

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const RECONNECT_FACTOR = 2;

const backoff = (attempt: number): number =>
  Math.min(RECONNECT_BASE_MS * RECONNECT_FACTOR ** attempt, RECONNECT_MAX_MS);

// ---------------------------------------------------------------------------
// URL helper
// ---------------------------------------------------------------------------

const getSocketUrl = (): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
};

// ---------------------------------------------------------------------------
// Factory con reconexión automática
// ---------------------------------------------------------------------------

export const connectLogisticsSocket = (handlers: LogisticsSocketHandlers): LogisticsSocket => {
  let socket: WebSocket | null = null;
  let attempt = 0;
  let destroyed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (destroyed) return;

    socket = new WebSocket(getSocketUrl());

    socket.onopen = () => {
      attempt = 0;
      handlers.onConnected?.();
    };

    socket.onmessage = (event: MessageEvent<string>) => {
      const message = parseWsMessage(event.data);
      if (!message) return;

      switch (message.type) {
        case 'INIT':
          handlers.onInit(message.data);
          break;
        case 'DRIVER_UPDATE':
          handlers.onDriverUpdate(message.data);
          break;
        case 'ORDER_UPDATE':
          handlers.onOrderUpdate(message.data);
          break;
        case 'ROUTE_UPDATE':
          handlers.onRouteUpdate(message.data);
          break;
      }
    };

    socket.onerror = (event: Event) => {
      handlers.onError?.(event);
    };

    socket.onclose = () => {
      if (destroyed) return;

      const delay = backoff(attempt);
      attempt += 1;
      handlers.onReconnecting?.(attempt);

      console.warn(`[WS] Desconectado. Reintentando en ${delay}ms (intento ${attempt})...`);
      reconnectTimer = setTimeout(connect, delay);
    };
  };

  connect();

  return {
    close: () => {
      destroyed = true;
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
      socket?.close();
    },
  };
};
