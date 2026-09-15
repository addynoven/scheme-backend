import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';

interface LoginSuccessViewProps {
  onGoToAdvisor: () => void;
}

export const LoginSuccessView: React.FC<LoginSuccessViewProps> = ({ onGoToAdvisor }) => {
  return (
    <View style={styles.container}>
      {/* Floating confetti dots */}
      <View style={[styles.confetti, { top: 20, left: 30, backgroundColor: '#F59E0B' }]} />
      <View style={[styles.confetti, { top: 40, right: 40, backgroundColor: '#EC4899' }]} />
      <View style={[styles.confetti, { top: 70, left: 60, backgroundColor: '#3B82F6' }]} />
      <View style={[styles.confetti, { top: 120, right: 60, backgroundColor: '#10B981' }]} />

      {/* Big Emerald Checkmark */}
      <View style={styles.checkCircle}>
        <FontAwesome name="check" size={42} color="#FFFFFF" />
      </View>

      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>
        You're now signed in to Scheme App. Let's find new opportunities together.
      </Text>

      {/* Progress Dots */}
      <View style={styles.dotsRow}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onGoToAdvisor}
        activeOpacity={0.85}
      >
        <Text style={styles.actionBtnText}>Go to Advisor</Text>
      </TouchableOpacity>

      {/* Monuments footer */}
      <View style={styles.monumentsWrapper}>
        <Image
          source={require('@/../assets/onboarding/monuments_en.png')}
          style={styles.monumentsImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    position: 'relative',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: palette.emerald700,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: palette.emerald700,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    backgroundColor: palette.emerald600,
    width: 18,
  },
  actionBtn: {
    width: '100%',
    backgroundColor: palette.emerald700,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  monumentsWrapper: {
    width: '100%',
    height: 70,
    marginTop: spacing.xl,
    opacity: 0.5,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  monumentsImage: {
    width: '80%',
    height: '100%',
  },
});
