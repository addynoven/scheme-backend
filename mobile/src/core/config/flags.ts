/**
 * Flat feature flags configuration.
 * Follows blueprint §5.6: simple flat const object, zero schema overhead.
 */

export const flags = {
  enableVoiceInput: true,
  enableDocumentVault: true,
  enableOfflineCache: true,
  enableEligibilityCheck: true,
  enableNotifications: false,
} as const;

export type FeatureFlagKey = keyof typeof flags;
