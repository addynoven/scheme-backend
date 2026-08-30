'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCitizenToken } from './session'
import { citizenGetMe } from '../api/endpoints'
import { UserCheck, ArrowRight, Lock } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireProfile?: boolean
}

export function AuthGuard({ children, requireProfile = false }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [citizenUid, setCitizenUid] = useState<string | null>(null)

  useEffect(() => {
    const token = getCitizenToken()
    if (!token) {
      setIsAuthenticated(false)
      return
    }

    citizenGetMe()
      .then((user) => {
        setIsAuthenticated(true)
        setCitizenUid(user.citizen_uid || null)
        setHasProfile(!!user.profile)
      })
      .catch(() => {
        setIsAuthenticated(false)
      })
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-10 w-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-400 font-medium">Verifying Citizen Identity...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-zinc-800 shadow-2xl text-center">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6 shadow-lg shadow-blue-500/10">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Citizen Authentication Required</h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-8">
          To protect your privacy and provide tailored welfare scheme matching, please log in with your registered Citizen ID or create your household profile.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Log In to Citizen Portal</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/register"
            className="w-full py-3 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-sm transition-all flex items-center justify-center"
          >
            Create New Household Profile
          </Link>
        </div>
      </div>
    )
  }

  if (requireProfile && hasProfile === false) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-amber-500/30 shadow-2xl text-center">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-lg shadow-amber-500/10">
          <UserCheck className="h-8 w-8" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-mono text-blue-400 mb-3">
          <span>{citizenUid || 'CIT-PENDING'}</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Complete Your Citizen Profile</h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-8">
          Your account is active, but you need to configure your demographic profile (state, district, occupation, income) so our engine can match all 4,148 welfare schemes for you.
        </p>

        <Link
          href="/profile"
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Complete Profile Now</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
