import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startDriverSimulation } from '../../../server/services/driverSimulation';
import { Driver } from '../../../src/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeDriver = (overrides: Partial<Driver> = {}): Driver => ({
  id: 'D1',
  name: 'Carlos',
  status: 'En Ruta',
  orders: 3,
  efficiency: 95,
  avatar: 'CM',
  vehicle: 'Camioneta',
  phone: '999',
  lat: -12.0,
  lng: -77.0,
  ...overrides,
});

const makeRealtime = () => ({ broadcast: vi.fn(), sendInit: vi.fn() });

// ---------------------------------------------------------------------------
// startDriverSimulation
// ---------------------------------------------------------------------------

describe('startDriverSimulation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('mueve conductores En Ruta después de un tick', () => {
    const driver = makeDriver();
    let drivers = [driver];
    const setDrivers = vi.fn((next: Driver[]) => { drivers = next; });
    const realtime = makeRealtime();

    startDriverSimulation(() => drivers, setDrivers, realtime);
    vi.advanceTimersByTime(3000);

    expect(setDrivers).toHaveBeenCalledOnce();
    const updated: Driver[] = setDrivers.mock.calls[0][0];
    // La posición debe haber cambiado (jitter aplicado)
    expect(updated[0].lat).not.toBe(driver.lat);
    expect(updated[0].lng).not.toBe(driver.lng);
  });

  it('no mueve conductores que no están En Ruta', () => {
    const drivers = [
      makeDriver({ id: 'D1', status: 'Disponible', lat: -12.0, lng: -77.0 }),
      makeDriver({ id: 'D2', status: 'Descanso',   lat: -12.1, lng: -77.1 }),
    ];
    let state = [...drivers];
    const setDrivers = vi.fn((next: Driver[]) => { state = next; });
    const realtime = makeRealtime();

    startDriverSimulation(() => state, setDrivers, realtime);
    vi.advanceTimersByTime(3000);

    const updated: Driver[] = setDrivers.mock.calls[0][0];
    expect(updated[0].lat).toBe(-12.0);
    expect(updated[0].lng).toBe(-77.0);
    expect(updated[1].lat).toBe(-12.1);
    expect(updated[1].lng).toBe(-77.1);
  });

  it('no mueve conductores sin coordenadas', () => {
    const driver = makeDriver({ lat: undefined, lng: undefined });
    let drivers = [driver];
    const setDrivers = vi.fn((next: Driver[]) => { drivers = next; });
    const realtime = makeRealtime();

    startDriverSimulation(() => drivers, setDrivers, realtime);
    vi.advanceTimersByTime(3000);

    const updated: Driver[] = setDrivers.mock.calls[0][0];
    expect(updated[0].lat).toBeUndefined();
    expect(updated[0].lng).toBeUndefined();
  });

  it('hace broadcast DRIVER_UPDATE en cada tick', () => {
    const drivers = [makeDriver()];
    let state = [...drivers];
    const realtime = makeRealtime();

    startDriverSimulation(() => state, (next) => { state = next; }, realtime);

    vi.advanceTimersByTime(3000);
    expect(realtime.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'DRIVER_UPDATE' }),
    );

    vi.advanceTimersByTime(3000);
    expect(realtime.broadcast).toHaveBeenCalledTimes(2);
  });

  it('ejecuta múltiples ticks en el tiempo correcto', () => {
    const drivers = [makeDriver()];
    let state = [...drivers];
    const setDrivers = vi.fn((next: Driver[]) => { state = next; });
    const realtime = makeRealtime();

    startDriverSimulation(() => state, setDrivers, realtime);

    vi.advanceTimersByTime(9000); // 3 ticks de 3000ms
    expect(setDrivers).toHaveBeenCalledTimes(3);
  });

  it('devuelve un NodeJS.Timeout que puede cancelarse con clearInterval', () => {
    const drivers = [makeDriver()];
    let state = [...drivers];
    const setDrivers = vi.fn((next: Driver[]) => { state = next; });
    const realtime = makeRealtime();

    const timer = startDriverSimulation(() => state, setDrivers, realtime);
    clearInterval(timer);

    vi.advanceTimersByTime(9000);
    // Tras cancelar, no debe haber ningún tick
    expect(setDrivers).not.toHaveBeenCalled();
  });
});
