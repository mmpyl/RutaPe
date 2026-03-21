import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrdersService } from '../../server/services/orders';
import { Order } from '../../src/types';

// ---------------------------------------------------------------------------
// Helpers
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

const makeRealtime = () => ({
  broadcast: vi.fn(),
  sendInit: vi.fn(),
});

// ---------------------------------------------------------------------------
// createOrdersService — list
// ---------------------------------------------------------------------------

describe('ordersService.list', () => {
  it('devuelve el estado actual de pedidos', () => {
    const initial = [makeOrder()];
    const getOrders = vi.fn(() => initial);
    const setOrders = vi.fn();
    const realtime = makeRealtime();

    const service = createOrdersService(getOrders, setOrders, realtime);
    expect(service.list()).toEqual(initial);
  });
});

// ---------------------------------------------------------------------------
// createOrdersService — create
// ---------------------------------------------------------------------------

describe('ordersService.create', () => {
  let getOrders: ReturnType<typeof vi.fn>;
  let setOrders: ReturnType<typeof vi.fn>;
  let realtime: ReturnType<typeof makeRealtime>;
  let captured: Order[] = [];

  beforeEach(() => {
    captured = [];
    getOrders = vi.fn(() => captured);
    setOrders = vi.fn((next: Order[]) => { captured = next; });
    realtime = makeRealtime();
  });

  it('crea un pedido válido y hace broadcast', () => {
    const service = createOrdersService(getOrders, setOrders, realtime);
    const result = service.create({
      client: 'María García',
      address: 'Calle Las Flores 456',
      items: 3,
      value: 99.9,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.client).toBe('María García');
    expect(result.data.status).toBe('Pendiente');
    expect(result.data.carrier).toBe('Flota Propia');
    expect(typeof result.data.id).toBe('string');
    expect(setOrders).toHaveBeenCalledOnce();
    expect(realtime.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ORDER_UPDATE' }),
    );
  });

  it('usa el carrier del payload si se provee', () => {
    const service = createOrdersService(getOrders, setOrders, realtime);
    const result = service.create({
      client: 'Test',
      address: 'Dir 1',
      items: 1,
      value: 10,
      carrier: 'Shalom',
      carrierLogo: 'SH',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.carrier).toBe('Shalom');
    expect(result.data.carrierLogo).toBe('SH');
  });

  it('rechaza payload sin cliente', () => {
    const service = createOrdersService(getOrders, setOrders, realtime);
    const result = service.create({ address: 'Dir', items: 1, value: 10 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(setOrders).not.toHaveBeenCalled();
    expect(realtime.broadcast).not.toHaveBeenCalled();
  });

  it('rechaza items igual a cero', () => {
    const service = createOrdersService(getOrders, setOrders, realtime);
    const result = service.create({ client: 'Test', address: 'Dir', items: 0, value: 10 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
  });

  it('rechaza value negativo', () => {
    const service = createOrdersService(getOrders, setOrders, realtime);
    const result = service.create({ client: 'Test', address: 'Dir', items: 1, value: -5 });

    expect(result.ok).toBe(false);
  });

  it('rechaza payload que no es objeto', () => {
    const service = createOrdersService(getOrders, setOrders, realtime);
    expect(service.create(null).ok).toBe(false);
    expect(service.create('string').ok).toBe(false);
    expect(service.create(42).ok).toBe(false);
  });

  it('genera un id con formato UUID v4', () => {
    const service = createOrdersService(getOrders, setOrders, realtime);
    const result = service.create({ client: 'Test', address: 'Dir', items: 1, value: 10 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(result.data.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('genera ids distintos en creaciones consecutivas', () => {
    const service = createOrdersService(getOrders, setOrders, realtime);
    const base = { client: 'Test', address: 'Dir', items: 1, value: 10 };

    const ids = new Set<string>();
    // Crear 20 pedidos y verificar que no hay colisiones
    for (let i = 0; i < 20; i++) {
      const result = service.create(base);
      if (result.ok) ids.add(result.data.id);
    }

    expect(ids.size).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// createOrdersService — patch
// ---------------------------------------------------------------------------

describe('ordersService.patch', () => {
  let orders: Order[];
  let getOrders: ReturnType<typeof vi.fn>;
  let setOrders: ReturnType<typeof vi.fn>;
  let realtime: ReturnType<typeof makeRealtime>;

  beforeEach(() => {
    orders = [makeOrder({ id: '4021' }), makeOrder({ id: '4022', client: 'Otro' })];
    getOrders = vi.fn(() => orders);
    setOrders = vi.fn((next: Order[]) => { orders = next; });
    realtime = makeRealtime();
  });

  it('actualiza el status de un pedido existente', () => {
    const service = createOrdersService(getOrders, setOrders, realtime);
    const result = service.patch('4021', { status: 'En Ruta' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.status).toBe('En Ruta');
    expect(realtime.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ORDER_UPDATE' }),
    );
  });

  it('preserva los campos no actualizados', () => {
    const service = createOrdersService(getOrders, setOrders, realtime);
    const result = service.patch('4021', { status: 'Entregado' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.client).toBe('Test Cliente');
    expect(result.data.items).toBe(2);
  });

  it('devuelve 404 para id inexistente', () => {
    const service = createOrdersService(getOrders, setOrders, realtime);
    const result = service.patch('9999', { status: 'En Ruta' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
    expect(setOrders).not.toHaveBeenCalled();
  });

  it('rechaza status inválido', () => {
    const service = createOrdersService(getOrders, setOrders, realtime);
    const result = service.patch('4021', { status: 'Volando' as never });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
  });

  it('rechaza payload vacío', () => {
    const service = createOrdersService(getOrders, setOrders, realtime);
    const result = service.patch('4021', {});

    expect(result.ok).toBe(false);
  });
});
