import { Router, Request, Response } from 'express';
import { OrdersService } from '../services/orders.js';
import { RoutesService } from '../services/routes.js';
import { Driver } from '../../src/types.js';
import { createRateLimiter } from './rateLimiter.js';

// ---------------------------------------------------------------------------
// Rate limiters
// ---------------------------------------------------------------------------

// /routes/optimize ejecuta 2-Opt O(n²) síncronamente en el event loop.
// 10 peticiones por minuto por IP es suficiente para uso legítimo (un operador
// no optimiza rutas más de una vez cada pocos segundos) y corta cualquier abuso.
const optimizeRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
  message: 'Límite de optimización alcanzado. Máximo 10 veces por minuto.',
});

// Límite general para mutaciones de pedidos — protege el broadcast WebSocket
// de ráfagas que enviarían decenas de mensajes al segundo a todos los clientes.
const mutationRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
  message: 'Demasiadas solicitudes. Máximo 60 por minuto.',
});

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

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

  router.post('/orders', mutationRateLimit, (req: Request, res: Response) => {
    const result = ordersService.create(req.body);
    if (!result.ok) return res.status(result.status).json({ error: result.error });
    return res.status(201).json(result.data);
  });

  router.patch('/orders/:id', mutationRateLimit, (req: Request, res: Response) => {
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

  router.post('/routes/optimize', optimizeRateLimit, (_req: Request, res: Response) => {
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
