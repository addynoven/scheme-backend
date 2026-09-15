import {
  type LanguageCode,
  type OnboardingState,
  OnboardingStateSchema,
} from '../models/onboarding.model';

export interface KeyValueStore {
  getBoolean(key: string): boolean | undefined;
  getString(key: string): string | undefined;
  set(key: string, value: boolean | string): void;
  remove(key: string): void;
}

const STORAGE_KEYS = {
  HAS_COMPLETED: 'scheme_onboarding_completed',
  SELECTED_LANGUAGE: 'scheme_selected_language',
  COMPLETED_AT: 'scheme_onboarding_completed_at',
} as const;

export class OnboardingStorageService {
  constructor(private readonly store?: KeyValueStore) {}

  private getStore(): KeyValueStore {
    if (this.store) {
      return this.store;
    }
    // Lazy-load MMKV to avoid importing react-native in test environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { storage } = require('@/core/storage/mmkv');
    return storage as KeyValueStore;
  }

  getOnboardingState(): OnboardingState {
    const store = this.getStore();
    const hasCompleted = store.getBoolean(STORAGE_KEYS.HAS_COMPLETED) ?? false;
    const storedLang = store.getString(STORAGE_KEYS.SELECTED_LANGUAGE);
    const completedAt = store.getString(STORAGE_KEYS.COMPLETED_AT);

    const language: LanguageCode = storedLang === 'hi' ? 'hi' : 'en';

    const parsed = OnboardingStateSchema.safeParse({
      hasCompletedOnboarding: hasCompleted,
      selectedLanguage: language,
      completedAt: completedAt ?? null,
    });

    if (!parsed.success) {
      return {
        hasCompletedOnboarding: false,
        selectedLanguage: 'en',
        completedAt: null,
      };
    }

    return parsed.data;
  }

  saveOnboardingLanguage(lang: LanguageCode): OnboardingState {
    const store = this.getStore();
    const nowIso = new Date().toISOString();
    store.set(STORAGE_KEYS.HAS_COMPLETED, true);
    store.set(STORAGE_KEYS.SELECTED_LANGUAGE, lang);
    store.set(STORAGE_KEYS.COMPLETED_AT, nowIso);

    return {
      hasCompletedOnboarding: true,
      selectedLanguage: lang,
      completedAt: nowIso,
    };
  }

  resetOnboardingState(): void {
    const store = this.getStore();
    store.remove(STORAGE_KEYS.HAS_COMPLETED);
    store.remove(STORAGE_KEYS.SELECTED_LANGUAGE);
    store.remove(STORAGE_KEYS.COMPLETED_AT);
  }
}

export const onboardingStorage = new OnboardingStorageService();
