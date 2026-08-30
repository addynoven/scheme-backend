'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkRepository } from '../repositories'
import { saveCitizenProfile, saveEligibilityReport, type EligibilityCheckPayload } from '@/core'

export function useCheckEligibility() {
  const router = useRouter()
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function evaluateEligibility(payload: EligibilityCheckPayload) {
    setEvaluating(true)
    setError(null)
    try {
      const report = await checkRepository.evaluate(payload)
      saveCitizenProfile(payload)
      saveEligibilityReport(report)
      router.push('/results')
      return report
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate eligibility')
      throw err
    } finally {
      setEvaluating(false)
    }
  }

  return { evaluateEligibility, evaluating, error, setError }
}
