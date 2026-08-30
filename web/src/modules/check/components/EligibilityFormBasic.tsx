'use client'

import { User, MapPin, Calendar } from 'lucide-react'
import { type EligibilityCheckPayload } from '@/core'

interface EligibilityFormBasicProps {
  formData: EligibilityCheckPayload
  onChange: (data: Partial<EligibilityCheckPayload>) => void
  statesList: Array<{ name: string; type: string }>
}

export function EligibilityFormBasic({ formData, onChange, statesList }: EligibilityFormBasicProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
        <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-blue-400">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Basic Demographics</h3>
          <p className="text-xs text-zinc-400">Age, location, and gender factors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <label className="block text-zinc-400 font-semibold mb-1">Age (Years) *</label>
          <input
            type="number"
            value={formData.age || ''}
            onChange={(e) => onChange({ age: Number(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-zinc-400 font-semibold mb-1">Gender *</label>
          <select
            value={formData.gender || 'Female'}
            onChange={(e) => onChange({ gender: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
          >
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Transgender">Transgender</option>
          </select>
        </div>

        <div>
          <label className="block text-zinc-400 font-semibold mb-1">State / UT *</label>
          <select
            value={formData.state || 'Madhya Pradesh'}
            onChange={(e) => onChange({ state: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
          >
            {statesList.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-zinc-400 font-semibold mb-1">District</label>
          <input
            type="text"
            value={formData.district || ''}
            placeholder="e.g. Bhopal"
            onChange={(e) => onChange({ district: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  )
}
