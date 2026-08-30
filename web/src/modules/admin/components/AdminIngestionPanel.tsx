'use client'

import { useState } from 'react'
import { Globe, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { type IngestionSource, type IngestionSyncRunResult } from '@/core'

interface AdminIngestionPanelProps {
  sources: IngestionSource[]
  onRunSync: (sourceKey?: string) => Promise<IngestionSyncRunResult[]>
}

export function AdminIngestionPanel({ sources, onRunSync }: AdminIngestionPanelProps) {
  const [syncingKey, setSyncingKey] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<IngestionSyncRunResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSync(sourceKey?: string) {
    setSyncingKey(sourceKey || 'all')
    setError(null)
    try {
      const res = await onRunSync(sourceKey)
      setLastResult(res)
    } catch (err: any) {
      setError(err.message || 'Sync failed')
    } finally {
      setSyncingKey(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Ingestion Pipeline Control</h3>
          <p className="text-xs text-slate-400">Manage external sources, scrapers, and auto-sync triggers</p>
        </div>
        <button
          onClick={() => handleSync(undefined)}
          disabled={!!syncingKey}
          className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncingKey === 'all' ? 'animate-spin' : ''}`} />
          Sync All Sources
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {lastResult && lastResult.length > 0 && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white">Sync Run Completed ({lastResult.length} sources)</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {lastResult.map((res, i) => (
              <div key={i} className="bg-slate-800/60 p-2.5 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-white text-[11px] font-bold">{res.source_key}</span>
                  <span className="text-[10px] text-blue-400 uppercase font-semibold">{res.status}</span>
                </div>
                <div className="text-[10px] text-slate-400 space-y-0.5">
                  <p>Created: <span className="text-emerald-400 font-semibold">{res.schemes_created}</span></p>
                  <p>Updated: <span className="text-amber-400 font-semibold">{res.schemes_updated}</span></p>
                  <p>Triage: <span className="text-purple-400 font-semibold">{res.breaking_changes_triaged}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((src) => (
          <div
            key={src.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800 rounded-xl">
                  <Globe className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{src.name}</h4>
                  <span className="text-[10px] font-mono text-slate-400">{src.source_key}</span>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  src.status === 'active' || src.status === 'idle' || src.status === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {src.status.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4 line-clamp-2">{src.endpoint_url}</p>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
              <span className="text-slate-500 text-[11px]">
                {src.last_synced_at ? `Last sync: ${new Date(src.last_synced_at).toLocaleDateString()}` : 'Never synced'}
              </span>
              <button
                onClick={() => handleSync(src.source_key)}
                disabled={syncingKey === src.source_key}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-lg font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${syncingKey === src.source_key ? 'animate-spin' : ''}`} />
                {syncingKey === src.source_key ? 'Syncing...' : 'Trigger Sync'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
