import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { asyncHandler, notFound } from '../utils/httpError.js';
import { isTrackingTokenShape } from '../domain/trackingLink.js';
import * as faults from '../services/faultService.js';
import { guestCreateSchema } from '../validators/fault.schemas.js';

// No sign-in on these routes: the tracking token in the link is the only key to a guest report.
const router = Router();

const HOUR = 60 * 60 * 1000;
// Mobile carriers put many people behind one address, so this is generous; the per-phone limit is the real guard.
const perNetwork = createRateLimiter({ max: 30, windowMs: HOUR });
// Runs after validation, so the phone number is already in one standard form.
const perPhone = createRateLimiter({
  max: 3,
  windowMs: HOUR,
  keyOf: (req) => req.body.contactPhone,
});

router.post(
  '/faults',
  perNetwork,
  validate(guestCreateSchema),
  perPhone,
  asyncHandler(async (req, res) => {
    res.status(201).json({ fault: await faults.createGuestFault(req.body) });
  })
);

router.get(
  '/faults/:token',
  asyncHandler(async (req, res) => {
    if (!isTrackingTokenShape(req.params.token)) throw notFound('This tracking link is not valid.');
    res.set('Cache-Control', 'no-store');
    res.set('Referrer-Policy', 'no-referrer');
    res.json({ fault: await faults.getFaultByToken(req.params.token) });
  })
);

export default router;
