import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';

interface StepProgressHeaderProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { step: 1, label: 'Demographics' },
  { step: 2, label: 'Economic' },
  { step: 3, label: 'Assets' },
];

export const StepProgressHeader: React.FC<StepProgressHeaderProps> = ({ currentStep }) => {
  return (
    <View style={styles.container}>
      <View style={styles.stepperRow}>
        {STEPS.map((s, index) => {
          const isCompleted = currentStep > s.step;
          const isCurrent = currentStep === s.step;

          return (
            <React.Fragment key={s.step}>
              {index > 0 && (
                <View
                  style={[
                    styles.connectorLine,
                    isCompleted || isCurrent ? styles.connectorActive : styles.connectorInactive,
                  ]}
                />
              )}

              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.circle,
                    isCurrent && styles.circleCurrent,
                    isCompleted && styles.circleCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.circleText,
                      (isCurrent || isCompleted) && styles.circleTextActive,
                    ]}
                  >
                    {s.step}
                  </Text>
                </View>
                <Text style={[styles.stepLabel, isCurrent && styles.stepLabelCurrent]}>
                  {s.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  stepItem: {
    alignItems: 'center',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  circleCurrent: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  circleCompleted: {
    backgroundColor: '#047857',
    borderColor: '#047857',
  },
  circleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  circleTextActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
  },
  stepLabelCurrent: {
    color: '#059669',
    fontWeight: '700',
  },
  connectorLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  connectorActive: {
    backgroundColor: '#059669',
  },
  connectorInactive: {
    backgroundColor: '#E2E8F0',
  },
});
