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

interface LogisticsSocketHandlers {
  onInit: (data: InitPayload) => void;
  onDriverUpdate: (data: Driver[]) => void;
  onOrderUpdate: (data: Order[]) => void;
  onRouteUpdate: (data: Route[]) => void;
  onError?: (error: Event | Error) => void;
}

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
  const socket = new WebSocket(getSocketUrl());

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

  if (handlers.onError) {
    socket.onerror = handlers.onError;
  }

  return socket;
};
