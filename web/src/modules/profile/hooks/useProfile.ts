'use client'

import { useState, useEffect, useCallback } from 'react'
import { profileRepository } from '../repositories'
import { type EligibilityCheckPayload } from '@/core'

export function useProfile() {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await profileRepository.getMe()
      setUser(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  async function updateProfile(formData: EligibilityCheckPayload) {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await profileRepository.updateProfile(formData)
      setUser(updated)
      setSuccess('Profile successfully updated')
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
      throw err
    } finally {
      setSaving(false)
    }
  }

  return { user, loading, saving, error, success, updateProfile, reload: loadProfile }
}
