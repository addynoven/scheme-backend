import {
  getSchemeBySlug as apiGetSchemeBySlug,
  getSchemeDocumentReadiness as apiGetSchemeDocumentReadiness,
  searchSchemesPaginated as apiSearchSchemesPaginated,
  listSchemesPaginated as apiListSchemesPaginated,
  getSchemeCategories as apiGetSchemeCategories,
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

  async list(params?: {
    skip?: number
    limit?: number
    category?: string
    state?: string
    ministry?: string
    search?: string
    sort_by?: string
  }): Promise<PaginatedResult<Scheme>> {
    return apiListSchemesPaginated(params)
  },

  async getCategories(): Promise<Array<{ category: string; count: number }>> {
    return apiGetSchemeCategories()
  },

  async search(params: { q?: string; category?: string; state?: string; skip?: number; limit?: number }): Promise<PaginatedResult<Scheme>> {
    return apiSearchSchemesPaginated(params.q, params.category, params.state, params.skip, params.limit)
  },
}
