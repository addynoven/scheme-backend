'use client'

import { useState, useRef } from 'react'
import { UploadCloud, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { type HouseholdMember } from '@/core'

interface VaultUploadZoneProps {
  onUpload: (file: File, docType: string, memberId?: number | null) => Promise<void>
  onExtractFacts: (file: File, docType: string, memberId?: number | null) => Promise<void>
  members: HouseholdMember[]
}

const DOCUMENT_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Income Certificate',
  'Caste Certificate',
  'Ration Card',
  'Disability Certificate',
  'Land Records (7/12)',
  'Domicile Certificate',
  'Bank Passbook',
  'Student ID',
  'Other',
]

export function VaultUploadZone({ onUpload, onExtractFacts, members }: VaultUploadZoneProps) {
  const [docType, setDocType] = useState(DOCUMENT_TYPES[0])
  const [targetMemberId, setTargetMemberId] = useState<string>('self')
  const [isExtracting, setIsExtracting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const memberId = targetMemberId === 'self' ? null : Number(targetMemberId)
    setError(null)

    // Trigger OCR & Fact Extraction if Aadhaar/PAN/Income/Caste
    if (['Aadhaar Card', 'PAN Card', 'Income Certificate', 'Caste Certificate'].includes(docType)) {
      setIsExtracting(true)
      try {
        await onExtractFacts(file, docType, memberId)
      } catch (err: any) {
        setError(err.message || 'Fact extraction failed, falling back to upload')
        await onUpload(file, docType, memberId)
      } finally {
        setIsExtracting(false)
      }
    } else {
      setUploading(true)
      try {
        await onUpload(file, docType, memberId)
      } catch (err: any) {
        setError(err.message || 'Upload failed')
      } finally {
        setUploading(false)
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-blue-400" />
            Upload & Sync Document
          </h3>
          <p className="text-xs text-zinc-400">AI automatically scans, indexes, and extracts eligibility facts</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800 rounded-2xl text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Document Category</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          >
            {DOCUMENT_TYPES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Target Citizen</label>
          <select
            value={targetMemberId}
            onChange={(e) => setTargetMemberId(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="self">Myself (Primary Account)</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name || m.member_name} ({m.relationship})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        onClick={() => !isExtracting && !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
          isExtracting || uploading
            ? 'border-blue-500/50 bg-blue-500/5'
            : 'border-zinc-700 hover:border-blue-500/50 bg-zinc-950/40 hover:bg-zinc-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={handleFileSelected}
          className="hidden"
        />

        {isExtracting ? (
          <div className="flex flex-col items-center gap-2">
            <Sparkles className="h-8 w-8 text-blue-400 animate-pulse" />
            <p className="text-xs font-bold text-white">AI Vision OCR in Progress...</p>
            <p className="text-[11px] text-zinc-400">Extracting eligibility facts & masking sensitive numbers</p>
          </div>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            <p className="text-xs font-bold text-white">Encrypting & Storing in Safe Vault...</p>
          </div>
        ) : (
          <>
            <div className="p-3 bg-zinc-800/80 rounded-2xl text-blue-400">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-white">Click to Select or Drop Document File</p>
            <p className="text-[11px] text-zinc-500">Supports PDF, PNG, JPG up to 10MB</p>
          </>
        )}
      </div>
    </div>
  )
}
