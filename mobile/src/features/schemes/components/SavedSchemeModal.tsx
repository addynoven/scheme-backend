import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';

interface SavedSchemeModalProps {
  visible: boolean;
  schemeTitle: string;
  onClose: () => void;
}

export const SavedSchemeModal: React.FC<SavedSchemeModalProps> = ({
  visible,
  schemeTitle,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Green Checkmark Circle */}
          <View style={styles.checkCircle}>
            <FontAwesome name="check" size={28} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>Saved to My Schemes</Text>
          <Text style={styles.subtitle}>
            You can view this anytime in the Saved tab.
          </Text>

          <TouchableOpacity
            style={styles.okayBtn}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Close confirmation"
          >
            <Text style={styles.okayText}>Okay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.emerald600,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  okayBtn: {
    width: '100%',
    backgroundColor: palette.emerald700,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  okayText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
