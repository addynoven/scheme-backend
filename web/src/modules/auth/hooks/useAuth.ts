'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCitizenToken, clearCitizenToken, setCitizenToken } from '@/core'
import { authRepository } from '../repositories'
import { useAuthStore } from '../store'

export function useAuth() {
  const router = useRouter()
  const { user, setUser, clear } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)

  const checkSession = async () => {
    const token = getCitizenToken()
    if (!token) {
      clear()
      setIsLoading(false)
      return
    }

    const res = await authRepository.getMe()
    if (res.ok) {
      setUser(res.data)
    } else {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('scheme_citizen_refresh') : null
      if (refreshToken) {
        try {
          const refRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          })
          if (refRes.ok) {
            const data = await refRes.json()
            if (data.access_token) {
              setCitizenToken(data.access_token)
              if (data.refresh_token) {
                localStorage.setItem('scheme_citizen_refresh', data.refresh_token)
              }
              const meRes = await authRepository.getMe()
              if (meRes.ok) {
                setUser(meRes.data)
                setIsLoading(false)
                return
              }
            }
          }
        } catch {}
      }
      clearCitizenToken()
      clear()
    }
    setIsLoading(false)
  }

  useEffect(() => {
    checkSession()
  }, [])

  const logout = () => {
    clearCitizenToken()
    clear()
    router.push('/login')
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    checkSession,
    logout,
  }
}
