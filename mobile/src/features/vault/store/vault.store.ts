import { create } from 'zustand';
import {
  formatFileSize,
  VaultDevScreen,
  VaultDocument,
  VaultDocumentCategory,
} from '../models/vault.model';
import { inferCategory, type BackendVaultDocument } from '../repositories/vault.api';

interface VaultState {
  documents: VaultDocument[];
  selectedSchemeId: string;
  activeDevScreen: VaultDevScreen;
  uploadModalVisible: boolean;
  savedModalVisible: boolean;
  lastSavedDocTitle: string;
  targetDocTitle?: string;
  targetCategory?: VaultDocumentCategory;

  // Actions
  setDevScreen: (screen: VaultDevScreen) => void;
  selectScheme: (schemeId: string) => void;
  openUploadSheet: (title?: string, category?: VaultDocumentCategory) => void;
  closeUploadSheet: () => void;
  saveDocumentDirect: (params: {
    title: string;
    category?: VaultDocumentCategory;
    fileName?: string;
    fileSize?: string;
    mimeType?: string;
    fileUri?: string;
    downloadUrl?: string;
  }) => void;
  closeSavedModal: () => void;
  addDocument: (doc: VaultDocument) => void;
  deleteDocument: (id: string) => void;
  syncServerDocuments: (serverDocs: BackendVaultDocument[]) => void;
  resetToInitial: () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  documents: [],
  selectedSchemeId: '',
  activeDevScreen: '1_open_vault',
  uploadModalVisible: false,
  savedModalVisible: false,
  lastSavedDocTitle: '',
  targetDocTitle: undefined,
  targetCategory: undefined,

  setDevScreen: (screen: VaultDevScreen) => {
    const baseModal = {
      uploadModalVisible: false,
      savedModalVisible: false,
    };
    if (screen === '3_upload_document') {
      set({ activeDevScreen: screen, ...baseModal, uploadModalVisible: true });
    } else if (screen === '5_document_saved') {
      set({ activeDevScreen: screen, ...baseModal, savedModalVisible: true });
    } else {
      set({ activeDevScreen: screen, ...baseModal });
    }
  },

  selectScheme: (schemeId: string) => {
    set({ selectedSchemeId: schemeId });
  },

  openUploadSheet: (title?: string, category?: VaultDocumentCategory) => {
    set({
      uploadModalVisible: true,
      targetDocTitle: title || '',
      lastSavedDocTitle: title || '',
      targetCategory: category || (title ? inferCategory(title) : undefined),
    });
  },

  closeUploadSheet: () => {
    set({ uploadModalVisible: false });
  },

  saveDocumentDirect: ({
    title,
    category,
    fileName,
    fileSize,
    mimeType,
    fileUri,
    downloadUrl,
  }) => {
    const finalTitle = title.trim() || 'Document';
    const finalCategory = category || inferCategory(finalTitle);
    const finalFileName =
      fileName || `${finalTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`;

    const newDoc: VaultDocument = {
      id: `doc-${Date.now()}`,
      title: finalTitle,
      fileName: finalFileName,
      fileSize: fileSize || '0 KB',
      mimeType: mimeType || 'application/pdf',
      category: finalCategory,
      uploadDate: 'Just now',
      isVerified: true,
      fileUri,
      downloadUrl,
    };

    set((state) => {
      const existingIdx = state.documents.findIndex(
        (d) => d.title.trim().toLowerCase() === finalTitle.toLowerCase()
      );
      let updatedDocs: VaultDocument[];
      if (existingIdx >= 0) {
        updatedDocs = [...state.documents];
        updatedDocs[existingIdx] = {
          ...updatedDocs[existingIdx],
          ...newDoc,
          id: updatedDocs[existingIdx].id,
        };
      } else {
        updatedDocs = [newDoc, ...state.documents];
      }
      return {
        uploadModalVisible: false,
        savedModalVisible: true,
        lastSavedDocTitle: finalTitle,
        targetDocTitle: undefined,
        targetCategory: undefined,
        documents: updatedDocs,
      };
    });
  },

  closeSavedModal: () => {
    set({ savedModalVisible: false, activeDevScreen: '6_updated_readiness' });
  },

  addDocument: (doc: VaultDocument) => {
    set((state) => {
      const existingIdx = state.documents.findIndex(
        (d) => d.title.trim().toLowerCase() === doc.title.trim().toLowerCase()
      );
      if (existingIdx >= 0) {
        const updated = [...state.documents];
        updated[existingIdx] = {
          ...updated[existingIdx],
          ...doc,
          id: updated[existingIdx].id,
        };
        return { documents: updated };
      }
      return { documents: [doc, ...state.documents] };
    });
  },

  deleteDocument: (id: string) => {
    set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }));
  },

  syncServerDocuments: (serverDocs: BackendVaultDocument[]) => {
    if (!serverDocs) return;
    const mapped: VaultDocument[] = serverDocs.map((doc) => ({
      id: String(doc.id),
      title: doc.document_type,
      fileName: doc.file_name,
      fileSize: formatFileSize(doc.file_size_bytes),
      mimeType: doc.mime_type,
      category: inferCategory(doc.document_type),
      uploadDate: 'Synced',
      isVerified: doc.is_verified,
      downloadUrl: doc.download_url || undefined,
    }));
    set({ documents: mapped });
  },

  resetToInitial: () => {
    set({
      documents: [],
      selectedSchemeId: '',
      activeDevScreen: '1_open_vault',
      uploadModalVisible: false,
      savedModalVisible: false,
      lastSavedDocTitle: '',
      targetDocTitle: undefined,
      targetCategory: undefined,
    });
  },
}));
