import { Driver } from '../../src/types.js';
import { RealtimeService } from './realtime.js';

const TICK_MS = 3_000;
const JITTER = 0.001;

const jitter = () => (Math.random() - 0.5) * JITTER;

export const startDriverSimulation = (
  getDrivers: () => Driver[],
  setDrivers: (drivers: Driver[]) => void,
  realtime: RealtimeService,
): NodeJS.Timeout => {
  return setInterval(() => {
    const updated = getDrivers().map((driver) => {
      if (driver.status !== 'En Ruta' || driver.lat == null || driver.lng == null) {
        return driver;
      }
      return { ...driver, lat: driver.lat + jitter(), lng: driver.lng + jitter() };
    });

    setDrivers(updated);
    realtime.broadcast({ type: 'DRIVER_UPDATE', data: updated });
  }, TICK_MS);
};
