'use client'

import { Building2, MapPin, ExternalLink, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import { type Scheme, type SchemeExplanation } from '@/core'

interface SchemeHeaderProps {
  scheme: Scheme
  userExplanation?: SchemeExplanation
}

export function SchemeHeader({ scheme, userExplanation }: SchemeHeaderProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold text-xs">
            {scheme.category}
          </span>
          <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-zinc-400" />
            {scheme.state || 'All-India / Central'}
          </span>
          <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-mono">
            {scheme.slug}
          </span>
        </div>

        {userExplanation && (
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                userExplanation.is_eligible
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : userExplanation.status === 'nearly_eligible'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}
            >
              {userExplanation.is_eligible ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              {userExplanation.match_percentage}% MATCH • {userExplanation.status.toUpperCase().replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-2">
          {scheme.name}
        </h1>
        <p className="text-xs text-zinc-400 flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-zinc-500" />
          {scheme.ministry}
        </p>
      </div>

      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed pt-2 border-t border-zinc-800/80">
        {scheme.description}
      </p>

      {scheme.application_url && (
        <div className="pt-2 flex justify-end">
          <a
            href={scheme.application_url}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            Apply on Official Portal <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  )
}
