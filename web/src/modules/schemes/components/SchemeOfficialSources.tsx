'use client'

import { Globe, ExternalLink } from 'lucide-react'
import { type OfficialSource } from '@/core'

interface SchemeOfficialSourcesProps {
  sources: OfficialSource[]
  officialWebsite?: string | null
}

export function SchemeOfficialSources({ sources, officialWebsite }: SchemeOfficialSourcesProps) {
  if ((!sources || sources.length === 0) && !officialWebsite) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
        <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-blue-400">
          <Globe className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Official Sources & Verification</h3>
          <p className="text-xs text-zinc-400">Government portals, Gazette notifications, and guidelines</p>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        {officialWebsite && (
          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl flex items-center justify-between">
            <span className="font-semibold text-white">Official Scheme Portal</span>
            <a
              href={officialWebsite}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
            >
              Visit Portal <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {sources?.map((s, idx) => {
          const url = s.url || s.source_url
          const title = s.title || s.source_name || `Source Reference #${idx + 1}`

          return (
            <div
              key={idx}
              className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl flex items-center justify-between"
            >
              <div>
                <span className="font-semibold text-white">{title}</span>
                {s.source_type && (
                  <span className="text-[10px] text-zinc-500 block uppercase">{s.source_type}</span>
                )}
              </div>
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                >
                  View Source <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
