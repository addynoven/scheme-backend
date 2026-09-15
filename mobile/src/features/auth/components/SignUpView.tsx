import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';
import { AuthErrorBanner, AuthErrorType } from './AuthErrorBanner';

interface SignUpViewProps {
  fullName: string;
  phoneNumber: string;
  countryCode: string;
  error?: AuthErrorType | null;
  onChangeName: (name: string) => void;
  onChangePhone: (phone: string) => void;
  onSendOtp: () => void;
  onLoginInstead?: () => void;
}

export const SignUpView: React.FC<SignUpViewProps> = ({
  fullName,
  phoneNumber,
  countryCode,
  error,
  onChangeName,
  onChangePhone,
  onSendOtp,
  onLoginInstead,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Your Account</Text>
      <Text style={styles.subtitle}>
        Join Scheme App to access government schemes and more.
      </Text>

      {/* Full Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Rohit Kumar"
          placeholderTextColor="#94A3B8"
          value={fullName}
          onChangeText={onChangeName}
        />
      </View>

      {/* Phone Number */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <View style={styles.phoneInputRow}>
          <View style={styles.countryPill}>
            <Text style={styles.flagEmoji}>🇮🇳</Text>
            <Text style={styles.countryCode}>{countryCode} ▾</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={onChangePhone}
            placeholder="9876543210"
            placeholderTextColor="#94A3B8"
            maxLength={10}
          />
        </View>
      </View>

      {error && (
        <AuthErrorBanner
          type={error}
          onAction={onLoginInstead}
          actionLabel={error === 'duplicate_account' ? 'Log In Instead' : undefined}
        />
      )}

      <TouchableOpacity
        style={[
          styles.sendOtpBtn,
          fullName.length > 0 && phoneNumber.length >= 10 && styles.sendOtpBtnActive,
        ]}
        onPress={onSendOtp}
        disabled={fullName.length === 0 || phoneNumber.length < 10}
        activeOpacity={0.85}
      >
        <Text style={styles.sendOtpText}>Send OTP</Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        By creating an account, you agree to our{' '}
        <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
        <Text style={styles.termsLink}>Privacy Policy</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    height: 46,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 46,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 4,
  },
  flagEmoji: {
    fontSize: 16,
  },
  countryCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  phoneInput: {
    flex: 1,
    height: 46,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  sendOtpBtn: {
    backgroundColor: '#94A3B8',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  sendOtpBtnActive: {
    backgroundColor: palette.emerald700,
  },
  sendOtpText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 16,
  },
  termsLink: {
    color: palette.emerald700,
    fontWeight: '600',
  },
});
