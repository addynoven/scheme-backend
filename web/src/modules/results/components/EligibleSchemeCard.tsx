'use client'

import Link from 'next/link'
import { CheckCircle2, ArrowRight, IndianRupee, ShieldCheck, Building2 } from 'lucide-react'
import { type SchemeExplanation } from '@/core'

interface EligibleSchemeCardProps {
  scheme: SchemeExplanation
}

export function EligibleSchemeCard({ scheme }: EligibleSchemeCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all group">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {scheme.match_percentage}% MATCH
          </span>

          <span className="text-[11px] text-zinc-500 font-mono">
            {scheme.criteria_passed}/{scheme.criteria_total} Rules
          </span>
        </div>

        <h3 className="text-base font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">
          {scheme.scheme_name}
        </h3>

        {scheme.summary_reason && (
          <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-2">
            {scheme.summary_reason}
          </p>
        )}

        {scheme.passed_criteria && scheme.passed_criteria.length > 0 && (
          <div className="space-y-1 mb-4">
            {scheme.passed_criteria.slice(0, 3).map((c, i) => (
              <div key={i} className="text-[11px] text-zinc-400 flex items-center gap-1.5 truncate">
                <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                <span className="truncate">{c.reason || `${c.field} qualified`}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
        <Link
          href={`/schemes/${scheme.scheme_slug}`}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
        >
          View Details & Apply <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
