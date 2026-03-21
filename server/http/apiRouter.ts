import { Router, Request, Response } from 'express';
import { OrdersService } from '../services/orders.js';
import { RoutesService } from '../services/routes.js';
import { Driver } from '../../src/types.js';

export const createApiRouter = (
  ordersService: OrdersService,
  routesService: RoutesService,
  getDrivers: () => Driver[],
): Router => {
  const router = Router();

  // -------------------------------------------------------------------------
  // Orders
  // -------------------------------------------------------------------------

  router.get('/orders', (_req: Request, res: Response) => {
    res.json(ordersService.list());
  });

  router.post('/orders', (req: Request, res: Response) => {
    const result = ordersService.create(req.body);
    if (!result.ok) return res.status(result.status).json({ error: result.error });
    return res.status(201).json(result.data);
  });

  router.patch('/orders/:id', (req: Request, res: Response) => {
    const result = ordersService.patch(req.params.id, req.body);
    if (!result.ok) return res.status(result.status).json({ error: result.error });
    return res.json(result.data);
  });

  // -------------------------------------------------------------------------
  // Drivers
  // -------------------------------------------------------------------------

  router.get('/drivers', (_req: Request, res: Response) => {
    res.json(getDrivers());
  });

  // -------------------------------------------------------------------------
  // Routes
  // -------------------------------------------------------------------------

  router.get('/routes', (_req: Request, res: Response) => {
    res.json(routesService.list());
  });

  router.post('/routes/optimize', (_req: Request, res: Response) => {
    const result = routesService.optimize();
    if (!result.ok) return res.status(result.status).json({ error: result.error });
    return res.json({ message: result.message, routes: result.routes });
  });

  // -------------------------------------------------------------------------
  // Integrations (simuladas)
  // -------------------------------------------------------------------------

  router.post('/whatsapp/alert', (req: Request, res: Response) => {
    const { orderId } = req.body as { orderId?: string };
    console.log(`[WhatsApp] Simulating alert for order ${orderId}`);
    res.json({ success: true, message: `Alert sent for order ${orderId}` });
  });

  return router;
};
