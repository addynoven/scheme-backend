import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { UploadMethod } from '../models/vault.model';
import { palette } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';

interface UploadDocSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectMethod: (method: UploadMethod) => void;
}

export const UploadDocSheet: React.FC<UploadDocSheetProps> = ({
  visible,
  onClose,
  onSelectMethod,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Upload Document</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <FontAwesome name="times" size={14} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Icon Prompt */}
              <View style={styles.promptSection}>
                <View style={styles.iconCircle}>
                  <FontAwesome name="camera" size={26} color="#059669" />
                </View>
                <Text style={styles.promptTitle}>Add a Document</Text>
                <Text style={styles.promptSubtitle}>
                  Take a clear photo or upload a file.{'\n'}Supports JPG, PNG, PDF (max 10MB)
                </Text>
              </View>

              {/* Options */}
              <View style={styles.optionsList}>
                {/* 1. Take Photo */}
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={() => onSelectMethod('camera')}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionLeft}>
                    <View style={styles.optionIconBox}>
                      <FontAwesome name="camera" size={18} color="#059669" />
                    </View>
                    <View>
                      <Text style={styles.optionTitle}>Take Photo</Text>
                      <Text style={styles.optionSub}>Open camera and scan</Text>
                    </View>
                  </View>
                  <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
                </TouchableOpacity>

                {/* 2. Choose from Gallery */}
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={() => onSelectMethod('gallery')}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionLeft}>
                    <View style={styles.optionIconBox}>
                      <FontAwesome name="image" size={18} color="#059669" />
                    </View>
                    <View>
                      <Text style={styles.optionTitle}>Choose from Gallery</Text>
                      <Text style={styles.optionSub}>Select from your photos</Text>
                    </View>
                  </View>
                  <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
                </TouchableOpacity>

                {/* 3. Upload File */}
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={() => onSelectMethod('file')}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionLeft}>
                    <View style={styles.optionIconBox}>
                      <FontAwesome name="file-text-o" size={18} color="#059669" />
                    </View>
                    <View>
                      <Text style={styles.optionTitle}>Upload File</Text>
                      <Text style={styles.optionSub}>Choose PDF or image</Text>
                    </View>
                  </View>
                  <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Supported Documents Footer */}
              <View style={styles.footerNote}>
                <View style={styles.footerIconCircle}>
                  <FontAwesome name="shield" size={13} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.footerNoteTitle}>Supported Documents</Text>
                  <Text style={styles.footerNoteText}>
                    Aadhaar, PAN, Income Certificate, Land Records, Bank Passbook, etc.
                  </Text>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: spacing.sm,
  },
  promptTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  promptSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  footerIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  footerNoteTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  footerNoteText: {
    fontSize: 11,
    color: '#065F46',
    marginTop: 2,
    lineHeight: 15,
  },
});
