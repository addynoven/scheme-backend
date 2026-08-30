import {
  getSchemeBySlug as apiGetSchemeBySlug,
  getSchemeDocumentReadiness as apiGetSchemeDocumentReadiness,
  searchSchemesPaginated as apiSearchSchemesPaginated,
  type Scheme,
  type SchemeDocumentReadiness,
  type PaginatedResult,
} from '@/core'

export const schemesRepository = {
  async getBySlug(slug: string): Promise<Scheme> {
    return apiGetSchemeBySlug(slug)
  },

  async getDocumentReadiness(schemeId: number): Promise<SchemeDocumentReadiness> {
    return apiGetSchemeDocumentReadiness(schemeId)
  },

  async search(params: { q?: string; category?: string; state?: string; skip?: number; limit?: number }): Promise<PaginatedResult<Scheme>> {
    return apiSearchSchemesPaginated(params.q, params.category, params.state, params.skip, params.limit)
  },
}
