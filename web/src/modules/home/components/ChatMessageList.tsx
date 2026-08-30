'use client'

import { User, Bot, Sparkles, BookOpen } from 'lucide-react'
import { MarkdownMessage } from './MarkdownMessage'
import { type ChatMessage } from '@/core'

interface ChatMessageListProps {
  messages: ChatMessage[]
  streamBuffer: string
  streamCitations: string[]
  isStreaming: boolean
}

export function ChatMessageList({
  messages,
  streamBuffer,
  streamCitations,
  isStreaming,
}: ChatMessageListProps) {
  return (
    <div className="space-y-6 pb-6">
      {messages.map((m, idx) => (
        <div
          key={m.id || idx}
          className={`flex gap-3 ${
            m.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {m.role !== 'user' && (
            <div className="h-8 w-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="h-4 w-4" />
            </div>
          )}

          <div
            className={`max-w-[85%] rounded-3xl p-4 sm:p-5 shadow-xl text-xs sm:text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-none'
            }`}
          >
            {m.role === 'user' ? (
              <p className="whitespace-pre-wrap">{m.content}</p>
            ) : (
              <div className="space-y-3">
                <MarkdownMessage content={m.content} />
                {m.citations && m.citations.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
                    <BookOpen className="h-3 w-3 text-blue-400" />
                    <span>Sources:</span>
                    {m.citations.map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-zinc-800 rounded-md font-mono text-[10px] text-zinc-300"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {m.role === 'user' && (
            <div className="h-8 w-8 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
              <User className="h-4 w-4" />
            </div>
          )}
        </div>
      ))}

      {isStreaming && streamBuffer && (
        <div className="flex gap-3 justify-start">
          <div className="h-8 w-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Bot className="h-4 w-4" />
          </div>

          <div className="max-w-[85%] rounded-3xl p-4 sm:p-5 shadow-xl text-xs sm:text-sm leading-relaxed bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-none">
            <MarkdownMessage content={streamBuffer} />
          </div>
        </div>
      )}
    </div>
  )
}
