import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { findUserByIdentifier, registerCustomer } from '../services/authService.js';
import { loginSchema, registerSchema } from '../validators/auth.schemas.js';
import { asyncHandler, unauthorized } from '../utils/httpError.js';

const router = Router();

// Runs after validation, so a typo in the form does not use up an attempt.
const registrations = createRateLimiter({
  max: 10,
  windowMs: 60 * 60 * 1000,
  message: 'Too many sign-ups from this network. Please try again in an hour.',
});

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MESSAGE = 'Too many sign-in attempts. Please wait 15 minutes and try again.';
// Runs after validation, so the identifier is already in one standard form.
const loginsPerNetwork = createRateLimiter({
  max: 30,
  windowMs: LOGIN_WINDOW_MS,
  message: LOGIN_MESSAGE,
});
// Stops one account being guessed at from many networks.
const loginsPerAccount = createRateLimiter({
  max: 10,
  windowMs: LOGIN_WINDOW_MS,
  keyOf: (req) => req.body.identifier,
  message: LOGIN_MESSAGE,
});

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    customerId: user.customer?.id ?? null,
    technicianId: user.technician?.id ?? null,
    coordinatorId: user.coordinator?.id ?? null,
  };
}

/** The token and user that sign-in and registration both answer with. */
function session(user, client) {
  const expiresIn = client === 'mobile' ? env.jwtExpiresInMobile : env.jwtExpiresIn;
  return { token: signToken(user, { expiresIn }), user: publicUser(user) };
}

router.post(
  '/register',
  validate(registerSchema),
  registrations,
  asyncHandler(async (req, res) => {
    const { client, ...input } = req.body;
    res.status(201).json(session(await registerCustomer(input), client));
  })
);

router.post(
  '/login',
  validate(loginSchema),
  loginsPerNetwork,
  loginsPerAccount,
  asyncHandler(async (req, res) => {
    const { identifier, password, client } = req.body;
    const user = await findUserByIdentifier(identifier);

    // Same message for an unknown account and a wrong password.
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !passwordMatches) {
      throw unauthorized('The email, phone number or password is incorrect.');
    }

    res.json(session(user, client));
  })
);

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
