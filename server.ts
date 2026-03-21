import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

import { ordersRepository, driversRepository, routesRepository } from './server/repository/index.js';
import { createRealtimeService } from './server/services/realtime.js';
import { createOrdersService } from './server/services/orders.js';
import { createRoutesService } from './server/services/routes.js';
import { startDriverSimulation } from './server/services/driverSimulation.js';
import { createApiRouter } from './server/http/apiRouter.js';
import { Order, Driver, Route } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT ?? 3000);

// Orígenes permitidos: en producción leer desde env, en desarrollo permitir localhost
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

// ---------------------------------------------------------------------------
// In-memory state — cargado desde repositorios al arrancar
// ---------------------------------------------------------------------------

let orders: Order[] = [];
let drivers: Driver[] = [];
let routes: Route[] = [];

const getOrders = () => orders;
const setOrders = (next: Order[]) => {
  orders = next;
  ordersRepository.save(next).catch((err) => console.error('[repo] Error guardando pedidos:', err));
};

const getDrivers = () => drivers;

// Actualiza solo posición GPS en memoria — no persiste para evitar escrituras
// excesivas cada 3 segundos desde la simulación.
const setDriversGps = (next: Driver[]) => { drivers = next; };

// Actualiza estado de conductor (Disponible <-> En Ruta) y persiste en disco.
// Preserva la posición GPS actual en memoria para no perder la posición simulada.
const setDrivers = (next: Driver[]) => {
  const withCurrentGps = next.map((d) => {
    const current = drivers.find((c) => c.id === d.id);
    return current ? { ...d, lat: current.lat, lng: current.lng } : d;
  });
  drivers = withCurrentGps;
  driversRepository.save(withCurrentGps).catch((err) =>
    console.error('[repo] Error guardando conductores:', err),
  );
};

const getRoutes = () => routes;
const setRoutes = (next: Route[]) => {
  routes = next;
  routesRepository.save(next).catch((err) => console.error('[repo] Error guardando rutas:', err));
};

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

async function startServer() {
  [orders, drivers, routes] = await Promise.all([
    ordersRepository.findAll(),
    driversRepository.findAll(),
    routesRepository.findAll(),
  ]);
  console.log(`[repo] Cargados: ${orders.length} pedidos, ${drivers.length} conductores, ${routes.length} rutas`);

  const app = express();
  const server = createServer(app);

  // Payload limitado a 1 MB por request — evita OOM ante bodies maliciosos.
  // Las fotos POD van en base64 dentro del JSON; el límite real útil es ~750 KB
  // para una foto de 550 KB base64-encoded. 1 MB deja margen sin ser permisivo.
  app.use(express.json({ limit: '1mb' }));

  // CORS — solo los orígenes explícitamente permitidos pueden hacer fetch a la API.
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  const wss = new WebSocketServer({ server });
  const realtime = createRealtimeService(wss);

  wss.on('connection', (ws) => {
    console.log('[WS] Client connected');
    realtime.sendInit(ws, { orders: getOrders(), drivers: getDrivers(), routes: getRoutes() });
  });

  const ordersService = createOrdersService(getOrders, setOrders, realtime);
  const routesService = createRoutesService(
    getOrders, setOrders,
    getDrivers, setDrivers,
    getRoutes, setRoutes,
    realtime,
  );

  const simulationTimer = startDriverSimulation(getDrivers, setDriversGps, realtime);
  server.on('close', () => clearInterval(simulationTimer));

  app.use('/api', createApiRouter(ordersService, routesService, getDrivers));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => { res.sendFile(path.join(distPath, 'index.html')); });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
