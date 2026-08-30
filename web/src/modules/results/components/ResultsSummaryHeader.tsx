'use client'

import Link from 'next/link'
import { Sparkles, IndianRupee, ArrowLeft, RefreshCw } from 'lucide-react'
import { type EligibilityReport, type EligibilityCheckPayload } from '@/core'

interface ResultsSummaryHeaderProps {
  report: EligibilityReport
  profile: EligibilityCheckPayload | null
}

export function ResultsSummaryHeader({ report, profile }: ResultsSummaryHeaderProps) {
  const eligibleCount = report.eligible_count || report.eligible_schemes?.length || 0
  const nearlyCount = report.nearly_eligible_count || report.nearly_eligible_schemes?.length || 0
  const totalEvaluated = report.total_evaluated || (eligibleCount + nearlyCount + (report.ineligible_schemes?.length || 0))

  return (
    <div className="bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/20 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/check" className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              Eligibility Evaluation Results
            </h1>
            <p className="text-xs text-zinc-400">
              Evaluated for {profile?.state || 'Citizen'} • {profile?.age || 28} Yrs • {profile?.gender || 'Female'}
            </p>
          </div>
        </div>

        <Link
          href="/check"
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Re-evaluate
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-2xl">
          <span className="text-[10px] text-emerald-400 uppercase font-semibold">Directly Qualified</span>
          <p className="text-2xl font-bold text-white mt-0.5">{eligibleCount} Schemes</p>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-2xl">
          <span className="text-[10px] text-amber-400 uppercase font-semibold">Nearly Eligible</span>
          <p className="text-2xl font-bold text-white mt-0.5">{nearlyCount} Schemes</p>
        </div>

        <div className="bg-blue-950/30 border border-blue-500/30 p-4 rounded-2xl">
          <span className="text-[10px] text-blue-300 uppercase font-semibold">Total Schemes Evaluated</span>
          <p className="text-2xl font-bold text-blue-400 mt-0.5">
            {totalEvaluated} Schemes
          </p>
        </div>
      </div>
    </div>
  )
}
