import {
  listHouseholdMembers as apiListHouseholdMembers,
  addHouseholdMember as apiAddHouseholdMember,
  updateHouseholdMember as apiUpdateHouseholdMember,
  deleteHouseholdMember as apiDeleteHouseholdMember,
  getFamilyEligibility as apiGetFamilyEligibility,
  citizenGetMe as apiCitizenGetMe,
  type HouseholdMember,
  type HouseholdMemberCreatePayload,
  type FamilyEligibilityReport,
} from '@/core'

export const householdRepository = {
  async getMe() {
    return apiCitizenGetMe()
  },

  async listMembers() {
    return apiListHouseholdMembers()
  },

  async createMember(payload: any) {
    return apiAddHouseholdMember(payload)
  },

  async updateMember(id: number, payload: Partial<HouseholdMember>) {
    return apiUpdateHouseholdMember(id, payload)
  },

  async deleteMember(id: number) {
    return apiDeleteHouseholdMember(id)
  },

  async getFamilyEligibility() {
    return apiGetFamilyEligibility()
  },
}
