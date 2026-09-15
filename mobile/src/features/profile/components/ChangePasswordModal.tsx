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

interface ChangePasswordModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

export function ChangePasswordModal({
  visible,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasUpperOrSpecial = /[A-Z]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword);

  const handleUpdate = () => {
    if (!currentPassword) {
      setErrorMessage('Please enter your current password');
      return;
    }
    if (!hasMinLength) {
      setErrorMessage('New password must be at least 8 characters');
      return;
    }
    if (!hasNumber) {
      setErrorMessage('New password must include at least one number');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setErrorMessage(null);
    setIsSuccess(true);
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleDone = () => {
    setIsSuccess(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleDone}
    >
      <View style={styles.scrim}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleDone}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <FontAwesome name="times" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {!isSuccess ? (
            <View style={styles.content}>
              <Text style={styles.title}>Change Password</Text>
              <Text style={styles.subtitle}>
                Choose a strong and secure password for your account.
              </Text>

              {/* Current Password */}
              <Text style={styles.label}>Current Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showCurrent}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity
                  onPress={() => setShowCurrent(!showCurrent)}
                  style={styles.eyeBtn}
                >
                  <FontAwesome
                    name={showCurrent ? 'eye-slash' : 'eye'}
                    size={16}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              {/* New Password */}
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity
                  onPress={() => setShowNew(!showNew)}
                  style={styles.eyeBtn}
                >
                  <FontAwesome
                    name={showNew ? 'eye-slash' : 'eye'}
                    size={16}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm New Password */}
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm(!showConfirm)}
                  style={styles.eyeBtn}
                >
                  <FontAwesome
                    name={showConfirm ? 'eye-slash' : 'eye'}
                    size={16}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              {/* Password Rules Checklist */}
              <View style={styles.rulesCard}>
                <Text style={styles.rulesHeader}>Password Rules</Text>
                <View style={styles.ruleRow}>
                  <FontAwesome
                    name={hasMinLength ? 'check-circle' : 'circle-o'}
                    size={13}
                    color={hasMinLength ? '#16A34A' : '#94A3B8'}
                  />
                  <Text style={[styles.ruleText, hasMinLength && styles.ruleTextPass]}>
                    Minimum 8 characters
                  </Text>
                </View>
                <View style={styles.ruleRow}>
                  <FontAwesome
                    name={hasNumber ? 'check-circle' : 'circle-o'}
                    size={13}
                    color={hasNumber ? '#16A34A' : '#94A3B8'}
                  />
                  <Text style={[styles.ruleText, hasNumber && styles.ruleTextPass]}>
                    Include at least one number
                  </Text>
                </View>
                <View style={styles.ruleRow}>
                  <FontAwesome
                    name={hasUpperOrSpecial ? 'check-circle' : 'circle-o'}
                    size={13}
                    color={hasUpperOrSpecial ? '#16A34A' : '#94A3B8'}
                  />
                  <Text style={[styles.ruleText, hasUpperOrSpecial && styles.ruleTextPass]}>
                    Recommended: one uppercase letter or special character
                  </Text>
                </View>
              </View>

              {errorMessage && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}

              <TouchableOpacity
                style={styles.updateBtn}
                onPress={handleUpdate}
                activeOpacity={0.85}
              >
                <Text style={styles.updateBtnText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Success State */
            <View style={styles.successContent}>
              <View style={styles.successCircle}>
                <FontAwesome name="check" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>Password Updated!</Text>
              <Text style={styles.successSubtitle}>
                Your password has been changed successfully.
              </Text>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={handleDone}
                activeOpacity={0.85}
              >
                <Text style={styles.doneBtnText}>Done</Text>
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
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  inputContainer: {
    width: '100%',
    height: 44,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#0F172A',
  },
  eyeBtn: {
    padding: 6,
  },
  rulesCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    gap: 6,
    marginVertical: spacing.xs,
  },
  rulesHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ruleText: {
    fontSize: 11.5,
    color: '#64748B',
    flex: 1,
  },
  ruleTextPass: {
    color: '#16A34A',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 4,
  },
  updateBtn: {
    backgroundColor: '#0D7A5F',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  updateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
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
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  doneBtn: {
    width: '100%',
    backgroundColor: '#0D7A5F',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
