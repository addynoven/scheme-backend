import {
  citizenGetMe as apiCitizenGetMe,
  updateCitizenProfile as apiUpdateCitizenProfile,
  extractQuickDocument as apiExtractQuickDocument,
  type EligibilityCheckPayload,
  type ExtractedDocumentFactsResponse,
} from '@/core'

export const profileRepository = {
  async getMe() {
    return apiCitizenGetMe()
  },

  async updateProfile(profile: any) {
    return apiUpdateCitizenProfile(profile)
  },

  async extractDocument(file: File) {
    return apiExtractQuickDocument(file)
  },
}
