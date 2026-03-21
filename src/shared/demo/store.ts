import { Driver, LogisticsSnapshot, Order, Route, RouteOptimizationResponse } from '../../types';
import { createDemoDrivers, createDemoOrders, createDemoRoutes } from './mockData';

const STORAGE_KEY = 'rutape-browser-state-v1';
const CLOSED_ORDER_STATUSES = new Set<Order['status']>(['Entregado', 'Cancelado']);
const ORDER_COLORS: Record<Order['status'], string> = {
  Pendiente: 'bg-slate-100 text-slate-700',
  'En Ruta': 'bg-blue-100 text-blue-700',
  Entregado: 'bg-emerald-100 text-emerald-700',
  Retrasado: 'bg-red-100 text-red-700',
  Cancelado: 'bg-slate-200 text-slate-700',
};

interface BrowserState {
  orders: Order[];
  drivers: Driver[];
  routes: Route[];
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const createInitialState = (): BrowserState => ({
  orders: createDemoOrders(),
  drivers: createDemoDrivers(),
  routes: createDemoRoutes(),
});

const readState = (): BrowserState => {
  if (typeof window === 'undefined') {
    return createInitialState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = createInitialState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  try {
    const parsed = JSON.parse(raw) as BrowserState;
    if (!Array.isArray(parsed.orders) || !Array.isArray(parsed.drivers) || !Array.isArray(parsed.routes)) {
      throw new Error('Invalid demo state');
    }
    return parsed;
  } catch {
    const seed = createInitialState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
};

const writeState = (state: BrowserState) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
};

const synchronizeRoutesAndDrivers = (routes: Route[], orders: Order[], drivers: Driver[]) => {
  const orderMap = new Map(orders.map((order) => [order.id, order]));

  const nextRoutes = routes.map((route) => {
    const existingStops = route.stops.filter((stopId) => orderMap.has(stopId));
    const completedStops = existingStops.filter((stopId) => {
      const order = orderMap.get(stopId);
      return order ? CLOSED_ORDER_STATUSES.has(order.status) : false;
    }).length;
    const hasOpenStops = existingStops.some((stopId) => {
      const order = orderMap.get(stopId);
      return order ? !CLOSED_ORDER_STATUSES.has(order.status) : false;
    });

    return {
      ...route,
      stops: existingStops,
      progress: existingStops.length === 0 ? 0 : Math.round((completedStops / existingStops.length) * 100),
      status: existingStops.length === 0 ? 'Programada' : hasOpenStops ? 'Activa' : 'Completada',
    } satisfies Route;
  });

  const nextDrivers = drivers.map((driver) => {
    const activeRoute = nextRoutes.some((route) => route.driverId === driver.id && route.status === 'Activa');
    const completedRoute = nextRoutes.some((route) => route.driverId === driver.id && route.status === 'Completada');

    if (activeRoute) {
      return { ...driver, status: 'En Ruta' as const };
    }

    if (completedRoute && driver.status === 'En Ruta') {
      return { ...driver, status: 'Disponible' as const };
    }

    return driver;
  });

  return {
    routes: nextRoutes,
    drivers: nextDrivers,
  };
};

const optimizeBrowserRoutes = (state: BrowserState): RouteOptimizationResponse => {
  const nextState = clone(state);
  const pendingOrders = nextState.orders.filter((order) => order.status === 'Pendiente');
  if (pendingOrders.length === 0) {
    return { message: 'No hay pedidos pendientes para optimizar', routes: nextState.routes };
  }

  const availableDrivers = nextState.drivers.filter((driver) => driver.status === 'Disponible' || driver.status === 'En Ruta');
  if (availableDrivers.length === 0) {
    throw new Error('No hay conductores disponibles');
  }

  const getDist = (lat1: number, lng1: number, lat2: number, lng2: number) =>
    Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2);

  pendingOrders.forEach((order) => {
    let bestDriver: Driver | null = null;
    let minCost = Infinity;

    availableDrivers.forEach((driver) => {
      const route = nextState.routes.find((currentRoute) => currentRoute.driverId === driver.id && currentRoute.status === 'Activa');
      const dist = getDist(driver.lat ?? -12.1, driver.lng ?? -77.03, order.lat ?? -12.1, order.lng ?? -77.03);
      const cost = dist + (route?.stops.length ?? 0) * 0.005;

      if (cost < minCost) {
        minCost = cost;
        bestDriver = driver;
      }
    });

    if (!bestDriver) return;

    order.driverId = bestDriver.id;
    order.status = 'En Ruta';
    order.color = ORDER_COLORS['En Ruta'];

    let route = nextState.routes.find((currentRoute) => currentRoute.driverId === bestDriver!.id && currentRoute.status === 'Activa');
    if (!route) {
      route = {
        id: `R${Math.floor(Math.random() * 1000)}`,
        driverId: bestDriver.id,
        stops: [],
        status: 'Activa',
        progress: 0,
      };
      nextState.routes.push(route);
    }

    route.stops.push(order.id);
  });

  const synced = synchronizeRoutesAndDrivers(nextState.routes, nextState.orders, nextState.drivers);
  nextState.routes = synced.routes;
  nextState.drivers = synced.drivers;
  writeState(nextState);
  return { message: 'Rutas optimizadas con éxito', routes: nextState.routes };
};

export const fetchBrowserSnapshot = async (): Promise<LogisticsSnapshot> => {
  const state = readState();
  return clone(state);
};

export const createBrowserOrder = async (order: Partial<Order>): Promise<Order> => {
  const state = readState();
  const status = order.status ?? 'Pendiente';
  const newOrder: Order = {
    id: String(Date.now()),
    client: order.client?.trim() || 'Nuevo cliente',
    address: order.address?.trim() || 'Dirección pendiente',
    items: order.items ?? 1,
    value: order.value ?? 0,
    status,
    time: order.time ?? 'Ahora',
    color: order.color ?? ORDER_COLORS[status],
    carrier: order.carrier?.trim() || 'Flota Propia',
    carrierLogo: order.carrierLogo?.trim() || 'FP',
    lat: order.lat,
    lng: order.lng,
  };

  state.orders = [newOrder, ...state.orders];
  writeState(state);
  return clone(newOrder);
};

export const updateBrowserOrder = async (id: string, updates: Partial<Order>): Promise<Order> => {
  const state = readState();
  const existingOrder = state.orders.find((order) => order.id === id);
  if (!existingOrder) {
    throw new Error('Pedido no encontrado');
  }

  const nextStatus = updates.status ?? existingOrder.status;
  const updatedOrder: Order = {
    ...existingOrder,
    ...updates,
    status: nextStatus,
    color: updates.color ?? ORDER_COLORS[nextStatus],
    time: updates.time ?? existingOrder.time,
  };

  state.orders = state.orders.map((order) => (order.id === id ? updatedOrder : order));
  const synced = synchronizeRoutesAndDrivers(state.routes, state.orders, state.drivers);
  state.routes = synced.routes;
  state.drivers = synced.drivers;
  writeState(state);
  return clone(updatedOrder);
};

export const sendBrowserWhatsappAlert = async (orderId: string) => ({
  success: true,
  message: `Alerta simulada enviada para el pedido ${orderId}`,
});

export const optimizeBrowserRoutesRequest = async (): Promise<RouteOptimizationResponse> =>
  optimizeBrowserRoutes(readState());

export const resetBrowserDemoState = () => {
  writeState(createInitialState());
};
