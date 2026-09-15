import { z } from 'zod';

export const OtpChannelSchema = z.enum(['whatsapp', 'sms', 'telegram']);
export type OtpChannel = z.infer<typeof OtpChannelSchema>;

export const AuthModeSchema = z.enum(['login', 'signup']);
export type AuthMode = z.infer<typeof AuthModeSchema>;

export const AuthStageSchema = z.enum([
  'options',
  'phone_input',
  'channel_select',
  'enter_otp',
  'success',
  'signup_phone',
  'complete_profile',
]);
export type AuthStage = z.infer<typeof AuthStageSchema>;

export const UserProfileSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  state: z.string().default('Maharashtra'),
  avatarUrl: z.string().optional(),
  isPhoneVerified: z.boolean().default(true),
  isEmailVerified: z.boolean().default(false),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export interface ChannelOption {
  id: OtpChannel;
  title: string;
  subtitle: string;
  badge?: string;
  icon: string;
}
