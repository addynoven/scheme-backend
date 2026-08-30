'use client'

import { useState, useEffect, useCallback } from 'react'
import { vaultRepository } from '../repositories'
import { type UserDocument, type SchemeDocumentReadiness, type Scheme, type HouseholdMember } from '@/core'

export function useVaultDocuments(memberFilter: number | 'all' = 'all') {
  const [documents, setDocuments] = useState<UserDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await vaultRepository.listDocuments(memberFilter === 'all' ? null : memberFilter)
      setDocuments(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [memberFilter])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  return { documents, loading, error, reload: loadDocuments, setDocuments }
}
