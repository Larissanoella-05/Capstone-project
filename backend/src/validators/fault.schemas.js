import { z } from 'zod';

/** Request-body rules for the fault endpoints. Kept apart from the routes so they can be tested and reused. */

export const CATEGORIES = ['POWER_OUTAGE', 'LOW_VOLTAGE', 'DAMAGED_CONNECTION', 'METER_ISSUE', 'OTHER'];
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES = ['ON_THE_WAY', 'ARRIVED', 'WORKING', 'RESOLVED', 'CANCELLED'];
export const OUTCOMES = ['SUPPLY_RESTORED', 'TEMPORARY_REPAIR', 'NO_FAULT_FOUND', 'REFERRED'];

/** Optional trimmed text. Empty or whitespace-only input becomes undefined. */
export const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .transform((value) => value || undefined)
    .optional();

export const createSchema = z.object({
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

export const updateSchema = z.object({
  priority: z.enum(PRIORITIES, { errorMap: () => ({ message: 'Choose a valid priority.' }) }),
});

export const statusSchema = z.object({
  status: z.enum(STATUSES, { errorMap: () => ({ message: 'Choose a valid status.' }) }),
  note: optionalText(500),
  outcome: z.enum(OUTCOMES).optional(),
  resolutionNote: optionalText(1000),
  workCompleted: optionalText(1000),
  clarificationContacts: z.coerce.number().int().min(0).max(50).optional(),
});

export const assignSchema = z.object({
  technicianId: z.coerce
    .number({ invalid_type_error: 'Choose a technician.' })
    .int()
    .positive('Choose a technician.'),
});
