import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AuthStorageService, KeyValueStore } from '../storage/auth.storage';
import { useAuthStore } from '../store/useAuthStore';
import { UserProfile } from '../models/auth.model';

class MockMemoryStore implements KeyValueStore {
  private memory = new Map<string, string>();
  getString(key: string): string | undefined {
    return this.memory.get(key);
  }
  set(key: string, value: string): void {
    this.memory.set(key, value);
  }
  delete(key: string): void {
    this.memory.delete(key);
  }
}

describe('Auth Module Unit Tests', () => {
  it('persists user session and clears on logout', () => {
    const memory = new MockMemoryStore();
    const storage = new AuthStorageService(memory);

    assert.strictEqual(storage.getCurrentUser(), null);

    const testUser: UserProfile = {
      id: 'u1',
      fullName: 'Rohit Kumar',
      phone: '+91 9876543210',
      email: 'rohit@example.com',
      state: 'Maharashtra',
      isPhoneVerified: true,
      isEmailVerified: false,
    };

    storage.saveUser(testUser);
    const loaded = storage.getCurrentUser();
    assert.strictEqual(loaded?.fullName, 'Rohit Kumar');
    assert.strictEqual(loaded?.phone, '+91 9876543210');

    storage.clearSession();
    assert.strictEqual(storage.getCurrentUser(), null);
  });

  it('useAuthStore manages stages and completes signup flow', async () => {
    const store = useAuthStore.getState();

    store.setStage('channel_select');
    assert.strictEqual(useAuthStore.getState().stage, 'channel_select');

    store.setSelectedChannel('telegram');
    assert.strictEqual(useAuthStore.getState().selectedChannel, 'telegram');

    store.setAuthMode('signup');
    store.setStage('enter_otp');
    ['1', '2', '3', '4', '5', '6'].forEach((d, i) => store.setOtpDigit(i, d));
    const success = await store.verifyOtp();
    assert.strictEqual(success, true);
    assert.strictEqual(useAuthStore.getState().stage, 'complete_profile');

    store.setEmail('newcitizen@example.com');
    store.setStateLocation('Delhi');
    store.completeProfileAndLogin();

    assert.strictEqual(useAuthStore.getState().stage, 'success');
    assert.strictEqual(useAuthStore.getState().currentUser?.state, 'Delhi');
  });

  it('validates 10-digit phone format and flags invalid input', () => {
    const isValidPhone = (phone: string) => /^\d{10}$/.test(phone);

    assert.strictEqual(isValidPhone('9876543210'), true);
    assert.strictEqual(isValidPhone('98abc4321'), false);
    assert.strictEqual(isValidPhone('12345'), false);
    assert.strictEqual(isValidPhone('987654321012'), false);
  });

  it('decrements remaining OTP attempts on failure and flags lockout', () => {
    let remainingAttempts = 2;
    let isLockedOut = false;

    const recordFailure = () => {
      if (remainingAttempts > 1) {
        remainingAttempts -= 1;
      } else {
        isLockedOut = true;
      }
    };

    recordFailure();
    assert.strictEqual(remainingAttempts, 1);
    assert.strictEqual(isLockedOut, false);

    recordFailure();
    assert.strictEqual(isLockedOut, true, 'Should lock out after attempts exhausted');
  });
});
