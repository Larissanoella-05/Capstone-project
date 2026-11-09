import { z } from 'zod';
import { parseLoginIdentifier } from '../domain/loginIdentifier.js';
import { normaliseRwandanPhone } from '../utils/phone.js';
import { optionalText } from './fault.schemas.js';

const IDENTIFIER_MESSAGE = 'Enter your email address or your Rwandan mobile number.';
const PHONE_MESSAGE = 'Enter a Rwandan mobile number, for example 078 123 4567.';
const METER_MESSAGE = 'A meter number has 11 or 13 digits.';
const WHERE_MESSAGE = 'Use your location so we can find your home on the map.';
const client = z.enum(['web', 'mobile']).optional();

/** Sign-in takes `identifier`; `email` is still read (and named in errors) for apps installed before phone sign-in. */
export const loginSchema = z
  .object({
    identifier: z.string().optional(),
    email: z.string().optional(),
    password: z.string({ required_error: 'Enter your password.' }).min(1, 'Enter your password.'),
    client,
  })
  .transform((value, ctx) => {
    const identifier = (value.identifier ?? value.email ?? '').trim();
    if (!parseLoginIdentifier(identifier)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: IDENTIFIER_MESSAGE,
        path: [
          value.identifier === undefined && value.email !== undefined ? 'email' : 'identifier',
        ],
      });
      return z.NEVER;
    }
    return {
      identifier: identifier.includes('@') ? identifier.toLowerCase() : identifier,
      password: value.password,
      client: value.client,
    };
  });

const requiredText = (label, max) =>
  z
    .string({ required_error: `Enter ${label}.`, invalid_type_error: `Enter ${label}.` })
    .trim()
    .min(1, `Enter ${label}.`)
    .max(max, `Keep this under ${max} characters.`);

/** A customer creating their own account. It has no role field: registration can only make a customer. */
export const registerSchema = z
  .object({
    name: requiredText('your full name', 100),
    phone: z
      .string({ required_error: PHONE_MESSAGE, invalid_type_error: PHONE_MESSAGE })
      .transform((value, ctx) => {
        const phone = normaliseRwandanPhone(value);
        if (!phone) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: PHONE_MESSAGE });
          return z.NEVER;
        }
        return phone;
      }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254, 'Keep this under 254 characters.')
      .optional()
      .transform((value) => value || undefined)
      .pipe(z.string().email('Enter a valid email address.').optional()),
    // bcrypt only reads the first 72 bytes, so a longer password would not be fully checked.
    password: z
      .string({ required_error: 'Choose a password.', invalid_type_error: 'Choose a password.' })
      .min(8, 'Use at least 8 characters for your password.')
      .max(72, 'Use at most 72 characters for your password.'),
    meterNumber: z
      .string({ required_error: METER_MESSAGE, invalid_type_error: METER_MESSAGE })
      .transform((value) => value.replace(/\s/g, ''))
      .refine((value) => /^(\d{11}|\d{13})$/.test(value), METER_MESSAGE),
    cell: requiredText('your cell', 60),
    village: optionalText(60),
    landmark: optionalText(200),
    latitude: z
      .number({ required_error: WHERE_MESSAGE, invalid_type_error: WHERE_MESSAGE })
      .min(-90, WHERE_MESSAGE)
      .max(90, WHERE_MESSAGE),
    longitude: z
      .number({ required_error: WHERE_MESSAGE, invalid_type_error: WHERE_MESSAGE })
      .min(-180, WHERE_MESSAGE)
      .max(180, WHERE_MESSAGE),
    client,
  })
  .strict('Registration only takes the fields on the sign-up form.');
