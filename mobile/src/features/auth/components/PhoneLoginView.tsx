import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';
import { AuthErrorBanner, AuthErrorType } from './AuthErrorBanner';

interface PhoneLoginViewProps {
  phoneNumber: string;
  countryCode: string;
  error?: AuthErrorType | null;
  onChangePhone: (phone: string) => void;
  onSendOtp: () => void;
  onSelectGoogle: () => void;
  onSelectEmail: () => void;
  onSwitchToSignUp: () => void;
  onForgotPassword?: () => void;
}

export const PhoneLoginView: React.FC<PhoneLoginViewProps> = ({
  phoneNumber,
  countryCode,
  error,
  onChangePhone,
  onSendOtp,
  onSelectGoogle,
  onSelectEmail,
  onSwitchToSignUp,
  onForgotPassword,
}) => {
  return (
    <View style={styles.container}>
      {/* Continue with Google */}
      <TouchableOpacity
        style={styles.socialBtn}
        onPress={onSelectGoogle}
        activeOpacity={0.8}
      >
        <FontAwesome name="google" size={16} color="#DB4437" style={styles.socialIcon} />
        <Text style={styles.socialText}>Continue with Google</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Phone Number Input */}
      <View style={styles.phoneSection}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <View style={[styles.phoneInputRow, error === 'invalid_phone' && styles.phoneInputRowError]}>
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

        {error === 'invalid_phone' && (
          <AuthErrorBanner type="invalid_phone" />
        )}

        <TouchableOpacity
          style={[
            styles.sendOtpBtn,
            phoneNumber.length >= 10 && styles.sendOtpBtnActive,
          ]}
          onPress={onSendOtp}
          disabled={phoneNumber.length < 10}
          activeOpacity={0.85}
        >
          <Text style={styles.sendOtpText}>Send OTP</Text>
        </TouchableOpacity>

        {onForgotPassword && (
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={onForgotPassword}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Continue with Email */}
      <TouchableOpacity
        style={styles.secondaryMethodBtn}
        onPress={onSelectEmail}
        activeOpacity={0.8}
      >
        <FontAwesome name="envelope-o" size={15} color="#475569" style={styles.methodIcon} />
        <Text style={styles.methodText}>Continue with Email</Text>
        <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
      </TouchableOpacity>

      {/* Footer link */}
      <TouchableOpacity
        style={styles.footerLink}
        onPress={onSwitchToSignUp}
        activeOpacity={0.7}
      >
        <Text style={styles.footerText}>
          New to Scheme App?{' '}
          <Text style={styles.footerLinkBold}>Create an account</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  socialIcon: {
    marginRight: spacing.sm,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  phoneSection: {
    marginBottom: spacing.xs,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  phoneInputRowError: {
    borderColor: '#DC2626',
    borderWidth: 1.5,
    borderRadius: 10,
  },
  forgotBtn: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    padding: 4,
  },
  forgotText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: palette.emerald700,
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
  },
  sendOtpBtnActive: {
    backgroundColor: palette.emerald700,
  },
  sendOtpText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryMethodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  methodIcon: {
    marginRight: spacing.sm,
  },
  methodText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  footerLink: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
  },
  footerLinkBold: {
    color: palette.emerald700,
    fontWeight: '700',
  },
});
