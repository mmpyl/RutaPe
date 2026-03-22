import { Driver, Order, Route, RouteOptimizationResponse } from '../../types';
import { requestJson } from './http';

export interface LogisticsSnapshot {
  orders: Order[];
  drivers: Driver[];
  routes: Route[];
}

const BROWSER_STATE_KEY = 'rutape-browser-state';
const browserMode = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_DATA_MODE === 'browser';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

const isOrder = (value: unknown): value is Order => {
  if (!isRecord(value)) return false;
  return isString(value.id)
    && isString(value.status)
    && isString(value.time)
    && isString(value.client)
    && isString(value.address)
    && isString(value.color)
    && isNumber(value.items)
    && isNumber(value.value);
};

const isDriver = (value: unknown): value is Driver => {
  if (!isRecord(value)) return false;
  return isString(value.id)
    && isString(value.name)
    && isString(value.status)
    && isNumber(value.orders)
    && isNumber(value.efficiency)
    && isString(value.avatar)
    && isString(value.vehicle)
    && isString(value.phone);
};

const isRoute = (value: unknown): value is Route => {
  if (!isRecord(value)) return false;
  return isString(value.id)
    && isString(value.driverId)
    && Array.isArray(value.stops)
    && value.stops.every(isString)
    && isString(value.status)
    && isNumber(value.progress);
};

const isOrderArray = (value: unknown): value is Order[] => Array.isArray(value) && value.every(isOrder);
const isDriverArray = (value: unknown): value is Driver[] => Array.isArray(value) && value.every(isDriver);
const isRouteArray = (value: unknown): value is Route[] => Array.isArray(value) && value.every(isRoute);
const isLogisticsSnapshot = (value: unknown): value is LogisticsSnapshot => {
  if (!isRecord(value)) return false;
  return isOrderArray(value.orders) && isDriverArray(value.drivers) && isRouteArray(value.routes);
};
const isRouteOptimizationResponse = (value: unknown): value is RouteOptimizationResponse => {
  if (!isRecord(value)) return false;
  return isString(value.message) && isRouteArray(value.routes);
};
const isSuccessMessage = (value: unknown): value is { success: boolean; message: string } => {
  if (!isRecord(value)) return false;
  return isBoolean(value.success) && isString(value.message);
};

const createBrowserSnapshot = (): LogisticsSnapshot => ({
  orders: [
    { id: '4021', status: 'Entregado', time: 'Hace 2 min', client: 'Juan Pérez', address: 'Av. Larco 123, Miraflores', color: 'bg-emerald-100 text-emerald-700', items: 3, value: 150.5, driverId: 'D1', carrier: 'Shalom', carrierLogo: 'SH', lat: -12.1221, lng: -77.0298 },
    { id: '4022', status: 'En Ruta', time: 'Hace 15 min', client: 'María García', address: 'Calle Las Flores 456, San Isidro', color: 'bg-blue-100 text-blue-700', items: 1, value: 45, driverId: 'D1', carrier: 'Shalom', carrierLogo: 'SH', lat: -12.0945, lng: -77.0356 },
    { id: '4023', status: 'Retrasado', time: 'Hace 1 hr', client: 'Carlos Torres', address: 'Jr. Puno 789, Cercado', color: 'bg-red-100 text-red-700', items: 5, value: 320, driverId: 'D3', carrier: 'Urbano', carrierLogo: 'UR', lat: -12.0464, lng: -77.0297 },
    { id: '4024', status: 'Pendiente', time: 'Hace 2 hr', client: 'Ana Loli', address: 'Av. Universitaria 101, SMP', color: 'bg-slate-100 text-slate-700', items: 2, value: 89.9, lat: -11.9912, lng: -77.0823 },
    { id: '4025', status: 'Pendiente', time: 'Hace 3 hr', client: 'Roberto Díaz', address: 'Av. Javier Prado 1500, San Borja', color: 'bg-slate-100 text-slate-700', items: 4, value: 210, lat: -12.0854, lng: -77.0012 },
    { id: '4026', status: 'En Ruta', time: 'Hace 30 min', client: 'Elena Paz', address: 'Av. Arequipa 2400, Lince', color: 'bg-blue-100 text-blue-700', items: 2, value: 120, driverId: 'D2', carrier: 'Marvi', carrierLogo: 'MV', lat: -12.0823, lng: -77.0345 },
  ],
  drivers: [
    { id: 'D1', name: 'Carlos Mendoza', status: 'En Ruta', orders: 5, efficiency: 98, avatar: 'CM', vehicle: 'Camioneta NHR', phone: '987654321', carrier: 'Shalom', carrierLogo: 'SH', lat: -12.1, lng: -77.03 },
    { id: 'D2', name: 'Luis Paredes', status: 'En Ruta', orders: 3, efficiency: 95, avatar: 'LP', vehicle: 'Moto Cargo', phone: '912345678', carrier: 'Marvi', carrierLogo: 'MV', lat: -12.08, lng: -77.035 },
    { id: 'D3', name: 'Jorge Ruiz', status: 'En Ruta', orders: 3, efficiency: 92, avatar: 'JR', vehicle: 'Furgón H100', phone: '955443322', carrier: 'Urbano', carrierLogo: 'UR', lat: -12.05, lng: -77.03 },
    { id: 'D4', name: 'Ana Belén', status: 'Disponible', orders: 0, efficiency: 99, avatar: 'AB', vehicle: 'Camioneta NHR', phone: '944332211', carrier: 'Shalom', carrierLogo: 'SH', lat: -12.12, lng: -77.02 },
  ],
  routes: [
    { id: 'R1', driverId: 'D1', stops: ['4021', '4022'], status: 'Activa', progress: 50 },
    { id: 'R2', driverId: 'D2', stops: ['4026'], status: 'Activa', progress: 30 },
    { id: 'R3', driverId: 'D3', stops: ['4023'], status: 'Activa', progress: 10 },
  ],
});

