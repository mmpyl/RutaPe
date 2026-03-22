import { Router } from 'express';
import { Driver, Order, Route } from '../../src/types.js';
import { optimizePendingRoutes } from '../services/routeOptimization.js';
import { buildOrderPayload, validateCreateOrderPayload, validateOrderPatchPayload } from '../validation/orders.js';

interface LogisticsSocketEvent {
  type: 'INIT' | 'DRIVER_UPDATE' | 'ORDER_UPDATE' | 'ROUTE_UPDATE';
  data: { orders: Order[]; drivers: Driver[]; routes: Route[] } | Driver[] | Order[] | Route[];
}

interface ApiRouterDependencies {
  getOrders: () => Order[];
  getDrivers: () => Driver[];
  getRoutes: () => Route[];
  setOrders: (orders: Order[]) => void;
  setDrivers: (drivers: Driver[]) => void;
  setRoutes: (routes: Route[]) => void;
  persistState: () => Promise<void>;
  syncRouteState: () => void;
  broadcast: (event: LogisticsSocketEvent) => void;
  broadcastSnapshot: () => void;
}

export const createApiRouter = ({
  getOrders,
  getDrivers,
  getRoutes,
  setOrders,
  setDrivers,
  setRoutes,
  persistState,
  syncRouteState,
  broadcast,
  broadcastSnapshot,
}: ApiRouterDependencies) => {
  const router = Router();

  router.get('/orders', (_req, res) => {
    res.json(getOrders());
  });

  router.post('/orders', async (req, res) => {
    const validationError = validateCreateOrderPayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const payload = req.body as Record<string, unknown>;
    const newOrder: Order = {
      ...(buildOrderPayload(payload) as Order),
      id: (Math.floor(Math.random() * 1000) + 4100).toString(),
      carrier: payload.carrier ? String(payload.carrier).trim() : 'Flota Propia',
      carrierLogo: payload.carrierLogo ? String(payload.carrierLogo).trim() : 'FP',
    };

    const nextOrders = [newOrder, ...getOrders()];
    setOrders(nextOrders);
    await persistState();
    broadcast({ type: 'ORDER_UPDATE', data: nextOrders });
    return res.status(201).json(newOrder);
  });

  router.patch('/orders/:id', async (req, res) => {
    const { id } = req.params;
    const orders = getOrders();
    const existingOrder = orders.find((order) => order.id === id);

    if (!existingOrder) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const validationError = validateOrderPatchPayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const updatedOrder = buildOrderPayload(req.body as Record<string, unknown>, existingOrder) as Order;
    const nextOrders = orders.map((order) => (order.id === id ? updatedOrder : order));
    setOrders(nextOrders);
    syncRouteState();
    await persistState();

    broadcast({ type: 'ORDER_UPDATE', data: getOrders() });
    broadcast({ type: 'ROUTE_UPDATE', data: getRoutes() });
    broadcast({ type: 'DRIVER_UPDATE', data: getDrivers() });
    return res.json(updatedOrder);
  });

  router.get('/drivers', (_req, res) => {
    res.json(getDrivers());
  });

  router.get('/routes', (_req, res) => {
    res.json(getRoutes());
  });

  router.post('/routes/optimize', async (_req, res) => {
    try {
      const result = optimizePendingRoutes(getOrders(), getDrivers(), getRoutes());
      setOrders(result.orders);
      setDrivers(result.drivers);
      setRoutes(result.routes);
      await persistState();
      broadcastSnapshot();
      return res.json({ message: result.message, routes: result.routes });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo optimizar las rutas';
      return res.status(400).json({ error: message });
    }
  });

  router.post('/whatsapp/alert', (req, res) => {
    const { orderId } = req.body;
    console.log(`Simulating WhatsApp alert for order ${orderId}`);
    res.json({ success: true, message: `Alert sent for order ${orderId}` });
  });

  return router;
};
