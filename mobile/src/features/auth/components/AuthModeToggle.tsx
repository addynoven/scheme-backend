import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthMode } from '../models/auth.model';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';

interface AuthModeToggleProps {
  mode: AuthMode;
  onSelectMode: (mode: AuthMode) => void;
}

export const AuthModeToggle: React.FC<AuthModeToggleProps> = ({ mode, onSelectMode }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, mode === 'login' && styles.tabActive]}
        onPress={() => onSelectMode('login')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
          Login
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, mode === 'signup' && styles.tabActive]}
        onPress={() => onSelectMode('signup')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
          Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginVertical: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: palette.emerald800,
    fontWeight: '700',
  },
});
