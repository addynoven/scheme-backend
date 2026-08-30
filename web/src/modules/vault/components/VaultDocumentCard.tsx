'use client'

import { FileText, ShieldCheck, Trash2, Download, CheckCircle2 } from 'lucide-react'
import { type UserDocument } from '@/core'

interface VaultDocumentCardProps {
  document: UserDocument
  onDelete: (id: number) => Promise<void>
}

export function VaultDocumentCard({ document, onDelete }: VaultDocumentCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex flex-col justify-between shadow-xl transition-all group">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <FileText className="h-5 w-5" />
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
              document.is_verified
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {document.is_verified && <CheckCircle2 className="h-3 w-3" />}
            {document.is_verified ? 'VERIFIED' : 'STORED'}
          </span>
        </div>

        <h4 className="text-xs font-bold text-white mb-1 truncate">{document.document_type}</h4>
        <p className="text-[11px] text-zinc-400 truncate mb-2">{document.file_name}</p>

        {document.document_number_masked && (
          <div className="px-2 py-1 bg-zinc-950/60 rounded-lg border border-zinc-800/80 mb-3 flex items-center justify-between text-[10px]">
            <span className="text-zinc-500">ID Number:</span>
            <span className="font-mono text-zinc-300 font-semibold">{document.document_number_masked}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500">
        <span>{(document.file_size_bytes / 1024).toFixed(0)} KB</span>
        <div className="flex items-center gap-1.5">
          {document.download_url && (
            <a
              href={document.download_url}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
              title="Download Document"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={() => onDelete(document.id)}
            className="p-1.5 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
            title="Delete Document"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
