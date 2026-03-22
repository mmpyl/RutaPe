import { Driver, Order, Route } from '../../src/types.js';

const CLOSED_ORDER_STATUSES = new Set<Order['status']>(['Entregado', 'Cancelado']);

const orderById = (orders: Order[]) => new Map(orders.map((order) => [order.id, order]));

const calculateRouteProgress = (route: Route, orderMap: Map<string, Order>) => {
  if (route.stops.length === 0) {
    return route.status === 'Programada' ? 0 : route.progress;
  }

  const completedStops = route.stops.reduce((count, stopId) => {
    const order = orderMap.get(stopId);
    return order && CLOSED_ORDER_STATUSES.has(order.status) ? count + 1 : count;
  }, 0);

  return Math.round((completedStops / route.stops.length) * 100);
};

export const synchronizeRoutesAndDrivers = (
  routes: Route[],
  orders: Order[],
  drivers: Driver[],
): { routes: Route[]; drivers: Driver[] } => {
  const orderMap = orderById(orders);

  const synchronizedRoutes = routes.map((route) => {
    const existingStops = route.stops.filter((stopId) => orderMap.has(stopId));
    const progress = calculateRouteProgress({ ...route, stops: existingStops }, orderMap);
    const hasOpenStops = existingStops.some((stopId) => {
      const order = orderMap.get(stopId);
      return order ? !CLOSED_ORDER_STATUSES.has(order.status) : false;
    });

    const nextStatus: Route['status'] = existingStops.length === 0
      ? 'Programada'
      : hasOpenStops
        ? 'Activa'
        : 'Completada';

    return {
      ...route,
      stops: existingStops,
      progress,
      status: nextStatus,
    };
  });

  const synchronizedDrivers = drivers.map((driver) => {
    const activeRoute = synchronizedRoutes.some((route) => route.driverId === driver.id && route.status === 'Activa');
    const completedRoute = synchronizedRoutes.some((route) => route.driverId === driver.id && route.status === 'Completada');

    if (activeRoute && driver.status !== 'En Ruta') {
      return { ...driver, status: 'En Ruta' as const };
    }

    if (!activeRoute && completedRoute && driver.status === 'En Ruta') {
      return { ...driver, status: 'Disponible' as const };
    }

    return driver;
  });

  return {
    routes: synchronizedRoutes,
    drivers: synchronizedDrivers,
  };
};
