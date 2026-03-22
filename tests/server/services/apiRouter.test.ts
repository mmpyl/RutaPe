import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import { createApiRouter } from '../../../server/http/apiRouter';
import { Order, Driver, Route } from '../../../src/types';

// ---------------------------------------------------------------------------
// Helpers de test
// ---------------------------------------------------------------------------

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: '4021',
  status: 'Pendiente',
  time: 'Ahora',
  client: 'Test Cliente',
  address: 'Av. Test 123',
  color: 'bg-slate-100 text-slate-700',
  items: 2,
  value: 100,
  carrier: 'Flota Propia',
  carrierLogo: 'FP',
  ...overrides,
});

const makeDriver = (): Driver => ({
  id: 'D1',
  name: 'Carlos',
  status: 'Disponible',
  orders: 0,
  efficiency: 95,
  avatar: 'CM',
  vehicle: 'Camioneta',
  phone: '999',
  lat: -12.0,
  lng: -77.0,
});

/**
 * Lanza una petición HTTP contra el router montado en Express en memoria.
 * No requiere puerto real ni supertest — usa http.request directamente.
 */
const makeRequest = async (
  app: express.Express,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> => {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const server = http.createServer(app);

    server.listen(0, () => {
      const port = (server.address() as { port: number }).port;
      const payload = body ? JSON.stringify(body) : undefined;

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          },
        },
        (res: any) => {
          let data = '';
          res.on('data', (chunk: string) => { data += chunk; });
          res.on('end', () => {
            server.close();
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch {
              resolve({ status: res.statusCode, body: data });
            }
          });
        },
      );

      req.on('error', (err: Error) => { server.close(); reject(err); });
      if (payload) req.write(payload);
      req.end();
    });
  });
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const makeServices = () => {
  const ordersService = {
    list: vi.fn(() => [makeOrder()]),
    create: vi.fn(() => ({ ok: true as const, data: makeOrder({ id: '9999' }) })),
    patch: vi.fn(() => ({ ok: true as const, data: makeOrder({ status: 'En Ruta' }) })),
  };

  const routesService = {
    list: vi.fn((): Route[] => []),
    optimize: vi.fn(() => ({
      ok: true as const,
      message: 'Rutas optimizadas con éxito',
      routes: [] as Route[],
    })),
  };

  const getDrivers = vi.fn(() => [makeDriver()]);

  return { ordersService, routesService, getDrivers };
};

const buildApp = (services: ReturnType<typeof makeServices>) => {
  const app = express();
  app.use(express.json());
  app.use('/api', createApiRouter(
    services.ordersService,
    services.routesService,
    services.getDrivers,
  ));
  return app;
};

// ---------------------------------------------------------------------------
// GET /api/orders
// ---------------------------------------------------------------------------

describe('GET /api/orders', () => {
  it('devuelve 200 con lista de pedidos', async () => {
    const services = makeServices();
    const app = buildApp(services);

    const { status, body } = await makeRequest(app, 'GET', '/api/orders');

    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(services.ordersService.list).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// POST /api/orders
// ---------------------------------------------------------------------------

describe('POST /api/orders', () => {
  it('devuelve 201 con el pedido creado cuando el servicio ok:true', async () => {
    const services = makeServices();
    const app = buildApp(services);

    const { status, body } = await makeRequest(app, 'POST', '/api/orders', {
      client: 'Juan',
      address: 'Calle 1',
      items: 2,
      value: 50,
    });

    expect(status).toBe(201);
    expect((body as Order).id).toBe('9999');
  });

  it('devuelve 400 con error cuando el servicio ok:false', async () => {
    const services = makeServices();
    services.ordersService.create = vi.fn(() => ({
      ok: false as const,
      status: 400,
      error: 'El cliente es obligatorio',
    }));
    const app = buildApp(services);

    const { status, body } = await makeRequest(app, 'POST', '/api/orders', {});

    expect(status).toBe(400);
    expect((body as { error: string }).error).toBe('El cliente es obligatorio');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/orders/:id
// ---------------------------------------------------------------------------

describe('PATCH /api/orders/:id', () => {
  it('devuelve 200 con pedido actualizado cuando ok:true', async () => {
    const services = makeServices();
    const app = buildApp(services);

    const { status, body } = await makeRequest(app, 'PATCH', '/api/orders/4021', {
      status: 'En Ruta',
    });

    expect(status).toBe(200);
    expect((body as Order).status).toBe('En Ruta');
  });

  it('devuelve 404 cuando el servicio ok:false con status 404', async () => {
    const services = makeServices();
    services.ordersService.patch = vi.fn(() => ({
      ok: false as const,
      status: 404,
      error: 'Pedido no encontrado',
    }));
    const app = buildApp(services);

    const { status, body } = await makeRequest(app, 'PATCH', '/api/orders/9999', {
      status: 'En Ruta',
    });

    expect(status).toBe(404);
    expect((body as { error: string }).error).toMatch(/no encontrado/i);
  });
});

// ---------------------------------------------------------------------------
// GET /api/drivers
// ---------------------------------------------------------------------------

describe('GET /api/drivers', () => {
  it('devuelve 200 con lista de conductores', async () => {
    const services = makeServices();
    const app = buildApp(services);

    const { status, body } = await makeRequest(app, 'GET', '/api/drivers');

    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(services.getDrivers).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// GET /api/routes
// ---------------------------------------------------------------------------

describe('GET /api/routes', () => {
  it('devuelve 200 con lista de rutas', async () => {
    const services = makeServices();
    const app = buildApp(services);

    const { status, body } = await makeRequest(app, 'GET', '/api/routes');

    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// POST /api/routes/optimize
// ---------------------------------------------------------------------------

describe('POST /api/routes/optimize', () => {
  it('devuelve 200 con mensaje de éxito', async () => {
    const services = makeServices();
    const app = buildApp(services);

    const { status, body } = await makeRequest(app, 'POST', '/api/routes/optimize');

    expect(status).toBe(200);
    expect((body as { message: string }).message).toMatch(/optimizad/i);
  });

  it('devuelve 400 cuando no hay conductores disponibles', async () => {
    const services = makeServices();
    services.routesService.optimize = vi.fn(() => ({
      ok: false as const,
      status: 400,
      error: 'No hay conductores disponibles',
    }));
    const app = buildApp(services);

    const { status, body } = await makeRequest(app, 'POST', '/api/routes/optimize');

    expect(status).toBe(400);
    expect((body as { error: string }).error).toMatch(/conductores/i);
  });
});

// ---------------------------------------------------------------------------
// POST /api/whatsapp/alert
// ---------------------------------------------------------------------------

describe('POST /api/whatsapp/alert', () => {
  it('devuelve 200 con success:true', async () => {
    const services = makeServices();
    const app = buildApp(services);

    const { status, body } = await makeRequest(app, 'POST', '/api/whatsapp/alert', {
      orderId: '4021',
    });

    expect(status).toBe(200);
    expect((body as { success: boolean }).success).toBe(true);
  });
});
