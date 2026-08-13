import { useState, useEffect } from 'react'
import { Link } from '@/router'
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ExternalLink,
  RotateCcw,
} from 'lucide-react'
import type { EligibilityReport, SchemeExplanation } from '@/lib/api'
import { getSavedEligibilityReport, getSavedCitizenProfile } from '@/lib/session'

export default function ResultsPage() {
  const [report, setReport] = useState<EligibilityReport | null>(null)
  const [activeTab, setActiveTab] = useState<'eligible' | 'nearly_eligible' | 'all'>('eligible')

  useEffect(() => {
    const data = getSavedEligibilityReport()
    if (data) {
      setReport(data)
    }
  }, [])

  const profile = getSavedCitizenProfile()

  if (!report) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 px-4 flex flex-col items-center gap-4">
        <AlertCircle className="h-12 w-12 text-zinc-600 mb-2" />
        <h2 className="text-xl font-bold text-zinc-200">No Evaluation Found</h2>
        <p className="text-sm text-zinc-400">
          Please fill out the eligibility form first to see your personalized scheme matches.
        </p>
        <Link
          to="/check"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg transition-colors mt-2"
        >
          <Sparkles className="h-4 w-4" />
          <span>Start Eligibility Check</span>
        </Link>
      </div>
    )
  }

  const displayedSchemes: SchemeExplanation[] =
    activeTab === 'eligible'
      ? report.eligible_schemes
      : activeTab === 'nearly_eligible'
      ? report.nearly_eligible_schemes
      : [...report.eligible_schemes, ...report.nearly_eligible_schemes, ...report.ineligible_schemes]

  return (
    <div className="flex flex-col gap-8">
      {/* Top Banner & Profile Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl border border-zinc-800/90 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 w-fit">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Analysis Complete · 12 National Schemes Evaluated</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
            Your Welfare Scheme Matches
          </h1>
          {profile && (
            <p className="text-xs text-zinc-400 flex flex-wrap items-center gap-2 mt-1">
              <span>Profile Context:</span>
              <span className="text-zinc-200 font-medium capitalize">{profile.occupation}</span>·
              <span className="text-zinc-200 font-medium">₹{profile.annual_income?.toLocaleString('en-IN')}/yr</span>·
              <span className="text-zinc-200 font-medium">{profile.age} years old</span>·
              <span className="text-zinc-200 font-medium">{profile.state}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/check"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Edit Details</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-4">
        <button
          onClick={() => setActiveTab('eligible')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'eligible'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Fully Eligible ({report.eligible_count})</span>
        </button>

        <button
          onClick={() => setActiveTab('nearly_eligible')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'nearly_eligible'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
          }`}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Nearly Eligible ({report.nearly_eligible_count})</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
          }`}
        >
          <span>All Evaluated ({report.total_evaluated})</span>
        </button>
      </div>

      {/* Results Cards List */}
      {displayedSchemes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/30">
          <p className="text-zinc-400 text-sm">No schemes in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedSchemes.map((scheme) => {
            const is100 = scheme.is_eligible
            const isNearly = scheme.status === 'nearly_eligible'

            return (
              <div
                key={scheme.scheme_id}
                className="group rounded-3xl border border-zinc-800/90 bg-zinc-900/60 hover:border-zinc-700/80 transition-all p-6 sm:p-7 flex flex-col justify-between shadow-xl relative overflow-hidden"
              >
                <div className="flex flex-col gap-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-zinc-500 line-clamp-1">
                      {scheme.ministry}
                    </span>

                    {is100 ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-sm flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        100% Eligible
                      </span>
                    ) : isNearly ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-800/60 shadow-sm flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {scheme.match_percentage}% Nearly Eligible
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-950 text-zinc-500 border border-zinc-800">
                        Ineligible
                      </span>
                    )}
                  </div>

                  {/* Scheme Title */}
                  <h3 className="text-xl font-bold text-zinc-100 group-hover:text-blue-300 transition-colors">
                    {scheme.scheme_name}
                  </h3>

                  {/* Summary Reason */}
                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                    {scheme.summary_reason}
                  </p>

                  {/* Criteria Verdict Preview */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Why you match:
                    </span>
                    <div className="space-y-1">
                      {scheme.passed_criteria.map((c) => (
                        <div
                          key={c.field}
                          className="flex items-start gap-2 text-xs text-emerald-400/90"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-400" />
                          <span className="text-zinc-300">{c.reason}</span>
                        </div>
                      ))}

                      {scheme.failed_criteria.map((c) => (
                        <div
                          key={c.field}
                          className="flex items-start gap-2 text-xs text-rose-400/90"
                        >
                          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-rose-400" />
                          <span className="text-zinc-300">{c.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Benefits Preview */}
                  {scheme.benefits_summary && scheme.benefits_summary.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-blue-400">
                      <Sparkles className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate text-zinc-300">
                        {scheme.benefits_summary[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Action Links */}
                <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <Link
                    to={`/schemes/${scheme.scheme_slug}` as any}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                  >
                    <span>View Scheme Details & Documents</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  {scheme.application_url && (
                    <a
                      href={scheme.application_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                    >
                      Official Portal <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
