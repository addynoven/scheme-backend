import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LanguageCodeSchema,
  LanguageOptionSchema,
  OnboardingStateSchema,
  LANGUAGE_OPTIONS,
} from '../models/onboarding.model';
import {
  OnboardingStorageService,
  type KeyValueStore,
} from '../storage/onboarding.storage';

class MockMemoryStore implements KeyValueStore {
  private map = new Map<string, string | boolean>();

  getBoolean(key: string): boolean | undefined {
    const val = this.map.get(key);
    return typeof val === 'boolean' ? val : undefined;
  }

  getString(key: string): string | undefined {
    const val = this.map.get(key);
    return typeof val === 'string' ? val : undefined;
  }

  set(key: string, value: boolean | string): void {
    this.map.set(key, value);
  }

  remove(key: string): void {
    this.map.delete(key);
  }
}

test('Onboarding models validate valid language codes', () => {
  assert.equal(LanguageCodeSchema.safeParse('en').success, true);
  assert.equal(LanguageCodeSchema.safeParse('hi').success, true);
  assert.equal(LanguageCodeSchema.safeParse('es').success, false);
});

test('LANGUAGE_OPTIONS contains exact specifications for English and Hindi', () => {
  assert.equal(LANGUAGE_OPTIONS.length, 2);

  const [en, hi] = LANGUAGE_OPTIONS;
  assert.equal(en.code, 'en');
  assert.equal(en.title, 'English');
  assert.equal(en.subtitle, 'Continue in English');
  assert.equal(en.letterBadge, 'A');

  assert.equal(hi.code, 'hi');
  assert.equal(hi.title, 'हिंदी');
  assert.equal(hi.subtitle, 'हिंदी में जारी रखें');
  assert.equal(hi.letterBadge, 'अ');

  for (const opt of LANGUAGE_OPTIONS) {
    const parsed = LanguageOptionSchema.safeParse(opt);
    assert.equal(parsed.success, true);
  }
});

test('OnboardingStateSchema validates state structures', () => {
  const validState = {
    hasCompletedOnboarding: true,
    selectedLanguage: 'hi',
    completedAt: '2026-09-13T22:00:00.000Z',
  };
  const parsed = OnboardingStateSchema.safeParse(validState);
  assert.equal(parsed.success, true);

  const invalidState = {
    hasCompletedOnboarding: 'yes', // should be boolean
    selectedLanguage: 'unknown',
  };
  const parsedInvalid = OnboardingStateSchema.safeParse(invalidState);
  assert.equal(parsedInvalid.success, false);
});

test('OnboardingStorageService returns uncompleted default state when empty', () => {
  const store = new MockMemoryStore();
  const service = new OnboardingStorageService(store);

  const state = service.getOnboardingState();
  assert.equal(state.hasCompletedOnboarding, false);
  assert.equal(state.selectedLanguage, 'en');
  assert.equal(state.completedAt, null);
});

test('OnboardingStorageService saves language preference and marks completed', () => {
  const store = new MockMemoryStore();
  const service = new OnboardingStorageService(store);

  const saved = service.saveOnboardingLanguage('hi');
  assert.equal(saved.hasCompletedOnboarding, true);
  assert.equal(saved.selectedLanguage, 'hi');
  assert.ok(typeof saved.completedAt === 'string');

  const loaded = service.getOnboardingState();
  assert.equal(loaded.hasCompletedOnboarding, true);
  assert.equal(loaded.selectedLanguage, 'hi');
  assert.equal(loaded.completedAt, saved.completedAt);
});

test('OnboardingStorageService resets state back to default', () => {
  const store = new MockMemoryStore();
  const service = new OnboardingStorageService(store);

  service.saveOnboardingLanguage('hi');
  service.resetOnboardingState();

  const state = service.getOnboardingState();
  assert.equal(state.hasCompletedOnboarding, false);
  assert.equal(state.selectedLanguage, 'en');
  assert.equal(state.completedAt, null);
});
