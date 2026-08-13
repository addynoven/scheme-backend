import { useState, useEffect } from 'react'
import { Plus, Minus, RotateCcw, Activity, Layers, Zap } from 'lucide-react'

export default function HomePage() {
  const [count, setCount] = useState(0)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (res.ok) setBackendStatus('online')
        else setBackendStatus('offline')
      })
      .catch(() => setBackendStatus('offline'))
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-950/60 border border-blue-800/60 text-blue-300 mb-6 shadow-sm">
        <Zap className="h-3.5 w-3.5 text-blue-400" />
        <span>Vite 6 + React 19 + Generouted Router</span>
      </div>

      {/* Hero Title */}
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-center max-w-2xl bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-500 bg-clip-text text-transparent mb-4">
        Citizen Scheme Navigator
      </h1>
      <p className="text-zinc-400 text-center max-w-lg text-sm sm:text-base mb-10">
        Discover government schemes, get plain-English eligibility explanations, and check document readiness.
      </p>

      {/* Interactive Counter Card */}
      <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/60 flex flex-col items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

        <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium mb-4 uppercase tracking-wider">
          <Layers className="h-4 w-4 text-blue-400" />
          Interactive Counter State
        </div>

        {/* Counter Display */}
        <div className="my-6 text-6xl sm:text-7xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
          {count}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 w-full justify-center mt-2">
          <button
            onClick={() => setCount((prev) => prev - 1)}
            className="h-12 w-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 border border-zinc-700/80 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            aria-label="Decrement"
          >
            <Minus className="h-5 w-5" />
          </button>

          <button
            onClick={() => setCount(0)}
            className="h-12 px-5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 active:scale-95 text-zinc-300 border border-zinc-700/60 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 text-zinc-400" />
            Reset
          </button>

          <button
            onClick={() => setCount((prev) => prev + 1)}
            className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Increment"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Backend Status Bar */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 w-full flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-zinc-500" />
            <span>Backend API:</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            {backendStatus === 'checking' && (
              <span className="text-amber-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                Connecting...
              </span>
            )}
            {backendStatus === 'online' && (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Connected (Port 8000)
              </span>
            )}
            {backendStatus === 'offline' && (
              <span className="text-zinc-500 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-500" />
                Offline
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
