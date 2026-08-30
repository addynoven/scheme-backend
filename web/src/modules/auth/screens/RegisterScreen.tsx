'use client'

import React from 'react'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { RegisterForm, SocialAuthButtons } from '../components'

export function RegisterScreen() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full my-8">
        <div className="text-center mb-8">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Create Citizen Profile</h1>
          <p className="text-sm text-zinc-400 mt-1.5">
            Get issued your sovereign Citizen UID & Household Unit ID
          </p>
        </div>

        <div className="rounded-3xl bg-zinc-900/80 border border-zinc-800/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <SocialAuthButtons />

          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-zinc-800 w-full" />
            <span className="bg-zinc-900 px-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold absolute">
              Or register with email
            </span>
          </div>

          <RegisterForm />

          <div className="mt-6 text-center text-xs text-zinc-400">
            <span>Already registered? </span>
            <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline">
              Sign In with Citizen UID
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
