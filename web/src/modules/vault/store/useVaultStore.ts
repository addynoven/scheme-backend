import { create } from 'zustand'
import { type UserDocument, type SchemeDocumentReadiness, type ExtractedDocumentFactsResponse } from '@/core'

interface VaultState {
  selectedMemberFilter: number | 'all'
  selectedSchemeId: number | null
  extractedData: ExtractedDocumentFactsResponse | null
  isExtractModalOpen: boolean
  setSelectedMemberFilter: (memberId: number | 'all') => void
  setSelectedSchemeId: (schemeId: number | null) => void
  setExtractedData: (data: ExtractedDocumentFactsResponse | null) => void
  setIsExtractModalOpen: (open: boolean) => void
}

export const useVaultStore = create<VaultState>((set) => ({
  selectedMemberFilter: 'all',
  selectedSchemeId: null,
  extractedData: null,
  isExtractModalOpen: false,
  setSelectedMemberFilter: (selectedMemberFilter) => set({ selectedMemberFilter }),
  setSelectedSchemeId: (selectedSchemeId) => set({ selectedSchemeId }),
  setExtractedData: (extractedData) => set({ extractedData, isExtractModalOpen: !!extractedData }),
  setIsExtractModalOpen: (isExtractModalOpen) => set({ isExtractModalOpen }),
}))
