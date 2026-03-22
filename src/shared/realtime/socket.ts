import { Driver, Order, Route } from '../../types';

interface InitPayload {
  orders: Order[];
  drivers: Driver[];
  routes: Route[];
}

type LogisticsSocketMessage =
  | { type: 'INIT'; data: InitPayload }
  | { type: 'DRIVER_UPDATE'; data: Driver[] }
  | { type: 'ORDER_UPDATE'; data: Order[] }
  | { type: 'ROUTE_UPDATE'; data: Route[] };

export type WebSocketStatus = 'connecting' | 'open' | 'closed' | 'error' | 'reconnecting' | 'disabled';

interface LogisticsSocketHandlers {
  onInit: (data: InitPayload) => void;
  onDriverUpdate: (data: Driver[]) => void;
  onOrderUpdate: (data: Order[]) => void;
  onRouteUpdate: (data: Route[]) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
  onError?: (error: Event | Error) => void;
}

const MAX_RECONNECT_DELAY_MS = 10_000;
const BASE_RECONNECT_DELAY_MS = 1_000;

const getSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
};

const isSocketMessage = (value: unknown): value is LogisticsSocketMessage => {
  if (typeof value !== 'object' || value === null || !('type' in value)) {
    return false;
  }

  const message = value as { type?: unknown };
  return typeof message.type === 'string';
};

export const connectLogisticsSocket = (handlers: LogisticsSocketHandlers) => {
  let socket: WebSocket | null = null;
  let reconnectAttempts = 0;
  let reconnectTimer: number | null = null;
  let manuallyClosed = false;

  const emitStatus = (status: WebSocketStatus) => {
    handlers.onStatusChange?.(status);
  };

  const clearReconnectTimer = () => {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (manuallyClosed) {
      emitStatus('closed');
      return;
    }

    reconnectAttempts += 1;
    const delay = Math.min(BASE_RECONNECT_DELAY_MS * 2 ** (reconnectAttempts - 1), MAX_RECONNECT_DELAY_MS);
    emitStatus('reconnecting');
    clearReconnectTimer();
    reconnectTimer = window.setTimeout(() => {
      connect();
    }, delay);
  };

  const connect = () => {
    emitStatus(reconnectAttempts > 0 ? 'reconnecting' : 'connecting');
    socket = new WebSocket(getSocketUrl());

    socket.onopen = () => {
      reconnectAttempts = 0;
      emitStatus('open');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as unknown;

        if (!isSocketMessage(message)) {
          throw new Error('Unexpected socket payload');
        }

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
          default:
            break;
        }
      } catch (error) {
        handlers.onError?.(error instanceof Error ? error : new Error('WebSocket parse error'));
      }
    };

    socket.onerror = (error) => {
      emitStatus('error');
      handlers.onError?.(error);
    };

    socket.onclose = () => {
      emitStatus('closed');
      scheduleReconnect();
    };
  };

  connect();

  return {
    close: () => {
      manuallyClosed = true;
      clearReconnectTimer();
      socket?.close();
    },
  };
};
