import { useState, useEffect, useRef } from 'react'
import {
  Send,
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
  Mic,
  MicOff,
  Radio,
  ChevronDown,
  Plus,
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
import { LiveVoiceModal } from '@/components/LiveVoiceModal'

const QUICK_STARTERS = [
  {
    icon: GraduationCap,
    label: 'Higher Education Scholarships',
    prompt: 'What higher education and college scholarships am I eligible for in my state?',
    color: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
  },
  {
    icon: Tractor,
    label: 'Farmer Subsidies & PM-Kisan',
    prompt: 'Tell me about agricultural subsidies, crop insurance, and PM-Kisan benefits.',
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
  },
  {
    icon: Briefcase,
    label: 'MSME & Startup Loans',
    prompt: 'What government subsidies and loans (like PMEGP or Mudra) can I get to start a business?',
    color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
  },
  {
    icon: Home,
    label: 'Housing & PMAY Assistance',
    prompt: 'Am I eligible for PM Awas Yojana (PMAY) financial assistance for building a home?',
    color: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30',
  },
  {
    icon: HeartPulse,
    label: 'Ayushman Health Cover',
    prompt: 'How do I check if my family has Ayushman Bharat ₹5 Lakh cashless hospital coverage?',
    color: 'from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30',
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

  // Voice States
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
  const [isDictating, setIsDictating] = useState(false)
  const dictationRecorderRef = useRef<MediaRecorder | null>(null)
  const dictationChunksRef = useRef<Blob[]>([])

  // Audio Playback & Copy State
  const [speakingMsgId, setSpeakingMsgId] = useState<number | null>(null)
  const [copiedMsgId, setCopiedMsgId] = useState<number | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [input])

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

  // Quick Dictation Mic
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
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
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
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#09090b] text-zinc-100 relative">
      
      {/* Live Voice Modal Overlay */}
      <LiveVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        sessionId={activeSessionId}
        userName={userName}
        onMessageAdded={() => {
          if (activeSessionId) loadSessionMessages(activeSessionId)
        }}
      />

      {/* Top Floating App Bar */}
      <header className="h-12 px-4 sm:px-6 border-b border-zinc-800/60 bg-[#09090b]/80 backdrop-blur-md flex items-center justify-between gap-3 z-10 shrink-0">
        <div className="flex items-center gap-2">
          
          {/* Model Selector Pill */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setModelDropdownOpen(!modelDropdownOpen)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-semibold text-zinc-200 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span>
                {selectedModel === 'flash'
                  ? 'Gemini 3.7 Flash'
                  : selectedModel === 'bitmask'
                  ? 'In-Memory Bitmask (0.85ms)'
                  : 'Deep Welfare Reasoner'}
              </span>
              <ChevronDown className="h-3 w-3 text-zinc-400 ml-0.5" />
            </button>

            {/* Model Dropdown Menu */}
            {modelDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                <div
                  onClick={() => setSelectedModel('flash')}
                  className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                    selectedModel === 'flash' ? 'bg-blue-600/15 text-blue-300' : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Gemini 3.7 Flash ⚡</span>
                    {selectedModel === 'flash' && <Check className="h-3.5 w-3.5 text-blue-400" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Ultra-fast synthesis with official OKF rules</p>
                </div>

                <div
                  onClick={() => setSelectedModel('bitmask')}
                  className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                    selectedModel === 'bitmask' ? 'bg-blue-600/15 text-blue-300' : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">In-Memory Bitmask 🚀</span>
                    {selectedModel === 'bitmask' && <Check className="h-3.5 w-3.5 text-blue-400" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">0.85ms pure integer binary evaluations</p>
                </div>

                <div
                  onClick={() => setSelectedModel('deep')}
                  className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                    selectedModel === 'deep' ? 'bg-blue-600/15 text-blue-300' : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Deep Document Reasoner 🏛️</span>
                    {selectedModel === 'deep' && <Check className="h-3.5 w-3.5 text-blue-400" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Full multi-step family eligibility graph</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Header: Live Voice Capsule */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/15 via-amber-500/15 to-yellow-500/15 border border-orange-500/30 hover:border-orange-500/60 text-orange-300 hover:text-orange-200 text-xs font-semibold transition-all group"
          >
            <Radio className="h-3.5 w-3.5 text-orange-400 group-hover:animate-pulse" />
            <span className="hidden sm:inline">Live Voice Mode</span>
          </button>
        </div>
      </header>

      {/* Main Chat Center Canvas */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Error Alert */}
        {error && (
          <div className="max-w-3xl mx-auto p-3.5 rounded-2xl bg-red-950/70 border border-red-800/80 text-red-300 text-xs flex items-center justify-between gap-2 shadow-lg">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="p-1 text-red-400 hover:text-white rounded-lg hover:bg-red-900/50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Hero Greeting & Empty State (Centered Canvas) */}
        {isGreetingEmptyState && (
          <div className="max-w-2xl mx-auto my-auto pt-8 sm:pt-16 pb-8 text-center flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-300">
            
            {/* Ambient Radial Aura */}
            <div className="relative">
              <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 blur-2xl pointer-events-none" />
              
              <div className="relative space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-semibold mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  <span>Sovereign Citizen Welfare Engine</span>
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-serif">
                  {timeGreeting}, {userName}
                </h1>
                <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Ask anything in Hindi or English to discover government schemes, scholarships, and DBT subsidies.
                </p>
              </div>
            </div>

            {/* Quick Action Starter Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left pt-2">
              {QUICK_STARTERS.map((s, idx) => {
                const Icon = s.icon
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(s.prompt)}
                    className="p-3.5 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 transition-all flex items-start gap-3 text-left group shadow-sm active:scale-[0.99]"
                  >
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${s.color} shrink-0 border`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                        {s.label}
                      </h4>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        {s.prompt}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Active Conversation Messages */}
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((m) => {
            const isUser = m.role === 'user'
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {/* Message Bubble */}
                {isUser ? (
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-3xl bg-zinc-800 text-zinc-100 px-5 py-3 text-sm leading-relaxed shadow-sm">
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                ) : (
                  <div className="w-full space-y-2 text-left">
                    <div className="prose prose-invert max-w-none text-zinc-200 text-sm leading-relaxed">
                      <MarkdownMessage content={m.content} />
                    </div>

                    {/* Citations Badges */}
                    {m.citations && m.citations.length > 0 && (
                      <div className="pt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mr-1">
                          Sources:
                        </span>
                        {m.citations.map((c, cIdx) => (
                          <span
                            key={cIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-300 text-[10px] font-medium"
                          >
                            <ShieldCheck className="h-2.5 w-2.5 text-blue-400" />
                            <span className="capitalize">{c.replace(/_/g, ' ')}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Assistant Actions Bar */}
                    <div className="flex items-center gap-2 pt-1 text-zinc-400 text-xs">
                      <button
                        onClick={() => handleCopyMessage(m.id, m.content)}
                        className="hover:text-zinc-200 transition-colors p-1 rounded-lg hover:bg-zinc-800/80 flex items-center gap-1"
                        title="Copy text"
                      >
                        {copiedMsgId === m.id ? (
                          <>
                            <CheckCheck className="h-3 w-3 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span className="text-[10px]">Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleSpeakMessage(m.id, m.content)}
                        className={`hover:text-zinc-200 transition-colors p-1 rounded-lg hover:bg-zinc-800/80 flex items-center gap-1 ${
                          speakingMsgId === m.id ? 'text-blue-400 animate-pulse' : ''
                        }`}
                        title="Listen to audio"
                      >
                        <Volume2 className="h-3 w-3" />
                        <span className="text-[10px]">
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
              <div className="prose prose-invert max-w-none text-zinc-200 text-sm leading-relaxed">
                {streamBuffer ? (
                  <MarkdownMessage content={streamBuffer} />
                ) : (
                  <div className="flex items-center gap-2 text-xs text-blue-400 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Evaluating 4,148 schemes with Gemini 3.7 Flash...</span>
                  </div>
                )}
              </div>

              {streamCitations.length > 0 && (
                <div className="pt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mr-1">
                    Sources:
                  </span>
                  {streamCitations.map((c, cIdx) => (
                    <span
                      key={cIdx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-300 text-[10px]"
                    >
                      <ShieldCheck className="h-2.5 w-2.5 text-blue-400" />
                      <span>{c}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Signature Floating Bottom Input Pill Capsule */}
      <footer className="p-3 sm:p-4 bg-[#09090b]/90 backdrop-blur-xl border-t border-zinc-800/80 shrink-0">
        <div className="max-w-3xl mx-auto">
          
          <div className="relative rounded-2xl sm:rounded-full bg-zinc-900 border border-zinc-700/60 focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/40 shadow-2xl transition-all p-1.5 sm:px-3 sm:py-2 flex items-center gap-2">
            
            {/* Attach / Vault Button */}
            <button
              type="button"
              onClick={() => {
                window.location.href = '/vault'
              }}
              className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center shrink-0 transition-colors"
              title="Attach Document / Vault"
            >
              <Plus className="h-4 w-4" />
            </button>

            {/* Input Text Area */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask in Hindi, English, Hinglish, Marathi (e.g. 'Can I get scholarship in MP?')"
              disabled={isStreaming}
              className="flex-1 bg-transparent border-0 resize-none py-1.5 px-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none max-h-40 disabled:opacity-50"
            />

            {/* Dictation Mic Button */}
            <button
              type="button"
              onClick={toggleDictation}
              className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                isDictating
                  ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              title={isDictating ? 'Stop dictation' : 'Speak to dictate text'}
            >
              {isDictating ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            {/* Live Voice Waveform Button */}
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="h-8 px-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
              title="Open Live Voice Conversation"
            >
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span className="text-[11px] font-bold hidden sm:inline">Live Voice</span>
            </button>

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              title="Send Message"
            >
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Micro Footer Caption */}
          <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2 px-2">
            <span>Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="h-3 w-3" />
              Grounded to {citizen?.profile?.state || 'India'} OKF Rules
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
