import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, forbidden, unauthorized } from '../utils/httpError.js';

export function signToken(user, { expiresIn = env.jwtExpiresIn } = {}) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn });
}

/**
 * Reads the Bearer token, loads the user with their role profile and puts it on req.user.
 * This is the single place to swap in a stronger scheme (refresh tokens, SSO) later.
 */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw unauthorized('Your session has expired. Sign in again.');
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(payload.sub) },
    include: { customer: true, technician: true, coordinator: true },
  });
  if (!user) throw unauthorized();

  req.user = user;
  next();
});

/** Allows the route only for the listed roles. */
export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };
