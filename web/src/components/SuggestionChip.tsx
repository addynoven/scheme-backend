import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface SuggestionChipProps {
  icon?: LucideIcon
  label: string
  prompt: string
  onClick: (prompt: string) => void
}

export const SuggestionChip: React.FC<SuggestionChipProps> = ({
  icon: Icon,
  label,
  prompt,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick(prompt)}
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 text-xs transition-all active:scale-[0.98] cursor-pointer text-left"
    >
      {Icon && <Icon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />}
      <span className="truncate">{label}</span>
    </button>
  )
}
