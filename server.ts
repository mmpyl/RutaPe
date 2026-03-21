import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { Driver, Order, Route } from "./src/types.js";
import { FileLogisticsStateRepository } from "./server/repositories/logisticsStateRepository.js";
import { optimizePendingRoutes } from "./server/services/routeOptimization.js";
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
  const repository = new FileLogisticsStateRepository(path.join(process.cwd(), '.rutape-data', 'logistics-state.json'));

  app.use(express.json());

  const initialState = await repository.read();
  let orders: Order[] = initialState.orders;
  let drivers: Driver[] = initialState.drivers;
  let routes: Route[] = initialState.routes;

  const persistState = async () => {
    await repository.write({ orders, drivers, routes });
  };

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

  app.post("/api/orders", async (req, res) => {
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
    await persistState();
    broadcast({ type: "ORDER_UPDATE", data: orders });
    return res.status(201).json(newOrder);
  });

  app.patch("/api/orders/:id", async (req, res) => {
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
    await persistState();

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

  app.post("/api/routes/optimize", async (_req, res) => {
    try {
      const result = optimizePendingRoutes(orders, drivers, routes);
      orders = result.orders;
      drivers = result.drivers;
      routes = result.routes;
      await persistState();
      broadcastSnapshot();
      return res.json({ message: result.message, routes });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo optimizar las rutas';
      return res.status(400).json({ error: message });
    }
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
