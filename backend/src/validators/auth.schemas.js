import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string({ required_error: 'Enter your email address.' }).trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string({ required_error: 'Enter your password.' }).min(1, 'Enter your password.'),
  client: z.enum(['web', 'mobile']).optional(),
});
