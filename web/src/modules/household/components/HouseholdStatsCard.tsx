'use client'

import { Users, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react'
import { type FamilyEligibilityReport } from '@/core'

interface HouseholdStatsCardProps {
  primaryUser: any | null
  memberCount: number
  report: FamilyEligibilityReport | null
}

export function HouseholdStatsCard({ primaryUser, memberCount, report }: HouseholdStatsCardProps) {
  const citizenUid = primaryUser?.citizen_uid || primaryUser?.profile?.citizen_uid || 'CIT-2026-PRIMARY'
  const totalSchemes = report?.total_collective_schemes || report?.total_eligible_schemes_found || 0

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-900 border border-indigo-500/20 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex items-start gap-4">
        <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400">
          <Users className="h-7 w-7" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-white">
              {primaryUser?.profile?.full_name || primaryUser?.name || 'Primary Citizen'} Household Graph
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
              FAMILY MESH ACTIVE
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono">
            Family Identifier: {report?.household_uid || 'HHD-2026-7890'} • Citizen UID: {citizenUid}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
        <div className="bg-zinc-950/60 border border-zinc-800/80 px-4 py-2.5 rounded-2xl text-center">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold">Total Members</span>
          <p className="text-lg font-bold text-white">{memberCount + 1}</p>
        </div>

        <div className="bg-emerald-950/40 border border-emerald-500/30 px-4 py-2.5 rounded-2xl text-center">
          <span className="text-[10px] text-emerald-400 uppercase font-semibold">Collective Welfare</span>
          <p className="text-lg font-bold text-emerald-300">{totalSchemes} Schemes</p>
        </div>
      </div>
    </div>
  )
}
