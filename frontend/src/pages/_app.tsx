import { Outlet } from 'react-router'
import { Link } from '@/router'
import { ShieldCheck, Search, CheckCircle2, ShieldAlert, FolderLock } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-blue-600/30 selection:text-blue-200">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 font-semibold text-lg hover:opacity-90 transition-opacity">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent font-bold tracking-tight text-base sm:text-lg">
                Scheme Navigator
              </span>
              <span className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">
                Government of India Benefits
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="text-xs sm:text-sm text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors flex items-center gap-1.5"
            >
              <Search className="h-3.5 w-3.5 text-zinc-400" />
              <span>Explore</span>
            </Link>

            <Link
              to="/vault"
              className="text-xs sm:text-sm text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors flex items-center gap-1.5"
            >
              <FolderLock className="h-3.5 w-3.5 text-blue-400" />
              <span>Document Vault</span>
            </Link>

            <Link
              to="/admin"
              className="text-xs sm:text-sm text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors flex items-center gap-1.5"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" />
              <span>Admin</span>
            </Link>

            <Link
              to="/check"
              className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 sm:px-4 py-2 rounded-xl shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Check Eligibility</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content with Error Boundary */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/60 py-8 text-center text-xs text-zinc-500 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Government Welfare Scheme Navigator · V1.3 Document Vault Ready</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/vault" className="text-zinc-500 hover:text-zinc-300">
              Document Vault
            </Link>
            <Link to="/admin" className="text-zinc-500 hover:text-zinc-300">
              Admin Portal
            </Link>
            <p className="text-zinc-500 text-[11px]">
              Official government scheme eligibility and official portal gateway.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
