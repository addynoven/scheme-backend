import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Link, useNavigate } from '@/router'
import {
  ShieldCheck,
  Search,
  FolderLock,
  LogOut,
  Plus,
  MessageSquare,
  Users,
  Radio,
  Menu,
  PanelLeftClose,
  PanelLeft,
  Edit2,
  Trash2,
  Check,
  X,
  User as UserIcon,
} from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { getCitizenToken, clearCitizenToken } from '@/lib/session'
import {
  citizenGetMe,
  listChatSessions,
  createChatSession,
  updateChatSessionTitle,
  deleteChatSession,
  type ChatSession,
} from '@/lib/api'
import { LiveVoiceModal } from '@/components/LiveVoiceModal'

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [citizenUid, setCitizenUid] = useState<string | null>(null)
  const [householdUid, setHouseholdUid] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [hasToken, setHasToken] = useState(false)
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  // Sidebar & Sessions State (Default open on desktop)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const isPublicRoute = location.pathname === '/login' || location.pathname === '/register'
  const isProfileRoute = location.pathname === '/profile'

  // Get active session ID from URL search params
  const searchParams = new URLSearchParams(location.search)
  const activeSessionId = searchParams.get('session') ? parseInt(searchParams.get('session')!, 10) : null

  const checkAuth = () => {
    const token = getCitizenToken()

    if (!token) {
      setHasToken(false)
      setCitizenUid(null)
      setHouseholdUid(null)
      setUserName(null)
      setUserProfile(null)
      setHasProfile(null)
      setIsChecking(false)
      if (!isPublicRoute) {
        navigate('/login')
      }
      return
    }

    setHasToken(true)
    citizenGetMe()
      .then((user) => {
        setCitizenUid(user.citizen_uid || 'CIT-VERIFIED')
        setHouseholdUid(user.household_uid || 'HHD-ACTIVE')
        setUserName(user.profile?.full_name || user.email?.split('@')[0] || 'Citizen')
        setUserProfile(user.profile || null)
        const profileOk = !!user.profile
        setHasProfile(profileOk)
        setIsChecking(false)
        if (isPublicRoute) {
          navigate('/')
        }
        loadSessions()
      })
      .catch(() => {
        clearCitizenToken()
        setHasToken(false)
        setCitizenUid(null)
        setHouseholdUid(null)
        setUserName(null)
        setUserProfile(null)
        setHasProfile(null)
        setIsChecking(false)
        if (!isPublicRoute) {
          navigate('/login')
        }
      })
  }

  useEffect(() => {
    checkAuth()
  }, [location.pathname])

  // Responsive sidebar: collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Listen to session update events
  useEffect(() => {
    const handleSessionsRefresh = () => loadSessions()
    window.addEventListener('scheme:session-updated', handleSessionsRefresh)
    return () => window.removeEventListener('scheme:session-updated', handleSessionsRefresh)
  }, [])

  async function loadSessions() {
    try {
      const data = await listChatSessions()
      setSessions(data)
    } catch (e) {
      console.error(e)
    }
  }

  async function handleNewChat() {
    try {
      const session = await createChatSession('New Welfare Conversation')
      setSessions((prev) => [session, ...prev])
      navigate(`/?session=${session.id}` as any)
      window.dispatchEvent(new CustomEvent('scheme:new-chat', { detail: { session } }))
      if (window.innerWidth < 1024) setSidebarOpen(false)
    } catch (e) {
      console.error(e)
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
    } catch (err) {
      console.error(err)
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
          navigate(`/?session=${remaining[0].id}` as any)
        } else {
          navigate('/')
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = () => {
    clearCitizenToken()
    setHasToken(false)
    setCitizenUid(null)
    setHouseholdUid(null)
    setUserName(null)
    setUserProfile(null)
    navigate('/login')
  }

  const filteredSessions = sessions.filter((s) =>
    (s.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 flex flex-row selection:bg-blue-600/30 selection:text-blue-200">
      
      {/* Global Live Voice Modal */}
      <LiveVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        sessionId={activeSessionId}
        userName={userName}
        onMessageAdded={() => {
          loadSessions()
          window.dispatchEvent(new CustomEvent('scheme:session-updated'))
        }}
      />

      {/* Flagship Unified Sidebar / Rail */}
      {hasToken && citizenUid && (
        <>
          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
            />
          )}

          <aside
            className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-zinc-800/80 bg-[#0c0c0e] transition-all duration-200 ease-in-out ${
              sidebarOpen ? 'w-64 sm:w-72' : 'w-16 hidden lg:flex'
            }`}
          >
            {/* Expanded Sidebar View */}
            {sidebarOpen ? (
              <div className="flex flex-col p-3 space-y-3 overflow-hidden flex-1">
                
                {/* Header: Logo & Collapse Button */}
                <div className="flex items-center justify-between px-1 h-9 shrink-0">
                  <Link to="/" className="flex items-center gap-2.5 group truncate">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white shrink-0 group-hover:scale-105 transition-transform">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col text-left truncate">
                      <span className="font-bold text-sm text-white tracking-tight leading-none">Scheme AI</span>
                      <span className="text-[9px] text-zinc-500 font-medium tracking-wide uppercase mt-0.5">Sovereign Welfare</span>
                    </div>
                  </Link>

                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
                    title="Collapse sidebar"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </button>
                </div>

                {/* New Chat Primary Action */}
                <button
                  onClick={handleNewChat}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600 text-zinc-100 font-medium text-xs shadow-sm transition-all group shrink-0"
                  title="New Conversation"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span>New Chat</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">⌘K</span>
                </button>

                {/* Primary Features Navigation */}
                <nav className="flex flex-col space-y-0.5 pt-1 border-t border-zinc-800/60 shrink-0">
                  <Link
                    to="/"
                    onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors ${
                      location.pathname === '/' && !activeSessionId
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Chat Center</span>
                  </Link>

                  <Link
                    to="/household"
                    onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors ${
                      location.pathname === '/household'
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    <Users className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span>Family Graph</span>
                  </Link>

                  <Link
                    to="/vault"
                    onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors ${
                      location.pathname === '/vault'
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    <FolderLock className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Document Vault</span>
                  </Link>

                  <Link
                    to="/results"
                    onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors ${
                      location.pathname === '/results'
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    <Search className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>Explore Schemes</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsVoiceModalOpen(true)
                      if (window.innerWidth < 1024) setSidebarOpen(false)
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 text-left"
                  >
                    <Radio className="h-4 w-4 text-orange-400 animate-pulse shrink-0" />
                    <span>Live Voice Mode</span>
                  </button>
                </nav>

                {/* Recent Chats Section */}
                <div className="flex-1 flex flex-col pt-3 border-t border-zinc-800/60 overflow-hidden min-h-0">
                  <div className="mb-2 shrink-0">
                    <div className="relative">
                      <Search className="h-3 w-3 absolute left-2.5 top-2.5 text-zinc-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full bg-zinc-900/90 border border-zinc-800/80 rounded-xl pl-7 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60"
                      />
                    </div>
                  </div>

                  <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1 shrink-0">
                    Recent Chats
                  </span>

                  <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
                    {filteredSessions.length === 0 ? (
                      <div className="px-2 py-3 text-[11px] text-zinc-500 italic">No conversations</div>
                    ) : (
                      filteredSessions.map((s) => {
                        const isActive = activeSessionId === s.id
                        const isEditing = editingSessionId === s.id

                        return (
                          <div
                            key={s.id}
                            onClick={() => {
                              if (!isEditing) {
                                navigate(`/?session=${s.id}` as any)
                                if (window.innerWidth < 1024) setSidebarOpen(false)
                              }
                            }}
                            className={`group relative rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1.5 cursor-pointer text-xs transition-all ${
                              isActive
                                ? 'bg-zinc-800 text-white font-medium'
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                              <MessageSquare className={`h-3 w-3 shrink-0 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
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
                                <span className="truncate">{s.title || 'Welfare Session'}</span>
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
                </div>
              </div>
            ) : (
              /* Collapsed Rail View (Clean 60px centered icons) */
              <div className="flex flex-col items-center py-3 space-y-4 flex-1">
                
                {/* Expand Button at Top */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="h-9 w-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
                  title="Expand sidebar"
                >
                  <PanelLeft className="h-4 w-4 text-blue-400" />
                </button>

                {/* New Chat Icon */}
                <button
                  onClick={handleNewChat}
                  className="h-9 w-9 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-300 hover:text-white transition-colors"
                  title="New Chat"
                >
                  <Plus className="h-4 w-4" />
                </button>

                {/* Feature Icons */}
                <nav className="flex flex-col items-center space-y-2 pt-2 border-t border-zinc-800/60">
                  <Link
                    to="/"
                    className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${
                      location.pathname === '/' && !activeSessionId
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                    title="Chat Center"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Link>

                  <Link
                    to="/household"
                    className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${
                      location.pathname === '/household'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                    title="Family Graph"
                  >
                    <Users className="h-4 w-4 text-indigo-400" />
                  </Link>

                  <Link
                    to="/vault"
                    className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${
                      location.pathname === '/vault'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                    title="Document Vault"
                  >
                    <FolderLock className="h-4 w-4 text-emerald-400" />
                  </Link>

                  <Link
                    to="/results"
                    className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${
                      location.pathname === '/results'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                    title="Explore Schemes"
                  >
                    <Search className="h-4 w-4 text-amber-400" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsVoiceModalOpen(true)}
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-orange-400 hover:bg-zinc-900 transition-colors"
                    title="Live Voice Mode"
                  >
                    <Radio className="h-4 w-4 animate-pulse" />
                  </button>
                </nav>
              </div>
            )}

            {/* Bottom User Profile Section */}
            <div className="p-2.5 border-t border-zinc-800/80 bg-[#09090b]/80 space-y-1 shrink-0">
              <Link
                to="/profile"
                onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
                className={`flex items-center rounded-xl transition-all ${
                  location.pathname === '/profile'
                    ? 'bg-zinc-800 text-white'
                    : 'hover:bg-zinc-900 text-zinc-300 hover:text-white'
                } ${sidebarOpen ? 'gap-2.5 p-2' : 'justify-center p-2'}`}
                title="Citizen Profile"
              >
                <div className="h-7 w-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                  {(userName || 'C')[0]?.toUpperCase()}
                </div>
                {sidebarOpen && (
                  <div className="flex flex-col text-left truncate flex-1 min-w-0">
                    <span className="text-xs font-semibold text-white truncate">{userName}</span>
                    <span className="text-[10px] text-emerald-400 truncate">
                      {userProfile ? `${userProfile.state} · ${userProfile.occupation}` : `${citizenUid || 'Verified'} · ${householdUid || 'Family'}`}
                    </span>
                  </div>
                )}
              </Link>

              {sidebarOpen && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-colors text-left"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </aside>
        </>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Mobile Header Bar */}
        {hasToken && citizenUid && (
          <header className="h-12 border-b border-zinc-800/60 bg-[#09090b]/90 backdrop-blur-md flex lg:hidden items-center justify-between px-3 z-30 shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/" className="flex items-center gap-2 font-semibold text-sm text-white">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              <span>Scheme Navigator</span>
            </Link>

            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="p-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400"
              title="Live Voice"
            >
              <Radio className="h-4 w-4 animate-pulse" />
            </button>
          </header>
        )}

        {/* Dynamic Outlet */}
        <main className="flex-1 h-full w-full overflow-hidden flex flex-col">
          <ErrorBoundary>
            {isChecking ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="h-9 w-9 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                <p className="text-xs text-zinc-400 font-medium font-mono">Verifying Citizen Authentication...</p>
              </div>
            ) : !hasToken ? (
              isPublicRoute ? (
                <Outlet />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="h-9 w-9 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                  <p className="text-xs text-zinc-400 font-medium">Redirecting to Citizen Sign In...</p>
                </div>
              )
            ) : hasProfile === false && !isProfileRoute ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-md w-full p-8 rounded-3xl bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 border border-amber-500/30 shadow-2xl text-center">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-lg shadow-amber-500/10">
                    <UserIcon className="h-8 w-8" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-mono text-blue-400 mb-3">
                    <span>{citizenUid}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Complete Your Citizen Profile</h2>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-8">
                    Your account is active, but configuring your demographic profile (state, district, occupation, income) enables our engine to evaluate 4,148 welfare schemes for your household.
                  </p>
                  <Link
                    to="/profile"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold text-xs shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <span>Complete Profile Now</span>
                  </Link>
                </div>
              </div>
            ) : (
              location.pathname === '/' ? (
                <Outlet />
              ) : (
                <div className="flex-1 w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                  <Outlet />
                </div>
              )
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
