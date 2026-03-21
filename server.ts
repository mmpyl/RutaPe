import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { Driver, Order, Route } from "./src/types.js";
import { createInitialDrivers, createInitialOrders, createInitialRoutes } from "./server/data/mockData.js";
import { synchronizeRoutesAndDrivers } from "./server/services/routeState.js";
import { buildOrderPayload, validateCreateOrderPayload, validateOrderPatchPayload } from "./server/validation/orders.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type LogisticsSocketEvent =
  | { type: "INIT"; data: { orders: Order[]; drivers: Driver[]; routes: Route[] } }
  | { type: "DRIVER_UPDATE"; data: Driver[] }
  | { type: "ORDER_UPDATE"; data: Order[] }
  | { type: "ROUTE_UPDATE"; data: Route[] };

async function startServer() {
  const app = express();
  const server = createServer(app);
  const PORT = 3000;

// ---------------------------------------------------------------------------
// In-memory state — cargado desde repositorios al arrancar
// ---------------------------------------------------------------------------

  let orders: Order[] = createInitialOrders();
  let drivers: Driver[] = createInitialDrivers();
  let routes: Route[] = createInitialRoutes();

  const wss = new WebSocketServer({ server });

  const broadcast = (data: LogisticsSocketEvent) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  const syncRouteState = () => {
    const nextState = synchronizeRoutesAndDrivers(routes, orders, drivers);
    routes = nextState.routes;
    drivers = nextState.drivers;
  };

  const broadcastSnapshot = () => {
    broadcast({ type: "INIT", data: { orders, drivers, routes } });
  };

  wss.on("connection", (ws) => {
    console.log("Client connected to WebSocket");
    ws.send(JSON.stringify({ type: "INIT", data: { orders, drivers, routes } }));
  });

  setInterval(() => {
    drivers = drivers.map((driver) => {
      if (driver.status === "En Ruta") {
        const newLat = driver.lat! + (Math.random() - 0.5) * 0.001;
        const newLng = driver.lng! + (Math.random() - 0.5) * 0.001;
        return { ...driver, lat: newLat, lng: newLng };
      }
      return driver;
    });
    broadcast({ type: "DRIVER_UPDATE", data: drivers });
  }, 3000);

  app.get("/api/orders", (_req, res) => {
    res.json(orders);
  });

  app.post("/api/orders", (req, res) => {
    const validationError = validateCreateOrderPayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const payload = req.body as Record<string, unknown>;
    const newOrder: Order = {
      ...(buildOrderPayload(payload) as Order),
      id: (Math.floor(Math.random() * 1000) + 4100).toString(),
      carrier: payload.carrier ? String(payload.carrier).trim() : "Flota Propia",
      carrierLogo: payload.carrierLogo ? String(payload.carrierLogo).trim() : "FP",
    };

    orders = [newOrder, ...orders];
    broadcast({ type: "ORDER_UPDATE", data: orders });
    return res.status(201).json(newOrder);
  });

  app.patch("/api/orders/:id", (req, res) => {
    const { id } = req.params;
    const existingOrder = orders.find((order) => order.id === id);

    if (!existingOrder) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const validationError = validateOrderPatchPayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const updatedOrder = buildOrderPayload(req.body as Record<string, unknown>, existingOrder) as Order;
    orders = orders.map((order) => (order.id === id ? updatedOrder : order));
    syncRouteState();

    broadcast({ type: "ORDER_UPDATE", data: orders });
    broadcast({ type: "ROUTE_UPDATE", data: routes });
    broadcast({ type: "DRIVER_UPDATE", data: drivers });
    return res.json(updatedOrder);
  });

  app.get("/api/drivers", (_req, res) => {
    res.json(drivers);
  });

  app.get("/api/routes", (_req, res) => {
    res.json(routes);
  });

  app.post("/api/routes/optimize", (_req, res) => {
    const pendingOrders = orders.filter((order) => order.status === "Pendiente");
    if (pendingOrders.length === 0) {
      return res.json({ message: "No hay pedidos pendientes para optimizar", routes });
    }

    const availableDrivers = drivers.filter((driver) => driver.status === "Disponible" || driver.status === "En Ruta");
    if (availableDrivers.length === 0) {
      return res.status(400).json({ error: "No hay conductores disponibles" });
    }

    const getDist = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
    };

    pendingOrders.forEach((order) => {
      let bestDriver: Driver | null = null;
      let minCost = Infinity;

      availableDrivers.forEach((driver) => {
        const route = routes.find((currentRoute) => currentRoute.driverId === driver.id && currentRoute.status === "Activa");
        let lastLat = driver.lat!;
        let lastLng = driver.lng!;

        if (route && route.stops.length > 0) {
          const lastStopId = route.stops[route.stops.length - 1];
          const lastStop = orders.find((currentOrder) => currentOrder.id === lastStopId);
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

      if (bestDriver) {
        order.driverId = bestDriver.id;
        order.status = "En Ruta";
        order.color = "bg-blue-100 text-blue-700";

        let route = routes.find((currentRoute) => currentRoute.driverId === bestDriver!.id && currentRoute.status === "Activa");
        if (!route) {
          route = {
            id: `R${Math.floor(Math.random() * 1000)}`,
            driverId: bestDriver.id,
            stops: [],
            status: "Activa",
            progress: 0,
          };
          routes.push(route);
        }
        route.stops.push(order.id);
      }
    });

    routes.forEach((route) => {
      if (route.status !== "Activa") return;
      const driver = drivers.find((currentDriver) => currentDriver.id === route.driverId);
      if (!driver) return;

      const activeStops = route.stops.filter((id) => {
        const order = orders.find((currentOrder) => currentOrder.id === id);
        return order?.status !== "Entregado";
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
          const currentOrder = orders.find((order) => order.id === id)!;
          const distance = getDist(currLat, currLng, currentOrder.lat!, currentOrder.lng!);
          if (distance < minDist) {
            minDist = distance;
            nearestIdx = index;
          }
        });
        const nextId = remaining.splice(nearestIdx, 1)[0];
        optimizedStops.push(nextId);
        const nextOrder = orders.find((order) => order.id === nextId)!;
        currLat = nextOrder.lat!;
        currLng = nextOrder.lng!;
      }

      const calculateRouteDist = (stopIds: string[]) => {
        let distance = 0;
        let previousLat = driver.lat!;
        let previousLng = driver.lng!;
        stopIds.forEach((id) => {
          const currentOrder = orders.find((order) => order.id === id)!;
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

      const deliveredStops = route.stops.filter((id) => orders.find((order) => order.id === id)?.status === "Entregado");
      route.stops = [...deliveredStops, ...optimizedStops];
    });

    syncRouteState();
    broadcastSnapshot();
    res.json({ message: "Rutas optimizadas con éxito", routes });
  });

  app.post("/api/whatsapp/alert", (req, res) => {
    const { orderId } = req.body;
    console.log(`Simulating WhatsApp alert for order ${orderId}`);
    res.json({ success: true, message: `Alert sent for order ${orderId}` });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: __dirname,
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
