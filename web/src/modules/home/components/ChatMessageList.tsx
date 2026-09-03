'use client'

import { User, Bot, Sparkles, BookOpen, AlertTriangle, Terminal, Brain } from 'lucide-react'
import { MarkdownMessage } from './MarkdownMessage'
import { type ChatMessage } from '@/core'
import { useDevErrorStore } from '@/core/errors/devErrorStore'
import { useChatStore } from '../store/useChatStore'

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
  const { openDevError } = useDevErrorStore()
  const { openMemoryInspector } = useChatStore()

  return (
    <div className="space-y-6 pb-6">
      {messages.map((m, idx) => {
        const isError =
          m.status === 'rate_limit_exceeded' ||
          m.status === 'service_unavailable' ||
          m.status === 'error' ||
          Boolean(m.error_code) ||
          m.content.includes('[Dev Mode:') ||
          m.content.includes('trouble connecting')

        const isRateLimit =
          m.status === 'rate_limit_exceeded' ||
          m.error_code === 'AI_RATE_LIMIT_EXCEEDED' ||
          m.content.includes('Rate Limit') ||
          m.content.includes('429')

        return (
          <div
            key={m.id || idx}
            className={`flex gap-3 ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.role !== 'user' && (
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isError
                    ? 'bg-red-500/20 border border-red-500/40 text-red-400'
                    : 'bg-blue-600/20 border border-blue-500/30 text-blue-400'
                }`}
              >
                {isError ? <AlertTriangle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-3xl p-4 sm:p-5 shadow-xl text-xs sm:text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : isError
                  ? 'bg-red-950/20 border border-red-500/40 text-red-100 rounded-bl-none shadow-red-950/20'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-none'
              }`}
            >
              {m.role === 'user' ? (
                <p className="whitespace-pre-wrap">{m.content}</p>
              ) : (
                <div className="space-y-3">
                  {/* Recalled Memory Badge Chip */}
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-800/60">
                    <button
                      type="button"
                      onClick={() => openMemoryInspector(m.memory_trace, m.content)}
                      className="px-2.5 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-[10px] font-bold text-purple-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Brain className="h-3 w-3 text-purple-400" />
                      <span>
                        RECALLED {m.memory_trace?.semantic_memory?.recalled_facts_count || 3} MEMORIES
                      </span>
                    </button>
                    <span className="text-[10px] text-zinc-500 font-mono">gemini-3.8-flash</span>
                  </div>

                  <MarkdownMessage content={m.content} />

                  {/* Dev Mode Inspector Trigger Button */}
                  {(isError || m.stack_trace || m.error_code) && (
                    <div className="pt-2 border-t border-red-500/30 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-red-300 font-mono">
                        {isRateLimit ? 'HTTP 429 · AI Quota Exceeded' : 'Service Issue Detected'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          openDevError({
                            title: isRateLimit ? 'Upstream AI Rate Limit Exceeded (HTTP 429)' : 'Welfare AI Service Error',
                            errorCode: m.error_code || (isRateLimit ? 'AI_RATE_LIMIT_EXCEEDED' : 'SERVICE_UNAVAILABLE'),
                            httpStatus: isRateLimit ? 429 : 503,
                            origin: 'Backend API',
                            endpoint: '/chat/sessions/messages',
                            message: m.content,
                            stackTrace: m.stack_trace || null,
                            solution: isRateLimit
                              ? 'Set LLM_PROVIDER=agy in backend/.env to use local CLI without external Gemini API rate limits.'
                              : 'Check backend server terminal logs for traceback.',
                            timestamp: m.created_at || new Date().toISOString(),
                          })
                        }
                        className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Terminal className="h-3 w-3 text-red-400" />
                        <span>Inspect Stack & Diagnostics</span>
                      </button>
                    </div>
                  )}

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
        )
      })}

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
