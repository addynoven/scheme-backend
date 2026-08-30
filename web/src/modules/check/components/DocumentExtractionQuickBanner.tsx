'use client'

import { useState, useRef } from 'react'
import { Sparkles, UploadCloud, FileCheck, Loader2 } from 'lucide-react'
import { checkRepository } from '../repositories'
import { type EligibilityCheckPayload } from '@/core'

interface DocumentExtractionQuickBannerProps {
  onFactsExtracted: (facts: Partial<EligibilityCheckPayload>) => void
}

export function DocumentExtractionQuickBanner({ onFactsExtracted }: DocumentExtractionQuickBannerProps) {
  const [extracting, setExtracting] = useState(false)
  const [extractedSuccess, setExtractedSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setExtracting(true)
    try {
      const data = await checkRepository.extractDocument(file)
      const facts = data.extracted_facts || {}
      onFactsExtracted({
        gender: facts.gender || undefined,
        state: facts.state || undefined,
        district: facts.district || undefined,
        annual_income: facts.annual_income || undefined,
        caste_category: facts.caste_category || undefined,
        occupation: facts.occupation || undefined,
        is_differently_abled: facts.is_differently_abled ?? undefined,
        has_land: facts.has_land ?? undefined,
        date_of_birth: facts.date_of_birth || undefined,
        age: facts.age || undefined,
      })
      setExtractedSuccess(true)
    } catch (err) {
      console.error(err)
    } finally {
      setExtracting(false)
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-purple-950/40 border border-blue-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-blue-500/20 border border-blue-500/40 rounded-2xl text-blue-400">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Auto-Fill via Document OCR
              {extractedSuccess && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                  FACTS EXTRACTED
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Upload Aadhaar, PAN, Income or Ration card to autofill this check in 2 seconds
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={extracting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all shrink-0 disabled:opacity-50"
        >
          {extracting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Scanning...
            </>
          ) : extractedSuccess ? (
            <>
              <FileCheck className="h-4 w-4 text-emerald-300" /> Upload Another
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4" /> Instant Autofill
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>
    </div>
  )
}
