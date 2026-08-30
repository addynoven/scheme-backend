import {
  adminLogin as apiAdminLogin,
  adminGetMe as apiAdminGetMe,
  adminListSchemes as apiAdminListSchemes,
  adminCreateScheme as apiAdminCreateScheme,
  adminUpdateScheme as apiAdminUpdateScheme,
  adminDeleteScheme as apiAdminDeleteScheme,
  adminListIngestionSources as apiAdminListIngestionSources,
  adminRunIngestionSync as apiAdminRunIngestionSync,
  adminListTriageItems as apiAdminListTriageItems,
  adminApproveTriageItem as apiAdminApproveTriageItem,
  adminRejectTriageItem as apiAdminRejectTriageItem,
  type Scheme,
  type IngestionSource,
  type IngestionTriageItem,
  type IngestionSyncRunResult,
  type PaginatedResult,
} from '@/core'

export const adminRepository = {
  async login(payload: { email: string; password: string }) {
    return apiAdminLogin(payload.email, payload.password)
  },

  async getMe() {
    return apiAdminGetMe()
  },

  async listSchemes(params?: { category?: string; status?: string; skip?: number; limit?: number }) {
    return apiAdminListSchemes(params)
  },

  async createScheme(payload: any) {
    return apiAdminCreateScheme(payload)
  },

  async updateScheme(id: number, payload: any) {
    return apiAdminUpdateScheme(id, payload)
  },

  async deleteScheme(id: number) {
    return apiAdminDeleteScheme(id)
  },

  async listIngestionSources() {
    return apiAdminListIngestionSources()
  },

  async runIngestionSync(sourceKey?: string) {
    return apiAdminRunIngestionSync(sourceKey)
  },

  async listTriageItems() {
    return apiAdminListTriageItems()
  },

  async approveTriageItem(itemId: number) {
    return apiAdminApproveTriageItem(itemId)
  },

  async rejectTriageItem(itemId: number) {
    return apiAdminRejectTriageItem(itemId)
  },
}
