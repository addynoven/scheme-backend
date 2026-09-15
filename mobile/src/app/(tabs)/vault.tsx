import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  VaultHomeScreen,
  SchemeReadinessScreen,
} from '@/features/vault';
import { ProfileMenuModal, LogoutConfirmModal } from '@/features/profile';

export default function VaultTabScreen() {
  const [currentView, setCurrentView] = useState<'vault' | 'readiness'>('vault');

  return (
    <View style={styles.container}>
      {currentView === 'readiness' ? (
        <SchemeReadinessScreen onBack={() => setCurrentView('vault')} />
      ) : (
        <VaultHomeScreen onGoToReadiness={() => setCurrentView('readiness')} />
      )}
      <ProfileMenuModal />
      <LogoutConfirmModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});

