'use client'

import { ShieldCheck, CheckCircle2, FileText, Sparkles } from 'lucide-react'

interface ProfileFactAuditListProps {
  user: any | null
}

export function ProfileFactAuditList({ user }: ProfileFactAuditListProps) {
  const verifiedFacts = user?.verified_facts || []

  if (verifiedFacts.length === 0) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Cryptographic Fact Provenance</h3>
            <p className="text-xs text-zinc-400">Facts auto-verified and anchored to uploaded documents</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          {verifiedFacts.length} Verified Facts
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {verifiedFacts.map((fact: any, idx: number) => (
          <div key={idx} className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-zinc-400 font-semibold">{fact.fact_key}</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <p className="font-bold text-white truncate">{fact.fact_value}</p>
            {fact.source_document_name && (
              <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                <FileText className="h-3 w-3" /> {fact.source_document_name}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
