'use client'

import { ShieldCheck, CheckCircle2, AlertCircle, Sparkles, ChevronRight } from 'lucide-react'
import { type Scheme, type SchemeDocumentReadiness } from '@/core'

interface SchemeReadinessCardProps {
  schemes: Scheme[]
  selectedSchemeId: number | null
  onSelectScheme: (id: number) => void
  readiness: SchemeDocumentReadiness | null
  loading: boolean
}

export function SchemeReadinessCard({
  schemes,
  selectedSchemeId,
  onSelectScheme,
  readiness,
  loading,
}: SchemeReadinessCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Scheme Document Readiness Check
          </h3>
          <p className="text-xs text-zinc-400">Match your vault documents against official scheme checklists</p>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Select Welfare Scheme</label>
        <select
          value={selectedSchemeId || ''}
          onChange={(e) => onSelectScheme(Number(e.target.value))}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
        >
          {schemes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.category})
            </option>
          ))}
        </select>
      </div>

      {readiness && (
        <div className="space-y-4 pt-2">
          <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Application Readiness</span>
              <p className="text-xl font-bold text-white mt-0.5">
                {readiness.readiness_percentage}%{' '}
                <span className="text-xs font-normal text-zinc-400">
                  ({readiness.mandatory_available}/{readiness.mandatory_total} Mandatory)
                </span>
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                readiness.is_ready_to_apply
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {readiness.is_ready_to_apply ? 'READY TO APPLY' : 'DOCS MISSING'}
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-zinc-300">Required Documents Checklist:</span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {readiness.checklist.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-zinc-800/50 rounded-xl border border-zinc-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    {item.status === 'available' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-white text-[11px]">{item.document_name}</p>
                      {item.is_mandatory && <span className="text-[9px] text-red-400 font-bold uppercase">Mandatory</span>}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      item.status === 'available' ? 'bg-emerald-950 text-emerald-400' : 'bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    {item.status === 'available' ? 'IN VAULT' : 'MISSING'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
