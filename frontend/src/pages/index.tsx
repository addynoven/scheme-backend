import { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Plus,
  ShieldCheck,
  Loader2,
  Trash2,
  Edit2,
  Check,
  X,
  Volume2,
  Copy,
  CheckCheck,
  PanelLeftClose,
  PanelLeft,
  GraduationCap,
  Briefcase,
  Tractor,
  Home,
  HeartPulse,
  Search,
  Mic,
  MicOff,
  Radio,
  ChevronDown,
} from 'lucide-react'
import {
  type ChatSession,
  type ChatMessage,
  listChatSessions,
  createChatSession,
  getChatSession,
  updateChatSessionTitle,
  deleteChatSession,
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
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamBuffer, setStreamBuffer] = useState('')
  const [streamCitations, setStreamCitations] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [citizen, setCitizen] = useState<any | null>(null)

  // Model & Mode selector
  const [selectedModel, setSelectedModel] = useState<'flash' | 'bitmask' | 'deep'>('flash')
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)

  // Voice States
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
  const [isDictating, setIsDictating] = useState(false)
  const dictationRecorderRef = useRef<MediaRecorder | null>(null)
  const dictationChunksRef = useRef<Blob[]>([])

  // Session Renaming State
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  // Audio Playback & Copy State
  const [speakingMsgId, setSpeakingMsgId] = useState<number | null>(null)
  const [copiedMsgId, setCopiedMsgId] = useState<number | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Listen to global events from App shell
  useEffect(() => {
    const handleNewChatEvent = () => handleNewSession()
    const handleSessionUpdated = () => {
      if (activeSessionId) loadSessionMessages(activeSessionId)
      loadSessions()
    }

    window.addEventListener('scheme:new-chat', handleNewChatEvent)
    window.addEventListener('scheme:session-updated', handleSessionUpdated)

    return () => {
      window.removeEventListener('scheme:new-chat', handleNewChatEvent)
      window.removeEventListener('scheme:session-updated', handleSessionUpdated)
    }
  }, [activeSessionId])

  // Load user profile and sessions on mount
  useEffect(() => {
    citizenGetMe()
      .then(setCitizen)
      .catch(() => {})
    loadSessions()
  }, [])

  useEffect(() => {
    if (activeSessionId) {
      loadSessionMessages(activeSessionId)
      const url = new URL(window.location.href)
      url.searchParams.set('session', activeSessionId.toString())
      window.history.replaceState({}, '', url.toString())
    }
  }, [activeSessionId])

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

  async function loadSessions() {
    try {
      const data = await listChatSessions()
      setSessions(data)

      const params = new URLSearchParams(window.location.search)
      const urlSessionId = params.get('session') ? parseInt(params.get('session')!, 10) : null

      if (urlSessionId && data.some((s) => s.id === urlSessionId)) {
        setActiveSessionId(urlSessionId)
      } else if (data.length > 0) {
        setActiveSessionId(data[0].id)
      } else {
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
      const session = await createChatSession('New Welfare Conversation')
      setSessions((prev) => [session, ...prev])
      setActiveSessionId(session.id)
      setMessages([])
      setInput('')
    } catch (e: any) {
      setError(e.message || 'Failed to create session')
    }
  }

  async function handleRenameSession(id: number, e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!editingTitle.trim()) {
      setEditingSessionId(null)
      return
    }
    try {
      const updated = await updateChatSessionTitle(id, editingTitle.trim())
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title: updated.title } : s)))
      setEditingSessionId(null)
    } catch (err: any) {
      setError(err.message || 'Failed to rename chat')
    }
  }

  async function handleDeleteSession(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this conversation?')) return

    try {
      await deleteChatSession(id)
      const remaining = sessions.filter((s) => s.id !== id)
      setSessions(remaining)
      if (activeSessionId === id) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id)
        } else {
          handleNewSession()
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete chat')
    }
  }

  // Quick Dictation Mic (Speech-to-Text directly into input)
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
        } catch (err: any) {
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
    if (!text || !activeSessionId || isStreaming) return

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
      await streamChatMessage(
        activeSessionId,
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
          await loadSessionMessages(activeSessionId)
          const updatedSessions = await listChatSessions()
          setSessions(updatedSessions)
        },
        async (err) => {
          console.warn('SSE fallback to standard HTTP POST:', err)
          try {
            const resp = await sendChatMessage(activeSessionId, text)
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

  const filteredSessions = sessions.filter((s) =>
    (s.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const userName = citizen?.profile?.full_name || citizen?.email?.split('@')[0] || 'Citizen'
  const isGreetingEmptyState = messages.length === 0 && !isStreaming

  // Time of day greeting
  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#09090b] text-zinc-100 relative">
      
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

      {/* History Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64 sm:w-72' : 'w-0'
        } transition-all duration-300 ease-in-out border-r border-zinc-800/80 bg-[#0c0c0e] flex flex-col z-20 shrink-0 overflow-hidden select-none`}
      >
        {/* New Chat Header */}
        <div className="p-3 border-b border-zinc-800/80 flex items-center justify-between gap-2">
          <button
            onClick={handleNewSession}
            className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600 text-xs font-semibold text-zinc-200 flex items-center justify-between gap-2 transition-all shadow-sm group"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>New Conversation</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">⌘K</span>
          </button>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* Search Chats */}
        <div className="p-2.5">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-zinc-900/90 border border-zinc-800/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-1">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Recent Welfare Chats
          </div>

          {filteredSessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-500">
              No conversations found
            </div>
          ) : (
            filteredSessions.map((s) => {
              const isActive = s.id === activeSessionId
              const isEditing = editingSessionId === s.id

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    if (!isEditing) setActiveSessionId(s.id)
                  }}
                  className={`group relative rounded-xl px-2.5 py-2 flex items-center justify-between gap-2 cursor-pointer transition-all ${
                    isActive
                      ? 'bg-zinc-800/90 border border-zinc-700/80 text-white font-medium shadow-sm'
                      : 'hover:bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                    <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                    {isEditing ? (
                      <input
                        type="text"
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSession(s.id, e)
                          if (e.key === 'Escape') setEditingSessionId(null)
                        }}
                        className="bg-zinc-950 border border-blue-500 text-xs text-white rounded px-1.5 py-0.5 w-full focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate text-xs">{s.title || 'New Welfare Conversation'}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRenameSession(s.id)
                          }}
                          className="p-1 hover:text-emerald-400 text-zinc-400"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingSessionId(null)
                          }}
                          className="p-1 hover:text-red-400 text-zinc-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingSessionId(s.id)
                            setEditingTitle(s.title)
                          }}
                          className="p-1 hover:text-zinc-200 text-zinc-500"
                          title="Rename"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className="p-1 hover:text-red-400 text-zinc-500"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Sidebar Footer - Citizen Context Pill */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="h-7 w-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
              {userName[0]?.toUpperCase()}
            </div>
            <div className="truncate text-left flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-200 truncate">{userName}</p>
              <p className="text-[10px] text-emerald-400 font-medium truncate">
                {citizen?.profile ? `${citizen.profile.state} · ${citizen.profile.occupation}` : 'Profile Grounded'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Center Canvas */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#09090b]">
        
        {/* Top Floating App Bar */}
        <div className="h-12 px-4 border-b border-zinc-800/60 bg-[#09090b]/80 backdrop-blur-md flex items-center justify-between gap-3 z-10 shrink-0">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Open sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            )}

            {/* Model Selector Pill */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setModelDropdownOpen(!modelDropdownOpen)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-semibold text-zinc-200 transition-all"
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

          {/* Right Header Badges */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-red-500/15 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 hover:text-amber-200 text-xs font-semibold transition-all group"
            >
              <Radio className="h-3.5 w-3.5 text-amber-400 group-hover:animate-pulse" />
              <span className="hidden sm:inline">Voice Mode</span>
            </button>
          </div>
        </div>

        {/* Chat Messages / Hero Greeting Container */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
          
          {error && (
            <div className="max-w-2xl mx-auto p-3.5 rounded-2xl bg-red-950/70 border border-red-800/80 text-red-300 text-xs flex items-center justify-between gap-2 shadow-lg">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="p-1 text-red-400 hover:text-white rounded-lg hover:bg-red-900/50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Hero Greeting & Empty State (Matching Claude / Gemini / ChatGPT Screenshots) */}
          {isGreetingEmptyState && (
            <div className="max-w-2xl mx-auto my-auto pt-8 sm:pt-16 pb-8 text-center flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-300">
              
              {/* Subtle Ambient Radial Aura */}
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
                    How can I help you and your family discover welfare schemes, scholarships, and DBT benefits today?
                  </p>
                </div>
              </div>

              {/* Quick Starter Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left pt-2">
                {QUICK_STARTERS.map((s, idx) => {
                  const Icon = s.icon
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSend(s.prompt)}
                      className={`p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition-all flex items-start gap-3 text-left group shadow-sm active:scale-[0.99]`}
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

          {/* Render Active Conversation Thread */}
          {messages.map((m) => {
            const isUser = m.role === 'user'
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
              >
                {!isUser && (
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20 mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div className={`space-y-1.5 max-w-[88%] sm:max-w-[82%] ${isUser ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`rounded-2xl p-4 sm:p-5 shadow-md ${
                      isUser
                        ? 'bg-zinc-800 text-white rounded-br-none border border-zinc-700/80 font-normal leading-relaxed'
                        : 'bg-zinc-900/90 text-zinc-200 rounded-bl-none border border-zinc-800/90 backdrop-blur-md leading-relaxed'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                    ) : (
                      <MarkdownMessage content={m.content} />
                    )}

                    {/* Citations Badges */}
                    {!isUser && m.citations && m.citations.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mr-1">
                          Verified Sources:
                        </span>
                        {m.citations.map((c, cIdx) => {
                          const name = c.replace(/_/g, ' ')
                          return (
                            <span
                              key={cIdx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-300 text-[10px] font-medium"
                            >
                              <ShieldCheck className="h-2.5 w-2.5 text-blue-400" />
                              <span className="capitalize">{name}</span>
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Assistant Action Bar */}
                  {!isUser && (
                    <div className="flex items-center gap-2 px-1 text-zinc-400 text-xs">
                      <button
                        onClick={() => handleCopyMessage(m.id, m.content)}
                        className="hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-800 flex items-center gap-1"
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
                        className={`hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-800 flex items-center gap-1 ${
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
                  )}
                </div>

                {isUser && (
                  <div className="h-8 w-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            )
          })}

          {/* Active SSE Streaming Assistant Bubble */}
          {isStreaming && (
            <div className="flex gap-3 max-w-3xl mr-auto justify-start">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20 mt-1 animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <div className="space-y-1.5 max-w-[88%] sm:max-w-[82%] text-left">
                <div className="rounded-2xl rounded-bl-none p-4 sm:p-5 shadow-md bg-zinc-900/90 border border-blue-500/30 text-zinc-200 backdrop-blur-md">
                  {streamBuffer ? (
                    <MarkdownMessage content={streamBuffer} />
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-blue-400 py-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Synthesizing citizen response with Gemini 3.7 Flash...</span>
                    </div>
                  )}

                  {streamCitations.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-1.5">
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
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Signature Floating Input Pill Capsule */}
        <div className="p-3 sm:p-4 bg-[#09090b]/90 backdrop-blur-xl border-t border-zinc-800/80 shrink-0">
          <div className="max-w-3xl mx-auto">
            
            {/* The Capsule Container */}
            <div className="relative rounded-2xl sm:rounded-full bg-zinc-900/90 border border-zinc-700/60 focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/50 shadow-2xl transition-all p-1.5 sm:px-3 sm:py-2 flex items-center gap-2">
              
              {/* Plus / Attach Button */}
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

              {/* Text Area */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything in Hindi, English, Marathi (e.g. 'Can I get scholarship in MP?')"
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

              {/* Live Conversational Voice Capsule Waveform Button */}
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

            {/* Micro Caption */}
            <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2 px-2">
              <span>Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline</span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck className="h-3 w-3" />
                Grounded to {citizen?.profile?.state || 'India'} OKF Rules
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
