import { HttpError } from '../utils/httpError.js';

/**
 * A small in-memory limiter: at most `max` requests per key in each `windowMs`. It resets when the server
 * restarts and is not shared between instances, which is enough for a one-instance pilot.
 * @param {{ max: number, windowMs: number, now?: () => number, keyOf?: (req: any) => string | undefined }} options
 */
export function createRateLimiter({ max, windowMs, now = Date.now, keyOf = (req) => req.ip }) {
  /** @type {Map<string, { count: number, resetAt: number }>} */
  const entries = new Map();

  function middleware(req, _res, next) {
    const time = now();
    for (const [key, entry] of entries) {
      if (entry.resetAt <= time) entries.delete(key);
    }

    const key = keyOf(req);
    if (!key) return next(); // nothing to count by, so another limiter has to cover this request

    const entry = entries.get(key) ?? { count: 0, resetAt: time + windowMs };
    entry.count += 1;
    entries.set(key, entry);

    if (entry.count > max) {
      return next(
        new HttpError(
          429,
          'Too many reports from this phone or network. Please wait a few minutes, or call 2727.'
        )
      );
    }
    next();
  }

  middleware.size = () => entries.size;
  return middleware;
}
