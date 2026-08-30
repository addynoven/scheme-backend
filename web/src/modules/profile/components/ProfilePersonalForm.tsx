'use client'

import { User, MapPin } from 'lucide-react'

interface ProfilePersonalFormProps {
  formData: any
  onChange: (field: string, val: any) => void
  statesList: string[]
}

export function ProfilePersonalForm({ formData, onChange, statesList }: ProfilePersonalFormProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
        <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-blue-400">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Personal & Location Information</h3>
          <p className="text-xs text-zinc-400">Legal identity, date of birth, and residency</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <label className="block text-zinc-400 font-semibold mb-1">Full Legal Name *</label>
          <input
            type="text"
            value={formData.full_name || ''}
            onChange={(e) => onChange('full_name', e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-zinc-400 font-semibold mb-1">Date of Birth</label>
          <input
            type="date"
            value={formData.date_of_birth || ''}
            onChange={(e) => onChange('date_of_birth', e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-zinc-400 font-semibold mb-1">Gender *</label>
          <select
            value={formData.gender || 'Male'}
            onChange={(e) => onChange('gender', e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
          >
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Transgender">Transgender</option>
          </select>
        </div>

        <div>
          <label className="block text-zinc-400 font-semibold mb-1">State *</label>
          <select
            value={formData.state || 'Madhya Pradesh'}
            onChange={(e) => onChange('state', e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
          >
            {statesList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
