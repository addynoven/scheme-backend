import { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  PlusCircle,
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
  synthesizeSpeech,
} from '@/lib/api'
import { MarkdownMessage } from '@/components/MarkdownMessage'

export default function ChatPage() {
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
  
  // Session Renaming State
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  // Audio Playback & Copy State
  const [speakingMsgId, setSpeakingMsgId] = useState<number | null>(null)
  const [copiedMsgId, setCopiedMsgId] = useState<number | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize from URL or load existing sessions
  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    if (activeSessionId) {
      loadSessionMessages(activeSessionId)
      // Update URL search query without page reload
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

  async function loadSessions() {
    try {
      const data = await listChatSessions()
      setSessions(data)

      // Check URL query param for session ID
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
    if (!confirm('Are you sure you want to delete this chat conversation?')) return

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

  async function handleSend(textToSend?: string) {
    const text = (textToSend || input).trim()
    if (!text || !activeSessionId || isStreaming) return

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setError(null)

    // Append User Message to local state immediately
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
          // Refresh sessions list to update active title if auto-generated
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopyMessage = (id: number, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMsgId(id)
    setTimeout(() => setCopiedMsgId(null), 2000)
  }

  const handleSpeakMessage = async (id: number, text: string) => {
    if (speakingMsgId === id && currentAudioRef.current) {
      currentAudioRef.current.pause()
      setSpeakingMsgId(null)
      return
    }

    try {
      setSpeakingMsgId(id)
      const res = await synthesizeSpeech(text.slice(0, 400), 'hi')
      if (res.audio_base64) {
        const audio = new Audio(`data:audio/mp3;base64,${res.audio_base64}`)
        currentAudioRef.current = audio
        audio.onended = () => setSpeakingMsgId(null)
        audio.onerror = () => setSpeakingMsgId(null)
        await audio.play()
      } else {
        setSpeakingMsgId(null)
      }
    } catch (err) {
      console.warn('Speech synthesis error:', err)
      setSpeakingMsgId(null)
    }
  }

  // Filtered Sessions
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group Sessions by Time
  const now = new Date()
  const todaySessions = filteredSessions.filter((s) => {
    const d = new Date(s.updated_at || s.created_at)
    return d.toDateString() === now.toDateString()
  })
  const olderSessions = filteredSessions.filter((s) => {
    const d = new Date(s.updated_at || s.created_at)
    return d.toDateString() !== now.toDateString()
  })

  const activeSession = sessions.find((s) => s.id === activeSessionId)

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-4 sm:-m-6 lg:-m-8 bg-zinc-950 overflow-hidden text-zinc-100">
      {/* ========================================================================= */}
      {/* 1. CHATGTP-GRADE SIDEBAR (COLLAPSIBLE)                                   */}
      {/* ========================================================================= */}
      <aside
        className={`${
          sidebarOpen ? 'w-72 sm:w-80' : 'w-0 -translate-x-full'
        } shrink-0 transition-all duration-300 ease-in-out border-r border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl flex flex-col z-20 overflow-hidden`}
      >
        {/* Top Action Header */}
        <div className="p-3 border-b border-zinc-800/80 flex items-center gap-2">
          <button
            onClick={handleNewSession}
            className="flex-1 py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Welfare Chat</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* Search Chats */}
        <div className="p-3 pb-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 transition-colors"
            />
          </div>
        </div>

        {/* Session List Grouped */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs">
          {/* Today Group */}
          {todaySessions.length > 0 && (
            <div>
              <span className="px-2 text-[10px] font-bold tracking-wider uppercase text-zinc-500">Today</span>
              <div className="mt-1 space-y-0.5">
                {todaySessions.map((s) => renderSessionItem(s))}
              </div>
            </div>
          )}

          {/* Older History Group */}
          {olderSessions.length > 0 && (
            <div>
              <span className="px-2 text-[10px] font-bold tracking-wider uppercase text-zinc-500">Previous Chats</span>
              <div className="mt-1 space-y-0.5">
                {olderSessions.map((s) => renderSessionItem(s))}
              </div>
            </div>
          )}

          {filteredSessions.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-40" />
              <span>No conversations found</span>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/40 text-[11px] text-zinc-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            <span>Sovereign Storage</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">● Online</span>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CHAT CONTAINER                                                    */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl px-4 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Open Sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                  {activeSession?.title || 'Citizen Welfare Consultation'}
                </h2>
                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                  <span className="flex items-center gap-1 text-blue-400 font-medium">
                    <Sparkles className="h-2.5 w-2.5" />
                    Gemini 3.7 Flash
                  </span>
                  <span>•</span>
                  <span>Multi-Worker Pipeline (SQL + OKF)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewSession}
              className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs text-red-300 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Chat Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Empty State / Quick Starters */}
          {messages.length === 0 && !isStreaming && (
            <div className="max-w-2xl mx-auto py-8 sm:py-12 text-center">
              <div className="h-16 w-16 mx-auto rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 mb-4 animate-pulse">
                <ShieldCheck className="h-9 w-9" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Sovereign Citizen Welfare AI Advisor
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                Powered by deterministic rule bitmasks, canonical government knowledge files, and Gemini 3.7 Flash reasoning.
              </p>

              {/* Quick Starter Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8 text-left">
                <button
                  onClick={() => handleSend('What scholarships are available for college and higher education?')}
                  className="p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-blue-500/40 transition-all group text-left"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    <span>College Scholarships</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">Full tuition fee waivers & post-matric grants</p>
                </button>

                <button
                  onClick={() => handleSend('Can government help with loans or subsidies to open a new business in MP?')}
                  className="p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-indigo-500/40 transition-all group text-left"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                    <Briefcase className="h-4 w-4 shrink-0" />
                    <span>Business & MSME Loans</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">PM Mudra (₹10-20L) & PMEGP subsidies</p>
                </button>

                <button
                  onClick={() => handleSend('Kya kisan bhaiyon ke liye koi naye anudan ya PM-Kisan scheme details hain?')}
                  className="p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-emerald-500/40 transition-all group text-left"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                    <Tractor className="h-4 w-4 shrink-0" />
                    <span>Agriculture & Farmers</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">PM-Kisan ₹6,000 & crop insurance support</p>
                </button>

                <button
                  onClick={() => handleSend('Mujhe pakka ghar banane ke liye PM Awas Yojana me kitni sahayata milti hai?')}
                  className="p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-amber-500/40 transition-all group text-left"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 group-hover:text-amber-300">
                    <Home className="h-4 w-4 shrink-0" />
                    <span>Housing Grants (PMAY)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">₹1.2L to ₹1.3L construction financial grant</p>
                </button>
              </div>
            </div>
          )}

          {/* Render Completed Message History */}
          {messages.map((m) => {
            const isUser = m.role === 'user'
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
              >
                {!isUser && (
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20 mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div className={`space-y-1.5 max-w-[88%] sm:max-w-[82%] ${isUser ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`rounded-2xl p-4 sm:p-5 shadow-md ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-none ml-auto text-left'
                        : 'bg-zinc-900/90 border border-zinc-800/90 rounded-bl-none text-zinc-200 backdrop-blur-md'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    ) : (
                      <MarkdownMessage content={m.content} />
                    )}

                    {/* Citations & Evidence Pills */}
                    {!isUser && m.citations && m.citations.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mr-1">
                          Canonical Sources:
                        </span>
                        {m.citations.map((c, cIdx) => {
                          const name = c.replace('knowledge/schemes/', '').replace('.md', '').replace(/-/g, ' ')
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

                  {/* Assistant Action Bar (Copy & Voice Speak) */}
                  {!isUser && (
                    <div className="flex items-center gap-2 px-1 text-zinc-400 text-xs">
                      <button
                        onClick={() => handleCopyMessage(m.id, m.content)}
                        className="hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-800 flex items-center gap-1"
                        title="Copy to clipboard"
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
                        title="Listen to response"
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

        {/* Floating Input Box */}
        <div className="p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800/80">
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-2xl bg-zinc-900/90 border border-zinc-700/60 focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/50 shadow-2xl transition-all p-1.5 flex items-end gap-2">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask in Hindi, English, Hinglish, Marathi, etc. (e.g. 'Can I get scholarship for college in MP?')"
                disabled={isStreaming}
                className="flex-1 bg-transparent border-0 resize-none py-2 px-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none max-h-44 disabled:opacity-50"
              />

              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2 px-1">
              <span>Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline</span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <HeartPulse className="h-3 w-3" />
                Live In-Memory Bitmask + Grounded Government OKF
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )

  // Helper renderer for session item in sidebar
  function renderSessionItem(s: ChatSession) {
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
            ? 'bg-blue-600/15 border border-blue-500/40 text-blue-300 font-semibold shadow-sm shadow-blue-500/10'
            : 'hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-transparent'
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
              className="bg-zinc-800 border border-blue-500 text-xs text-white rounded px-1.5 py-0.5 w-full focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate">{s.title || 'New Welfare Conversation'}</span>
          )}
        </div>

        {/* Edit & Delete Action Buttons on Hover or Active */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRenameSession(s.id)
                }}
                className="p-1 hover:text-emerald-400 text-zinc-400"
                title="Save Title"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingSessionId(null)
                }}
                className="p-1 hover:text-red-400 text-zinc-400"
                title="Cancel"
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
                title="Rename Chat"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => handleDeleteSession(s.id, e)}
                className="p-1 hover:text-red-400 text-zinc-500"
                title="Delete Chat"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>
    )
  }
}
