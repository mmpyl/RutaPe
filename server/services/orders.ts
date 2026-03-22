import { Order } from '../../src/types.js';
import {
  buildOrderPayload,
  validateCreateOrderPayload,
  validateOrderPatchPayload,
} from '../validation/orders.js';
import { RealtimeService } from './realtime.js';

export interface OrderServiceResult<T> {
  ok: true;
  data: T;
}

export interface OrderServiceError {
  ok: false;
  status: number;
  error: string;
}

export type OrderServiceResponse<T> = OrderServiceResult<T> | OrderServiceError;

const makeError = (status: number, error: string): OrderServiceError => ({ ok: false, status, error });

// crypto.randomUUID() está disponible en Node.js >= 19 sin importaciones.
// Genera un UUID v4 criptográficamente seguro, eliminando el riesgo de
// colisión que existía con el rango anterior de solo 1000 valores posibles.
const generateOrderId = (): string => crypto.randomUUID();

export const createOrdersService = (
  getOrders: () => Order[],
  setOrders: (orders: Order[]) => void,
  realtime: RealtimeService,
) => {
  const list = (): Order[] => getOrders();

  const create = (payload: unknown): OrderServiceResponse<Order> => {
    const validationError = validateCreateOrderPayload(payload);
    if (validationError) return makeError(400, validationError);

    const body = payload as Record<string, unknown>;
    const base = buildOrderPayload(body) as Order;

    const newOrder: Order = {
      ...base,
      id: generateOrderId(),
      carrier: body.carrier ? String(body.carrier).trim() : 'Flota Propia',
      carrierLogo: body.carrierLogo ? String(body.carrierLogo).trim() : 'FP',
    };

    setOrders([newOrder, ...getOrders()]);
    realtime.broadcast({ type: 'ORDER_UPDATE', data: getOrders() });

    return { ok: true, data: newOrder };
  };

  const patch = (id: string, payload: unknown): OrderServiceResponse<Order> => {
    const existing = getOrders().find((o) => o.id === id);
    if (!existing) return makeError(404, 'Pedido no encontrado');

    const validationError = validateOrderPatchPayload(payload);
    if (validationError) return makeError(400, validationError);

    const updated = buildOrderPayload(payload as Record<string, unknown>, existing) as Order;
    setOrders(getOrders().map((o) => (o.id === id ? updated : o)));
    realtime.broadcast({ type: 'ORDER_UPDATE', data: getOrders() });

    return { ok: true, data: updated };
  };

  return { list, create, patch };
};

export type OrdersService = ReturnType<typeof createOrdersService>;
