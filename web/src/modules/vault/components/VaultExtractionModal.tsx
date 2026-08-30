'use client'

import { useState } from 'react'
import { Sparkles, CheckCircle2, X, ArrowRight, ShieldCheck } from 'lucide-react'
import { type ExtractedDocumentFactsResponse, type ConfirmFactsAndSyncProfileRequest } from '@/core'

interface VaultExtractionModalProps {
  data: ExtractedDocumentFactsResponse | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (facts: ConfirmFactsAndSyncProfileRequest) => Promise<void>
}

export function VaultExtractionModal({ data, isOpen, onClose, onConfirm }: VaultExtractionModalProps) {
  if (!isOpen || !data) return null

  const facts = data.extracted_facts || {}
  const [formData, setFormData] = useState<ConfirmFactsAndSyncProfileRequest>({
    full_name: facts.full_name || '',
    date_of_birth: facts.date_of_birth || '',
    gender: facts.gender || '',
    state: facts.state || '',
    district: facts.district || '',
    annual_income: facts.annual_income || 0,
    occupation: facts.occupation || '',
    caste_category: facts.caste_category || '',
    has_land: facts.has_land ?? false,
    is_differently_abled: facts.is_differently_abled ?? false,
    document_number_masked: facts.document_number_masked || '',
  })

  const [saving, setSaving] = useState(false)

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onConfirm(formData)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-zinc-800 bg-gradient-to-r from-blue-950/40 to-indigo-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 border border-blue-500/40 rounded-2xl text-blue-400">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Fact Extraction Verified</h3>
              <p className="text-xs text-blue-300/80">
                Confidence: {(data.confidence_score * 100).toFixed(0)}% • {data.detected_document_type}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 text-zinc-400 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-6 space-y-4 text-xs">
          <p className="text-zinc-400 leading-relaxed">
            {data.evidence_summary || 'Extracted demographic and economic facts from your document. Review and confirm to sync to your citizen profile:'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80">
            {formData.full_name !== undefined && (
              <div>
                <label className="block text-zinc-500 text-[10px] uppercase font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-medium"
                />
              </div>
            )}

            {formData.date_of_birth !== undefined && (
              <div>
                <label className="block text-zinc-500 text-[10px] uppercase font-semibold mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.date_of_birth || ''}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-medium"
                />
              </div>
            )}

            {formData.state !== undefined && (
              <div>
                <label className="block text-zinc-500 text-[10px] uppercase font-semibold mb-1">State</label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-medium"
                />
              </div>
            )}

            {formData.annual_income !== undefined && formData.annual_income !== 0 && (
              <div>
                <label className="block text-zinc-500 text-[10px] uppercase font-semibold mb-1">Annual Income ₹</label>
                <input
                  type="number"
                  value={formData.annual_income || ''}
                  onChange={(e) => setFormData({ ...formData, annual_income: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-medium"
                />
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl"
            >
              Skip Sync
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {saving ? 'Syncing...' : 'Confirm & Sync to Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
