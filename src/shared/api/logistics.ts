import { Driver, Order, Route, RouteOptimizationResponse } from '../../types';
import {
  isDriverArray,
  isOrder,
  isOrderArray,
  isRouteArray,
  isRouteOptimizationResponse,
  isSuccessMessage,
} from '../contracts/guards';
import {
  createBrowserOrder,
  optimizeBrowserRoutes,
  readBrowserState,
  updateBrowserOrder,
} from '../demo/store';
import { requestJson } from './http';

export interface LogisticsSnapshot {
  orders: Order[];
  drivers: Driver[];
  routes: Route[];
}

const browserMode = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_DATA_MODE === 'browser';

export const fetchLogisticsSnapshot = async (): Promise<LogisticsSnapshot> => {
  if (browserMode) {
    return readBrowserState();
  }

  const [orders, drivers, routes] = await Promise.all([
    requestJson<Order[]>('/api/orders', undefined, 'Failed to fetch orders', isOrderArray),
    requestJson<Driver[]>('/api/drivers', undefined, 'Failed to fetch drivers', isDriverArray),
    requestJson<Route[]>('/api/routes', undefined, 'Failed to fetch routes', isRouteArray),
  ]);

  return { orders, drivers, routes };
};

export const createOrderRequest = async (order: Partial<Order>) => {
  if (browserMode) {
    return createBrowserOrder(readBrowserState(), order);
  }

  return requestJson<Order>(
    '/api/orders',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    },
    'Failed to add order',
    isOrder,
  );
};

export const updateOrderRequest = async (id: string, updates: Partial<Order>) => {
  if (browserMode) {
    return updateBrowserOrder(readBrowserState(), id, updates);
  }

  return requestJson<Order>(
    `/api/orders/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    },
    'Failed to update order',
    isOrder,
  );
};

export const sendWhatsappAlertRequest = async (orderId: string) => {
  if (browserMode) {
    return { success: true, message: `Alert sent for order ${orderId}` };
  }

  return requestJson<{ success: boolean; message: string }>(
    '/api/whatsapp/alert',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    },
    'Failed to send alert',
    isSuccessMessage,
  );
};

export const optimizeRoutesRequest = async (): Promise<RouteOptimizationResponse> => {
  if (browserMode) {
    return optimizeBrowserRoutes(readBrowserState());
  }

  return requestJson<RouteOptimizationResponse>(
    '/api/routes/optimize',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    'Failed to optimize routes',
    isRouteOptimizationResponse,
  );
};

export const isBrowserDataMode = () => browserMode;
