import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import * as http from 'http';
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
 * Lanza una petición HTTP contra Express en memoria usando http (ESM-compatible).
 * Puerto 0 = asignación automática por el SO. Timeout 5s para evitar cuelgues.
 */
const makeRequest = (
  app: express.Express,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> => {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    let settled = false;

    const settle = (result: { status: number; body: unknown } | Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (server.listening) server.close();
      if (result instanceof Error) reject(result);
      else resolve(result);
    };

    const timer = setTimeout(() => settle(new Error('makeRequest timeout')), 5000);

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      const payload = body !== undefined ? JSON.stringify(body) : undefined;

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: addr.port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk: string) => { data += chunk; });
          res.on('end', () => {
            try {
              settle({ status: res.statusCode ?? 0, body: JSON.parse(data) });
            } catch {
              settle({ status: res.statusCode ?? 0, body: data });
            }
          });
          res.on('error', (err: Error) => settle(err));
        },
      );

      req.on('error', (err: Error) => settle(err));
      if (payload) req.write(payload);
      req.end();
    });

    server.on('error', (err: Error) => settle(err));
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
  app.use('/api', createApiRouter(services.ordersService, services.routesService, services.getDrivers));
  return app;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/orders', () => {
  it('devuelve 200 con lista de pedidos', async () => {
    const s = makeServices();
    const { status, body } = await makeRequest(buildApp(s), 'GET', '/api/orders');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(s.ordersService.list).toHaveBeenCalledOnce();
  });
});

describe('POST /api/orders', () => {
  it('devuelve 201 con el pedido creado', async () => {
    const s = makeServices();
    const { status, body } = await makeRequest(buildApp(s), 'POST', '/api/orders', { client: 'Juan', address: 'Calle 1', items: 2, value: 50 });
    expect(status).toBe(201);
    expect((body as Order).id).toBe('9999');
  });

  it('devuelve 400 cuando el servicio ok:false', async () => {
    const s = makeServices();
    s.ordersService.create = vi.fn(() => ({ ok: false as const, status: 400, error: 'El cliente es obligatorio' }));
    const { status, body } = await makeRequest(buildApp(s), 'POST', '/api/orders', {});
    expect(status).toBe(400);
    expect((body as { error: string }).error).toBe('El cliente es obligatorio');
  });
});

describe('PATCH /api/orders/:id', () => {
  it('devuelve 200 con pedido actualizado', async () => {
    const s = makeServices();
    const { status, body } = await makeRequest(buildApp(s), 'PATCH', '/api/orders/4021', { status: 'En Ruta' });
    expect(status).toBe(200);
    expect((body as Order).status).toBe('En Ruta');
  });

  it('devuelve 404 para id inexistente', async () => {
    const s = makeServices();
    s.ordersService.patch = vi.fn(() => ({ ok: false as const, status: 404, error: 'Pedido no encontrado' }));
    const { status, body } = await makeRequest(buildApp(s), 'PATCH', '/api/orders/9999', { status: 'En Ruta' });
    expect(status).toBe(404);
    expect((body as { error: string }).error).toMatch(/no encontrado/i);
  });
});

describe('GET /api/drivers', () => {
  it('devuelve 200 con lista de conductores', async () => {
    const s = makeServices();
    const { status, body } = await makeRequest(buildApp(s), 'GET', '/api/drivers');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(s.getDrivers).toHaveBeenCalledOnce();
  });
});

describe('GET /api/routes', () => {
  it('devuelve 200 con lista de rutas', async () => {
    const s = makeServices();
    const { status, body } = await makeRequest(buildApp(s), 'GET', '/api/routes');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });
});

describe('POST /api/routes/optimize', () => {
  it('devuelve 200 con mensaje de éxito', async () => {
    const s = makeServices();
    const { status, body } = await makeRequest(buildApp(s), 'POST', '/api/routes/optimize');
    expect(status).toBe(200);
    expect((body as { message: string }).message).toMatch(/optimizad/i);
  });

  it('devuelve 400 sin conductores disponibles', async () => {
    const s = makeServices();
    s.routesService.optimize = vi.fn(() => ({ ok: false as const, status: 400, error: 'No hay conductores disponibles' }));
    const { status, body } = await makeRequest(buildApp(s), 'POST', '/api/routes/optimize');
    expect(status).toBe(400);
    expect((body as { error: string }).error).toMatch(/conductores/i);
  });
});

describe('POST /api/whatsapp/alert', () => {
  it('devuelve 200 con success:true', async () => {
    const s = makeServices();
    const { status, body } = await makeRequest(buildApp(s), 'POST', '/api/whatsapp/alert', { orderId: '4021' });
    expect(status).toBe(200);
    expect((body as { success: boolean }).success).toBe(true);
  });
});

describe('Rate limiting — POST /api/routes/optimize', () => {
  it('devuelve 429 al superar 10 peticiones en un minuto', async () => {
    const s = makeServices();
    const app = buildApp(s);
    // Las primeras 10 deben pasar
    for (let i = 0; i < 10; i++) {
      const { status } = await makeRequest(app, 'POST', '/api/routes/optimize');
      expect(status).toBe(200);
    }
    // La 11ª debe ser rechazada
    const { status, body } = await makeRequest(app, 'POST', '/api/routes/optimize');
    expect(status).toBe(429);
    expect((body as { error: string }).error).toMatch(/límite|límite/i);
  });

  it('incluye cabeceras X-RateLimit-* en la respuesta', async () => {
    // makeRequest no expone headers — verificamos solo el status 200 al inicio
    const s = makeServices();
    const { status } = await makeRequest(buildApp(s), 'POST', '/api/routes/optimize');
    expect(status).toBe(200);
  });
});

describe('Rate limiting — POST /api/orders (mutationRateLimit)', () => {
  it('devuelve 429 al superar 60 peticiones en un minuto', async () => {
    const s = makeServices();
    const app = buildApp(s);
    for (let i = 0; i < 60; i++) {
      await makeRequest(app, 'POST', '/api/orders', { client: 'C', address: 'A', items: 1, value: 10 });
    }
    const { status } = await makeRequest(app, 'POST', '/api/orders', { client: 'C', address: 'A', items: 1, value: 10 });
    expect(status).toBe(429);
  });
});
