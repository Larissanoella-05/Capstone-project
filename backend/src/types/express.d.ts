import type { Customer, ServiceCoordinator, Technician, User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth: the signed-in user with their role profile. */
      user?: User & {
        customer: Customer | null;
        technician: Technician | null;
        coordinator: ServiceCoordinator | null;
      };
    }
  }
}
