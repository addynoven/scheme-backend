import {
  listVaultDocuments as apiListVaultDocuments,
  uploadVaultDocument as apiUploadVaultDocument,
  deleteVaultDocument as apiDeleteVaultDocument,
  extractQuickDocument as apiExtractQuickDocument,
  extractVaultDocumentFacts as apiExtractVaultDocumentFacts,
  confirmAndSyncProfileFacts as apiConfirmAndSyncProfileFacts,
  getSchemeDocumentReadiness as apiGetSchemeDocumentReadiness,
  fetchPopularSchemes as apiFetchPopularSchemes,
  listHouseholdMembers as apiListHouseholdMembers,
  type UserDocument,
  type SchemeDocumentReadiness,
  type ExtractedDocumentFactsResponse,
  type ConfirmFactsAndSyncProfileRequest,
  type Scheme,
  type HouseholdMember,
} from '@/core'

export const vaultRepository = {
  async listDocuments(householdMemberId?: number | null) {
    return apiListVaultDocuments(householdMemberId)
  },

  async uploadDocument(file: File, documentType: string, memberId?: number | null) {
    return apiUploadVaultDocument(file, documentType, undefined, memberId || undefined)
  },

  async deleteDocument(id: number) {
    return apiDeleteVaultDocument(id)
  },

  async extractFacts(file: File, documentType: string, memberId?: number | null) {
    return apiExtractQuickDocument(file, documentType)
  },

  async confirmFacts(documentId: number, payload: ConfirmFactsAndSyncProfileRequest) {
    return apiConfirmAndSyncProfileFacts(documentId, payload)
  },

  async getSchemeReadiness(schemeId: number) {
    return apiGetSchemeDocumentReadiness(schemeId)
  },

  async fetchPopularSchemes(limit = 25) {
    return apiFetchPopularSchemes(limit)
  },

  async listHouseholdMembers() {
    return apiListHouseholdMembers()
  },
}
