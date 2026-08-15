import { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  ShieldCheck,
  Loader2,
  Check,
  X,
  Volume2,
  Copy,
  CheckCheck,
  GraduationCap,
  Briefcase,
  Tractor,
  Home,
  HeartPulse,
  ChevronDown,
} from 'lucide-react'
import {
  type ChatMessage,
  createChatSession,
  getChatSession,
  streamChatMessage,
  sendChatMessage,
  citizenGetMe,
  transcribeAudio,
} from '@/lib/api'
import { MarkdownMessage } from '@/components/MarkdownMessage'
import { ChatComposer } from '@/components/ChatComposer'
import { SuggestionChip } from '@/components/SuggestionChip'

const SUGGESTIONS = [
  {
    icon: GraduationCap,
    label: 'Scholarships',
    prompt: 'What higher education scholarships am I eligible for?',
  },
  {
    icon: Tractor,
    label: 'Farmer benefits',
    prompt: 'Tell me about agricultural subsidies and PM-Kisan benefits.',
  },
  {
    icon: Briefcase,
    label: 'Business & MSME',
    prompt: 'What loans and subsidies (like PMEGP or Mudra) can I get to start a business?',
  },
  {
    icon: Home,
    label: 'Housing',
    prompt: 'Am I eligible for PM Awas Yojana (PMAY) housing assistance?',
  },
  {
    icon: HeartPulse,
    label: 'Healthcare',
    prompt: 'How do I check if my family has Ayushman Bharat ₹5 Lakh cashless hospital cover?',
  },
]

