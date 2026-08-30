'use client'

import { Search } from 'lucide-react'

interface ResultsFilterTabsProps {
  activeTab: 'eligible' | 'nearly_eligible' | 'ineligible'
  onTabChange: (tab: 'eligible' | 'nearly_eligible' | 'ineligible') => void
  eligibleCount: number
  nearlyCount: number
  ineligibleCount: number
  searchQuery: string
  onSearchChange: (q: string) => void
}

export function ResultsFilterTabs({
  activeTab,
  onTabChange,
  eligibleCount,
  nearlyCount,
  ineligibleCount,
  searchQuery,
  onSearchChange,
}: ResultsFilterTabsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3 text-xs">
      <div className="flex gap-2">
        <button
          onClick={() => onTabChange('eligible')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'eligible'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          Qualified ({eligibleCount})
        </button>

        <button
          onClick={() => onTabChange('nearly_eligible')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'nearly_eligible'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          Nearly Eligible ({nearlyCount})
        </button>

        <button
          onClick={() => onTabChange('ineligible')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'ineligible'
              ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          Not Qualified ({ineligibleCount})
        </button>
      </div>

      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter results..."
          className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  )
}
