import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Link, useNavigate } from '@/router'
import {
  ShieldCheck,
  Search,
  FolderLock,
  User,
  LogOut,
  Plus,
  MessageSquare,
  Users,
  Radio,
  Menu,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { getCitizenToken, clearCitizenToken } from '@/lib/session'
import { citizenGetMe, listChatSessions, type ChatSession } from '@/lib/api'
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

  // Sidebar & Navigation State (ChatGPT / Gemini style)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [recentSessions, setRecentSessions] = useState<ChatSession[]>([])
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)

  const isPublicRoute = location.pathname === '/login' || location.pathname === '/register'
  const isProfileRoute = location.pathname === '/profile'

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
        // Load recent sessions for the global rail drawer
        listChatSessions()
          .then((s) => setRecentSessions(s.slice(0, 10)))
          .catch(() => {})
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

  const handleLogout = () => {
    clearCitizenToken()
    setHasToken(false)
    setCitizenUid(null)
    setHouseholdUid(null)
    setUserName(null)
    setUserProfile(null)
    navigate('/login')
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 flex flex-row selection:bg-blue-600/30 selection:text-blue-200">
      
      {/* Global Live Voice Modal */}
      <LiveVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        userName={userName}
        onMessageAdded={() => {
          // If on home, let home refresh
          window.dispatchEvent(new CustomEvent('scheme:session-updated'))
        }}
      />

      {/* Flagship Left Icon Rail / Sidebar (ChatGPT / Claude / Gemini / Grok Style) */}
      {hasToken && citizenUid && (
        <>
          {/* Mobile Overlay Backdrop */}
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
            />
          )}

          {/* Collapsible Left Drawer / Rail */}
          <aside
            className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-zinc-800/80 bg-[#0c0c0e] transition-all duration-300 ease-in-out ${
              sidebarOpen ? 'w-64 sm:w-72' : 'w-16 hidden md:flex'
            }`}
          >
            {/* Top Section: Logo & Main Navigation Icons */}
            <div className="flex flex-col p-2.5 space-y-3">
              
              {/* Header: Logo & Sidebar Toggle */}
              <div className="flex items-center justify-between px-1 h-10">
                <Link to="/" className="flex items-center gap-2.5 group">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  {sidebarOpen && (
                    <div className="flex flex-col text-left truncate">
                      <span className="font-bold text-sm text-white tracking-tight leading-none">Scheme AI</span>
                      <span className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase mt-0.5">Sovereign Engine</span>
                    </div>
                  )}
                </Link>

                {sidebarOpen ? (
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    title="Collapse sidebar"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors hidden md:block"
                    title="Expand sidebar"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Primary Action: New Chat */}
              <Link
                to="/"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('scheme:new-chat'))
                  if (window.innerWidth < 768) setSidebarOpen(false)
                }}
                className={`flex items-center rounded-xl transition-all ${
                  sidebarOpen
                    ? 'gap-2.5 px-3 py-2 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 font-semibold text-xs shadow-sm'
                    : 'justify-center p-2.5 hover:bg-zinc-800/80 text-zinc-300 hover:text-white'
                }`}
                title="New Welfare Conversation"
              >
                <Plus className="h-4 w-4 text-blue-400 shrink-0" />
                {sidebarOpen && <span>New Chat</span>}
              </Link>

              {/* Core Feature Rail Links */}
              <nav className="flex flex-col space-y-1 pt-1 border-t border-zinc-800/60">
                <Link
                  to="/"
                  onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false) }}
                  className={`flex items-center rounded-xl text-xs transition-colors ${
                    location.pathname === '/' || location.pathname === '/chat'
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  } ${sidebarOpen ? 'gap-3 px-3 py-2' : 'justify-center p-2.5'}`}
                  title="AI Chat Center (Home)"
                >
                  <MessageSquare className="h-4 w-4 text-blue-400 shrink-0" />
                  {sidebarOpen && <span>Chat Center</span>}
                </Link>

                <Link
                  to="/household"
                  onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false) }}
                  className={`flex items-center rounded-xl text-xs transition-colors ${
                    location.pathname === '/household'
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  } ${sidebarOpen ? 'gap-3 px-3 py-2' : 'justify-center p-2.5'}`}
                  title="Family Graph & Multi-Member Matrix"
                >
                  <Users className="h-4 w-4 text-indigo-400 shrink-0" />
                  {sidebarOpen && <span>Family Graph</span>}
                </Link>

                <Link
                  to="/vault"
                  onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false) }}
                  className={`flex items-center rounded-xl text-xs transition-colors ${
                    location.pathname === '/vault'
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  } ${sidebarOpen ? 'gap-3 px-3 py-2' : 'justify-center p-2.5'}`}
                  title="Document Vault & OCR Scanner"
                >
                  <FolderLock className="h-4 w-4 text-emerald-400 shrink-0" />
                  {sidebarOpen && <span>Document Vault</span>}
                </Link>

                <Link
                  to="/results"
                  onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false) }}
                  className={`flex items-center rounded-xl text-xs transition-colors ${
                    location.pathname === '/results'
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  } ${sidebarOpen ? 'gap-3 px-3 py-2' : 'justify-center p-2.5'}`}
                  title="Browse 4,148 Schemes"
                >
                  <Search className="h-4 w-4 text-amber-400 shrink-0" />
                  {sidebarOpen && <span>Explore Schemes</span>}
                </Link>

                {/* Live Voice Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setIsVoiceModalOpen(true)
                    if (window.innerWidth < 768) setSidebarOpen(false)
                  }}
                  className={`flex items-center rounded-xl text-xs transition-colors text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 ${
                    sidebarOpen ? 'gap-3 px-3 py-2' : 'justify-center p-2.5'
                  }`}
                  title="Live Voice Mode"
                >
                  <Radio className="h-4 w-4 text-orange-400 animate-pulse shrink-0" />
                  {sidebarOpen && <span>Live Voice Mode</span>}
                </button>
              </nav>

              {/* Sidebar Expanded: Recent Conversations */}
              {sidebarOpen && (
                <div className="flex-1 overflow-y-auto space-y-1 pt-3 border-t border-zinc-800/60 max-h-64">
                  <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                    Recent Conversations
                  </span>
                  {recentSessions.length === 0 ? (
                    <div className="px-2 py-3 text-[11px] text-zinc-500 italic">No recent chats</div>
                  ) : (
                    recentSessions.map((s) => (
                      <Link
                        key={s.id}
                        to={`/?session=${s.id}` as any}
                        onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false) }}
                        className="p-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-900/90 truncate block text-left transition-colors"
                      >
                        {s.title || 'Welfare Session'}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Bottom Section: Profile Avatar & Controls */}
            <div className="p-2.5 border-t border-zinc-800/80 bg-[#09090b]/80 space-y-1">
              <Link
                to="/profile"
                onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false) }}
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
          <header className="h-12 border-b border-zinc-800/60 bg-[#09090b]/90 backdrop-blur-md flex md:hidden items-center justify-between px-3 z-30 shrink-0">
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

        {/* Dynamic Outlet with Layout-Level Profile Gate */}
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
                    <User className="h-8 w-8" />
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
