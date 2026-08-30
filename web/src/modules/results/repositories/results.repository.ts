import {
  getSavedEligibilityReport,
  getSavedCitizenProfile,
  getSchemeDocumentReadiness as apiGetSchemeDocumentReadiness,
  type EligibilityReport,
  type EligibilityCheckPayload,
  type SchemeDocumentReadiness,
} from '@/core'

export const resultsRepository = {
  getSavedReport(): EligibilityReport | null {
    if (typeof window === 'undefined') return null
    return getSavedEligibilityReport()
  },

  getSavedProfile(): EligibilityCheckPayload | null {
    if (typeof window === 'undefined') return null
    return getSavedCitizenProfile()
  },

  async getDocumentReadiness(schemeId: number): Promise<SchemeDocumentReadiness> {
    return apiGetSchemeDocumentReadiness(schemeId)
  },
}
