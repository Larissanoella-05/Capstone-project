import { z } from 'zod';

export const locationSchema = z.object({
  latitude: z.coerce.number().min(-90, 'Latitude is out of range.').max(90, 'Latitude is out of range.'),
  longitude: z.coerce.number().min(-180, 'Longitude is out of range.').max(180, 'Longitude is out of range.'),
  faultId: z.coerce.number().int().positive().optional(),
  label: z.string().trim().max(120).optional(),
});
