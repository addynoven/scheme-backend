import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors, palette } from '@/core/theme/colors';
import { borderRadius, spacing } from '@/core/theme/spacing';
import { fontSizes, fontWeights } from '@/core/theme/typography';
import type { ThinkingStep } from '../models/advisor.model';

interface ThinkingIndicatorProps {
  readonly steps: readonly ThinkingStep[];
}

export function ThinkingIndicator({ steps }: ThinkingIndicatorProps) {
  return (
    <View style={styles.container}>
      {/* Bot Header */}
      <View style={styles.botRow}>
        <View style={styles.botIconCircle}>
          <FontAwesome name="android" size={13} color="#FFFFFF" />
        </View>
        <Text style={styles.thinkingTitle}>Thinking...</Text>
      </View>

      {/* Steps List */}
      <View style={styles.stepsCard}>
        {steps.map((step) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';

          return (
            <View key={step.id} style={styles.stepItem}>
              <View style={styles.stepIconContainer}>
                {isCompleted ? (
                  <FontAwesome name="check-circle" size={16} color={palette.emerald600} />
                ) : isActive ? (
                  <ActivityIndicator size="small" color={palette.emerald700} />
                ) : (
                  <View style={styles.pendingDot} />
                )}
              </View>
              <Text
                style={[
                  styles.stepText,
                  isCompleted ? styles.stepCompletedText : isActive ? styles.stepActiveText : styles.stepPendingText,
                ]}
              >
                {step.title}
              </Text>
            </View>
          );
        })}

        {/* Wait prompt */}
        <View style={styles.tipRow}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>This usually takes a few seconds. Please wait...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
    gap: spacing.xs,
  },
  botRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  botIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.emerald700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thinkingTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.light.text,
  },
  stepsCard: {
    backgroundColor: colors.light.surfaceElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: spacing.sm,
    marginLeft: spacing.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepIconContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: palette.slate300,
    backgroundColor: '#FFFFFF',
  },
  stepText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  stepCompletedText: {
    color: palette.slate900,
  },
  stepActiveText: {
    color: palette.emerald800,
    fontWeight: fontWeights.semibold,
  },
  stepPendingText: {
    color: palette.slate400,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.saffron50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  tipIcon: {
    fontSize: fontSizes.xs,
  },
  tipText: {
    fontSize: fontSizes.xs - 1,
    color: palette.saffron800,
  },
});
