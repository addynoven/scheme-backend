import React from 'react';
import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import { fontSizes, fontWeights } from '../theme/typography';

export type BadgeVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

export interface BadgeProps {
  readonly label: string;
  readonly variant?: BadgeVariant;
  readonly style?: ViewStyle;
  readonly textStyle?: TextStyle;
  readonly testID?: string;
}

export function Badge({
  label,
  variant = 'neutral',
  style,
  textStyle,
  testID,
}: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], style]} testID={testID}>
      <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xxs + 1,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  neutral: {
    backgroundColor: colors.light.border,
  },
  info: {
    backgroundColor: colors.light.status.infoBg,
  },
  success: {
    backgroundColor: colors.light.status.successBg,
  },
  warning: {
    backgroundColor: colors.light.status.warningBg,
  },
  error: {
    backgroundColor: colors.light.status.errorBg,
  },
  text: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  neutralText: {
    color: colors.light.textMuted,
  },
  infoText: {
    color: colors.light.status.info,
  },
  successText: {
    color: colors.light.status.success,
  },
  warningText: {
    color: colors.light.status.warning,
  },
  errorText: {
    color: colors.light.status.error,
  },
});
