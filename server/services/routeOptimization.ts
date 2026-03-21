import { Driver, Order, Route } from '../../src/types.js';
import { synchronizeRoutesAndDrivers } from './routeState.js';

export interface RouteOptimizationResult {
  message: string;
  orders: Order[];
  drivers: Driver[];
  routes: Route[];
}

export const optimizePendingRoutes = (
  orders: Order[],
  drivers: Driver[],
  routes: Route[],
): RouteOptimizationResult => {
  const nextOrders = orders.map((order) => ({ ...order }));
  const nextDrivers = drivers.map((driver) => ({ ...driver }));
  const nextRoutes = routes.map((route) => ({ ...route, stops: [...route.stops] }));

  const pendingOrders = nextOrders.filter((order) => order.status === 'Pendiente');
  if (pendingOrders.length === 0) {
    return { message: 'No hay pedidos pendientes para optimizar', orders: nextOrders, drivers: nextDrivers, routes: nextRoutes };
  }

  const availableDrivers = nextDrivers.filter((driver) => driver.status === 'Disponible' || driver.status === 'En Ruta');
  if (availableDrivers.length === 0) {
    throw new Error('No hay conductores disponibles');
  }

  const getDist = (lat1: number, lng1: number, lat2: number, lng2: number) =>
    Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2);

  pendingOrders.forEach((order) => {
    let bestDriver: Driver | null = null;
    let minCost = Infinity;

    availableDrivers.forEach((driver) => {
      const route = nextRoutes.find((currentRoute) => currentRoute.driverId === driver.id && currentRoute.status === 'Activa');
      let lastLat = driver.lat!;
      let lastLng = driver.lng!;

      if (route && route.stops.length > 0) {
        const lastStopId = route.stops[route.stops.length - 1];
        const lastStop = nextOrders.find((currentOrder) => currentOrder.id === lastStopId);
        if (lastStop?.lat && lastStop?.lng) {
          lastLat = lastStop.lat;
          lastLng = lastStop.lng;
        }
      }

      const dist = getDist(lastLat, lastLng, order.lat!, order.lng!);
      const currentLoad = route ? route.stops.length : 0;
      const cost = dist + currentLoad * 0.005;

      if (cost < minCost) {
        minCost = cost;
        bestDriver = driver;
      }
    });

    if (!bestDriver) return;

    order.driverId = bestDriver.id;
    order.status = 'En Ruta';
    order.color = 'bg-blue-100 text-blue-700';

    let route = nextRoutes.find((currentRoute) => currentRoute.driverId === bestDriver!.id && currentRoute.status === 'Activa');
    if (!route) {
      route = {
        id: `R${Math.floor(Math.random() * 1000)}`,
        driverId: bestDriver.id,
        stops: [],
        status: 'Activa',
        progress: 0,
      };
      nextRoutes.push(route);
    }
    route.stops.push(order.id);
  });

  nextRoutes.forEach((route) => {
    if (route.status !== 'Activa') return;
    const driver = nextDrivers.find((currentDriver) => currentDriver.id === route.driverId);
    if (!driver) return;

    const activeStops = route.stops.filter((id) => {
      const order = nextOrders.find((currentOrder) => currentOrder.id === id);
      return order?.status !== 'Entregado';
    });

    if (activeStops.length < 2) return;

    let optimizedStops: string[] = [];
    const remaining = [...activeStops];
    let currLat = driver.lat!;
    let currLng = driver.lng!;

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let minDist = Infinity;
      remaining.forEach((id, index) => {
        const currentOrder = nextOrders.find((order) => order.id === id)!;
        const distance = getDist(currLat, currLng, currentOrder.lat!, currentOrder.lng!);
        if (distance < minDist) {
          minDist = distance;
          nearestIdx = index;
        }
      });
      const nextId = remaining.splice(nearestIdx, 1)[0];
      optimizedStops.push(nextId);
      const nextOrder = nextOrders.find((order) => order.id === nextId)!;
      currLat = nextOrder.lat!;
      currLng = nextOrder.lng!;
    }

    const calculateRouteDist = (stopIds: string[]) => {
      let distance = 0;
      let previousLat = driver.lat!;
      let previousLng = driver.lng!;
      stopIds.forEach((id) => {
        const currentOrder = nextOrders.find((order) => order.id === id)!;
        distance += getDist(previousLat, previousLng, currentOrder.lat!, currentOrder.lng!);
        previousLat = currentOrder.lat!;
        previousLng = currentOrder.lng!;
      });
      return distance;
    };

    let improved = true;
    let bestDist = calculateRouteDist(optimizedStops);

    while (improved) {
      improved = false;
      for (let i = 0; i < optimizedStops.length - 1; i += 1) {
        for (let k = i + 1; k < optimizedStops.length; k += 1) {
          const newStops = [
            ...optimizedStops.slice(0, i),
            ...optimizedStops.slice(i, k + 1).reverse(),
            ...optimizedStops.slice(k + 1),
          ];
          const newDist = calculateRouteDist(newStops);
          if (newDist < bestDist) {
            optimizedStops = newStops;
            bestDist = newDist;
            improved = true;
          }
        }
      }
    }

    const deliveredStops = route.stops.filter((id) => nextOrders.find((order) => order.id === id)?.status === 'Entregado');
    route.stops = [...deliveredStops, ...optimizedStops];
  });

  const synchronized = synchronizeRoutesAndDrivers(nextRoutes, nextOrders, nextDrivers);

  return {
    message: 'Rutas optimizadas con éxito',
    orders: nextOrders,
    drivers: synchronized.drivers,
    routes: synchronized.routes,
  };
};
