'use client'

import Link from 'next/link'
import { AlertCircle, XCircle, ArrowRight } from 'lucide-react'
import { type SchemeExplanation } from '@/core'

interface IneligibleSchemeCardProps {
  scheme: SchemeExplanation
  isNearlyEligible?: boolean
}

export function IneligibleSchemeCard({ scheme, isNearlyEligible }: IneligibleSchemeCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              isNearlyEligible
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {isNearlyEligible ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            {scheme.match_percentage}% MATCH • {isNearlyEligible ? 'NEARLY ELIGIBLE' : 'NOT QUALIFIED'}
          </span>

          <span className="text-[11px] text-zinc-500 font-mono">
            {scheme.criteria_passed}/{scheme.criteria_total} Rules
          </span>
        </div>

        <h3 className="text-base font-bold text-white mb-1">{scheme.scheme_name}</h3>

        {scheme.summary_reason && (
          <p className="text-xs text-zinc-400 leading-relaxed mb-4">{scheme.summary_reason}</p>
        )}

        {scheme.failed_criteria && scheme.failed_criteria.length > 0 && (
          <div className="space-y-1 mb-4">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Missing Criteria:</span>
            {scheme.failed_criteria.slice(0, 2).map((c, i) => (
              <div key={i} className="text-[11px] text-red-400/90 flex items-center gap-1.5 truncate">
                <XCircle className="h-3 w-3 text-red-400 shrink-0" />
                <span className="truncate">{c.reason || `${c.field} not satisfied`}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
        <Link
          href={`/schemes/${scheme.scheme_slug}`}
          className="text-xs text-zinc-400 hover:text-white font-semibold flex items-center gap-1"
        >
          View Scheme Guidelines <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
