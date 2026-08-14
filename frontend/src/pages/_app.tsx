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

  const checkAuth = () => {
    const token = getCitizenToken()
    setHasToken(!!token)
    if (token) {
      citizenGetMe()
        .then((user) => {
          setCitizenUid(user.citizen_uid || 'CIT-VERIFIED')
          setHouseholdUid(user.household_uid || 'HHD-ACTIVE')
          setUserName(user.profile?.full_name || user.email?.split('@')[0] || 'Citizen')
        })
        .catch(() => {
          setCitizenUid(null)
          setHouseholdUid(null)
          setUserName(null)
        })
    } else {
      setCitizenUid(null)
      setHouseholdUid(null)
      setUserName(null)
    }
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

            {/* Auth & Profile Badges */}
            {hasToken && citizenUid ? (
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
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-zinc-900 transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="h-3.5 w-3.5 text-blue-400" />
                  <span>Log In</span>
                </Link>
                <Link
                  to="/register"
                  className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content with Error Boundary */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <ErrorBoundary>
          <Outlet />
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
