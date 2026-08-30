'use client'

import { Briefcase, IndianRupee } from 'lucide-react'
import { type EligibilityCheckPayload } from '@/core'

interface EligibilityFormEconomicProps {
  formData: EligibilityCheckPayload
  onChange: (data: Partial<EligibilityCheckPayload>) => void
}

const OCCUPATIONS = [
  'unemployed',
  'farmer',
  'student',
  'employed',
  'self-employed',
  'daily-wage',
  'senior-citizen',
]

export function EligibilityFormEconomic({ formData, onChange }: EligibilityFormEconomicProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
          <Briefcase className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Economic & Special Criteria</h3>
          <p className="text-xs text-zinc-400">Income threshold, employment, land, and disability status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block text-zinc-400 font-semibold mb-1">Occupation</label>
          <select
            value={formData.occupation || 'unemployed'}
            onChange={(e) => onChange({ occupation: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
          >
            {OCCUPATIONS.map((o) => (
              <option key={o} value={o}>
                {o.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-zinc-400 font-semibold mb-1">Annual Household Income ₹</label>
          <input
            type="number"
            value={formData.annual_income || ''}
            onChange={(e) => onChange({ annual_income: Number(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            placeholder="e.g. 180000"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
        <label className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-2xl border border-zinc-800 cursor-pointer text-zinc-300 hover:bg-zinc-800">
          <input
            type="checkbox"
            checked={formData.has_land ?? false}
            onChange={(e) => onChange({ has_land: e.target.checked })}
            className="rounded bg-zinc-700 border-zinc-600 text-emerald-500 focus:ring-0"
          />
          <div>
            <span className="font-semibold block text-white">Owns Agricultural Land</span>
            <span className="text-[11px] text-zinc-400">Relevant for PM-Kisan & Krishi Yojanas</span>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-2xl border border-zinc-800 cursor-pointer text-zinc-300 hover:bg-zinc-800">
          <input
            type="checkbox"
            checked={formData.is_differently_abled ?? false}
            onChange={(e) => onChange({ is_differently_abled: e.target.checked })}
            className="rounded bg-zinc-700 border-zinc-600 text-emerald-500 focus:ring-0"
          />
          <div>
            <span className="font-semibold block text-white">Differently Abled (PwD)</span>
            <span className="text-[11px] text-zinc-400">40%+ disability status certificate</span>
          </div>
        </label>
      </div>
    </div>
  )
}
