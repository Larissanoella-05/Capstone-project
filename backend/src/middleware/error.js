import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/httpError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: `No route for ${req.method} ${req.originalUrl}` } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }

  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: { message: 'The photo is too large. Choose one under 1 MB.' } });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: { message: 'The request body is not valid JSON.' } });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') return res.status(404).json({ error: { message: 'Record not found.' } });
    if (err.code === 'P2002') return res.status(409).json({ error: { message: 'That record already exists.' } });
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error(err);
    return res.status(503).json({ error: { message: 'The database is not reachable. Try again shortly.' } });
  }

  console.error(err);
  res.status(500).json({ error: { message: 'Something went wrong on the server.' } });
}
