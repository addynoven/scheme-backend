import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import { fontSizes, fontWeights } from '../theme/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  readonly title: string;
  readonly onPress: (event: GestureResponderEvent) => void;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly enableHaptic?: boolean;
  readonly style?: ViewStyle;
  readonly textStyle?: TextStyle;
  readonly testID?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  enableHaptic = true,
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const handlePress = (event: GestureResponderEvent) => {
    if (disabled || loading) return;

    if (enableHaptic) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress(event);
  };

  const containerStyles: ViewStyle[] = [
    styles.base,
    styles[size],
    styles[variant],
    disabled ? styles.disabled : {},
    style ?? {},
  ];

  const labelStyles: TextStyle[] = [
    styles.textBase,
    styles[`${size}Text`],
    styles[`${variant}Text`],
    disabled ? styles.disabledText : {},
    textStyle ?? {},
  ];

  const spinnerColor =
    variant === 'primary' ? colors.light.background : colors.light.primary;

  return (
    <TouchableOpacity
      style={containerStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      accessibilityLabel={title}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <Text style={labelStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  // Sizes
  sm: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  md: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 52,
  },
  // Variants
  primary: {
    backgroundColor: colors.light.primary,
  },
  secondary: {
    backgroundColor: colors.light.primaryMuted,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.light.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: colors.light.border,
    borderColor: colors.light.border,
    opacity: 0.6,
  },
  // Text sizes
  textBase: {
    fontWeight: fontWeights.semibold,
    textAlign: 'center',
  },
  smText: {
    fontSize: fontSizes.sm,
  },
  mdText: {
    fontSize: fontSizes.base,
  },
  lgText: {
    fontSize: fontSizes.lg,
  },
  // Text colors
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: colors.light.primary,
  },
  outlineText: {
    color: colors.light.primary,
  },
  ghostText: {
    color: colors.light.primary,
  },
  disabledText: {
    color: colors.light.textMuted,
  },
});
