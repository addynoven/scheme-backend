import { create } from 'zustand';
import {
  ExtractedFacts,
  UploadMethod,
  VaultDevScreen,
  VaultDocument,
} from '../models/vault.model';
import { inferCategory, type BackendVaultDocument } from '../repositories/vault.api';

// Default extraction form values shown while user edits. Not real data.
const BLANK_EXTRACTION: ExtractedFacts = {
  fullName: '',
  dob: '',
  gender: 'male',
  state: '',
  address: '',
  documentNumber: '',
};

interface VaultState {
  documents: VaultDocument[];
  selectedSchemeId: string;
  activeDevScreen: VaultDevScreen;
  uploadModalVisible: boolean;
  extractModalVisible: boolean;
  savedModalVisible: boolean;
  currentExtraction: ExtractedFacts;
  lastSavedDocTitle: string;
  targetCategory?: VaultDocument['category'];

  // Actions
  setDevScreen: (screen: VaultDevScreen) => void;
  selectScheme: (schemeId: string) => void;
  openUploadSheet: (title?: string, category?: VaultDocument['category']) => void;
  closeUploadSheet: () => void;
  startExtraction: (method: UploadMethod, targetCategory?: VaultDocument['category']) => void;
  updateExtraction: (fields: Partial<ExtractedFacts>) => void;
  confirmExtractionAndSave: () => void;
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
  extractModalVisible: false,
  savedModalVisible: false,
  currentExtraction: { ...BLANK_EXTRACTION },
  lastSavedDocTitle: '',

  setDevScreen: (screen: VaultDevScreen) => {
    // Screen transitions must NEVER mutate documents.
    const baseModal = {
      uploadModalVisible: false,
      extractModalVisible: false,
      savedModalVisible: false,
    };
    if (screen === '3_upload_document') {
      set({ activeDevScreen: screen, ...baseModal, uploadModalVisible: true });
    } else if (screen === '4_extract_verify') {
      set({ activeDevScreen: screen, ...baseModal, extractModalVisible: true });
    } else if (screen === '5_document_saved') {
      set({ activeDevScreen: screen, ...baseModal, savedModalVisible: true });
    } else {
      set({ activeDevScreen: screen, ...baseModal });
    }
  },

  selectScheme: (schemeId: string) => {
    set({ selectedSchemeId: schemeId });
  },

  openUploadSheet: (title?: string, category?: VaultDocument['category']) => {
    set({
      uploadModalVisible: true,
      lastSavedDocTitle: title || '',
      targetCategory: category,
    });
  },

  closeUploadSheet: () => {
    set({ uploadModalVisible: false });
  },

  startExtraction: (_method: UploadMethod, targetCategory?: VaultDocument['category']) => {
    set((state) => ({
      uploadModalVisible: false,
      extractModalVisible: true,
      targetCategory: targetCategory || state.targetCategory,
    }));
  },

  updateExtraction: (fields: Partial<ExtractedFacts>) => {
    set((state) => ({
      currentExtraction: { ...state.currentExtraction, ...fields },
    }));
  },

  confirmExtractionAndSave: () => {
    const extraction = get().currentExtraction;
    const title = get().lastSavedDocTitle || 'Document';
    // targetCategory is set when user taps "Upload" on a specific missing doc row.
    // Fall back to inferCategory from the title string they confirmed.
    const category: VaultDocument['category'] = get().targetCategory ?? inferCategory(title);

    const newDoc: VaultDocument = {
      id: `doc-${Date.now()}`,
      title,
      fileName: `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      fileSize: '1.2 MB',
      mimeType: 'application/pdf',
      category,
      uploadDate: 'Just now',
      isVerified: true,
      extractedData: {
        owner: extraction.fullName,
        documentNumber: extraction.documentNumber || '',
        state: extraction.state,
      },
    };

    set((state) => ({
      extractModalVisible: false,
      savedModalVisible: true,
      lastSavedDocTitle: title,
      targetCategory: undefined,
      documents: [newDoc, ...state.documents],
    }));
  },

  closeSavedModal: () => {
    set({ savedModalVisible: false, activeDevScreen: '6_updated_readiness' });
  },

  addDocument: (doc: VaultDocument) => {
    set((state) => ({ documents: [doc, ...state.documents] }));
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
      fileSize: `${(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`,
      mimeType: doc.mime_type,
      category: inferCategory(doc.document_type),
      uploadDate: 'Synced',
      isVerified: doc.is_verified,
    }));
    set({ documents: mapped });
  },

  resetToInitial: () => {
    set({
      documents: [],
      selectedSchemeId: '',
      activeDevScreen: '1_open_vault',
      uploadModalVisible: false,
      extractModalVisible: false,
      savedModalVisible: false,
      currentExtraction: { ...BLANK_EXTRACTION },
      lastSavedDocTitle: '',
      targetCategory: undefined,
    });
  },
}));
