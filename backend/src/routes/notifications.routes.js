import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, badRequest, notFound } from '../utils/httpError.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { fault: { select: { id: true, reference: true } } },
    });
    res.json({
      unread: notifications.filter((notification) => !notification.read).length,
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        createdAt: n.createdAt,
        faultId: n.fault?.id ?? null,
        faultReference: n.fault?.reference ?? null,
      })),
    });
  })
);

router.patch(
  '/read-all',
  asyncHandler(async (req, res) => {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });
    res.json({ updated: result.count });
  })
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest('The notification id is not valid.');
    const result = await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { read: true },
    });
    if (!result.count) throw notFound('That notification does not exist.');
    res.json({ updated: result.count });
  })
);

export default router;
