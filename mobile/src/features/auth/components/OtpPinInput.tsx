import React, { useRef } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { OtpChannel } from '../models/auth.model';
import { AuthErrorBanner, AuthErrorType } from './AuthErrorBanner';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';

interface OtpPinInputProps {
  digits: string[];
  phoneNumber: string;
  channel: OtpChannel;
  countdown: number;
  error?: AuthErrorType | null;
  attemptsRemaining?: number;
  onChangeDigit: (index: number, value: string) => void;
  onVerify: () => void;
  onBack: () => void;
  onTrySms: () => void;
  onResendOtp?: () => void;
}

export const OtpPinInput: React.FC<OtpPinInputProps> = ({
  digits,
  phoneNumber,
  channel,
  countdown,
  error,
  attemptsRemaining,
  onChangeDigit,
  onVerify,
  onBack,
  onTrySms,
  onResendOtp,
}) => {
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleDigitChange = (val: string, index: number) => {
    onChangeDigit(index, val);
    if (val && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : channel === 'sms' ? 'SMS' : 'Telegram';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <FontAwesome name="chevron-left" size={14} color="#0F172A" />
      </TouchableOpacity>

      <Text style={styles.title}>Enter the 6-digit code</Text>
      <Text style={styles.subtitle}>
        We sent it to +91 {phoneNumber} via {channelLabel}
      </Text>

      {/* 6 Digit Boxes */}
      <View style={styles.digitsRow}>
        {digits.map((digit, idx) => (
          <TextInput
            key={idx}
            ref={(ref) => {
              inputs.current[idx] = ref;
            }}
            style={[
              styles.digitBox,
              digit ? styles.digitBoxFilled : null,
              error ? styles.digitBoxError : null,
            ]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(val) => handleDigitChange(val, idx)}
            textAlign="center"
          />
        ))}
      </View>

      {/* Error Banner if Wrong OTP or Expired */}
      {error && (
        <View style={styles.errorWrapper}>
          <AuthErrorBanner
            type={error}
            attemptsRemaining={attemptsRemaining}
            onAction={error === 'otp_expired' ? onResendOtp : undefined}
            actionLabel={error === 'otp_expired' ? 'Resend OTP' : undefined}
          />
        </View>
      )}

      <Text style={styles.resendText}>
        Didn't receive the code?{' '}
        <Text style={styles.countdown}>Resend in 00:{countdown.toString().padStart(2, '0')}</Text>
      </Text>

      <TouchableOpacity style={styles.trySmsBtn} onPress={onTrySms} activeOpacity={0.7}>
        <Text style={styles.trySmsText}>Try via SMS instead</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.verifyBtn}
        onPress={onVerify}
        activeOpacity={0.85}
      >
        <Text style={styles.verifyBtnText}>Verify & Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  digitsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  digitBox: {
    width: 44,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  digitBoxFilled: {
    borderColor: palette.emerald600,
    backgroundColor: '#F0FDF4',
  },
  digitBoxError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorWrapper: {
    width: '100%',
    marginBottom: spacing.md,
  },
  resendText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  countdown: {
    fontWeight: '700',
    color: palette.emerald800,
  },
  trySmsBtn: {
    paddingVertical: 4,
    marginBottom: spacing.lg,
  },
  trySmsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  verifyBtn: {
    width: '100%',
    backgroundColor: palette.emerald700,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
