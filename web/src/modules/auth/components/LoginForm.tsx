'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react'
import { setCitizenToken } from '@/core'
import { authRepository } from '../repositories'
import { authClient } from '@/lib/auth-client'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // 1. Try Better Auth first
      const authRes = await authClient.signIn.email({ email, password })
      const token = (authRes.data as any)?.token || (authRes.data as any)?.session?.token
      if (token) {
        setCitizenToken(token)
        router.push('/')
        return
      }

      // 2. Direct FastAPI fallback
      const res = await authRepository.login({ email, password })
      if (res.ok && res.data.access_token) {
        setCitizenToken(res.data.access_token)
        if (res.data.refresh_token) {
          localStorage.setItem('scheme_citizen_refresh', res.data.refresh_token)
        }
        router.push('/')
      } else {
        setError(!res.ok ? res.error.message : 'Invalid credentials')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
            setPassword('AdminPass123!')
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-xs font-semibold text-purple-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span>Use Admin Account (admin@gov.in)</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setEmail('citizen.ramesh@example.com')
            setPassword('SecurePass123!')
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-semibold text-blue-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span>Use Demo Citizen Profile (Ramesh Patel)</span>
        </button>
      </div>
    </div>
  )
}
