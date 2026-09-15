import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { spacing } from '@/core/theme/spacing';

interface ForgotPasswordModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

type ForgotStep = '1_contact' | '2_code' | '3_new_password' | '4_success';

export function ForgotPasswordModal({
  visible,
  onClose,
  onSuccess,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<ForgotStep>('1_contact');
  const [contact, setContact] = useState('rohit@example.com');
  const [code, setCode] = useState(['4', '1', '2', '8', '9', '0']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendCode = () => {
    if (!contact.trim()) {
      setErrorMessage('Please enter your email or phone number');
      return;
    }
    setErrorMessage(null);
    setStep('2_code');
  };

  const handleVerifyCode = () => {
    setErrorMessage(null);
    setStep('3_new_password');
  };

  const handleResetPassword = () => {
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return;
    }
    if (!/\d/.test(newPassword)) {
      setErrorMessage('Password must include at least one number');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setErrorMessage(null);
    setStep('4_success');
  };

  const handleFinish = () => {
    setStep('1_contact');
    setNewPassword('');
    setConfirmPassword('');
    onSuccess();
    onClose();
  };

  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.scrim}>
        <View style={styles.modalCard}>
          {/* Header Bar */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="times" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* STEP 1: Enter Contact */}
          {step === '1_contact' && (
            <View style={styles.stepContainer}>
              <View style={styles.iconCircle}>
                <FontAwesome name="lock" size={32} color="#0D7A5F" />
              </View>

              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                Enter your email or phone number and we'll send you a reset code.
              </Text>

              <Text style={styles.inputLabel}>Email or Phone</Text>
              <TextInput
                style={styles.input}
                value={contact}
                onChangeText={setContact}
                placeholder="Enter email or phone"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
              />

              {errorMessage && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSendCode}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Send Reset Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.textLinkButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.textLink}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Enter Reset Code */}
          {step === '2_code' && (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>Enter Reset Code</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to{'\n'}
                <Text style={styles.boldText}>{contact}</Text>
              </Text>

              <View style={styles.otpBoxesRow}>
                {code.map((digit, idx) => (
                  <View key={idx} style={styles.otpBox}>
                    <Text style={styles.otpDigit}>{digit}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.resendText}>
                Didn't receive the code?{' '}
                <Text style={styles.resendTimer}>Resend in 00:28</Text>
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleVerifyCode}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Verify Code</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: Set New Password */}
          {step === '3_new_password' && (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>Set New Password</Text>
              <Text style={styles.subtitle}>
                Create a strong password to protect your account.
              </Text>

              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <FontAwesome
                    name={showPassword ? 'eye-slash' : 'eye'}
                    size={16}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Rules Checklist */}
              <View style={styles.checklist}>
                <View style={styles.checkRow}>
                  <FontAwesome
                    name={hasMinLength ? 'check-circle' : 'circle-o'}
                    size={14}
                    color={hasMinLength ? '#16A34A' : '#94A3B8'}
                  />
                  <Text style={[styles.checkText, hasMinLength && styles.checkTextActive]}>
                    Password must be at least 8 characters
                  </Text>
                </View>
                <View style={styles.checkRow}>
                  <FontAwesome
                    name={hasNumber ? 'check-circle' : 'circle-o'}
                    size={14}
                    color={hasNumber ? '#16A34A' : '#94A3B8'}
                  />
                  <Text style={[styles.checkText, hasNumber && styles.checkTextActive]}>
                    Include at least one number
                  </Text>
                </View>
              </View>

              {errorMessage && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleResetPassword}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Reset Password</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: Success */}
          {step === '4_success' && (
            <View style={styles.stepContainer}>
              <View style={styles.successIconCircle}>
                <FontAwesome name="check" size={32} color="#FFFFFF" />
              </View>

              <Text style={styles.title}>Password Reset!</Text>
              <Text style={styles.subtitle}>
                You can now log in with your new password.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleFinish}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Go to Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: spacing.xs,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  inputLabel: {
    alignSelf: 'flex-start',
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: spacing.md,
  },
  passwordInputContainer: {
    width: '100%',
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    marginBottom: spacing.md,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#0F172A',
  },
  eyeButton: {
    padding: 6,
  },
  checklist: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginBottom: spacing.md,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  checkTextActive: {
    color: '#16A34A',
    fontWeight: '700',
  },
  errorText: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: spacing.sm,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#0D7A5F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    shadowColor: '#0D7A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  textLinkButton: {
    marginTop: spacing.md,
    padding: 6,
  },
  textLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D7A5F',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  otpBox: {
    width: 44,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigit: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  resendText: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: spacing.lg,
  },
  resendTimer: {
    color: '#0D7A5F',
    fontWeight: '700',
  },
});
