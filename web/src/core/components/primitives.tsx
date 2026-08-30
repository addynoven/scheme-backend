import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'interactive'
}

export function Card({ variant = 'default', className = '', children, ...props }: CardProps) {
  const base = 'rounded-2xl border transition-all'
  const variants = {
    default: 'bg-zinc-900/90 border-zinc-800/80 shadow-lg text-zinc-100',
    glass: 'bg-zinc-900/60 backdrop-blur-xl border-zinc-800/60 shadow-xl text-zinc-100',
    interactive:
      'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700 shadow-md hover:shadow-xl text-zinc-100 cursor-pointer',
  }[variant]

  return (
    <div className={`${base} ${variants} ${className}`} {...props}>
      {children}
    </div>
  )
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'emerald' | 'purple' | 'amber' | 'red' | 'zinc'
}

export function Badge({ variant = 'zinc', className = '', children, ...props }: BadgeProps) {
  const base = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold'
  const variants = {
    blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border border-red-500/20',
    zinc: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
  }[variant]

  return (
    <span className={`${base} ${variants} ${className}`} {...props}>
      {children}
    </span>
  )
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-zinc-950 border ${
          error ? 'border-red-500/80 focus:border-red-500' : 'border-zinc-800 focus:border-blue-500'
        } rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}
