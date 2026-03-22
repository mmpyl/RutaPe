import { createJsonRepository } from './jsonRepository.js';
import { createInitialOrders, createInitialDrivers, createInitialRoutes } from '../data/mockData.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../../.rutape-data');

export const ordersRepository = createJsonRepository(
  path.join(dataDir, 'orders.json'),
  createInitialOrders
);

export const driversRepository = createJsonRepository(
  path.join(dataDir, 'drivers.json'),
  createInitialDrivers
);

export const routesRepository = createJsonRepository(
  path.join(dataDir, 'routes.json'),
  createInitialRoutes
);

