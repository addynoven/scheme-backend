import { profileRepository } from './repositories'
import { type EligibilityCheckPayload } from '@/core'

export async function updateProfileAction(profile: EligibilityCheckPayload) {
  return profileRepository.updateProfile(profile)
}
