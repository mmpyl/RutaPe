import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

import { createInitialDrivers, createInitialOrders, createInitialRoutes } from './server/data/mockData.js';
import { createRealtimeService } from './server/services/realtime.js';
import { createOrdersService } from './server/services/orders.js';
import { createRoutesService } from './server/services/routes.js';
import { startDriverSimulation } from './server/services/driverSimulation.js';
import { createApiRouter } from './server/http/apiRouter.js';
import { Order, Driver, Route } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// ---------------------------------------------------------------------------
// In-memory state (getter/setter pattern para inyección sin closures circulares)
// ---------------------------------------------------------------------------

let orders: Order[] = createInitialOrders();
let drivers: Driver[] = createInitialDrivers();
let routes: Route[] = createInitialRoutes();

const getOrders = () => orders;
const setOrders = (next: Order[]) => { orders = next; };

const getDrivers = () => drivers;
const setDrivers = (next: Driver[]) => { drivers = next; };

const getRoutes = () => routes;
const setRoutes = (next: Route[]) => { routes = next; };

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  // --- WebSocket ---
  const wss = new WebSocketServer({ server });
  const realtime = createRealtimeService(wss);

  wss.on('connection', (ws) => {
    console.log('[WS] Client connected');
    realtime.sendInit(ws, { orders: getOrders(), drivers: getDrivers(), routes: getRoutes() });
  });

  // --- Services ---
  const ordersService = createOrdersService(getOrders, setOrders, realtime);
  const routesService = createRoutesService(
    getOrders, setOrders,
    getDrivers, setDrivers,
    getRoutes, setRoutes,
    realtime,
  );

  // --- Driver simulation ---
  startDriverSimulation(getDrivers, setDrivers, realtime);

  // --- HTTP routes ---
  app.use('/api', createApiRouter(ordersService, routesService, getDrivers));

  // --- Vite middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
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
