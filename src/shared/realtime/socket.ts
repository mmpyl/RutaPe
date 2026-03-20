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
  onError?: (error: Event) => void;
}

const getSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
};

export const connectLogisticsSocket = (handlers: LogisticsSocketHandlers) => {
  const socket = new WebSocket(getSocketUrl());

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data) as LogisticsSocketMessage;

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
  };

  if (handlers.onError) {
    socket.onerror = handlers.onError;
  }

  return socket;
};
