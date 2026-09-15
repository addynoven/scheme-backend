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

interface LinkAccountModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onAccountLinked: (email: string) => void;
  readonly initialStep?: 'email_input' | 'verify';
  readonly defaultEmail?: string;
}

type LinkStep = 'email_input' | 'verify' | 'success';

export function LinkAccountModal({
  visible,
  onClose,
  onAccountLinked,
  initialStep = 'email_input',
  defaultEmail = 'rohit@example.com',
}: LinkAccountModalProps) {
  const [step, setStep] = useState<LinkStep>(initialStep);
  const [emailInput, setEmailInput] = useState(defaultEmail);
  const [otpDigits, setOtpDigits] = useState(['1', '2', '3', '4', '5', '6']);

  React.useEffect(() => {
    if (visible) {
      setStep(initialStep);
      setEmailInput(defaultEmail);
    }
  }, [visible, initialStep, defaultEmail]);

  const handleSendCode = () => {
    if (!emailInput.includes('@')) return;
    setStep('verify');
  };

  const handleVerify = () => {
    setStep('success');
  };

  const handleDone = () => {
    onAccountLinked(emailInput);
    setStep('email_input');
    onClose();
  };

  const handleCancel = () => {
    setStep('email_input');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleCancel}
    >
      <View style={styles.scrim}>
        <View style={styles.card}>
          {/* Header Close */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleCancel}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <FontAwesome name="times" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* STEP: Link Email */}
          {step === 'email_input' && (
            <View style={styles.content}>
              <Text style={styles.title}>Link Email Address</Text>
              <Text style={styles.subtitle}>
                Enter your email address to receive welfare notifications and account recovery alerts.
              </Text>

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="citizen@example.com"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSendCode}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Send Verification Code</Text>
              </TouchableOpacity>

              <Text style={styles.footerNote}>
                We will send a 6-digit verification code to this email.
              </Text>
            </View>
          )}

          {/* STEP: Verify Email OTP */}
          {step === 'verify' && (
            <View style={styles.content}>
              <Text style={styles.title}>Verify Email</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit verification code sent to{'\n'}
                <Text style={styles.boldText}>{emailInput}</Text>
              </Text>

              <View style={styles.otpRow}>
                {otpDigits.map((digit, idx) => (
                  <View key={idx} style={styles.otpBox}>
                    <Text style={styles.otpText}>{digit}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.resendText}>
                Didn't receive the code?{' '}
                <Text style={styles.resendLink}>Resend in 00:28</Text>
              </Text>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleVerify}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Verify & Link</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP: Success */}
          {step === 'success' && (
            <View style={styles.contentPadded}>
              <View style={styles.successCircle}>
                <FontAwesome name="check" size={32} color="#FFFFFF" />
              </View>

              <Text style={styles.title}>Email Verified!</Text>
              <Text style={styles.subtitle}>
                <Text style={styles.boldText}>{emailInput}</Text> has been successfully verified and linked to your citizen account.
              </Text>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleDone}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Done</Text>
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
  card: {
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
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
  },
  contentPadded: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 46,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: spacing.lg,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#0D7A5F',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerNote: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  otpBox: {
    width: 44,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  resendText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  resendLink: {
    color: '#0D7A5F',
    fontWeight: '700',
  },
  successCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
});
