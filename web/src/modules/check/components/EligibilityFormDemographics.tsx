'use client'

import { Sliders } from 'lucide-react'
import { type EligibilityCheckPayload } from '@/core'

interface EligibilityFormDemographicsProps {
  formData: EligibilityCheckPayload
  onChange: (data: Partial<EligibilityCheckPayload>) => void
}

const CASTE_CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS']
const MARITAL_STATUSES = ['Single', 'Married', 'Widowed', 'Divorced']
const RESIDENCE_AREAS = ['Rural', 'Urban', 'Semi-Urban']

export function EligibilityFormDemographics({ formData, onChange }: EligibilityFormDemographicsProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
        <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
          <Sliders className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Social & Categorical Factors</h3>
          <p className="text-xs text-zinc-400">Reservation, area, and marital criteria</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block text-zinc-400 font-semibold mb-1">Caste Category</label>
          <select
            value={formData.caste_category || 'General'}
            onChange={(e) => onChange({ caste_category: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            {CASTE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-zinc-400 font-semibold mb-1">Marital Status</label>
          <select
            value={formData.marital_status || 'Married'}
            onChange={(e) => onChange({ marital_status: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            {MARITAL_STATUSES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-zinc-400 font-semibold mb-1">Residence Area</label>
          <select
            value={formData.residence_area || 'Rural'}
            onChange={(e) => onChange({ residence_area: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            {RESIDENCE_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
