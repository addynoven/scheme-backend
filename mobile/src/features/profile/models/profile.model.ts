import { z } from 'zod';

export const LinkedAccountSchema = z.object({
  provider: z.enum(['google', 'phone', 'email']),
  identifier: z.string(),
  status: z.enum(['connected', 'verified', 'unverified', 'not_connected']),
  isPrimary: z.boolean().optional(),
});
export type LinkedAccount = z.infer<typeof LinkedAccountSchema>;

export const AppSettingsSchema = z.object({
  language: z.enum(['en', 'hi']).default('en'),
  notificationsEnabled: z.boolean().default(true),
  defaultOtpChannel: z.enum(['whatsapp', 'sms', 'telegram']).default('whatsapp'),
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;
