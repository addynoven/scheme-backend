import React, { useState } from 'react'
import { Link, useNavigate } from '@/router'
import { citizenLogin } from '@/lib/api'
import { setCitizenToken } from '@/lib/session'
import { ShieldCheck, ArrowRight, Sparkles, Lock, Mail, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await citizenLogin(email, password)
      if (res.access_token) {
        setCitizenToken(res.access_token)
        navigate('/')
      } else {
        setError('Login failed: Token missing from response')
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="text-center mb-8">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-4">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Citizen Welfare Portal</h1>
        <p className="text-sm text-zinc-400 mt-1.5">
          Access your sovereign household profile & matched welfare schemes
        </p>
      </div>

      <div className="rounded-3xl bg-zinc-900/80 border border-zinc-800/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-800/80 space-y-2">
          <button
            type="button"
            onClick={() => {
              setEmail('admin@gov.in')
              setPassword('AdminPassword123!')
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-xs font-semibold text-purple-300 transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>Use Admin / Citizen Account (admin@gov.in)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('citizen.ramesh@example.com')
              setPassword('SecurePass123!')
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-semibold text-blue-300 transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Use Demo Citizen Profile (Ramesh Chandra Patel)</span>
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-zinc-400">
          <span>New citizen? </span>
          <Link to="/register" className="font-semibold text-blue-400 hover:text-blue-300 hover:underline">
            Register & issue Citizen UID
          </Link>
        </div>
      </div>
    </div>
  )
}
