'use client'

import { Bot, Sparkles } from 'lucide-react'
import { SuggestionChip } from './SuggestionChip'

interface ChatWelcomeHeroProps {
  userName: string
  onSelectSuggestion: (text: string) => void
}

const SUGGESTIONS = [
  'What schemes are available for small farmers in MP?',
  'Check eligibility for Ladli Behna Yojana',
  'How do I apply for PM Awas Yojana?',
  'Are there education scholarships for OBC students?',
]

export function ChatWelcomeHero({ userName, onSelectSuggestion }: ChatWelcomeHeroProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 sm:p-12 space-y-6 max-w-2xl mx-auto">
      <div className="p-4 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-3xl text-blue-400 shadow-2xl">
        <Bot className="h-12 w-12" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Namaste, {userName}!
        </h2>
        <p className="text-sm text-zinc-400 max-w-lg leading-relaxed">
          I am your AI Welfare Assistant. Ask me anything in English, Hindi, or Hinglish about central & state government schemes.
        </p>
      </div>

      <div className="w-full pt-4 space-y-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Suggested Inquiries
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {SUGGESTIONS.map((s, idx) => (
            <SuggestionChip
              key={idx}
              label={s}
              prompt={s}
              onClick={onSelectSuggestion}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