export default function HomePage() {
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamBuffer, setStreamBuffer] = useState('')
  const [streamCitations, setStreamCitations] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [citizen, setCitizen] = useState<any | null>(null)

  // Model Selector
  const [selectedModel, setSelectedModel] = useState<'flash' | 'bitmask' | 'deep'>('flash')
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)

  // Mic Dictation State
  const [isDictating, setIsDictating] = useState(false)
  const dictationRecorderRef = useRef<MediaRecorder | null>(null)
  const dictationChunksRef = useRef<Blob[]>([])

  // Audio Playback & Copy State
  const [speakingMsgId, setSpeakingMsgId] = useState<number | null>(null)
  const [copiedMsgId, setCopiedMsgId] = useState<number | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Sync active session from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlSessionId = params.get('session') ? parseInt(params.get('session')!, 10) : null
    if (urlSessionId) {
      setActiveSessionId(urlSessionId)
      loadSessionMessages(urlSessionId)
    } else {
      setActiveSessionId(null)
      setMessages([])
    }
  }, [window.location.search])

  // Listen to global new-chat event
  useEffect(() => {
    const handleNewChat = (e: any) => {
      const session = e.detail?.session
      if (session) {
        setActiveSessionId(session.id)
        setMessages([])
        setInput('')
      }
    }
    window.addEventListener('scheme:new-chat', handleNewChat)
    return () => window.removeEventListener('scheme:new-chat', handleNewChat)
  }, [])

  useEffect(() => {
    citizenGetMe()
      .then(setCitizen)
      .catch(() => {})
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamBuffer])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = () => setModelDropdownOpen(false)
    if (modelDropdownOpen) {
      window.addEventListener('click', handleClickOutside)
    }
    return () => window.removeEventListener('click', handleClickOutside)
  }, [modelDropdownOpen])

  async function loadSessionMessages(id: number) {
    try {
      const session = await getChatSession(id)
      setMessages(session.messages || [])
    } catch (e) {
      console.error(e)
    }
  }

  async function ensureSession(): Promise<number> {
    if (activeSessionId) return activeSessionId
    const newSession = await createChatSession('New Welfare Conversation')
    setActiveSessionId(newSession.id)
    const url = new URL(window.location.href)
    url.searchParams.set('session', newSession.id.toString())
    window.history.replaceState({}, '', url.toString())
    window.dispatchEvent(new CustomEvent('scheme:session-updated'))
    return newSession.id
  }

  // Quick Dictation Mic (Voice directly inside Chat)
  async function toggleDictation() {
    if (isDictating) {
      if (dictationRecorderRef.current) {
        dictationRecorderRef.current.stop()
      }
      setIsDictating(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      dictationRecorderRef.current = recorder
      dictationChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) dictationChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(dictationChunksRef.current, { type: 'audio/mp3' })
        const audioFile = new File([audioBlob], 'dictation.mp3', { type: 'audio/mp3' })
        try {
          const res = await transcribeAudio(audioFile)
          if (res.transcribed_text) {
            setInput((prev) => (prev ? `${prev} ${res.transcribed_text}` : res.transcribed_text))
          }
        } catch (err) {
          setError('Speech dictation failed')
        }
      }

      recorder.start()
      setIsDictating(true)
    } catch (err) {
      setError('Microphone permission required for dictation')
    }
  }

  async function handleSend(textToSend?: string) {
    const text = (textToSend || input).trim()
    if (!text || isStreaming) return

    setInput('')
    setError(null)

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      citations: [],
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsStreaming(true)
    setStreamBuffer('')
    setStreamCitations([])

    let accumulatedText = ''
    let accumulatedCitations: string[] = []

    try {
      const sessionId = await ensureSession()

      await streamChatMessage(
        sessionId,
        text,
        (token, citations) => {
          accumulatedText += token
          setStreamBuffer(accumulatedText)
          if (citations && citations.length > 0) {
            accumulatedCitations = Array.from(new Set([...accumulatedCitations, ...citations]))
            setStreamCitations(accumulatedCitations)
          }
        },
        async () => {
          setIsStreaming(false)
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              role: 'assistant',
              content: accumulatedText,
              citations: accumulatedCitations,
              created_at: new Date().toISOString(),
            },
          ])
          setStreamBuffer('')
          setStreamCitations([])
          await loadSessionMessages(sessionId)
          window.dispatchEvent(new CustomEvent('scheme:session-updated'))
        },
        async (err) => {
          console.warn('SSE fallback to standard HTTP POST:', err)
          try {
            const resp = await sendChatMessage(sessionId, text)
            setMessages((prev) => [
              ...prev,
              {
                id: resp.id,
                role: 'assistant',
                content: resp.content,
                citations: resp.citations || [],
                created_at: resp.created_at,
              },
            ])
            await loadSessionMessages(sessionId)
            window.dispatchEvent(new CustomEvent('scheme:session-updated'))
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

  function handleCopyMessage(id: number, content: string) {
    navigator.clipboard.writeText(content)
    setCopiedMsgId(id)
    setTimeout(() => setCopiedMsgId(null), 2000)
  }

  function handleSpeakMessage(id: number, content: string) {
    if (speakingMsgId === id) {
      if (window.speechSynthesis) window.speechSynthesis.cancel()
      setSpeakingMsgId(null)
      return
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const cleanText = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*#_`]/g, '')
      const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 450))
      utterance.lang = 'hi-IN'
      utterance.rate = 1.05

      utterance.onend = () => setSpeakingMsgId(null)
      utterance.onerror = () => setSpeakingMsgId(null)

      setSpeakingMsgId(id)
      window.speechSynthesis.speak(utterance)
    }
  }

  const userName = citizen?.profile?.full_name || citizen?.email?.split('@')[0] || 'Citizen'
  const isGreetingEmptyState = messages.length === 0 && !isStreaming

  // Time of day greeting
  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#0a0a0c] text-zinc-100 relative">
      
      {/* Top App Bar */}
      <header className="h-11 px-4 sm:px-6 border-b border-zinc-800/50 bg-[#0a0a0c]/80 backdrop-blur-xs flex items-center justify-between gap-3 z-10 shrink-0">
        <div className="flex items-center gap-2">
          
          {/* Model Selector Pill */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setModelDropdownOpen(!modelDropdownOpen)
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs text-zinc-300 transition-all cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-blue-400" />
              <span>
                {selectedModel === 'flash'
                  ? 'Gemini 3.7 Flash'
                  : selectedModel === 'bitmask'
                  ? 'In-Memory Bitmask'
                  : 'Deep Reasoner'}
              </span>
              <ChevronDown className="h-3 w-3 text-zinc-500 ml-0.5" />
            </button>

            {/* Model Dropdown Menu */}
            {modelDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-60 rounded-xl bg-zinc-900 border border-zinc-750 shadow-xl p-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                <div
                  onClick={() => setSelectedModel('flash')}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedModel === 'flash' ? 'bg-zinc-800 text-zinc-100' : 'hover:bg-zinc-850 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Gemini 3.7 Flash</span>
                    {selectedModel === 'flash' && <Check className="h-3.5 w-3.5 text-blue-400" />}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Fast synthesis with official OKF rules</p>
                </div>

                <div
                  onClick={() => setSelectedModel('bitmask')}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedModel === 'bitmask' ? 'bg-zinc-800 text-zinc-100' : 'hover:bg-zinc-850 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">In-Memory Bitmask</span>
                    {selectedModel === 'bitmask' && <Check className="h-3.5 w-3.5 text-blue-400" />}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">0.85ms pure integer binary evaluations</p>
                </div>

                <div
                  onClick={() => setSelectedModel('deep')}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedModel === 'deep' ? 'bg-zinc-800 text-zinc-100' : 'hover:bg-zinc-850 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Deep Document Reasoner</span>
                    {selectedModel === 'deep' && <Check className="h-3.5 w-3.5 text-blue-400" />}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Multi-step household eligibility graph</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Conversation / Empty State Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col">
        
        {/* Error Alert */}
        {error && (
          <div className="max-w-2xl mx-auto w-full mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center justify-between gap-2">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="p-1 text-red-400 hover:text-white rounded hover:bg-red-900/50"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Minimal Conversational Empty State */}
        {isGreetingEmptyState && (
          <div className="max-w-2xl mx-auto w-full my-auto py-8 sm:py-12 flex flex-col items-center text-center space-y-6 animate-in fade-in duration-200">
            
            {/* 1. Context Label & Greeting */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-zinc-500 tracking-wide">
                Scheme AI · Government benefits assistant
              </span>
              
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100">
                {timeGreeting}, {userName}.
              </h1>
              
              <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
                Find government schemes, scholarships, benefits, and services you may qualify for.
              </p>
            </div>

            {/* 2. Primary Dominated Chat Composer */}
            <ChatComposer
              input={input}
              setInput={setInput}
              onSend={handleSend}
              isStreaming={isStreaming}
              isDictating={isDictating}
              onToggleDictation={toggleDictation}
              citizenState={citizen?.profile?.state || 'India'}
              autoFocus
            />

            {/* 3. Lightweight Suggested Actions */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {SUGGESTIONS.map((s, idx) => (
                <SuggestionChip
                  key={idx}
                  icon={s.icon}
                  label={s.label}
                  prompt={s.prompt}
                  onClick={handleSend}
                />
              ))}
            </div>
          </div>
        )}

        {/* Active Conversation Messages */}
        {!isGreetingEmptyState && (
          <div className="max-w-3xl mx-auto w-full space-y-6 flex-1">
            {messages.map((m) => {
              const isUser = m.role === 'user'
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  {/* Message Bubble */}
                  {isUser ? (
                    <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl bg-zinc-800 text-zinc-100 px-4 py-2.5 text-sm leading-relaxed">
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ) : (
                    <div className="w-full space-y-2 text-left">
                      <div className="prose prose-invert max-w-none text-zinc-200 text-[15px] leading-relaxed">
                        <MarkdownMessage content={m.content} />
                      </div>

                      {/* Compact Grounded Sources */}
                      {m.citations && m.citations.length > 0 && (
                        <div className="pt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-medium text-zinc-500 mr-1">
                            Sources:
                          </span>
                          {m.citations.map((c, cIdx) => (
                            <span
                              key={cIdx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px]"
                            >
                              <ShieldCheck className="h-3 w-3 text-blue-400" />
                              <span className="capitalize">{c.replace(/_/g, ' ')}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Assistant Actions Bar */}
                      <div className="flex items-center gap-2 pt-1 text-zinc-500 text-xs">
                        <button
                          onClick={() => handleCopyMessage(m.id, m.content)}
                          className="hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-850 flex items-center gap-1 cursor-pointer"
                          title="Copy text"
                        >
                          {copiedMsgId === m.id ? (
                            <>
                              <CheckCheck className="h-3 w-3 text-emerald-400" />
                              <span className="text-[11px] text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleSpeakMessage(m.id, m.content)}
                          className={`hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-850 flex items-center gap-1 cursor-pointer ${
                            speakingMsgId === m.id ? 'text-blue-400 animate-pulse' : ''
                          }`}
                          title="Listen to audio"
                        >
                          <Volume2 className="h-3 w-3" />
                          <span className="text-[11px]">
                            {speakingMsgId === m.id ? 'Speaking...' : 'Listen'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Active SSE Streaming Assistant Response */}
            {isStreaming && (
              <div className="w-full space-y-2 text-left animate-in fade-in duration-150">
                <div className="prose prose-invert max-w-none text-zinc-200 text-[15px] leading-relaxed">
                  {streamBuffer ? (
                    <MarkdownMessage content={streamBuffer} />
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 py-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                      <span>Checking eligibility rules...</span>
                    </div>
                  )}
                </div>

                {streamCitations.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-medium text-zinc-500 mr-1">
                      Sources:
                    </span>
                    {streamCitations.map((c, cIdx) => (
                      <span
                        key={cIdx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px]"
                      >
                        <ShieldCheck className="h-3 w-3 text-blue-400" />
                        <span>{c}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Pinned Bottom Chat Composer */}
      {!isGreetingEmptyState && (
        <footer className="p-3 sm:p-4 bg-[#0a0a0c]/90 backdrop-blur-xs border-t border-zinc-800/60 shrink-0">
          <div className="max-w-3xl mx-auto w-full">
            <ChatComposer
              input={input}
              setInput={setInput}
              onSend={handleSend}
              isStreaming={isStreaming}
              isDictating={isDictating}
              onToggleDictation={toggleDictation}
              citizenState={citizen?.profile?.state || 'India'}
            />
          </div>
        </footer>
      )}
    </div>
  )
}
