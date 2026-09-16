import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { VaultDocument } from '../models/vault.model';
import { spacing } from '@/core/theme/spacing';

interface VaultDocumentCardProps {
  document: VaultDocument;
  onDelete?: (id: string) => void;
  onReplace?: (doc: VaultDocument) => void;
}

export const VaultDocumentCard: React.FC<VaultDocumentCardProps> = ({
  document,
  onDelete,
}) => {
  const [previewVisible, setPreviewVisible] = useState(false);

  const previewUri = document.downloadUrl || document.fileUri;
  const isImage =
    document.mimeType?.startsWith('image/') ||
    /\.(jpe?g|png|webp|gif)$/i.test(document.fileName || '') ||
    (previewUri ? /\.(jpe?g|png|webp|gif)/i.test(previewUri) : false);
  const isPdf =
    document.mimeType?.includes('pdf') ||
    /\.pdf$/i.test(document.fileName || '');

  const confirmDelete = () => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document.title}" permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPreviewVisible(false);
            if (onDelete) onDelete(document.id);
          },
        },
      ]
    );
  };

  const handleOpenExternal = async () => {
    if (!previewUri) {
      Alert.alert('Unavailable', 'Document link is not available.');
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(previewUri);
      if (canOpen) {
        await Linking.openURL(previewUri);
      } else {
        Alert.alert('Error', 'Cannot open document URL.');
      }
    } catch {
      Alert.alert('Error', 'Could not open document viewer.');
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => setPreviewVisible(true)}
        onLongPress={confirmDelete}
        delayLongPress={500}
        accessibilityRole="button"
        accessibilityLabel={`Document ${document.title}. Tap to view, hold to delete.`}
      >
        <View style={styles.leftCol}>
          <View
            style={[
              styles.iconBox,
              isImage
                ? styles.iconBoxImage
                : isPdf
                ? styles.iconBoxPdf
                : styles.iconBoxDefault,
            ]}
          >
            <FontAwesome
              name={isImage ? 'file-image-o' : isPdf ? 'file-pdf-o' : 'file-text-o'}
              size={20}
              color={isImage ? '#2563EB' : isPdf ? '#EF4444' : '#059669'}
            />
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.title} numberOfLines={1}>
              {document.title}
            </Text>
            <Text style={styles.subtext} numberOfLines={1}>
              {document.fileName} • {document.fileSize}
            </Text>
          </View>
        </View>

        <View style={styles.rightCol}>
          {document.isVerified && (
            <View style={styles.verifiedBadge}>
              <FontAwesome name="check" size={10} color="#15803D" style={{ marginRight: 3 }} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}

          <FontAwesome name="angle-right" size={18} color="#94A3B8" style={{ marginLeft: 4 }} />
        </View>
      </TouchableOpacity>

      {/* Document Preview Modal */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {document.title}
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {document.fileName} • {document.fileSize}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setPreviewVisible(false)}
                accessibilityLabel="Close preview"
              >
                <FontAwesome name="times" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Document Body */}
            <View style={styles.previewContainer}>
              {isImage && previewUri ? (
                <Image
                  source={{ uri: previewUri }}
                  style={styles.imagePreview}
                  contentFit="contain"
                  transition={200}
                />
              ) : isPdf ? (
                <View style={styles.pdfContainer}>
                  <View style={styles.pdfIconCircle}>
                    <FontAwesome name="file-pdf-o" size={48} color="#EF4444" />
                  </View>
                  <Text style={styles.pdfNoticeTitle}>PDF Document</Text>
                  <Text style={styles.pdfNoticeSub}>
                    {document.fileName}
                  </Text>
                  {previewUri && (
                    <TouchableOpacity
                      style={styles.openExternalBtn}
                      onPress={handleOpenExternal}
                      activeOpacity={0.8}
                    >
                      <FontAwesome name="external-link" size={14} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.openExternalBtnText}>Open Document</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.pdfContainer}>
                  <View style={[styles.pdfIconCircle, { backgroundColor: '#F1F5F9' }]}>
                    <FontAwesome name="file-text-o" size={48} color="#64748B" />
                  </View>
                  <Text style={styles.pdfNoticeTitle}>{document.title}</Text>
                  <Text style={styles.pdfNoticeSub}>{document.fileName}</Text>
                  {previewUri && (
                    <TouchableOpacity
                      style={styles.openExternalBtn}
                      onPress={handleOpenExternal}
                      activeOpacity={0.8}
                    >
                      <FontAwesome name="external-link" size={14} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.openExternalBtnText}>Open Document</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Footer Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={confirmDelete}
                activeOpacity={0.8}
              >
                <FontAwesome name="trash-o" size={15} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.deleteBtnText}>Delete Document</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => setPreviewVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.dismissBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.xs,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  iconBoxPdf: {
    backgroundColor: '#FEE2E2',
  },
  iconBoxImage: {
    backgroundColor: '#DBEAFE',
  },
  iconBoxDefault: {
    backgroundColor: '#DCFCE7',
  },
  infoCol: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  previewContainer: {
    height: 340,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  pdfContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  pdfIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  pdfNoticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  pdfNoticeSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  openExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  openExternalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    gap: spacing.sm,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    flex: 1,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  dismissBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  dismissBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
});
