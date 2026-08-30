'use client'

import { useState } from 'react'
import { Lock, ShieldAlert, AlertTriangle } from 'lucide-react'
import { adminRepository } from '../repositories'
import { saveAdminToken, saveAdminUser } from '@/core'

interface AdminLoginFormProps {
  onSuccess: (token: string, user: any) => void
}

export function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const [email, setEmail] = useState('admin@schemesync.gov.in')
  const [password, setPassword] = useState('admin1234')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError(null)
    setLoading(true)

    try {
      const data = await adminRepository.login({ email, password })
      saveAdminToken(data.access_token)
      saveAdminUser(data.user)
      onSuccess(data.access_token, data.user)
    } catch (err: any) {
      setLoginError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <ShieldAlert className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Admin Portal</h1>
            <p className="text-xs text-slate-400">SchemeSync Operations Control</p>
          </div>
        </div>

        {loginError && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            {loading ? 'Authenticating...' : 'Sign In to Operations'}
          </button>
        </form>
      </div>
    </div>
  )
}