const readBrowserState = (): LogisticsSnapshot => {
  const raw = window.localStorage.getItem(BROWSER_STATE_KEY);
  if (!raw) {
    const seed = createBrowserSnapshot();
    window.localStorage.setItem(BROWSER_STATE_KEY, JSON.stringify(seed));
    return seed;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isLogisticsSnapshot(parsed)) {
      return parsed;
    }
  } catch {
    // fall back to seed below
  }

  const seed = createBrowserSnapshot();
  window.localStorage.setItem(BROWSER_STATE_KEY, JSON.stringify(seed));
  return seed;
};

const writeBrowserState = (snapshot: LogisticsSnapshot) => {
  window.localStorage.setItem(BROWSER_STATE_KEY, JSON.stringify(snapshot));
};

const optimizeBrowserRoutes = (snapshot: LogisticsSnapshot): RouteOptimizationResponse => {
  const nextSnapshot = structuredClone(snapshot);
  const availableDriver = nextSnapshot.drivers.find((driver) => driver.status === 'Disponible') ?? nextSnapshot.drivers[0];

  if (!availableDriver) {
    return { message: 'No hay conductores disponibles', routes: nextSnapshot.routes };
  }

  const pendingOrders = nextSnapshot.orders.filter((order) => order.status === 'Pendiente');
  if (pendingOrders.length === 0) {
    return { message: 'No hay pedidos pendientes para optimizar', routes: nextSnapshot.routes };
  }

  let route = nextSnapshot.routes.find((currentRoute) => currentRoute.driverId === availableDriver.id && currentRoute.status === 'Activa');
  if (!route) {
    route = {
      id: `R${Math.floor(Math.random() * 1000)}`,
      driverId: availableDriver.id,
      stops: [],
      status: 'Activa',
      progress: 0,
    };
    nextSnapshot.routes.push(route);
  }

  pendingOrders.forEach((order) => {
    order.status = 'En Ruta';
    order.color = 'bg-blue-100 text-blue-700';
    order.driverId = availableDriver.id;
    route!.stops.push(order.id);
  });

  availableDriver.status = 'En Ruta';
  availableDriver.orders = route.stops.length;
  writeBrowserState(nextSnapshot);
  return { message: 'Rutas optimizadas con éxito (browser mode)', routes: nextSnapshot.routes };
};

export const fetchLogisticsSnapshot = async (): Promise<LogisticsSnapshot> => {
  if (browserMode) {
    return readBrowserState();
  }

  const [orders, drivers, routes] = await Promise.all([
    requestJson<Order[]>('/api/orders', undefined, 'Failed to fetch orders', isOrderArray),
    requestJson<Driver[]>('/api/drivers', undefined, 'Failed to fetch drivers', isDriverArray),
    requestJson<Route[]>('/api/routes', undefined, 'Failed to fetch routes', isRouteArray),
  ]);

  return { orders, drivers, routes };
};

export const createOrderRequest = async (order: Partial<Order>) => {
  if (browserMode) {
    const snapshot = readBrowserState();
    const newOrder: Order = {
      id: (Math.floor(Math.random() * 1000) + 4100).toString(),
      status: order.status ?? 'Pendiente',
      time: order.time ?? 'Ahora',
      client: order.client ?? 'Cliente demo',
      address: order.address ?? 'Dirección demo',
      color: order.color ?? 'bg-slate-100 text-slate-700',
      items: order.items ?? 1,
      value: order.value ?? 0,
      lat: order.lat,
      lng: order.lng,
      carrier: order.carrier ?? 'Flota Propia',
      carrierLogo: order.carrierLogo ?? 'FP',
      driverId: order.driverId,
      pod: order.pod,
    };
    const nextSnapshot = { ...snapshot, orders: [newOrder, ...snapshot.orders] };
    writeBrowserState(nextSnapshot);
    return newOrder;
  }

  return requestJson<Order>(
    '/api/orders',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    },
    'Failed to add order',
    isOrder,
  );
};

export const updateOrderRequest = async (id: string, updates: Partial<Order>) => {
  if (browserMode) {
    const snapshot = readBrowserState();
    const nextOrders = snapshot.orders.map((order) => (order.id === id ? { ...order, ...updates } : order));
    const updatedOrder = nextOrders.find((order) => order.id === id);
    if (!updatedOrder) {
      throw new Error('Pedido no encontrado');
    }
    writeBrowserState({ ...snapshot, orders: nextOrders });
    return updatedOrder;
  }

  return requestJson<Order>(
    `/api/orders/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    },
    'Failed to update order',
    isOrder,
  );
};

export const sendWhatsappAlertRequest = async (orderId: string) => {
  if (browserMode) {
    return { success: true, message: `Alert sent for order ${orderId}` };
  }

  return requestJson<{ success: boolean; message: string }>(
    '/api/whatsapp/alert',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    },
    'Failed to send alert',
    isSuccessMessage,
  );
};

export const optimizeRoutesRequest = async () => {
  if (browserMode) {
    return optimizeBrowserRoutes(readBrowserState());
  }

  return requestJson<RouteOptimizationResponse>(
    '/api/routes/optimize',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    'Failed to optimize routes',
    isRouteOptimizationResponse,
  );
};

export const isBrowserDataMode = () => browserMode;
