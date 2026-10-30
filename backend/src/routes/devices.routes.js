import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/httpError.js';
import * as push from '../services/pushService.js';
import { registerDeviceSchema, removeDeviceSchema } from '../validators/device.schemas.js';

const router = Router();
router.use(requireAuth);

// POST /api/devices  (a signed-in phone registers its push token)
router.post(
  '/',
  validate(registerDeviceSchema),
  asyncHandler(async (req, res) => {
    await push.registerDevice(req.user, req.body);
    res.status(201).json({ registered: true });
  })
);

// DELETE /api/devices  (sign-out: stop pushes to this phone)
router.delete(
  '/',
  validate(removeDeviceSchema),
  asyncHandler(async (req, res) => {
    res.json({ removed: await push.removeDevice(req.user, req.body.token) });
  })
);

export default router;
