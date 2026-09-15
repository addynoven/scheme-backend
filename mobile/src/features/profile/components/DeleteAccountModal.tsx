import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { spacing } from '@/core/theme/spacing';

interface DeleteAccountModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onConfirmDelete: () => void;
}

type DeleteStep = '1_warning' | '2_type_delete' | '3_deleting' | '4_deleted';

export function DeleteAccountModal({
  visible,
  onClose,
  onConfirmDelete,
}: DeleteAccountModalProps) {
  const [step, setStep] = useState<DeleteStep>('1_warning');
  const [inputText, setInputText] = useState('');

  const isDeleteConfirmed = inputText.trim() === 'DELETE';

  const handleDeleteAction = () => {
    if (!isDeleteConfirmed) return;
    setStep('3_deleting');
    setTimeout(() => {
      setStep('4_deleted');
    }, 1200);
  };

  const handleFinish = () => {
    setStep('1_warning');
    setInputText('');
    onConfirmDelete();
    onClose();
  };

  const handleCancel = () => {
    setStep('1_warning');
    setInputText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleCancel}
    >
      <View style={styles.scrim}>
        <View style={styles.card}>
          {/* Header Close */}
          {step !== '3_deleting' && step !== '4_deleted' && (
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleCancel}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FontAwesome name="times" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 1: Warning */}
          {step === '1_warning' && (
            <View style={styles.content}>
              <View style={styles.trashCircle}>
                <FontAwesome name="trash-o" size={36} color="#DC2626" />
              </View>

              <Text style={styles.warningTitle}>Delete Your Account?</Text>
              <Text style={styles.warningSubtitle}>
                This will permanently delete your account and all your data, including:
              </Text>

              <View style={styles.bulletsCard}>
                {[
                  'Your profile information',
                  'Saved schemes',
                  'Uploaded documents',
                  'Eligibility history',
                  'App settings and preferences',
                ].map((item) => (
                  <View key={item} style={styles.bulletRow}>
                    <View style={styles.redDot} />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.continueBtn}
                onPress={() => setStep('2_type_delete')}
                activeOpacity={0.85}
              >
                <Text style={styles.continueBtnText}>Continue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Keep My Account</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Type DELETE */}
          {step === '2_type_delete' && (
            <View style={styles.content}>
              <View style={styles.trashCircleSmall}>
                <FontAwesome name="trash-o" size={26} color="#DC2626" />
              </View>

              <Text style={styles.warningTitle}>Confirm Deletion</Text>
              <Text style={styles.instructionText}>
                To confirm, please type <Text style={styles.boldDelete}>DELETE</Text> below.
              </Text>

              <TextInput
                style={[
                  styles.confirmInput,
                  isDeleteConfirmed && styles.confirmInputValid,
                ]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="DELETE"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
              />

              <TouchableOpacity
                style={[
                  styles.deleteSubmitBtn,
                  !isDeleteConfirmed && styles.deleteSubmitBtnDisabled,
                ]}
                disabled={!isDeleteConfirmed}
                onPress={handleDeleteAction}
                activeOpacity={0.85}
              >
                <Text style={styles.deleteSubmitBtnText}>Delete My Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: Deleting in Progress */}
          {step === '3_deleting' && (
            <View style={styles.contentPadded}>
              <View style={styles.trashCircle}>
                <FontAwesome name="trash-o" size={36} color="#DC2626" />
              </View>

              <Text style={styles.warningTitle}>Deleting Account...</Text>
              <Text style={styles.warningSubtitle}>
                This may take a few moments.{'\n'}Please don't close the app.
              </Text>

              <ActivityIndicator
                size="large"
                color="#DC2626"
                style={{ marginTop: spacing.lg }}
              />
            </View>
          )}

          {/* STEP 4: Account Deleted */}
          {step === '4_deleted' && (
            <View style={styles.contentPadded}>
              <View style={styles.successCircle}>
                <FontAwesome name="check" size={34} color="#FFFFFF" />
              </View>

              <Text style={styles.successTitle}>Account Deleted</Text>
              <Text style={styles.successSubtitle}>
                Your account and all associated data have been permanently deleted. We're sorry to see you go.
              </Text>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={handleFinish}
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
    shadowOpacity: 0.2,
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
    alignItems: 'center',
    width: '100%',
  },
  contentPadded: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: spacing.lg,
  },
  trashCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  trashCircleSmall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 6,
  },
  warningSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  instructionText: {
    fontSize: 13.5,
    color: '#334155',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  boldDelete: {
    fontWeight: '800',
    color: '#DC2626',
  },
  bulletsCard: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: spacing.md,
    gap: 8,
    marginBottom: spacing.lg,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
  },
  bulletText: {
    fontSize: 12.5,
    color: '#7F1D1D',
    fontWeight: '600',
  },
  confirmInput: {
    width: '100%',
    height: 48,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    backgroundColor: '#F8FAFC',
    marginBottom: spacing.lg,
  },
  confirmInputValid: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
  },
  continueBtn: {
    width: '100%',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 6,
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteSubmitBtn: {
    width: '100%',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 6,
  },
  deleteSubmitBtnDisabled: {
    backgroundColor: '#CBD5E1',
    opacity: 0.6,
  },
  deleteSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  successCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
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
