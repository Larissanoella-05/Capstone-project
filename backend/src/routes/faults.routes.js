import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, badRequest } from '../utils/httpError.js';
import * as faults from '../services/faultService.js';
import {
  assignSchema,
  createSchema,
  listQuerySchema,
  statusSchema,
  updateSchema,
} from '../validators/fault.schemas.js';

const router = Router();
router.use(requireAuth);

function idParam(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0)
    throw badRequest('The fault id in the address is not valid.');
  return id;
}

// Paged only when page or pageSize is given (20 per page by default, 100 at most).
router.get(
  '/',
  validate(listQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await faults.listFaults(req.user, req.query));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json({ fault: await faults.getFault(req.user, idParam(req)) });
  })
);

router.post(
  '/',
  requireRole('CUSTOMER'),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json({ fault: await faults.createFault(req.user, req.body) });
  })
);

router.patch(
  '/:id',
  requireRole('COORDINATOR'),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    res.json({ fault: await faults.updateFault(req.user, idParam(req), req.body) });
  })
);

router.patch(
  '/:id/status',
  requireRole('TECHNICIAN', 'COORDINATOR'),
  validate(statusSchema),
  asyncHandler(async (req, res) => {
    res.json({ fault: await faults.changeStatus(req.user, idParam(req), req.body) });
  })
);

router.post(
  '/:id/assign',
  requireRole('COORDINATOR'),
  validate(assignSchema),
  asyncHandler(async (req, res) => {
    res.json({
      fault: await faults.assignTechnician(req.user, idParam(req), req.body.technicianId),
    });
  })
);

export default router;
