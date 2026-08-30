import { checkRepository } from './repositories'
import { type EligibilityCheckPayload } from '@/core'

export async function evaluateEligibilityAction(payload: EligibilityCheckPayload) {
  return checkRepository.evaluate(payload)
}
