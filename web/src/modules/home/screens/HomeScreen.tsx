'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MessageSquare,
  Plus,
  Mic,
  ShieldCheck,
  FolderLock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  User as UserIcon,
  Users,
  Compass,
  Brain,
} from 'lucide-react'
import {
  ChatWelcomeHero,
  ChatMessageList,
  ChatComposer,
} from '../components'
import { useChat } from '../hooks'
import { useChatStore } from '../store'
import { VoiceAssistantModal } from '@/modules/voice'
import { useAuth } from '@/modules/auth'
import { DevErrorModal } from '@/core/components/DevErrorModal'
import { MemoryEnginePanel } from '@/components/MemoryEnginePanel'

export function HomeScreen({ initialSessionId }: { initialSessionId?: number } = {}) {
  const {
    currentSessionId,
    sessions,
    messages,
    streamBuffer,
    streamCitations,
    isStreaming,
    isServiceBlocked,
    serviceErrorMessage,
    userName,
    selectSession,
    sendQuery,
    resetServiceBlock,
  } = useChat(initialSessionId)

  const { logout, user } = useAuth()
  const {
    isVoiceModalOpen,
    setIsVoiceModalOpen,
    isMemoryInspectorOpen,
    activeMemoryTrace,
    activePromptSnippet,
    openMemoryInspector,
    closeMemoryInspector,
  } = useChatStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [input, setInput] = useState('')
  const [isDictating, setIsDictating] = useState(false)

  function handleSend(text?: string) {
    const query = text || input
    if (query.trim()) {
      sendQuery(query)
      setInput('')
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sessions Sidebar */}
      <aside
        className={`bg-zinc-950 border-r border-zinc-800 transition-all duration-300 flex flex-col justify-between shrink-0 ${
          sidebarOpen ? 'w-64' : 'w-0 -translate-x-full md:w-16 md:translate-x-0'
        }`}
      >
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
          {sidebarOpen ? (
            <>
              <h2 className="text-xs font-bold uppercase text-zinc-400">Consultations</h2>
              <button
                onClick={() => selectSession(0)}
                className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                title="New Chat"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 mx-auto text-zinc-400 hover:text-white"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none">
          {sidebarOpen &&
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSession(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium truncate transition-all flex items-center gap-2 ${
                  currentSessionId === s.id
                    ? 'bg-zinc-800 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{s.title || `Consultation #${s.id}`}</span>
              </button>
            ))}
        </div>

        {/* Quick Nav Bottom */}
        {sidebarOpen && (
          <div className="p-3 border-t border-zinc-800 space-y-1 text-xs text-zinc-400">
            <Link
              href="/schemes"
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-900 hover:text-white transition-colors"
            >
              <Compass className="h-4 w-4 text-amber-400" /> Browse Schemes
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-900 hover:text-white transition-colors"
            >
              <UserIcon className="h-4 w-4 text-zinc-400" /> Citizen Profile
            </Link>
            <Link
              href="/check"
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-900 hover:text-white transition-colors"
            >
              <Sparkles className="h-4 w-4 text-blue-400" /> Eligibility Check
            </Link>
            <Link
              href="/vault"
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-900 hover:text-white transition-colors"
            >
              <FolderLock className="h-4 w-4 text-emerald-400" /> Citizen Vault
            </Link>
            <Link
              href="/household"
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-900 hover:text-white transition-colors"
            >
              <Users className="h-4 w-4 text-indigo-400" /> Household Mesh
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-400 hover:bg-red-950/30 hover:text-red-400 transition-colors text-left cursor-pointer"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        )}
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
        {/* Top Header */}
        <header className="h-14 border-b border-zinc-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-zinc-900 text-zinc-400 rounded-lg"
            >
              <Menu className="h-4 w-4" />
            </button>
            <h1 className="text-sm font-bold text-white">Multilingual AI Welfare Consultant</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => openMemoryInspector(null)}
              className="px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Memory Engine Inspector"
            >
              <Brain className="h-3.5 w-3.5 text-purple-400" />
              <span className="hidden sm:inline">Memory Engine</span>
            </button>
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
            >
              <Mic className="h-3.5 w-3.5" /> Live Voice
            </button>
            <Link
              href="/profile"
              className="p-1.5 sm:px-3 sm:py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-xl border border-zinc-800 flex items-center gap-1.5 transition-colors"
              title="Citizen Profile"
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{userName || user?.profile?.full_name || 'Profile'}</span>
            </Link>
            <button
              onClick={logout}
              className="p-1.5 sm:px-3 sm:py-1.5 bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 text-xs font-medium rounded-xl border border-zinc-800 hover:border-red-900/50 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Chat Timeline / Welcome */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-none">
          <div className="max-w-3xl mx-auto">
            {messages.length === 0 && !streamBuffer ? (
              <ChatWelcomeHero userName={userName} onSelectSuggestion={sendQuery} />
            ) : (
              <ChatMessageList
                messages={messages}
                streamBuffer={streamBuffer}
                streamCitations={streamCitations}
                isStreaming={isStreaming}
              />
            )}
          </div>
        </div>

        {/* Bottom Composer */}
        <footer className="p-4 border-t border-zinc-800 bg-zinc-950/80 shrink-0">
          <div className="max-w-3xl mx-auto">
            <ChatComposer
              input={input}
              setInput={setInput}
              onSend={handleSend}
              isStreaming={isStreaming}
              isDictating={isDictating}
              isServiceBlocked={isServiceBlocked}
              serviceErrorMessage={serviceErrorMessage}
              onResetServiceBlock={resetServiceBlock}
              onToggleDictation={() => setIsVoiceModalOpen(true)}
            />
          </div>
        </footer>
      </main>

      {/* Live Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />

      {/* Memory Engine Inspector Drawer */}
      <MemoryEnginePanel
        isOpen={isMemoryInspectorOpen}
        onClose={closeMemoryInspector}
        memoryTrace={activeMemoryTrace}
        activeMessageSnippet={activePromptSnippet || undefined}
      />

      {/* Centralized Dev Mode Error & Stack Trace Inspector Modal */}
      <DevErrorModal />
    </div>
  )
}
