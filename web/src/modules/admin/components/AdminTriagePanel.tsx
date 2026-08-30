'use client'

import { useState } from 'react'
import { Check, X, Eye } from 'lucide-react'
import { type IngestionTriageItem } from '@/core'

interface AdminTriagePanelProps {
  items: IngestionTriageItem[]
  onApprove: (itemId: number) => Promise<void>
  onReject: (itemId: number) => Promise<void>
}

export function AdminTriagePanel({ items, onApprove, onReject }: AdminTriagePanelProps) {
  const [selectedItem, setSelectedItem] = useState<IngestionTriageItem | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)

  async function handleAction(itemId: number, action: 'approve' | 'reject') {
    setProcessingId(itemId)
    try {
      if (action === 'approve') {
        await onApprove(itemId)
      } else {
        await onReject(itemId)
      }
      if (selectedItem?.id === itemId) setSelectedItem(null)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Ingestion Triage Queue</h3>
          <p className="text-xs text-slate-400">Review, approve, or reject extracted schemes pending publication</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <p className="text-slate-400 text-sm font-semibold">Triage Queue Clean</p>
          <p className="text-slate-600 text-xs mt-1">No items currently require human review</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  selectedItem?.id === item.id
                    ? 'bg-slate-800/80 border-blue-500/50 shadow-lg'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.scheme_name || item.scheme_slug}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">Source ID: {item.source_id}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{item.diff_summary || 'Pending review'}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Payload
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(item.id, 'reject')}
                      disabled={processingId === item.id}
                      className="px-3 py-1 bg-red-950/60 hover:bg-red-900/60 border border-red-800/80 text-red-300 rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                    >
                      <X className="h-3 w-3" /> Reject
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'approve')}
                      disabled={processingId === item.id}
                      className="px-3 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/80 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" /> Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Details Inspector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-fit shadow-xl">
            <h4 className="text-xs font-bold text-slate-300 uppercase mb-3">Payload Inspector</h4>
            {selectedItem ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px]">Scheme</span>
                  <p className="font-semibold text-white">{selectedItem.scheme_name}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">Impact & Change</span>
                  <p className="text-amber-400">{selectedItem.change_type} ({selectedItem.impact_level})</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">Diff Payload</span>
                  <pre className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60">
                    {JSON.stringify(selectedItem.diff_payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-xs">Select a triage item to inspect payload details</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
