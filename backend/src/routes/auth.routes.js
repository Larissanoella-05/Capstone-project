import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../validators/auth.schemas.js';
import { asyncHandler, unauthorized } from '../utils/httpError.js';

const router = Router();

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

// POST /api/auth/login
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password, client } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { customer: true, technician: true, coordinator: true },
    });

    // Same message for an unknown email and a wrong password.
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!passwordMatches) throw unauthorized('The email or password is incorrect.');

    const expiresIn = client === 'mobile' ? env.jwtExpiresInMobile : env.jwtExpiresIn;
    res.json({ token: signToken(user, { expiresIn }), user: publicUser(user) });
  })
);

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
