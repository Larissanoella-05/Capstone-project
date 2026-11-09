import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { parseLoginIdentifier } from '../domain/loginIdentifier.js';
import { conflict } from '../utils/httpError.js';

const profiles = /** @satisfies {Prisma.UserInclude} */ ({
  customer: true,
  technician: true,
  coordinator: true,
});

const TAKEN = {
  phone: 'An account with this phone number already exists. Sign in instead.',
  email: 'An account with this email address already exists. Sign in instead.',
};

/** A 409 that names the field, in the same shape the validator uses for its details. */
function taken(/** @type {'phone' | 'email'} */ field) {
  const error = conflict(TAKEN[field]);
  error.details = [{ field, message: TAKEN[field] }];
  return error;
}

/**
 * Finds the account for what was typed in the "Email or phone" box, with its role profiles.
 * @param {string} identifier
 */
export async function findUserByIdentifier(identifier) {
  const where = parseLoginIdentifier(identifier);
  if (!where) return null;
  return prisma.user.findUnique({ where, include: profiles });
}

/**
 * The 409 for a phone or email that an existing account already has, or null. The phone is named first.
 * @param {{ phone: string | null, email: string | null }[]} existing
 * @param {{ phone: string, email?: string }} wanted
 */
export function conflictFromExisting(existing, wanted) {
  if (existing.some((user) => user.phone === wanted.phone)) return taken('phone');
  if (wanted.email && existing.some((user) => user.email === wanted.email)) return taken('email');
  return null;
}

/**
 * Two sign-ups can pass the check above together; the unique index then stops the second. This gives that case
 * the same answer. Returns null for any other error.
 * @param {unknown} error
 */
export function conflictFromUniqueViolation(error) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002')
    return null;
  const target = /** @type {string[] | undefined} */ (error.meta?.target);
  if (target?.includes('phone')) return taken('phone');
  if (target?.includes('email')) return taken('email');
  return null;
}

/**
 * Creates a customer account with their first service location. Only ever a CUSTOMER. The user, the customer
 * and the location are one nested write, so either all three exist afterwards or none do.
 * @param {{
 *   name: string, phone: string, email?: string, password: string, meterNumber: string, cell: string,
 *   village?: string, landmark?: string, latitude: number, longitude: number
 * }} input
 */
export async function registerCustomer(input) {
  const wanted = { phone: input.phone, email: input.email };
  // An email nobody typed must not become a filter: `{ email: undefined }` would match every account.
  const existing = await prisma.user.findMany({
    where: { OR: [{ phone: wanted.phone }, ...(wanted.email ? [{ email: wanted.email }] : [])] },
    select: { phone: true, email: true },
  });
  const duplicate = conflictFromExisting(existing, wanted);
  if (duplicate) throw duplicate;

  const passwordHash = await bcrypt.hash(input.password, 10);
  try {
    return await prisma.user.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        passwordHash,
        role: 'CUSTOMER',
        customer: {
          create: {
            serviceLocations: {
              create: {
                meterNumber: input.meterNumber,
                cell: input.cell,
                village: input.village ?? null,
                landmark: input.landmark ?? null,
                latitude: input.latitude,
                longitude: input.longitude,
              },
            },
          },
        },
      },
      include: profiles,
    });
  } catch (error) {
    throw conflictFromUniqueViolation(error) ?? error;
  }
}
