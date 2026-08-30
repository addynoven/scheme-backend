'use client'

import { Layers, CheckCircle2, Globe, AlertTriangle } from 'lucide-react'

interface AdminStatsHeaderProps {
  totalSchemes: number
  activeSchemes: number
  totalSources: number
  pendingTriage: number
}

export function AdminStatsHeader({
  totalSchemes,
  activeSchemes,
  totalSources,
  pendingTriage,
}: AdminStatsHeaderProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <Layers className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <p className="text-xs text-slate-400">Total Schemes</p>
          <p className="text-xl font-bold text-white">{totalSchemes}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-xs text-slate-400">Active Schemes</p>
          <p className="text-xl font-bold text-white">{activeSchemes}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <Globe className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <p className="text-xs text-slate-400">Ingestion Sources</p>
          <p className="text-xl font-bold text-white">{totalSources}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <p className="text-xs text-slate-400">Pending Triage</p>
          <p className="text-xl font-bold text-white">{pendingTriage}</p>
        </div>
      </div>
    </div>
  )
}
