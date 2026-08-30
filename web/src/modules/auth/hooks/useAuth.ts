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
