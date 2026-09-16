import React, { useCallback } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SplashScreenView, onboardingStorage } from '@/features/onboarding';
import { authStorage } from '@/features/auth';
import { secureStorage } from '@/core/storage/secureStorage';

export default function RootIndexRoute() {
  const router = useRouter();

  const handleSplashComplete = useCallback(async () => {
    const onboardingState = onboardingStorage.getOnboardingState();
    const currentUser = authStorage.getCurrentUser();

    // 1. First time opening: go to language selection
    if (!onboardingState.hasCompletedOnboarding) {
      router.replace('/onboarding');
      return;
    }

    // 2. Not logged in: go to auth
    if (!currentUser) {
      router.replace('/auth');
      return;
    }

    // 3. User profile exists in MMKV but JWT token may be gone (e.g. after reinstall).
    //    SecureStore (Android Keystore) gets wiped on reinstall, MMKV doesn't.
    //    If token is missing, clear stale session and redirect to auth.
    const tokenResult = await secureStorage.get('auth_token');
    if (!tokenResult.ok || !tokenResult.data) {
      console.log('[Auth] Stale session detected — MMKV user exists but JWT token missing. Redirecting to login.');
      authStorage.clearSession();
      router.replace('/auth');
      return;
    }

    // 4. Already logged in with valid token: go to home screen
    router.replace('/(tabs)');
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FCF9" />
      <SplashScreenView
        onComplete={handleSplashComplete}
        autoAdvance={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FCF9',
  },
});
