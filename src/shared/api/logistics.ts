import { Driver, LogisticsSnapshot, Order, Route, RouteOptimizationResponse } from '../../types';
import { isBrowserDataMode } from '../config/dataMode';
import {
  createBrowserOrder,
  fetchBrowserSnapshot,
  optimizeBrowserRoutesRequest,
  sendBrowserWhatsappAlert,
  updateBrowserOrder,
} from '../demo/store';
import { requestJson } from './http';

export const fetchLogisticsSnapshot = async (): Promise<LogisticsSnapshot> => {
  if (isBrowserDataMode()) {
    return fetchBrowserSnapshot();
  }

  const [orders, drivers, routes] = await Promise.all([
    requestJson<Order[]>('/api/orders', undefined, 'Failed to fetch orders'),
    requestJson<Driver[]>('/api/drivers', undefined, 'Failed to fetch drivers'),
    requestJson<Route[]>('/api/routes', undefined, 'Failed to fetch routes'),
  ]);

  return { orders, drivers, routes };
};

export const createOrderRequest = (order: Partial<Order>) => {
  if (isBrowserDataMode()) {
    return createBrowserOrder(order);
  }

  return requestJson<Order>(
    '/api/orders',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    },
    'Failed to add order',
  );
};

export const updateOrderRequest = (id: string, updates: Partial<Order>) => {
  if (isBrowserDataMode()) {
    return updateBrowserOrder(id, updates);
  }

  return requestJson<Order>(
    `/api/orders/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    },
    'Failed to update order',
  );
};

export const sendWhatsappAlertRequest = (orderId: string) => {
  if (isBrowserDataMode()) {
    return sendBrowserWhatsappAlert(orderId);
  }

  return requestJson<{ success: boolean; message: string }>(
    '/api/whatsapp/alert',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    },
    'Failed to send alert',
  );
};

export const optimizeRoutesRequest = () => {
  if (isBrowserDataMode()) {
    return optimizeBrowserRoutesRequest();
  }

  return requestJson<RouteOptimizationResponse>(
    '/api/routes/optimize',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    'Failed to optimize routes',
  );
};
