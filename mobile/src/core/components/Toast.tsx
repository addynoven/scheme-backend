import React, { useEffect, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import { fontSizes, fontWeights } from '../theme/typography';
import { shadows } from '../theme/shadows';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  readonly id: string;
  readonly message: string;
  readonly type?: ToastType;
  readonly durationMs?: number;
}

type ToastListener = (toast: ToastMessage | null) => void;
const listeners = new Set<ToastListener>();

export const toastService = {
  show(message: string, type: ToastType = 'info', durationMs = 3000): void {
    const toast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
      durationMs,
    };
    listeners.forEach((listener) => listener(toast));
  },
  hide(): void {
    listeners.forEach((listener) => listener(null));
  },
  subscribe(listener: ToastListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function Toast() {
  const [currentToast, setCurrentToast] = useState<ToastMessage | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const unsubscribe = toastService.subscribe((toast) => {
      if (toast) {
        setCurrentToast(toast);
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(toast.durationMs ?? 3000),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (finished) {
            setCurrentToast(null);
          }
        });
      } else {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => setCurrentToast(null));
      }
    });

    return unsubscribe;
  }, [opacity]);

  if (!currentToast) return null;

  const type = currentToast.type ?? 'info';

  return (
    <Animated.View
      style={[
        styles.container,
        styles[type],
        { opacity } as unknown as ViewStyle,
      ]}
      accessibilityRole="alert"
    >
      <TouchableOpacity
        style={styles.content}
        onPress={toastService.hide}
        activeOpacity={0.9}
      >
        <Text style={[styles.text, styles[`${type}Text`]]}>
          {currentToast.message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  content: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  text: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    textAlign: 'center',
  },
  info: {
    backgroundColor: colors.light.text,
  },
  infoText: {
    color: colors.light.background,
  },
  success: {
    backgroundColor: colors.light.status.success,
  },
  successText: {
    color: '#FFFFFF',
  },
  warning: {
    backgroundColor: colors.light.status.warning,
  },
  warningText: {
    color: '#FFFFFF',
  },
  error: {
    backgroundColor: colors.light.status.error,
  },
  errorText: {
    color: '#FFFFFF',
  },
});
