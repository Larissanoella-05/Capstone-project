import { z } from 'zod';

const EXPO_TOKEN = /^(Exponent|Expo)PushToken\[.+\]$/;

export const registerDeviceSchema = z.object({
  token: z.string().trim().regex(EXPO_TOKEN, 'That is not a valid push token.'),
  platform: z.enum(['android']).optional(),
});

export const removeDeviceSchema = z.object({
  token: z.string().trim().min(1, 'A push token is required.'),
});
