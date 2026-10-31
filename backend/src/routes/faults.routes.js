import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, badRequest } from '../utils/httpError.js';
import * as faults from '../services/faultService.js';
import {
  assignSchema,
  createSchema,
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

// GET /api/faults?status=OPEN|ALL|<status>&priority=&search=&date=TODAY|WEEK
router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ faults: await faults.listFaults(req.user, req.query) });
  })
);

// GET /api/faults/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json({ fault: await faults.getFault(req.user, idParam(req)) });
  })
);

// POST /api/faults  (customer)
router.post(
  '/',
  requireRole('CUSTOMER'),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json({ fault: await faults.createFault(req.user, req.body) });
  })
);

// PATCH /api/faults/:id  (coordinator: change priority)
router.patch(
  '/:id',
  requireRole('COORDINATOR'),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    res.json({ fault: await faults.updateFault(req.user, idParam(req), req.body) });
  })
);

// PATCH /api/faults/:id/status  (technician: next stage, coordinator: cancel)
router.patch(
  '/:id/status',
  requireRole('TECHNICIAN', 'COORDINATOR'),
  validate(statusSchema),
  asyncHandler(async (req, res) => {
    res.json({ fault: await faults.changeStatus(req.user, idParam(req), req.body) });
  })
);

// POST /api/faults/:id/assign  (coordinator)
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
