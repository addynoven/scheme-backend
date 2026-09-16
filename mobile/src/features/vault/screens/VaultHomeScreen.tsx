import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useVaultStore } from '../store/vault.store';
import {
  useDeleteDocumentMutation,
  useUploadDocumentMutation,
  useVaultDocumentsQuery,
} from '../hooks/useVaultQuery';
import { VaultDocumentCard } from '../components/VaultDocumentCard';
import { UploadDocSheet } from '../components/UploadDocSheet';
import { DocumentSavedModal } from '../components/DocumentSavedModal';
import { DocumentUploadPayload, formatFileSize } from '../models/vault.model';
import { palette } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { toastService } from '@/core/components/Toast';
import { useProfileStore, ProfileMenuModal, LogoutConfirmModal } from '@/features/profile';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

interface VaultHomeScreenProps {
  onGoToReadiness?: () => void;
}

export const VaultHomeScreen: React.FC<VaultHomeScreenProps> = ({ onGoToReadiness }) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);

  const {
    documents,
    uploadModalVisible,
    savedModalVisible,
    lastSavedDocTitle,
    targetDocTitle,
    targetCategory,
    openUploadSheet,
    closeUploadSheet,
    saveDocumentDirect,
    closeSavedModal,
    deleteDocument,
    syncServerDocuments,
  } = useVaultStore();

  const { data: serverDocs, isLoading, refetch } = useVaultDocumentsQuery();

  useEffect(() => {
    if (serverDocs) {
      syncServerDocuments(serverDocs);
    }
  }, [serverDocs, syncServerDocuments]);

  const uploadDocMutation = useUploadDocumentMutation();
  const deleteDocMutation = useDeleteDocumentMutation();
  const [isUploading, setIsUploading] = useState(false);

  const handleDeleteDocument = async (id: string) => {
    try {
      deleteDocument(id);
      const numId = parseInt(id, 10);
      if (!isNaN(numId) && numId > 0) {
        await deleteDocMutation.mutateAsync(numId);
      }
      toastService.show('Document deleted permanently', 'info');
    } catch (error) {
      console.warn('Failed to delete document:', error);
      refetch();
      toastService.show('Failed to delete document from server', 'error');
    }
  };

  const handleUpload = async (params: DocumentUploadPayload) => {
    try {
      setIsUploading(true);
      let downloadUrl: string | undefined = undefined;
      if (params.fileUri) {
        const uploadedDoc = await uploadDocMutation.mutateAsync({
          uri: params.fileUri,
          fileName:
            params.fileName ||
            `${params.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.jpg`,
          mimeType: params.mimeType || 'image/jpeg',
          documentType: params.title,
        });
        downloadUrl = uploadedDoc?.download_url || undefined;
      }
      saveDocumentDirect({
        title: params.title,
        category: params.category,
        fileName: params.fileName,
        fileSize: formatFileSize(params.fileSize),
        mimeType: params.mimeType,
        fileUri: params.fileUri,
        downloadUrl,
      });
      toastService.show(`${params.title} uploaded successfully!`, 'success');
    } catch (error) {
      console.warn('Document upload error:', error);
      Alert.alert(
        'Upload Failed',
        'Could not upload document to secure vault. Please check your network and try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSavedData = () => {
    toastService.show('Saved Profile Data: 12 facts verified from documents', 'info');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* App Header */}
      <View style={styles.appHeader}>
        <View style={styles.brandRow}>
          <View style={styles.brandLogo}>
            <FontAwesome name="leaf" size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.brandText}>Vault</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => useProfileStore.getState().openMenu()}
            accessibilityRole="button"
            accessibilityLabel="Open Citizen Profile"
          >
            {currentUser?.avatarUrl ? (
              <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <FontAwesome name="user" size={15} color="#B45309" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={palette.emerald900}
            colors={[palette.emerald900]}
          />
        }
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>
              Hello!{'\n'}Keep your documents safe and ready.
            </Text>
            <Text style={styles.heroSubtitle}>
              Upload once, reuse for all scheme applications.
            </Text>
          </View>

          <View style={styles.heroArtCircle}>
            <FontAwesome name="id-card" size={44} color="#059669" />
          </View>
        </View>

        {/* S3 Security Badge */}
        <View style={styles.securityBadge}>
          <View style={styles.securityLeft}>
            <View style={styles.lockIconBox}>
              <FontAwesome name="lock" size={14} color="#047857" />
            </View>
            <View>
              <Text style={styles.securityTitle}>S3 Encrypted</Text>
              <Text style={styles.securitySub}>Secure. Private. Always with you.</Text>
            </View>
          </View>
          <View style={styles.activeDot} />
        </View>

        {/* Primary CTA: Check Readiness */}
        <TouchableOpacity
          style={styles.primaryCta}
          onPress={() => {
            if (onGoToReadiness) {
              onGoToReadiness();
            } else {
              useVaultStore.getState().setDevScreen('2_scheme_readiness');
            }
          }}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryCtaText}>Check Readiness for a Scheme</Text>
          <FontAwesome name="arrow-right" size={14} color="#A7F3D0" />
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionHeader}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {/* Upload Document */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => openUploadSheet()}
              activeOpacity={0.75}
            >
              <View style={styles.actionIconBox}>
                <FontAwesome name="cloud-upload" size={17} color="#047857" />
              </View>
              <Text style={styles.actionTitle}>Upload{'\n'}Document</Text>
            </TouchableOpacity>

            {/* View Documents */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => toastService.show(`Viewing ${documents.length} stored documents`, 'info')}
              activeOpacity={0.75}
            >
              <View style={styles.actionIconBox}>
                <FontAwesome name="folder-open-o" size={17} color="#047857" />
              </View>
              <Text style={styles.actionTitle}>View{'\n'}Documents</Text>
            </TouchableOpacity>

            {/* Saved Data */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleSavedData}
              activeOpacity={0.75}
            >
              <View style={styles.actionIconBox}>
                <FontAwesome name="database" size={17} color="#047857" />
              </View>
              <Text style={styles.actionTitle}>Saved{'\n'}Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Why use Vault? */}
        <View style={styles.whyVaultCard}>
          <Text style={styles.whyTitle}>Why use Vault?</Text>
          <View style={styles.whyList}>
            <View style={styles.whyItem}>
              <View style={styles.whyCheckCircle}>
                <FontAwesome name="check" size={9} color="#047857" />
              </View>
              <Text style={styles.whyItemText}>Upload once, reuse everywhere</Text>
            </View>

            <View style={styles.whyItem}>
              <View style={styles.whyCheckCircle}>
                <FontAwesome name="check" size={9} color="#047857" />
              </View>
              <Text style={styles.whyItemText}>Auto-fill forms with extracted data</Text>
            </View>

            <View style={styles.whyItem}>
              <View style={styles.whyCheckCircle}>
                <FontAwesome name="check" size={9} color="#047857" />
              </View>
              <Text style={styles.whyItemText}>Secure and encrypted</Text>
            </View>
          </View>
        </View>

        {/* User's Documents */}
        <View style={styles.docsSection}>
          <View style={styles.docsSectionHeader}>
            <Text style={styles.sectionHeader}>Your Documents ({documents.length})</Text>
            <TouchableOpacity onPress={() => openUploadSheet()}>
              <Text style={styles.addDocLink}>+ Add Document</Text>
            </TouchableOpacity>
          </View>

          {documents.length === 0 ? (
            <View style={styles.emptyDocsCard}>
              <FontAwesome name="folder-open-o" size={36} color="#94A3B8" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyDocsTitle}>No documents in Vault yet</Text>
              <Text style={styles.emptyDocsSubtitle}>
                Upload your identity or income documents to verify eligibility and automatically autofill applications.
              </Text>
              <TouchableOpacity
                style={styles.emptyUploadBtn}
                onPress={() => openUploadSheet()}
                activeOpacity={0.85}
              >
                <FontAwesome name="cloud-upload" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyUploadBtnText}>Upload Document</Text>
              </TouchableOpacity>
            </View>
          ) : (
            documents.map((doc) => (
              <VaultDocumentCard
                key={doc.id}
                document={doc}
                onDelete={handleDeleteDocument}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Upload Bottom Sheet */}
      <UploadDocSheet
        visible={uploadModalVisible}
        onClose={closeUploadSheet}
        defaultTitle={targetDocTitle}
        defaultCategory={targetCategory}
        isUploading={isUploading}
        onUpload={handleUpload}
      />

      {/* Document Saved Confetti Modal */}
      <DocumentSavedModal
        visible={savedModalVisible}
        documentTitle={lastSavedDocTitle}
        onClose={closeSavedModal}
      />
      <ProfileMenuModal />
      <LogoutConfirmModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    padding: 6,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#059669',
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: spacing.sm,
  },
  heroTextCol: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#064E3B',
    lineHeight: 22,
  },
  heroSubtitle: {
    fontSize: 11,
    color: '#047857',
    marginTop: 4,
    lineHeight: 16,
  },
  heroArtCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: spacing.sm,
  },
  securityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lockIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  securitySub: {
    fontSize: 10,
    color: '#64748B',
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#064E3B',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickActionsSection: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 14,
  },
  whyVaultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
  },
  whyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: spacing.xs,
  },
  whyList: {
    gap: 8,
  },
  whyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whyCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whyItemText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  docsSection: {
    marginTop: spacing.xs,
  },
  docsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  addDocLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  emptyDocsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: spacing.xs,
  },
  emptyDocsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptyDocsSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  emptyUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.emerald800,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
  },
  emptyUploadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
