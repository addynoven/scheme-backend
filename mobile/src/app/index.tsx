import React, { useCallback } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SplashScreenView, onboardingStorage } from '@/features/onboarding';
import { authStorage } from '@/features/auth';

export default function RootIndexRoute() {
  const router = useRouter();

  const handleSplashComplete = useCallback(() => {
    const onboardingState = onboardingStorage.getOnboardingState();
    const currentUser = authStorage.getCurrentUser();

    // 1. First time opening: go to language selection
    if (!onboardingState.hasCompletedOnboarding) {
      router.replace('/onboarding');
      return;
    }

    // 2. Not logged in: no public screens other than auth
    if (!currentUser) {
      router.replace('/auth');
      return;
    }

    // 3. Already logged in: go to home screen
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
