import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Link, useNavigate } from '@/router'
import {
  Menu,
  User as UserIcon,
  Shield,
} from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { getCitizenToken, clearCitizenToken } from '@/lib/session'
import {
  citizenGetMe,
  listChatSessions,
  createChatSession,
  type ChatSession,
} from '@/lib/api'
import { AppSidebar } from '@/components/AppSidebar'

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

  // Sidebar & Sessions State
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sessions, setSessions] = useState<ChatSession[]>([])

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
    <div className="h-screen w-screen overflow-hidden bg-[#0a0a0c] text-zinc-100 flex flex-row selection:bg-blue-600/30 selection:text-blue-200">
      
      {/* Flagship App Sidebar */}
      {hasToken && citizenUid && (
        <AppSidebar
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          sessions={sessions}
          setSessions={setSessions}
          activeSessionId={activeSessionId}
          userName={userName}
          userProfile={userProfile}
          citizenUid={citizenUid}
          householdUid={householdUid}
          onNewChat={handleNewChat}
          onLogout={handleLogout}
          currentPath={location.pathname}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Mobile Header Bar */}
        {hasToken && citizenUid && (
          <header className="h-12 border-b border-zinc-800/60 bg-[#0a0a0c]/90 backdrop-blur-xs flex lg:hidden items-center justify-between px-3 z-30 shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/" className="flex items-center gap-2 font-medium text-sm text-zinc-100">
              <Shield className="h-4 w-4 text-blue-400" />
              <span>Scheme AI</span>
            </Link>

            <div className="w-8" />
          </header>
        )}

        {/* Dynamic Outlet */}
        <main className="flex-1 h-full w-full overflow-hidden flex flex-col">
          <ErrorBoundary>
            {isChecking ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="h-8 w-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3" />
                <p className="text-xs text-zinc-500">Checking credentials...</p>
              </div>
            ) : !hasToken ? (
              isPublicRoute ? (
                <Outlet />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="h-8 w-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3" />
                  <p className="text-xs text-zinc-500">Redirecting...</p>
                </div>
              )
            ) : hasProfile === false && !isProfileRoute ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl text-center">
                  <div className="h-12 w-12 mx-auto rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 mb-4">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold text-zinc-100 tracking-tight mb-1.5">Complete Citizen Profile</h2>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                    Configure your demographic profile (state, district, occupation, income) to enable accurate evaluation across all government schemes.
                  </p>
                  <Link
                    to="/profile"
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Complete Profile</span>
                  </Link>
                </div>
              </div>
            ) : (
              location.pathname === '/' ? (
                <Outlet />
              ) : (
                <div className="flex-1 w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
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
