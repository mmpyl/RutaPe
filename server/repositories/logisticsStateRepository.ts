import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import path from 'path';
import { Driver, Order, Route } from '../../src/types.js';
import { createInitialDrivers, createInitialOrders, createInitialRoutes } from '../data/mockData.js';

export interface LogisticsStateSnapshot {
  orders: Order[];
  drivers: Driver[];
  routes: Route[];
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const createSeedState = (): LogisticsStateSnapshot => ({
  orders: createInitialOrders(),
  drivers: createInitialDrivers(),
  routes: createInitialRoutes(),
});

const isValidState = (value: unknown): value is LogisticsStateSnapshot => {
  if (typeof value !== 'object' || value === null) return false;
  const state = value as Partial<LogisticsStateSnapshot>;
  return Array.isArray(state.orders) && Array.isArray(state.drivers) && Array.isArray(state.routes);
};

export class FileLogisticsStateRepository {
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  private async ensureParentDir() {
    await mkdir(path.dirname(this.filePath), { recursive: true });
  }

  private async seedIfMissing() {
    try {
      await readFile(this.filePath, 'utf-8');
    } catch {
      await this.write(createSeedState());
    }
  }

  async read(): Promise<LogisticsStateSnapshot> {
    await this.ensureParentDir();
    await this.seedIfMissing();

    const raw = await readFile(this.filePath, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;

    if (!isValidState(parsed)) {
      const seed = createSeedState();
      await this.write(seed);
      return seed;
    }

    return clone(parsed);
  }

  async write(snapshot: LogisticsStateSnapshot): Promise<void> {
    await this.ensureParentDir();

    this.writeQueue = this.writeQueue.then(async () => {
      const tempPath = `${this.filePath}.tmp`;
      await writeFile(tempPath, JSON.stringify(snapshot, null, 2), 'utf-8');
      await rename(tempPath, this.filePath);
    });

    return this.writeQueue;
  }
}
