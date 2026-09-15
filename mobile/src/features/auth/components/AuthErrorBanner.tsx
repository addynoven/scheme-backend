import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { spacing } from '@/core/theme/spacing';

export type AuthErrorType =
  | 'invalid_phone'
  | 'wrong_otp'
  | 'otp_expired'
  | 'duplicate_account'
  | 'invalid_email'
  | 'wrong_password'
  | 'account_not_found'
  | 'too_many_attempts'
  | 'generic_error';

interface AuthErrorBannerProps {
  readonly type: AuthErrorType;
  readonly message?: string;
  readonly attemptsRemaining?: number;
  readonly onAction?: () => void;
  readonly actionLabel?: string;
}

export function AuthErrorBanner({
  type,
  message,
  attemptsRemaining,
  onAction,
  actionLabel,
}: AuthErrorBannerProps) {
  const getDefaultMessage = () => {
    switch (type) {
      case 'invalid_phone':
        return 'Please enter a valid 10-digit phone number.';
      case 'wrong_otp':
        return 'Incorrect code. Please try again.';
      case 'otp_expired':
        return 'This OTP has expired. Please request a new code to continue.';
      case 'duplicate_account':
        return 'An account with this email already exists.';
      case 'invalid_email':
        return 'Please enter a valid email address.';
      case 'wrong_password':
        return 'Incorrect email or password. Please try again.';
      case 'account_not_found':
        return 'No account found. We couldn\'t find an account with this email/phone.';
      case 'too_many_attempts':
        return "Too many attempts. You've entered an incorrect code multiple times. Please try again after 5 minutes.";
      case 'generic_error':
      default:
        return 'Something went wrong. We couldn\'t complete your request. Please try again.';
    }
  };

  const isWarning = type === 'otp_expired';
  const iconName: React.ComponentProps<typeof FontAwesome>['name'] =
    type === 'otp_expired' ? 'clock-o' : type === 'too_many_attempts' ? 'lock' : 'exclamation-circle';

  return (
    <View style={[styles.container, isWarning && styles.containerWarning]}>
      <View style={styles.contentRow}>
        <View style={[styles.iconCircle, isWarning && styles.iconCircleWarning]}>
          <FontAwesome
            name={iconName}
            size={14}
            color={isWarning ? '#B45309' : '#DC2626'}
          />
        </View>
        <View style={styles.textColumn}>
          <Text style={[styles.messageText, isWarning && styles.messageTextWarning]}>
            {message ?? getDefaultMessage()}
          </Text>

          {type === 'wrong_otp' && attemptsRemaining !== undefined && (
            <Text style={styles.attemptsText}>
              Attempts remaining: {attemptsRemaining}
            </Text>
          )}
        </View>
      </View>

      {onAction && actionLabel && (
        <TouchableOpacity
          style={[styles.actionButton, isWarning && styles.actionButtonWarning]}
          onPress={onAction}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={[styles.actionButtonText, isWarning && styles.actionButtonTextWarning]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: spacing.xs,
    gap: 8,
  },
  containerWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  iconCircleWarning: {
    backgroundColor: '#FEF3C7',
  },
  textColumn: {
    flex: 1,
  },
  messageText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#991B1B',
    lineHeight: 17,
  },
  messageTextWarning: {
    color: '#92400E',
  },
  attemptsText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 3,
  },
  actionButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginTop: 2,
  },
  actionButtonWarning: {
    borderColor: '#FCD34D',
  },
  actionButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  actionButtonTextWarning: {
    color: '#B45309',
  },
});
