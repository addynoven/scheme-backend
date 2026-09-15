import { create } from 'zustand';
import {
  type LanguageCode,
  type OnboardingStep,
} from '../models/onboarding.model';
import { onboardingStorage } from '../storage/onboarding.storage';

interface OnboardingStoreState {
  step: OnboardingStep;
  selectedLanguage: LanguageCode;
  isSaving: boolean;
  hasSaved: boolean;
  hasCompleted: boolean;

  setStep: (step: OnboardingStep) => void;
  selectLanguage: (lang: LanguageCode) => void;
  confirmAndComplete: (lang: LanguageCode, onSuccess?: () => void) => Promise<void>;
  resetOnboarding: () => void;
  initFromStorage: () => void;
}

export const useOnboardingStore = create<OnboardingStoreState>((set) => ({
  step: 'language',
  selectedLanguage: 'en',
  isSaving: false,
  hasSaved: false,
  hasCompleted: false,

  setStep: (step: OnboardingStep) => {
    set({ step });
  },

  selectLanguage: (lang: LanguageCode) => {
    set({ selectedLanguage: lang });
  },

  confirmAndComplete: async (lang: LanguageCode, onSuccess?: () => void) => {
    set({ selectedLanguage: lang, isSaving: true });

    onboardingStorage.saveOnboardingLanguage(lang);

    // Provide visual feedback for 400ms before navigating
    await new Promise((resolve) => setTimeout(resolve, 400));

    set({
      isSaving: false,
      hasSaved: true,
      hasCompleted: true,
    });

    if (onSuccess) {
      onSuccess();
    }
  },

  resetOnboarding: () => {
    onboardingStorage.resetOnboardingState();
    set({
      step: 'language',
      selectedLanguage: 'en',
      isSaving: false,
      hasSaved: false,
      hasCompleted: false,
    });
  },

  initFromStorage: () => {
    const stored = onboardingStorage.getOnboardingState();
    set({
      hasCompleted: stored.hasCompletedOnboarding,
      selectedLanguage: stored.selectedLanguage,
    });
  },
}));
