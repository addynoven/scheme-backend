'use client'

import { useState, useEffect } from 'react'
import { schemesRepository } from '../repositories'
import { getSavedEligibilityReport, getCitizenToken, type Scheme, type SchemeDocumentReadiness, type SchemeExplanation } from '@/core'

export function useSchemeDetail(slug: string) {
  const [scheme, setScheme] = useState<Scheme | null>(null)
  const [docReadiness, setDocReadiness] = useState<SchemeDocumentReadiness | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)

    schemesRepository
      .getBySlug(slug)
      .then((data) => {
        setScheme(data)
        const token = getCitizenToken()
        if (token) {
          schemesRepository
            .getDocumentReadiness(data.id)
            .then(setDocReadiness)
            .catch(() => {})
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Scheme not found')
      })
      .finally(() => setLoading(false))
  }, [slug])

  // Look for saved eligibility report verdict for this scheme
  const savedReport = typeof window !== 'undefined' ? getSavedEligibilityReport() : null
  let userExplanation: SchemeExplanation | undefined
  if (savedReport && slug) {
    userExplanation =
      savedReport.eligible_schemes?.find((s: SchemeExplanation) => s.scheme_slug === slug) ||
      savedReport.nearly_eligible_schemes?.find((s: SchemeExplanation) => s.scheme_slug === slug) ||
      savedReport.ineligible_schemes?.find((s: SchemeExplanation) => s.scheme_slug === slug)
  }

  return { scheme, docReadiness, userExplanation, loading, error }
}
