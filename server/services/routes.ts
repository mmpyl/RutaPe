import { Order, Driver, Route } from '../../src/types.js';
import { RealtimeService } from './realtime.js';

// ---------------------------------------------------------------------------
// Helpers geométricos
// ---------------------------------------------------------------------------

const euclidean = (lat1: number, lng1: number, lat2: number, lng2: number): number =>
  Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2);

// ---------------------------------------------------------------------------
// Nearest-Neighbor greedy para ordenamiento inicial
// ---------------------------------------------------------------------------

const nearestNeighbor = (
  stopIds: string[],
  originLat: number,
  originLng: number,
  getCoords: (id: string) => { lat: number; lng: number } | null,
): string[] => {
  const remaining = [...stopIds];
  const ordered: string[] = [];
  let currLat = originLat;
  let currLng = originLng;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let minDist = Infinity;

    remaining.forEach((id, idx) => {
      const coords = getCoords(id);
      if (!coords) return;
      const d = euclidean(currLat, currLng, coords.lat, coords.lng);
      if (d < minDist) {
        minDist = d;
        nearestIdx = idx;
      }
    });

    const nextId = remaining.splice(nearestIdx, 1)[0];
    ordered.push(nextId);

    const coords = getCoords(nextId);
    if (coords) {
      currLat = coords.lat;
      currLng = coords.lng;
    }
  }

  return ordered;
};

// ---------------------------------------------------------------------------
// 2-Opt para refinamiento
// ---------------------------------------------------------------------------

// Límite de iteraciones del while externo de 2-Opt.
//
// Sin límite, 2-Opt es O(n²) por pasada × k pasadas hasta converger.
// En el peor caso teórico k = O(n²), dando O(n⁴) — con 30 paradas
// eso son hasta 810 000 evaluaciones de routeDist en un único tick del
// event loop, bloqueando WebSockets y requests durante cientos de ms.
//
// Con MAX_TWO_OPT_PASSES = 20:
//   - n=10 → ≤ 20 × 45 = 900 evaluaciones    (~0 ms)
//   - n=20 → ≤ 20 × 190 = 3 800 evaluaciones (~1 ms)
//   - n=50 → ≤ 20 × 1225 = 24 500 evaluaciones (~8 ms)
//
// En la práctica, para rutas de MVP (<15 paradas), el algoritmo converge
// en 2-5 pasadas y el límite nunca se alcanza. Para rutas más grandes
// proporciona un techo de tiempo garantizado sin degradar la calidad
// significativamente (las mejoras más grandes siempre ocurren en las
// primeras pasadas — ley de rendimientos decrecientes del 2-Opt).
const MAX_TWO_OPT_PASSES = 20;

const twoOpt = (
  stopIds: string[],
  originLat: number,
  originLng: number,
  getCoords: (id: string) => { lat: number; lng: number } | null,
): string[] => {
  const routeDist = (ids: string[]): number => {
    let dist = 0;
    let prevLat = originLat;
    let prevLng = originLng;

    for (const id of ids) {
      const coords = getCoords(id);
      if (!coords) continue;
      dist += euclidean(prevLat, prevLng, coords.lat, coords.lng);
      prevLat = coords.lat;
      prevLng = coords.lng;
    }

    return dist;
  };

  let best = [...stopIds];
  let bestDist = routeDist(best);
  let improved = true;
  let passes = 0;

  while (improved && passes < MAX_TWO_OPT_PASSES) {
    improved = false;
    passes += 1;
    for (let i = 0; i < best.length - 1; i++) {
      for (let k = i + 1; k < best.length; k++) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, k + 1).reverse(),
          ...best.slice(k + 1),
        ];
        const candidateDist = routeDist(candidate);
        if (candidateDist < bestDist) {
          best = candidate;
          bestDist = candidateDist;
          improved = true;
        }
      }
    }
  }

  return best;
};

// ---------------------------------------------------------------------------
// Servicio principal
// ---------------------------------------------------------------------------

export interface OptimizeResult {
  message: string;
  routes: Route[];
}

export interface OptimizeError {
  ok: false;
  status: number;
  error: string;
}

export type OptimizeResponse = ({ ok: true } & OptimizeResult) | OptimizeError;

