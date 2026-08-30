'use client'

import Link from 'next/link'
import { Sparkles, ShieldCheck, ArrowRight } from 'lucide-react'
import { type FamilyEligibilityReport } from '@/core'

interface HouseholdWelfareScanPanelProps {
  report: FamilyEligibilityReport | null
}

export function HouseholdWelfareScanPanel({ report }: HouseholdWelfareScanPanelProps) {
  if (!report) return null

  const memberReports = report.family_members_reports || (report.household_results as any[]) || []

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Household Welfare Scan Overview
          </h3>
          <p className="text-xs text-zinc-400">Total potential entitlement across all family members</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {memberReports.map((mr: any, idx: number) => (
          <div key={idx} className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs">{mr.full_name || mr.member_name}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                {mr.eligible_schemes_count || mr.eligible_count || 0} Eligible
              </span>
            </div>

            <p className="text-[11px] text-zinc-400">
              Relationship: <span className="text-zinc-300 font-medium">{mr.relationship}</span>
            </p>

            {mr.eligible_schemes && mr.eligible_schemes.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-zinc-800">
                {mr.eligible_schemes.slice(0, 3).map((s: any) => (
                  <Link
                    key={s.slug || s.scheme_slug}
                    href={`/schemes/${s.slug || s.scheme_slug}`}
                    className="text-[11px] text-zinc-300 hover:text-indigo-300 block truncate"
                  >
                    • {s.name || s.scheme_name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
