import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { palette } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';

interface DocumentSavedModalProps {
  visible: boolean;
  documentTitle: string;
  onClose: () => void;
  onViewDocument?: () => void;
}

export const DocumentSavedModal: React.FC<DocumentSavedModalProps> = ({
  visible,
  documentTitle,
  onClose,
  onViewDocument,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Confetti decorative dots */}
          <View style={styles.confettiContainer} pointerEvents="none">
            <View style={[styles.confettiDot, { backgroundColor: '#FBBF24', top: 20, left: 30 }]} />
            <View style={[styles.confettiDot, { backgroundColor: '#F43F5E', top: 35, left: 70 }]} />
            <View style={[styles.confettiDot, { backgroundColor: '#38BDF8', top: 60, left: 25 }]} />
            <View style={[styles.confettiDot, { backgroundColor: '#A855F7', top: 20, right: 40 }]} />
            <View style={[styles.confettiDot, { backgroundColor: '#FB7185', top: 40, right: 20 }]} />
            <View style={[styles.confettiDot, { backgroundColor: '#34D399', top: 65, right: 60 }]} />
          </View>

          {/* Success Checkmark Circle */}
          <View style={styles.outerGlowRing}>
            <View style={styles.innerCheckCircle}>
              <FontAwesome name="check" size={32} color="#FFFFFF" />
            </View>
          </View>

          {/* Heading */}
          <Text style={styles.title}>Document Saved!</Text>
          <Text style={styles.subtitle}>
            <Text style={{ fontWeight: '700', color: '#0F172A' }}>{documentTitle}</Text> has been
            saved to your Vault.
          </Text>

          {/* Value Prop Benefits Card */}
          <View style={styles.benefitsCard}>
            <View style={styles.benefitRow}>
              <View style={styles.benefitIconCircle}>
                <FontAwesome name="check" size={11} color="#047857" />
              </View>
              <Text style={styles.benefitText}>Information extracted and saved to your profile</Text>
            </View>

            <View style={styles.benefitRow}>
              <View style={styles.benefitIconCircle}>
                <FontAwesome name="refresh" size={11} color="#047857" />
              </View>
              <Text style={styles.benefitText}>Can be reused across all schemes</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.btnRow}>
            {onViewDocument && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onViewDocument}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryBtnText}>View Document</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  confettiDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  outerGlowRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  innerCheckCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  benefitsCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefitIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 16,
  },
  btnRow: {
    width: '100%',
    gap: spacing.xs,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
});