export const createRoutesService = (
  getOrders: () => Order[],
  setOrders: (orders: Order[]) => void,
  getDrivers: () => Driver[],
  setDrivers: (drivers: Driver[]) => void,
  getRoutes: () => Route[],
  setRoutes: (routes: Route[]) => void,
  realtime: RealtimeService,
) => {
  const list = (): Route[] => getRoutes();

  const optimize = (): OptimizeResponse => {
    const orders = getOrders();
    const drivers = getDrivers();
    let routes = getRoutes();

    const pendingOrders = orders.filter((o) => o.status === 'Pendiente');
    if (pendingOrders.length === 0) {
      return { ok: true, message: 'No hay pedidos pendientes para optimizar', routes };
    }

    const availableDrivers = drivers.filter(
      (d) => d.status === 'Disponible' || d.status === 'En Ruta',
    );
    if (availableDrivers.length === 0) {
      return { ok: false, status: 400, error: 'No hay conductores disponibles' };
    }

    // Coords lookup
    const getCoords = (id: string) => {
      const o = orders.find((ord) => ord.id === id);
      return o?.lat != null && o.lng != null ? { lat: o.lat, lng: o.lng } : null;
    };

    // --- Balanced assignment ---
    const updatedOrders = [...orders];

    pendingOrders.forEach((order) => {
      let bestDriver: Driver | null = null;
      let minCost = Infinity;

      availableDrivers.forEach((driver) => {
        const route = routes.find((r) => r.driverId === driver.id && r.status === 'Activa');
        let lastLat = driver.lat!;
        let lastLng = driver.lng!;

        if (route && route.stops.length > 0) {
          const lastStopId = route.stops[route.stops.length - 1];
          const coords = getCoords(lastStopId);
          if (coords) {
            lastLat = coords.lat;
            lastLng = coords.lng;
          }
        }

        const dist = euclidean(lastLat, lastLng, order.lat!, order.lng!);
        const currentLoad = route ? route.stops.length : 0;
        const cost = dist + currentLoad * 0.005;

        if (cost < minCost) {
          minCost = cost;
          bestDriver = driver;
        }
      });

      if (!bestDriver) return;

      const targetDriver = bestDriver as Driver;

      // Mutate order
      const idx = updatedOrders.findIndex((o) => o.id === order.id);
      if (idx !== -1) {
        updatedOrders[idx] = {
          ...updatedOrders[idx],
          driverId: targetDriver.id,
          status: 'En Ruta',
          color: 'bg-blue-100 text-blue-700',
        };
      }

      // Find or create route
      let route = routes.find((r) => r.driverId === targetDriver.id && r.status === 'Activa');
      if (!route) {
        route = {
          id: `R${Math.floor(Math.random() * 1000)}`,
          driverId: targetDriver.id,
          stops: [],
          status: 'Activa',
          progress: 0,
        };
        routes = [...routes, route];
      }
      routes = routes.map((r) =>
        r.id === route!.id ? { ...r, stops: [...r.stops, order.id] } : r,
      );

      // Mark driver as En Ruta
      const driverIdx = availableDrivers.findIndex((d) => d.id === targetDriver.id);
      if (driverIdx !== -1) {
        availableDrivers[driverIdx] = { ...availableDrivers[driverIdx], status: 'En Ruta' };
      }
    });

    // --- 2-Opt per active route ---
    routes = routes.map((route) => {
      if (route.status !== 'Activa') return route;

      const driver = drivers.find((d) => d.id === route.driverId);
      if (!driver) return route;

      const deliveredStops = route.stops.filter(
        (id) => updatedOrders.find((o) => o.id === id)?.status === 'Entregado',
      );
      const activeStops = route.stops.filter(
        (id) => updatedOrders.find((o) => o.id === id)?.status !== 'Entregado',
      );

      if (activeStops.length < 2) return route;

      const nn = nearestNeighbor(activeStops, driver.lat!, driver.lng!, getCoords);
      const optimized = twoOpt(nn, driver.lat!, driver.lng!, getCoords);

      return { ...route, stops: [...deliveredStops, ...optimized] };
    });

    // Persist state
    setOrders(updatedOrders);
    setDrivers(
      drivers.map((d) => {
        const updated = availableDrivers.find((ad) => ad.id === d.id);
        return updated ?? d;
      }),
    );
    setRoutes(routes);

    realtime.broadcast({
      type: 'INIT',
      data: { orders: updatedOrders, drivers: getDrivers(), routes },
    });

    return { ok: true, message: 'Rutas optimizadas con éxito', routes };
  };

  return { list, optimize };
};

export type RoutesService = ReturnType<typeof createRoutesService>;
