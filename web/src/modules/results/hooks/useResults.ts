'use client'

import { useState, useEffect } from 'react'
import { resultsRepository } from '../repositories'
import { type EligibilityReport, type EligibilityCheckPayload } from '@/core'

export function useResults() {
  const [report, setReport] = useState<EligibilityReport | null>(null)
  const [profile, setProfile] = useState<EligibilityCheckPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const rep = resultsRepository.getSavedReport()
    const prof = resultsRepository.getSavedProfile()
    setReport(rep)
    setProfile(prof)
    setLoading(false)
  }, [])

  return { report, profile, loading }
}
