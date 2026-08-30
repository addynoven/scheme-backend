import { householdRepository } from './repositories'
import { type HouseholdMemberCreatePayload } from '@/core'

export async function createHouseholdMemberAction(payload: HouseholdMemberCreatePayload) {
  return householdRepository.createMember(payload)
}
