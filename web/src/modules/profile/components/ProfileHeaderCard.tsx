'use client'

import { User, ShieldCheck, CheckCircle2 } from 'lucide-react'

interface ProfileHeaderCardProps {
  user: any | null
  completenessScore: number
}

export function ProfileHeaderCard({ user, completenessScore }: ProfileHeaderCardProps) {
  const profile = user?.profile || {}
  const citizenUid = user?.citizen_uid || profile?.citizen_uid || 'CIT-2026-PRIMARY'

  return (
    <div className="bg-gradient-to-br from-blue-950/40 via-zinc-900 to-zinc-900 border border-blue-500/20 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-3xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-xl">
          {profile.full_name ? profile.full_name.charAt(0) : user?.phone ? 'C' : 'P'}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-white">
              {profile.full_name || 'Citizen Profile'}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> VERIFIED CITIZEN
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono">
            Citizen UID: {citizenUid} • Phone: {user?.phone || '+91 98765 43210'}
          </p>
        </div>
      </div>

      <div className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-2xl w-full md:w-56 text-xs">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-zinc-400 font-semibold">Profile Completion</span>
          <span className="text-blue-400 font-bold">{completenessScore}%</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${completenessScore}%` }}
          />
        </div>
      </div>
    </div>
  )
}
