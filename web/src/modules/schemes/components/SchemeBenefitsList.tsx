'use client'

import { Sparkles, IndianRupee, Gift } from 'lucide-react'
import { type Benefit } from '@/core'

interface SchemeBenefitsListProps {
  benefits: Benefit[]
}

export function SchemeBenefitsList({ benefits }: SchemeBenefitsListProps) {
  if (!benefits || benefits.length === 0) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Benefits & Entitlements</h3>
          <p className="text-xs text-zinc-400">Direct financial transfers and in-kind welfare</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {benefits.map((b, idx) => (
          <div
            key={idx}
            className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl flex items-start gap-3"
          >
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 mt-0.5 shrink-0">
              {b.amount ? <IndianRupee className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
            </div>
            <div>
              {b.title && <h4 className="font-bold text-white text-xs mb-0.5">{b.title}</h4>}
              <p className="text-xs text-zinc-300 leading-relaxed">{b.description}</p>
              {b.amount ? (
                <p className="text-xs font-bold text-emerald-400 mt-1">
                  ₹{Number(b.amount).toLocaleString('en-IN')} Direct DBT
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
