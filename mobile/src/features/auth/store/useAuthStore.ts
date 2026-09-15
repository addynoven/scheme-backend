import { create } from 'zustand';
import { AuthMode, AuthStage, OtpChannel, UserProfile } from '../models/auth.model';
import { authStorage } from '../storage/auth.storage';

export interface AuthState {
  authMode: AuthMode;
  stage: AuthStage;
  phoneNumber: string;
  countryCode: string;
  selectedChannel: OtpChannel;
  otpDigits: string[];
  fullName: string;
  email: string;
  state: string;
  countdown: number;
  currentUser: UserProfile | null;
  isLoading: boolean;

  // Actions
  setAuthMode: (mode: AuthMode) => void;
  setStage: (stage: AuthStage) => void;
  setPhoneNumber: (phone: string) => void;
  setSelectedChannel: (channel: OtpChannel) => void;
  setOtpDigit: (index: number, value: string) => void;
  setFullName: (name: string) => void;
  setEmail: (email: string) => void;
  setStateLocation: (state: string) => void;
  verifyOtp: () => Promise<boolean>;
  loginWithGoogle: (email: string, name?: string, idToken?: string, avatarUrl?: string) => Promise<boolean>;
  completeProfileAndLogin: () => void;
  loginSuccessNow: () => void;
  logout: () => Promise<void>;
  resetAuthFlow: () => void;
}

import { authApi } from '../repositories/auth.api';

export const useAuthStore = create<AuthState>((set, get) => {
  const storedUser = authStorage.getCurrentUser();

  return {
    authMode: 'login',
    stage: 'options',
    phoneNumber: '',
    countryCode: '+91',
    selectedChannel: 'whatsapp',
    otpDigits: ['', '', '', '', '', ''],
    fullName: '',
    email: '',
    state: '',
    countdown: 28,
    currentUser: storedUser || null,
    isLoading: false,

    setAuthMode: (authMode) => set({ authMode }),

    setStage: (stage) => set({ stage }),

    setPhoneNumber: (phoneNumber) => set({ phoneNumber }),

    setSelectedChannel: (selectedChannel) => set({ selectedChannel }),

    setOtpDigit: (index, value) => {
      const digits = [...get().otpDigits];
      digits[index] = value;
      set({ otpDigits: digits });
    },

    setFullName: (fullName) => set({ fullName }),

    setEmail: (email) => set({ email }),

    setStateLocation: (state) => set({ state }),

    verifyOtp: async () => {
      const digits = get().otpDigits.join('');
      if (digits.length === 6) {
        if (get().authMode === 'signup') {
          set({ stage: 'complete_profile' });
          return true;
        }
        set({ isLoading: true });
        try {
          const fullPhone = `${get().countryCode} ${get().phoneNumber}`.trim();
          const result = await authApi.verifyPhoneOtp(fullPhone, digits);
          if (result.ok) {
            set({ currentUser: result.data, stage: 'success', isLoading: false });
            return true;
          }
        } catch {
          // ignore
        } finally {
          set({ isLoading: false });
        }
      }
      return false;
    },

    loginWithGoogle: async (email: string, name?: string, idToken?: string, avatarUrl?: string) => {
      set({ isLoading: true });
      try {
        const result = await authApi.loginWithGoogle(email, name, idToken, avatarUrl);
        if (result.ok) {
          set({ currentUser: result.data, stage: 'success', isLoading: false });
          return true;
        }
      } catch {
        // ignore
      } finally {
        set({ isLoading: false });
      }
      return false;
    },

    completeProfileAndLogin: () => {
      const user: UserProfile = {
        id: `usr_${Date.now()}`,
        fullName: get().fullName || 'Citizen',
        phone: `${get().countryCode} ${get().phoneNumber}`,
        email: get().email || undefined,
        state: get().state || 'Maharashtra',
        isPhoneVerified: true,
        isEmailVerified: false,
      };
      authStorage.saveUser(user);
      set({ currentUser: user, stage: 'success' });
    },

    loginSuccessNow: () => {
      const user = get().currentUser;
      if (user) {
        authStorage.saveUser(user);
        set({ stage: 'success' });
      }
    },

    logout: async () => {
      try {
        const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
        await GoogleSignin.signOut();
      } catch {}
      await authApi.logout();
      set({ currentUser: null, stage: 'options' });
    },

    resetAuthFlow: () => {
      set({
        stage: 'options',
        phoneNumber: '',
        otpDigits: ['', '', '', '', '', ''],
      });
    },
  };
});
