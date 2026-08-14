import { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Loader2,
} from 'lucide-react'
import {
  type ChatSession,
  type ChatMessage,
  listChatSessions,
  createChatSession,
  getChatSession,
  streamChatMessage,
  sendChatMessage,
} from '@/lib/api'

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamBuffer, setStreamBuffer] = useState('')
  const [streamCitations, setStreamCitations] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    if (activeSessionId) {
      loadSessionMessages(activeSessionId)
    }
  }, [activeSessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamBuffer])

  async function loadSessions() {
    try {
      const data = await listChatSessions()
      setSessions(data)
      if (data.length > 0 && !activeSessionId) {
        setActiveSessionId(data[0].id)
      } else if (data.length === 0) {
        handleNewSession()
      }
    } catch (e: any) {
      console.error(e)
    }
  }

  async function loadSessionMessages(id: number) {
    try {
      const session = await getChatSession(id)
      setMessages(session.messages || [])
    } catch (e: any) {
      console.error(e)
    }
  }

  async function handleNewSession() {
    try {
      const session = await createChatSession('New Citizen Consultation')
      setSessions((prev) => [session, ...prev])
      setActiveSessionId(session.id)
      setMessages([])
    } catch (e: any) {
      setError(e.message || 'Failed to create session')
    }
  }

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!input.trim() || !activeSessionId || isStreaming) return

    const userText = input.trim()
    setInput('')
    setError(null)

    // Append User Message to local state
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: userText,
      citations: [],
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsStreaming(true)
    setStreamBuffer('')
    setStreamCitations([])

    try {
      await streamChatMessage(
        activeSessionId,
        userText,
        (token, citations) => {
          setStreamBuffer((prev) => prev + token)
          if (citations && citations.length > 0) {
            setStreamCitations((prev) => Array.from(new Set([...prev, ...citations])))
          }
        },
        async () => {
          setIsStreaming(false)
          setStreamBuffer('')
          setStreamCitations([])
          await loadSessionMessages(activeSessionId)
        },
        async (err) => {
          console.warn('SSE fallback to standard HTTP POST:', err)
          try {
            await sendChatMessage(activeSessionId, userText)
            await loadSessionMessages(activeSessionId)
          } catch (postErr: any) {
            setError(postErr.message || 'Failed to send message')
          } finally {
            setIsStreaming(false)
            setStreamBuffer('')
          }
        }
      )
    } catch (err: any) {
      setError(err.message || 'Error communicating with assistant')
      setIsStreaming(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] min-h-[550px]">
      {/* Sidebar: Session History */}
      <div className="w-full lg:w-72 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
              <MessageSquare className="h-4 w-4 text-blue-400" />
              <span>Consultations</span>
            </div>
            <button
              onClick={handleNewSession}
              className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-xs flex items-center gap-1"
              title="New Consultation"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>New</span>
            </button>
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[400px] pr-1">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`text-left text-xs px-3 py-2.5 rounded-xl transition-all truncate flex items-center gap-2 ${
                  activeSessionId === s.id
                    ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <Bot className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                <span className="truncate">{s.title || `Consultation #${s.id}`}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Fact Ingestion Notice */}
        <div className="mt-4 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium mb-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Grounded Knowledge</span>
          </div>
          Answers cite official government gazettes, MP Samagra portal, and state DBT rules.
        </div>
      </div>

      {/* Main Chat Stream */}
      <div className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col justify-between overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-zinc-200 font-semibold text-base mb-1">SevaSaathi AI Assistant</h3>
              <p className="text-xs max-w-sm">
                Ask any question in Hindi, Hinglish, or English. E.g., <br />
                <span className="text-blue-400 italic">"meri beti ke liye koi scholarship batao"</span> or <br />
                <span className="text-indigo-400 italic">"what documents are required for ladli behna?"</span>
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="h-8 w-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/10'
                    : 'bg-zinc-950/80 border border-zinc-800/80 text-zinc-200 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Citations Pill */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800 flex flex-wrap gap-1.5">
                    {m.citations.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 border border-blue-800/40 text-[10px]"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        <span>{c}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="h-8 w-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {/* Active SSE Streaming Bubble */}
          {isStreaming && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <Bot className="h-4 w-4" />
              </div>
              <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-bl-none p-4 bg-zinc-950/80 border border-zinc-800/80 text-zinc-200 text-xs sm:text-sm leading-relaxed">
                <div className="whitespace-pre-wrap">{streamBuffer || 'Typing response...'}</div>
                {streamCitations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800 flex flex-wrap gap-1.5">
                    {streamCitations.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 border border-blue-800/40 text-[10px]"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        <span>{c}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="px-4 py-2 bg-red-950/60 border-t border-red-800 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-zinc-950/80 border-t border-zinc-800 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your welfare question in Hindi, Hinglish, or English..."
            disabled={isStreaming}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="p-2.5 sm:px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
