import { Driver, Order, Route } from '../../types';
import { requestJson } from './http';

export interface LogisticsSnapshot {
  orders: Order[];
  drivers: Driver[];
  routes: Route[];
}

export const fetchLogisticsSnapshot = async (): Promise<LogisticsSnapshot> => {
  const [orders, drivers, routes] = await Promise.all([
    requestJson<Order[]>('/api/orders', undefined, 'Failed to fetch orders'),
    requestJson<Driver[]>('/api/drivers', undefined, 'Failed to fetch drivers'),
    requestJson<Route[]>('/api/routes', undefined, 'Failed to fetch routes'),
  ]);

  return { orders, drivers, routes };
};

export const createOrderRequest = (order: Partial<Order>) =>
  requestJson<Order>(
    '/api/orders',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    },
    'Failed to add order'
  );

export const updateOrderRequest = (id: string, updates: Partial<Order>) =>
  requestJson<Order>(
    `/api/orders/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    },
    'Failed to update order'
  );

export const sendWhatsappAlertRequest = (orderId: string) =>
  requestJson<{ success: boolean; message: string }>(
    '/api/whatsapp/alert',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    },
    'Failed to send alert'
  );

export const optimizeRoutesRequest = () =>
  requestJson<{ message: string; routes: Route[] }>(
    '/api/routes/optimize',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    'Failed to optimize routes'
  );
