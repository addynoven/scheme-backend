'use client'

import { Users, FolderLock } from 'lucide-react'
import { type HouseholdMember } from '@/core'

interface VaultFilterBarProps {
  members: HouseholdMember[]
  selectedFilter: number | 'all'
  onSelectFilter: (filter: number | 'all') => void
  totalDocs: number
}

export function VaultFilterBar({
  members,
  selectedFilter,
  onSelectFilter,
  totalDocs,
}: VaultFilterBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
      <button
        onClick={() => onSelectFilter('all')}
        className={`px-4 py-2 rounded-2xl font-semibold transition-all flex items-center gap-2 shrink-0 ${
          selectedFilter === 'all'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
        }`}
      >
        <FolderLock className="h-4 w-4" />
        All Documents ({totalDocs})
      </button>

      {members.map((member) => (
        <button
          key={member.id}
          onClick={() => onSelectFilter(member.id)}
          className={`px-4 py-2 rounded-2xl font-semibold transition-all flex items-center gap-2 shrink-0 ${
            selectedFilter === member.id
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          {member.full_name || member.member_name} ({member.relationship})
        </button>
      ))}
    </div>
  )
}
