import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, badRequest, forbidden } from '../utils/httpError.js';
import * as technicians from '../services/technicianService.js';
import { locationSchema } from '../validators/technician.schemas.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  requireRole('COORDINATOR'),
  asyncHandler(async (req, res) => {
    const faultId = req.query.faultId ? Number(req.query.faultId) : undefined;
    if (req.query.faultId && !Number.isInteger(faultId))
      throw badRequest('faultId must be a number.');
    res.json({ technicians: await technicians.listTechnicians({ faultId }) });
  })
);

router.post(
  '/me/location',
  requireRole('TECHNICIAN'),
  validate(locationSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json({ location: await technicians.recordLocation(req.user, req.body) });
  })
);

router.get(
  '/:id',
  requireRole('COORDINATOR', 'TECHNICIAN'),
  asyncHandler(async (req, res) => {
    const id = req.params.id === 'me' ? req.user.technician?.id : Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest('The technician id in the address is not valid.');
    if (req.user.role === 'TECHNICIAN' && req.user.technician.id !== id) throw forbidden();
    res.json({ technician: await technicians.getTechnician(id) });
  })
);

export default router;
