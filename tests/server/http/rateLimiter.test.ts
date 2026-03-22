import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRateLimiter } from '../../../server/http/rateLimiter';
import type { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeReq = (ip = '1.2.3.4', forwardedFor?: string): Partial<Request> => ({
  headers: forwardedFor ? { 'x-forwarded-for': forwardedFor } : {},
  socket: { remoteAddress: ip } as Request['socket'],
});

const makeRes = (): { res: Partial<Response>; statusCode: number | null; body: unknown; headers: Record<string, string> } => {
  const ctx = { statusCode: null as number | null, body: null as unknown, headers: {} as Record<string, string> };
  const res: Partial<Response> = {
    setHeader: vi.fn((key: string, value: string) => { ctx.headers[key] = value; return res as Response; }),
    status: vi.fn((code: number) => { ctx.statusCode = code; return res as Response; }),
    json: vi.fn((data: unknown) => { ctx.body = data; return res as Response; }),
  };
  return { res, ...ctx };
};

const makeNext = () => vi.fn() as unknown as NextFunction;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createRateLimiter', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('permite la primera petición', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 5 });
    const { res } = makeRes();
    const next = makeNext();
    limiter(makeReq() as Request, res as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('permite hasta maxRequests peticiones en la ventana', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 3 });
    const next = makeNext();
    for (let i = 0; i < 3; i++) {
      const { res } = makeRes();
      limiter(makeReq() as Request, res as Response, next);
    }
    expect(next).toHaveBeenCalledTimes(3);
  });

  it('devuelve 429 al superar maxRequests', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 2 });
    const next = makeNext();
    limiter(makeReq() as Request, makeRes().res as Response, next);
    limiter(makeReq() as Request, makeRes().res as Response, next);
    const { res } = makeRes();
    limiter(makeReq() as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('usa el mensaje personalizado en el error 429', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1, message: 'Error personalizado' });
    const next = makeNext();
    limiter(makeReq() as Request, makeRes().res as Response, next);
    const { res, body } = makeRes();
    limiter(makeReq() as Request, res as Response, next);
    expect((body as null) ?? (res.json as ReturnType<typeof vi.fn>).mock.calls[0]?.[0])
    // evaluar la llamada real al json mock
    expect(res.json).toHaveBeenCalledWith({ error: 'Error personalizado' });
  });

  it('IPs distintas tienen contadores independientes', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    const next = makeNext();
    limiter(makeReq('1.1.1.1') as Request, makeRes().res as Response, next);
    limiter(makeReq('2.2.2.2') as Request, makeRes().res as Response, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('resetea el contador al expirar la ventana', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    const next = makeNext();
    limiter(makeReq() as Request, makeRes().res as Response, next);
    // Avanzar más allá de la ventana
    vi.advanceTimersByTime(61_000);
    limiter(makeReq() as Request, makeRes().res as Response, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('emite X-RateLimit-Limit y X-RateLimit-Remaining', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 5 });
    const { res, headers } = makeRes();
    limiter(makeReq() as Request, res as Response, makeNext());
    expect(headers['X-RateLimit-Limit']).toBe('5');
    expect(headers['X-RateLimit-Remaining']).toBe('4');
  });

  it('emite Retry-After en la respuesta 429', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    const next = makeNext();
    limiter(makeReq() as Request, makeRes().res as Response, next);
    const { res, headers } = makeRes();
    limiter(makeReq() as Request, res as Response, next);
    expect(Number(headers['Retry-After'])).toBeGreaterThan(0);
  });

  it('lee la IP real desde x-forwarded-for (proxy)', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    const next = makeNext();
    // Ambas peticiones vienen del mismo IP real detrás del proxy
    limiter(makeReq('proxy', '10.0.0.1, proxy') as Request, makeRes().res as Response, next);
    const { res } = makeRes();
    limiter(makeReq('proxy', '10.0.0.1, proxy') as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('X-RateLimit-Remaining llega a 0 al agotar el límite (no negativo)', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 2 });
    const next = makeNext();
    limiter(makeReq() as Request, makeRes().res as Response, next);
    limiter(makeReq() as Request, makeRes().res as Response, next);
    const { res, headers } = makeRes();
    limiter(makeReq() as Request, res as Response, next);
    expect(Number(headers['X-RateLimit-Remaining'])).toBe(0);
  });
});
