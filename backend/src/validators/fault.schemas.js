import { z } from 'zod';
import { normaliseRwandanPhone } from '../utils/phone.js';

/** Request-body rules for the fault endpoints. */

export const CATEGORIES = /** @type {const} */ ([
  'POWER_OUTAGE',
  'LOW_VOLTAGE',
  'DAMAGED_CONNECTION',
  'METER_ISSUE',
  'OTHER',
]);
export const PRIORITIES = /** @type {const} */ (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const STATUSES = /** @type {const} */ ([
  'ON_THE_WAY',
  'ARRIVED',
  'WORKING',
  'RESOLVED',
  'CANCELLED',
]);
export const OUTCOMES = /** @type {const} */ ([
  'SUPPLY_RESTORED',
  'TEMPORARY_REPAIR',
  'NO_FAULT_FOUND',
  'REFERRED',
]);

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

const PHONE_MESSAGE = 'Enter a Rwandan mobile number, for example 078 123 4567.';
const METER_MESSAGE = 'A meter number has 11 or 13 digits. Leave it empty if you do not know it.';
const WHERE_MESSAGE = 'Tell us where the fault is: use your location or describe the place.';

/** A report made without an account. Only the fields below are read; anything else is dropped. */
export const guestCreateSchema = z
  .object({
    category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Choose a fault category.' }) }),
    contactPhone: z
      .string({ required_error: PHONE_MESSAGE, invalid_type_error: PHONE_MESSAGE })
      .transform((value, ctx) => {
        const phone = normaliseRwandanPhone(value);
        if (!phone) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: PHONE_MESSAGE });
          return z.NEVER;
        }
        return phone;
      }),
    latitude: z.number().min(-90, WHERE_MESSAGE).max(90, WHERE_MESSAGE).optional(),
    longitude: z.number().min(-180, WHERE_MESSAGE).max(180, WHERE_MESSAGE).optional(),
    accuracyM: z.number().int().min(0).max(1_000_000).optional(),
    placeText: optionalText(300),
    claimedMeter: z
      .string()
      .optional()
      .transform((value) => value?.replace(/\s/g, '') || undefined)
      .refine((value) => value === undefined || /^(\d{11}|\d{13})$/.test(value), METER_MESSAGE),
    description: optionalText(1000),
    photo: createSchema.shape.photo,
    // A hidden field that people leave empty and simple bots fill in.
    website: z.string().max(0, 'Leave this field empty.').optional(),
  })
  .superRefine((value, ctx) => {
    const hasLatitude = value.latitude !== undefined;
    const hasLongitude = value.longitude !== undefined;
    if (hasLatitude !== hasLongitude) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: WHERE_MESSAGE, path: ['latitude'] });
    } else if (!hasLatitude && !value.placeText) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: WHERE_MESSAGE, path: ['placeText'] });
    }
  })
  .transform((value) => {
    const { website: _website, ...rest } = value;
    return {
      ...rest,
      locationSource: /** @type {'GPS' | 'TYPED'} */ (
        value.latitude === undefined ? 'TYPED' : 'GPS'
      ),
    };
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

const LIST_STATUSES = /** @type {const} */ (['OPEN', 'ALL', 'REPORTED', 'ASSIGNED', ...STATUSES]);

/** A whole number from 1 to `max`, sent as text in the query string. */
const countParam = (label, max) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a whole number.` })
    .int(`${label} must be a whole number.`)
    .min(1, `${label} must be 1 or more.`)
    .max(max, `${label} must be ${max} or less.`)
    .optional();

/** Query string of GET /faults. Paging is opt-in: without page or pageSize the whole list is returned. */
export const listQuerySchema = z.object({
  status: z
    .enum(LIST_STATUSES, { errorMap: () => ({ message: 'Choose a valid status.' }) })
    .optional(),
  priority: z
    .enum([...PRIORITIES, 'ALL'], { errorMap: () => ({ message: 'Choose a valid priority.' }) })
    .optional(),
  date: z
    .enum(['ANY', 'TODAY', 'WEEK'], { errorMap: () => ({ message: 'Choose a valid date range.' }) })
    .optional(),
  search: optionalText(100),
  page: countParam('Page', 1_000_000),
  pageSize: countParam('Page size', 100),
});

export const assignSchema = z.object({
  technicianId: z.coerce
    .number({ invalid_type_error: 'Choose a technician.' })
    .int()
    .positive('Choose a technician.'),
});
