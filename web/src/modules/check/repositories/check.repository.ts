import {
  checkEligibility as apiCheckEligibility,
  extractQuickDocument as apiExtractQuickDocument,
  type EligibilityCheckPayload,
  type EligibilityReport,
  type ExtractedDocumentFactsResponse,
} from '@/core'

export const checkRepository = {
  async evaluate(payload: EligibilityCheckPayload): Promise<EligibilityReport> {
    return apiCheckEligibility(payload)
  },

  async extractDocument(file: File, docType?: string): Promise<ExtractedDocumentFactsResponse> {
    return apiExtractQuickDocument(file, docType)
  },
}
