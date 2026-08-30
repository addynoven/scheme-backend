'use client'

import Link from 'next/link'
import { FileText, CheckCircle2, AlertCircle, FolderLock } from 'lucide-react'
import { type RequiredDocument, type SchemeDocumentReadiness } from '@/core'

interface SchemeDocumentsChecklistProps {
  documents: RequiredDocument[]
  readiness?: SchemeDocumentReadiness | null
}

export function SchemeDocumentsChecklist({ documents, readiness }: SchemeDocumentsChecklistProps) {
  if (!documents || documents.length === 0) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Required Documentation</h3>
            <p className="text-xs text-zinc-400">Certificates & identity proofs required to apply</p>
          </div>
        </div>

        <Link
          href="/vault"
          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
        >
          <FolderLock className="h-3.5 w-3.5" /> Check Vault
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {documents.map((doc, idx) => {
          const matchedItem = readiness?.checklist?.find(
            (c) => c.document_name.toLowerCase() === doc.document_name.toLowerCase()
          )

          return (
            <div
              key={idx}
              className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                {matchedItem?.status === 'available' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-zinc-500 shrink-0" />
                )}
                <div>
                  <h4 className="font-semibold text-white">{doc.document_name}</h4>
                  <p className="text-[11px] text-zinc-400">
                    {doc.is_mandatory ? (
                      <span className="text-red-400 font-bold">Mandatory</span>
                    ) : (
                      'Optional'
                    )}
                  </p>
                </div>
              </div>

              {matchedItem && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    matchedItem.status === 'available'
                      ? 'bg-emerald-950 text-emerald-400'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {matchedItem.status === 'available' ? 'IN VAULT' : 'MISSING'}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
