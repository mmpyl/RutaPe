import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoutesService } from '../../server/services/routes';
import { Order, Driver, Route } from '../../src/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeDriver = (overrides: Partial<Driver> = {}): Driver => ({
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
  ...overrides,
});

const makeOrder = (id: string, lat: number, lng: number, overrides: Partial<Order> = {}): Order => ({
  id,
  status: 'Pendiente',
  time: 'Ahora',
  client: `Cliente ${id}`,
  address: `Dirección ${id}`,
  color: 'bg-slate-100 text-slate-700',
  items: 1,
  value: 50,
  lat,
  lng,
  ...overrides,
});

const makeRealtime = () => ({ broadcast: vi.fn(), sendInit: vi.fn() });

// ---------------------------------------------------------------------------
// routesService.list
// ---------------------------------------------------------------------------

describe('routesService.list', () => {
  it('devuelve las rutas actuales', () => {
    const routes: Route[] = [{ id: 'R1', driverId: 'D1', stops: [], status: 'Activa', progress: 0 }];
    const service = createRoutesService(
      vi.fn(() => []), vi.fn(),
      vi.fn(() => []), vi.fn(),
      vi.fn(() => routes), vi.fn(),
      makeRealtime(),
    );
    expect(service.list()).toEqual(routes);
  });
});

// ---------------------------------------------------------------------------
// routesService.optimize
// ---------------------------------------------------------------------------

describe('routesService.optimize', () => {
  let orders: Order[];
  let drivers: Driver[];
  let routes: Route[];
  let setOrders: ReturnType<typeof vi.fn>;
  let setDrivers: ReturnType<typeof vi.fn>;
  let setRoutes: ReturnType<typeof vi.fn>;
  let realtime: ReturnType<typeof makeRealtime>;

  beforeEach(() => {
    orders = [
      makeOrder('O1', -12.1, -77.0),
      makeOrder('O2', -12.2, -77.1),
      makeOrder('O3', -12.3, -77.2),
    ];
    drivers = [makeDriver({ id: 'D1', status: 'Disponible', lat: -12.0, lng: -77.0 })];
    routes = [];
    setOrders = vi.fn((next) => { orders = next; });
    setDrivers = vi.fn((next) => { drivers = next; });
    setRoutes = vi.fn((next) => { routes = next; });
    realtime = makeRealtime();
  });

  const makeService = () =>
    createRoutesService(
      () => orders, setOrders,
      () => drivers, setDrivers,
      () => routes, setRoutes,
      realtime,
    );

  it('asigna pedidos pendientes a conductores disponibles', () => {
    const result = makeService().optimize();

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(setOrders).toHaveBeenCalledOnce();
    const updatedOrders: Order[] = setOrders.mock.calls[0][0];
    const assigned = updatedOrders.filter((o) => o.status === 'En Ruta');
    expect(assigned.length).toBe(3);
    assigned.forEach((o) => expect(o.driverId).toBe('D1'));
  });

  it('crea una ruta activa para el conductor', () => {
    makeService().optimize();

    expect(setRoutes).toHaveBeenCalledOnce();
    const updatedRoutes: Route[] = setRoutes.mock.calls[0][0];
    expect(updatedRoutes.length).toBeGreaterThan(0);
    expect(updatedRoutes[0].driverId).toBe('D1');
    expect(updatedRoutes[0].stops.length).toBe(3);
  });

  it('hace broadcast del estado completo tras optimizar', () => {
    makeService().optimize();

    expect(realtime.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'INIT' }),
    );
  });

  it('devuelve mensaje indicando éxito', () => {
    const result = makeService().optimize();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.message).toMatch(/optimizad/i);
  });

  it('devuelve ok:true con mensaje si no hay pedidos pendientes', () => {
    orders = orders.map((o) => ({ ...o, status: 'Entregado' as const }));
    const result = makeService().optimize();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.message).toMatch(/no hay pedidos/i);
    expect(setOrders).not.toHaveBeenCalled();
  });

  it('devuelve ok:false si no hay conductores disponibles', () => {
    drivers = [makeDriver({ status: 'Descanso' })];
    const result = makeService().optimize();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/conductores/i);
  });

  it('el orden de paradas es una permutación de los pedidos originales', () => {
    makeService().optimize();

    const updatedRoutes: Route[] = setRoutes.mock.calls[0][0];
    const stops = updatedRoutes[0].stops;
    const originalIds = orders.map((o) => o.id).sort();
    expect([...stops].sort()).toEqual(originalIds);
  });

  it('no mueve paradas ya entregadas en la fase 2-opt', () => {
    orders[0] = { ...orders[0], status: 'Entregado', driverId: 'D1' };
    routes = [{
      id: 'R1',
      driverId: 'D1',
      stops: ['O1', 'O2'],
      status: 'Activa',
      progress: 50,
    }];
    drivers = [makeDriver({ id: 'D1', status: 'En Ruta', lat: -12.0, lng: -77.0 })];

    makeService().optimize();

    const updatedRoutes: Route[] = setRoutes.mock.calls[0][0];
    const route = updatedRoutes.find((r) => r.driverId === 'D1');
    // O1 está entregado, debe aparecer primero y no reordenarse
    expect(route?.stops[0]).toBe('O1');
  });

  it('distribuye pedidos entre múltiples conductores disponibles', () => {
    drivers = [
      makeDriver({ id: 'D1', status: 'Disponible', lat: -12.0, lng: -77.0 }),
      makeDriver({ id: 'D2', status: 'Disponible', lat: -12.0, lng: -77.0 }),
    ];

    makeService().optimize();

    const updatedOrders: Order[] = setOrders.mock.calls[0][0];
    const assignedToD1 = updatedOrders.filter((o) => o.driverId === 'D1').length;
    const assignedToD2 = updatedOrders.filter((o) => o.driverId === 'D2').length;

    expect(assignedToD1 + assignedToD2).toBe(3);
    expect(assignedToD1).toBeGreaterThan(0);
    expect(assignedToD2).toBeGreaterThan(0);
  });

  it('penaliza conductores con más carga al asignar nuevos pedidos', () => {
    orders = [
      makeOrder('O1', -12.1, -77.0, { status: 'En Ruta', driverId: 'D1' }),
      makeOrder('O2', -12.2, -77.1, { status: 'En Ruta', driverId: 'D1' }),
      makeOrder('O3', -12.3, -77.2, { status: 'En Ruta', driverId: 'D1' }),
      makeOrder('O4', -12.1, -77.0),
    ];
    drivers = [
      makeDriver({ id: 'D1', status: 'En Ruta',    lat: -12.0, lng: -77.0 }),
      makeDriver({ id: 'D2', status: 'Disponible', lat: -12.0, lng: -77.0 }),
    ];
    routes = [{ id: 'R1', driverId: 'D1', stops: ['O1', 'O2', 'O3'], status: 'Activa', progress: 0 }];

    makeService().optimize();

    const updatedOrders: Order[] = setOrders.mock.calls[0][0];
    const o4 = updatedOrders.find((o) => o.id === 'O4');
    expect(o4?.driverId).toBe('D2');
  });

});
