import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import { fontSizes, fontWeights } from '../theme/typography';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  readonly label?: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly containerStyle?: ViewStyle;
  readonly inputStyle?: TextStyle;
}

export function Input({
  label,
  error,
  helperText,
  containerStyle,
  inputStyle,
  testID,
  onFocus,
  onBlur,
  ...restProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const hasError = Boolean(error);

  const borderStyle = hasError
    ? styles.inputError
    : isFocused
    ? styles.inputFocused
    : styles.inputDefault;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, borderStyle, inputStyle]}
        placeholderTextColor={colors.light.textSubtle}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        accessibilityLabel={label}
        aria-invalid={hasError}
        testID={testID}
        {...restProps}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.light.text,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.base,
    color: colors.light.text,
    backgroundColor: colors.light.surface,
  },
  inputDefault: {
    borderColor: colors.light.border,
  },
  inputFocused: {
    borderColor: colors.light.primary,
    backgroundColor: colors.light.surfaceElevated,
  },
  inputError: {
    borderColor: colors.light.status.error,
  },
  errorText: {
    fontSize: fontSizes.xs,
    color: colors.light.status.error,
    marginTop: spacing.xs,
  },
  helperText: {
    fontSize: fontSizes.xs,
    color: colors.light.textMuted,
    marginTop: spacing.xs,
  },
});
