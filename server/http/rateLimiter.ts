import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface RateLimitOptions {
  /** Ventana de tiempo en ms. Default: 60 000 (1 minuto). */
  windowMs: number;
  /** Máximo de peticiones permitidas por IP en la ventana. */
  maxRequests: number;
  /** Mensaje de error devuelto al superar el límite. */
  message?: string;
}

interface BucketEntry {
  count: number;
  windowStart: number;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Middleware de rate limiting basado en ventana fija por IP.
 * No requiere dependencias externas — usa un Map en memoria.
 *
 * Decisiones de diseño:
 * - Ventana fija (no deslizante) para mantener la implementación simple y
 *   predecible. Para el endpoint /routes/optimize, cuyo coste es CPU y no
 *   I/O, es suficiente.
 * - Limpieza lazy: los buckets expirados se eliminan en cada request del
 *   mismo IP, evitando un setInterval de housekeeping.
 * - X-RateLimit-* headers estándar para que el cliente pueda adaptar su
 *   ritmo sin necesidad de parsear el body de error.
 */
export const createRateLimiter = (options: RateLimitOptions) => {
  const { windowMs, maxRequests, message = 'Demasiadas solicitudes. Intenta de nuevo en un momento.' } = options;
  const buckets = new Map<string, BucketEntry>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() ??
      req.socket.remoteAddress ??
      'unknown';

    const now = Date.now();
    const existing = buckets.get(ip);

    // Limpiar bucket expirado del mismo IP (limpieza lazy)
    if (existing && now - existing.windowStart >= windowMs) {
      buckets.delete(ip);
    }

    const bucket = buckets.get(ip);

    if (!bucket) {
      buckets.set(ip, { count: 1, windowStart: now });
      setRateLimitHeaders(res, maxRequests, maxRequests - 1, windowMs, now);
      return next();
    }

    bucket.count += 1;
    const remaining = Math.max(0, maxRequests - bucket.count);
    setRateLimitHeaders(res, maxRequests, remaining, windowMs, bucket.windowStart);

    if (bucket.count > maxRequests) {
      const retryAfterSec = Math.ceil((windowMs - (now - bucket.windowStart)) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(429).json({ error: message });
      return;
    }

    next();
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const setRateLimitHeaders = (
  res: Response,
  limit: number,
  remaining: number,
  windowMs: number,
  windowStart: number,
): void => {
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil((windowStart + windowMs) / 1000)));
};
