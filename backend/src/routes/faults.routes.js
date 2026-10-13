import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, badRequest } from '../utils/httpError.js';
import * as faults from '../services/faultService.js';

const router = Router();
router.use(requireAuth);

const CATEGORIES = ['POWER_OUTAGE', 'LOW_VOLTAGE', 'DAMAGED_CONNECTION', 'METER_ISSUE', 'OTHER'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES = ['ON_THE_WAY', 'ARRIVED', 'WORKING', 'RESOLVED', 'CANCELLED'];
const OUTCOMES = ['SUPPLY_RESTORED', 'TEMPORARY_REPAIR', 'NO_FAULT_FOUND', 'REFERRED'];

const optionalText = (max) =>
  z.string().trim().max(max, `Keep this under ${max} characters.`).optional().or(z.literal('').transform(() => undefined));

const createSchema = z.object({
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Choose a fault category.' }) }),
  description: optionalText(1000),
  contactPhone: optionalText(30),
  serviceLocationId: z.coerce.number().int().positive().optional(),
  photo: z
    .string()
    .startsWith('data:image/', 'The photo must be an image file.')
    .max(1_500_000, 'The photo is too large. Choose one under 1 MB.')
    .optional()
    .nullable(),
});

const updateSchema = z.object({
  priority: z.enum(PRIORITIES, { errorMap: () => ({ message: 'Choose a valid priority.' }) }),
});

const statusSchema = z.object({
  status: z.enum(STATUSES, { errorMap: () => ({ message: 'Choose a valid status.' }) }),
  note: optionalText(500),
  outcome: z.enum(OUTCOMES).optional(),
  resolutionNote: optionalText(1000),
  workCompleted: optionalText(1000),
  clarificationContacts: z.coerce.number().int().min(0).max(50).optional(),
});

const assignSchema = z.object({
  technicianId: z.coerce
    .number({ invalid_type_error: 'Choose a technician.' })
    .int()
    .positive('Choose a technician.'),
});

function idParam(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('The fault id in the address is not valid.');
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
    res.json({ fault: await faults.assignTechnician(req.user, idParam(req), req.body.technicianId) });
  })
);

export default router;
