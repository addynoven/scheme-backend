import { useState, useEffect } from 'react'
import { useParams, Link } from '@/router'
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Building2,
  Calendar,
  Layers,
  MapPin,
  FolderLock,
  FolderCheck,
} from 'lucide-react'
import {
  getSchemeBySlug,
  getSchemeDocumentReadiness,
  type Scheme,
  type SchemeExplanation,
  type SchemeDocumentReadiness,
} from '@/lib/api'
import { getSavedEligibilityReport, getCitizenToken } from '@/lib/session'

export default function SchemeDetailPage() {
  const { slug } = useParams('/schemes/:slug' as any)
  const [scheme, setScheme] = useState<Scheme | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [docReadiness, setDocReadiness] = useState<SchemeDocumentReadiness | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    getSchemeBySlug(slug)
      .then((data) => {
        setScheme(data)
        setLoading(false)
        const token = getCitizenToken()
        if (token) {
          getSchemeDocumentReadiness(data.id)
            .then((readiness) => setDocReadiness(readiness))
            .catch(() => {})
        }
      })
      .catch((err) => {
        setError(err.message || 'Scheme not found')
        setLoading(false)
      })
  }, [slug])

  // Check if citizen has a saved eligibility verdict for this scheme
  const savedReport = getSavedEligibilityReport()
  let userExplanation: SchemeExplanation | undefined
  if (savedReport && slug) {
    userExplanation = [
      ...savedReport.eligible_schemes,
      ...savedReport.nearly_eligible_schemes,
      ...savedReport.ineligible_schemes,
    ].find((s) => s.scheme_slug === slug)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-pulse">
        <div className="h-6 w-32 bg-zinc-900 rounded-lg" />
        <div className="h-48 bg-zinc-900/60 border border-zinc-800 rounded-3xl" />
        <div className="h-64 bg-zinc-900/60 border border-zinc-800 rounded-3xl" />
      </div>
    )
  }

  if (error || !scheme) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 px-4 flex flex-col items-center gap-4">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-2" />
        <h2 className="text-xl font-bold text-zinc-100">Scheme Not Found</h2>
        <p className="text-sm text-zinc-400">
          The requested government scheme does not exist or has been removed.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg transition-colors mt-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to All Schemes</span>
        </Link>
      </div>
    )
  }

  const applyUrl = scheme.application_url || scheme.official_website

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to={savedReport ? '/results' : '/'}
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{savedReport ? 'Back to Results' : 'Back to All Schemes'}</span>
        </Link>

        {applyUrl && (
          <a
            href={applyUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
          >
            <span>Apply on Official Portal</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Header Banner */}
      <div className="p-6 sm:p-10 rounded-3xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/80 shadow-2xl backdrop-blur-xl flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center gap-2">
          {scheme.state && scheme.state !== 'ALL_INDIA' ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              State: {scheme.state}
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-200 border border-zinc-700">
              🇮🇳 National Scheme
            </span>
          )}

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60">
            {scheme.category}
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {scheme.ministry}
          </span>

          {scheme.launch_date && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Launched: {scheme.launch_date}
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight leading-tight">
          {scheme.name}
        </h1>

        <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-3xl">
          {scheme.description}
        </p>
      </div>

      {/* "Why You Match" Personalized Card (if user checked eligibility) */}
      {userExplanation && (
        <div className="p-6 sm:p-8 rounded-3xl border border-blue-900/60 bg-blue-950/20 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-bold text-zinc-100">
                Your Match Verdict
              </h2>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                userExplanation.is_eligible
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                  : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
              }`}
            >
              {userExplanation.is_eligible
                ? '100% Eligible'
                : `${userExplanation.match_percentage}% Match`}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80 leading-relaxed">
            {userExplanation.summary_reason}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {userExplanation.passed_criteria.map((c) => (
              <div
                key={c.field}
                className="p-3.5 rounded-xl bg-zinc-950/60 border border-emerald-900/40 flex items-start gap-2.5 text-xs"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-zinc-200">{c.criterion_title}</span>
                  <span className="text-zinc-400 text-[11px]">{c.reason}</span>
                </div>
              </div>
            ))}

            {userExplanation.failed_criteria.map((c) => (
              <div
                key={c.field}
                className="p-3.5 rounded-xl bg-zinc-950/60 border border-rose-900/40 flex items-start gap-2.5 text-xs"
              >
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-zinc-200">{c.criterion_title}</span>
                  <span className="text-zinc-400 text-[11px]">{c.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Benefits & Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Benefits */}
        <div className="p-6 sm:p-7 rounded-3xl border border-zinc-800/90 bg-zinc-900/60 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 text-zinc-100 font-bold text-base">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Scheme Benefits</span>
          </div>

          {!scheme.benefits || scheme.benefits.length === 0 ? (
            <p className="text-xs text-zinc-500">No benefits listed.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {scheme.benefits.map((benefit) => {
                const benefitTitle = benefit.title || benefit.benefit_type || 'Direct Benefit'
                return (
                  <div
                    key={benefit.id}
                    className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-400">
                        {benefitTitle}
                      </span>
                      {benefit.amount && (
                        <span className="font-bold text-zinc-100 bg-emerald-950/60 px-2 py-0.5 rounded text-[11px] border border-emerald-800/40">
                          ₹{benefit.amount.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    {benefit.description && (
                      <p className="text-zinc-300 text-xs mt-1 leading-relaxed">
                        {benefit.description}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 2. Eligibility Criteria Rules */}
        <div className="p-6 sm:p-7 rounded-3xl border border-zinc-800/90 bg-zinc-900/60 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 text-zinc-100 font-bold text-base">
            <Layers className="h-4 w-4 text-blue-400" />
            <span>Eligibility Requirements</span>
          </div>

          {!scheme.eligibility_rules || scheme.eligibility_rules.length === 0 ? (
            <p className="text-xs text-zinc-500">Universal scheme with no restrictive rules.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {scheme.eligibility_rules.map((rule) => {
                const rawField = rule.field_name || rule.field || 'Condition'
                const fieldLabel = rawField.replace(/_/g, ' ')
                const operatorLabel =
                  rule.operator === 'eq'
                    ? '='
                    : rule.operator === 'lte'
                    ? '≤'
                    : rule.operator === 'gte'
                    ? '≥'
                    : rule.operator === 'between'
                    ? 'between'
                    : rule.operator
                const ruleVal = rule.rule_value || rule.value || ''

                return (
                  <div
                    key={rule.id}
                    className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-start gap-3 text-xs"
                  >
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-zinc-200 capitalize">
                        {fieldLabel}: {operatorLabel} {ruleVal}
                      </span>
                      {rule.description && (
                        <p className="text-zinc-400 text-[11px]">{rule.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Live Document Readiness Meter Card (if authenticated) */}
      {docReadiness && (
        <div className="p-6 sm:p-8 rounded-3xl border border-indigo-900/60 bg-gradient-to-r from-indigo-950/40 via-zinc-900/60 to-purple-950/40 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderLock className="h-5 w-5 text-indigo-400" />
              <h2 className="text-base font-bold text-zinc-100">
                Your Application Document Readiness
              </h2>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                docReadiness.readiness_percentage === 100
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                  : docReadiness.readiness_percentage > 0
                  ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                  : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
              }`}
            >
              {docReadiness.readiness_percentage}% Ready
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                docReadiness.readiness_percentage === 100
                  ? 'bg-emerald-500'
                  : docReadiness.readiness_percentage >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${docReadiness.readiness_percentage}%` }}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-800">
            <p className="text-xs text-zinc-300">{docReadiness.summary}</p>
            <Link
              to="/vault"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shrink-0 transition-colors"
            >
              <FolderCheck className="h-3.5 w-3.5" />
              <span>Open Vault & Upload</span>
            </Link>
          </div>
        </div>
      )}

      {/* Required Documents Section */}
      <div className="p-6 sm:p-8 rounded-3xl border border-zinc-800/90 bg-zinc-900/60 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-100 font-bold text-base">
            <FileText className="h-4 w-4 text-purple-400" />
            <span>Required Documents to Apply</span>
          </div>
          <span className="text-xs text-zinc-500">
            {scheme.required_documents?.length || 0} document(s) needed
          </span>
        </div>

        {!scheme.required_documents || scheme.required_documents.length === 0 ? (
          <p className="text-xs text-zinc-500">No document requirements specified.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {scheme.required_documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between gap-2 text-xs"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">
                      {doc.document_name}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        doc.is_mandatory
                          ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {doc.is_mandatory ? 'Mandatory' : 'Optional'}
                    </span>
                  </div>
                  {doc.description && (
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      {doc.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official Links & Apply Action */}
      <div className="p-6 sm:p-8 rounded-3xl border border-zinc-800/90 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-bold text-zinc-100">
              Ready to Submit Your Application?
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Submit your application directly through the official Government portal.
          </p>
        </div>

        {applyUrl && (
          <a
            href={applyUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 active:scale-95 transition-all"
          >
            <span>Open Official Portal</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  )
}
