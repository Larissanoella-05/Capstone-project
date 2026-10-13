import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/httpError.js';
import { getAnalytics, getOverview } from '../services/statsService.js';

const router = Router();

// GET /api/health  (used by the hosting platform and the deployment check)
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', time: new Date().toISOString() });
  })
);

// GET /api/service-locations  (customer's registered premises)
router.get(
  '/service-locations',
  requireAuth,
  requireRole('CUSTOMER'),
  asyncHandler(async (req, res) => {
    const serviceLocations = await prisma.serviceLocation.findMany({
      where: { customerId: req.user.customer.id },
      orderBy: { id: 'asc' },
    });
    res.json({ serviceLocations });
  })
);

// GET /api/stats/overview  (coordinator dashboard tiles)
router.get(
  '/stats/overview',
  requireAuth,
  requireRole('COORDINATOR'),
  asyncHandler(async (_req, res) => {
    res.json({ overview: await getOverview() });
  })
);

// GET /api/stats/analytics  (coordinator analytics page)
router.get(
  '/stats/analytics',
  requireAuth,
  requireRole('COORDINATOR'),
  asyncHandler(async (_req, res) => {
    res.json({ analytics: await getAnalytics() });
  })
);

export default router;
