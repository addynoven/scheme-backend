import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Link, useNavigate } from '@/router'
import {
  ShieldCheck,
  Search,
  FolderLock,
  User,
  LogOut,
  LogIn,
} from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { getCitizenToken, clearCitizenToken } from '@/lib/session'
import { citizenGetMe } from '@/lib/api'

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [citizenUid, setCitizenUid] = useState<string | null>(null)
  const [householdUid, setHouseholdUid] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [hasToken, setHasToken] = useState(false)
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  const isPublicRoute = location.pathname === '/login' || location.pathname === '/register'
  const isProfileRoute = location.pathname === '/profile'

  const checkAuth = () => {
    const token = getCitizenToken()

    if (!token) {
      setHasToken(false)
      setCitizenUid(null)
      setHouseholdUid(null)
      setUserName(null)
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
        const profileOk = !!user.profile
        setHasProfile(profileOk)
        setIsChecking(false)
        if (isPublicRoute) {
          navigate('/')
        }
      })
      .catch(() => {
        clearCitizenToken()
        setHasToken(false)
        setCitizenUid(null)
        setHouseholdUid(null)
        setUserName(null)
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
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-blue-600/30 selection:text-blue-200">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 font-semibold text-lg hover:opacity-90 transition-opacity shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent font-bold tracking-tight text-base sm:text-lg">
                Scheme Navigator
              </span>
              <span className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">
                Sovereign Citizen Welfare Engine
              </span>
            </div>
          </Link>

          {hasToken && citizenUid ? (
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                to="/"
                className={`text-xs sm:text-sm px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Search className="h-3.5 w-3.5 text-zinc-400" />
                <span className="hidden md:inline">Command Center</span>
              </Link>

              <Link
                to="/household"
                className={`text-xs sm:text-sm px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/household' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <span className="text-indigo-400 font-semibold">👨‍👩‍👧</span>
                <span className="hidden sm:inline">Family Graph</span>
              </Link>

              <Link
                to="/vault"
                className={`text-xs sm:text-sm px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/vault' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <FolderLock className="h-3.5 w-3.5 text-blue-400" />
                <span className="hidden sm:inline">Vault</span>
              </Link>

              <Link
                to="/chat"
                className={`text-xs sm:text-sm px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/chat' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <span className="text-blue-400 font-semibold">💬</span>
                <span className="hidden sm:inline">Chat</span>
              </Link>

              <Link
                to="/voice"
                className={`text-xs sm:text-sm px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/voice' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <span className="text-violet-400 font-semibold">🎙️</span>
                <span className="hidden sm:inline">Voice</span>
              </Link>

              <div className="h-5 w-px bg-zinc-800 mx-1 hidden sm:block" />

              {/* Citizen Identity Badge */}
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-blue-400" />
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-[11px] font-bold text-white leading-none">{userName}</span>
                    <span className="text-[9px] font-mono text-blue-400 leading-none mt-0.5">{citizenUid} • {householdUid}</span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Log Out"
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </nav>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Citizen Sign In</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content with Layout-Level Auth & Profile Gate */}
      <main
        className={`flex-1 w-full flex flex-col ${
          location.pathname === '/chat'
            ? 'overflow-hidden p-0'
            : 'max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8'
        }`}
      >
        <ErrorBoundary>
          {isChecking ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-9 w-9 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
              <p className="text-xs text-zinc-400 font-medium font-mono">Verifying Citizen Authentication...</p>
            </div>
          ) : !hasToken ? (
            isPublicRoute ? (
              <Outlet />
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-9 w-9 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                <p className="text-xs text-zinc-400 font-medium">Redirecting to Citizen Sign In...</p>
              </div>
            )
          ) : hasProfile === false && !isProfileRoute ? (
            <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-amber-500/30 shadow-2xl text-center">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-lg shadow-amber-500/10">
                <User className="h-8 w-8" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-mono text-blue-400 mb-3">
                <span>{citizenUid}</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Complete Your Citizen Profile</h2>
              <p className="text-xs text-zinc-400 leading-relaxed mb-8">
                Your account is active, but you must configure your demographic profile (state, district, occupation, income) so our engine can evaluate 4,148 welfare schemes for your household.
              </p>
              <Link
                to="/profile"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold text-xs shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>Complete Profile Now</span>
              </Link>
            </div>
          ) : (
            <Outlet />
          )}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/60 py-8 text-center text-xs text-zinc-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sovereign Citizen Welfare Engine · V3.0 SaaS Multi-Member Architecture</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/vault" className="text-zinc-500 hover:text-zinc-300">
              Document Vault
            </Link>
            <Link to="/household" className="text-zinc-500 hover:text-zinc-300">
              Family Graph
            </Link>
            <Link to="/admin" className="text-zinc-500 hover:text-zinc-300">
              Admin Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
