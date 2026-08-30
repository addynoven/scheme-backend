'use client'

import { useState, useEffect, useCallback } from 'react'
import { householdRepository } from '../repositories'
import { type HouseholdMember, type FamilyEligibilityReport } from '@/core'

export function useHousehold() {
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [report, setReport] = useState<FamilyEligibilityReport | null>(null)
  const [primaryUser, setPrimaryUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [usr, mems, rep] = await Promise.all([
        householdRepository.getMe().catch(() => null),
        householdRepository.listMembers(),
        householdRepository.getFamilyEligibility().catch(() => null),
      ])
      setPrimaryUser(usr)
      setMembers(mems || [])
      setReport(rep)
    } catch (err: any) {
      setError(err.message || 'Failed to load household graph')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { members, report, primaryUser, loading, error, reload: loadData, setMembers }
}
