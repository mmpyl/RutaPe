import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { Driver, Order, Route } from "./src/types.js";
import { FileLogisticsStateRepository } from "./server/repositories/logisticsStateRepository.js";
import { synchronizeRoutesAndDrivers } from "./server/services/routeState.js";
import { createApiRouter } from "./server/routes/api.js";

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
  const PORT = Number(process.env.PORT ?? 3000);
  const HOST = process.env.HOST ?? "0.0.0.0";
  const isProduction = process.argv.includes("--prod") || process.env.NODE_ENV === "production";
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

  app.use('/api', createApiRouter({
    getOrders: () => orders,
    getDrivers: () => drivers,
    getRoutes: () => routes,
    setOrders: (nextOrders) => {
      orders = nextOrders;
    },
    setDrivers: (nextDrivers) => {
      drivers = nextDrivers;
    },
    setRoutes: (nextRoutes) => {
      routes = nextRoutes;
    },
    persistState,
    syncRouteState,
    broadcast,
    broadcastSnapshot,
  }));

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
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

  server.listen(PORT, HOST, () => {
    const runtimeMode = isProduction ? "production" : "development";
    console.log(`Server running in ${runtimeMode} mode on http://localhost:${PORT}`);
  });
}

startServer();
