import { Order, Driver, Route, RouteOptimizationResponse } from '../../types';
import { LogisticsSnapshot } from '../api/logistics';
import { isLogisticsSnapshot } from '../contracts/guards';

const BROWSER_STATE_KEY = 'rutape-browser-state-v1';

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

export const readBrowserState = (): LogisticsSnapshot => {
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
    // ignore and restore seed below
  }

  const seed = createBrowserSnapshot();
  window.localStorage.setItem(BROWSER_STATE_KEY, JSON.stringify(seed));
  return seed;
};

export const writeBrowserState = (snapshot: LogisticsSnapshot) => {
  window.localStorage.setItem(BROWSER_STATE_KEY, JSON.stringify(snapshot));
};

export const createBrowserOrder = (snapshot: LogisticsSnapshot, order: Partial<Order>): Order => {
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

  writeBrowserState({ ...snapshot, orders: [newOrder, ...snapshot.orders] });
  return newOrder;
};

export const updateBrowserOrder = (snapshot: LogisticsSnapshot, id: string, updates: Partial<Order>): Order => {
  const nextOrders = snapshot.orders.map((order) => (order.id === id ? { ...order, ...updates } : order));
  const updatedOrder = nextOrders.find((order) => order.id === id);
  if (!updatedOrder) {
    throw new Error('Pedido no encontrado');
  }
  writeBrowserState({ ...snapshot, orders: nextOrders });
  return updatedOrder;
};

export const optimizeBrowserRoutes = (snapshot: LogisticsSnapshot): RouteOptimizationResponse => {
  const nextSnapshot = structuredClone(snapshot) as LogisticsSnapshot;
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
