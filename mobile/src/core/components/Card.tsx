import React, { type ReactNode } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/shadows';
import { borderRadius, spacing } from '../theme/spacing';

export interface CardProps {
  readonly children: ReactNode;
  readonly onPress?: (event: GestureResponderEvent) => void;
  readonly padding?: 'none' | 'sm' | 'md' | 'lg';
  readonly elevated?: boolean;
  readonly style?: ViewStyle;
  readonly testID?: string;
}

export function Card({
  children,
  onPress,
  padding = 'md',
  elevated = true,
  style,
  testID,
}: CardProps) {
  const containerStyles: ViewStyle[] = [
    styles.card,
    elevated ? shadows.sm : styles.flat,
    styles[`padding_${padding}`],
    style ?? {},
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyles}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        testID={testID}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyles} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surfaceElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  flat: {
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: spacing.sm,
  },
  padding_md: {
    padding: spacing.lg,
  },
  padding_lg: {
    padding: spacing.xxl,
  },
});
