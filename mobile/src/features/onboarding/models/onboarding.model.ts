import { z } from 'zod';

export const LanguageCodeSchema = z.enum(['en', 'hi']);
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;

export const OnboardingStepSchema = z.enum(['splash', 'language']);
export type OnboardingStep = z.infer<typeof OnboardingStepSchema>;

export const LanguageOptionSchema = z.object({
  code: LanguageCodeSchema,
  title: z.string().min(1),
  subtitle: z.string().min(1),
  letterBadge: z.string().min(1),
  letterBadgeBg: z.string(),
  letterColor: z.string(),
});
export type LanguageOption = z.infer<typeof LanguageOptionSchema>;

export const OnboardingStateSchema = z.object({
  hasCompletedOnboarding: z.boolean(),
  selectedLanguage: LanguageCodeSchema,
  completedAt: z.string().nullable().optional(),
});
export type OnboardingState = z.infer<typeof OnboardingStateSchema>;

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  {
    code: 'en',
    title: 'English',
    subtitle: 'Continue in English',
    letterBadge: 'A',
    letterBadgeBg: '#E6F4EA',
    letterColor: '#0D7A5F',
  },
  {
    code: 'hi',
    title: 'हिंदी',
    subtitle: 'हिंदी में जारी रखें',
    letterBadge: 'अ',
    letterBadgeBg: '#FEF3C7',
    letterColor: '#D97706',
  },
] as const;
