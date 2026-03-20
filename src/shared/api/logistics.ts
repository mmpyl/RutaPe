import { Driver, Order, Route } from '../../types';
import { requestJson } from './http';
import {
  isOrder,
  isOrderArray,
  isDriverArray,
  isRouteArray,
  isWhatsAppAlertResponse,
  WhatsAppAlertResponse,
} from '../contracts/guards';

export interface LogisticsSnapshot {
  orders: Order[];
  drivers: Driver[];
  routes: Route[];
}

export const fetchLogisticsSnapshot = async (): Promise<LogisticsSnapshot> => {
  const [orders, drivers, routes] = await Promise.all([
    requestJson<Order[]>('/api/orders', undefined, 'Error al cargar pedidos', isOrderArray),
    requestJson<Driver[]>('/api/drivers', undefined, 'Error al cargar conductores', isDriverArray),
    requestJson<Route[]>('/api/routes', undefined, 'Error al cargar rutas', isRouteArray),
  ]);

  return { orders, drivers, routes };
};

export const createOrderRequest = (order: Partial<Order>): Promise<Order> =>
  requestJson<Order>(
    '/api/orders',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    },
    'Error al crear pedido',
    isOrder,
  );

export const updateOrderRequest = (id: string, updates: Partial<Order>): Promise<Order> =>
  requestJson<Order>(
    `/api/orders/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    },
    'Error al actualizar pedido',
    isOrder,
  );

export const sendWhatsappAlertRequest = (
  orderId: string,
): Promise<WhatsAppAlertResponse> =>
  requestJson(
    '/api/whatsapp/alert',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    },
    'Error al enviar alerta',
    isWhatsAppAlertResponse,
  );

const isOptimizeResponse = (
  v: unknown,
): v is { message: string; routes: Route[] } => {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  return typeof obj.message === 'string' && isRouteArray(obj.routes);
};

export const optimizeRoutesRequest = (): Promise<{ message: string; routes: Route[] }> =>
  requestJson(
    '/api/routes/optimize',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    'Error al optimizar rutas',
    isOptimizeResponse,
  );
