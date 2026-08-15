import React, { useRef, useEffect } from 'react'
import {
  Send,
  Loader2,
  Mic,
  MicOff,
  Plus,
  ShieldCheck,
} from 'lucide-react'

interface ChatComposerProps {
  input: string
  setInput: (val: string) => void
  onSend: (text?: string) => void
  isStreaming: boolean
  isDictating: boolean
  onToggleDictation: () => void
  placeholder?: string
  citizenState?: string
  autoFocus?: boolean
  className?: string
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  input,
  setInput,
  onSend,
  isStreaming,
  isDictating,
  onToggleDictation,
  placeholder = 'Ask about scholarships, housing, healthcare, pensions...',
  citizenState = 'India',
  autoFocus = false,
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [input])

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Primary Composer Container */}
      <div className="relative rounded-2xl bg-[#141417] border border-zinc-800/90 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600/50 shadow-lg transition-all p-2 sm:p-2.5 flex flex-col gap-2">
        
        {/* Main Text Area */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming}
          className="w-full bg-transparent border-0 resize-none py-1 px-2 text-[15px] text-zinc-100 placeholder-zinc-500 focus:outline-none max-h-40 leading-relaxed disabled:opacity-50"
        />

        {/* Composer Controls Row */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-800/40 px-1">
          
          {/* Left Actions: Attach / Vault */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                window.location.href = '/vault'
              }}
              className="h-8 px-2.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Attach document or open vault"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Attach / Vault</span>
            </button>
          </div>

          {/* Right Actions: Mic, Send */}
          <div className="flex items-center gap-1.5">
            {/* Dictation Mic (Voice to Text Input) */}
            <button
              type="button"
              onClick={onToggleDictation}
              className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                isDictating
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
              }`}
              title={isDictating ? 'Stop recording' : 'Speak to input text'}
            >
              {isDictating ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isDictating ? 'Listening...' : 'Voice'}</span>
            </button>

            {/* Send Button */}
            <button
              type="button"
              onClick={() => onSend()}
              disabled={!input.trim() || isStreaming}
              className="h-8 w-8 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 flex items-center justify-center shadow-sm disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Send message"
            >
              {isStreaming ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Trust & Micro-interaction Subtitle */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2 px-1">
        <span>Press <strong className="text-zinc-400 font-medium">Enter</strong> to send · <strong className="text-zinc-400 font-medium">Shift+Enter</strong> for newline</span>
        <span className="flex items-center gap-1 text-zinc-400">
          <ShieldCheck className="h-3 w-3 text-blue-400" />
          Verified for {citizenState}
        </span>
      </div>
    </div>
  )
}
