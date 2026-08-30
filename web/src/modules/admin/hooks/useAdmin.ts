'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminRepository } from '../repositories'
import { getAdminToken, removeAdminToken } from '@/core'
import { type Scheme, type IngestionSource, type IngestionTriageItem, type IngestionSyncRunResult } from '@/core'

export function useAdminAuth() {
  const [token, setToken] = useState<string | null>(null)
  const [adminUser, setAdminUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = getAdminToken()
    if (savedToken) {
      setToken(savedToken)
      adminRepository
        .getMe()
        .then((user) => setAdminUser(user))
        .catch(() => {
          removeAdminToken()
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    removeAdminToken()
    setToken(null)
    setAdminUser(null)
  }, [])

  return { token, adminUser, loading, setToken, setAdminUser, logout }
}
