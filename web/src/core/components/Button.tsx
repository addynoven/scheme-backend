import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100'

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }[size]

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700',
    outline: 'border border-zinc-800 hover:bg-zinc-800/60 text-zinc-300 hover:text-white',
    danger: 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-500/20',
    ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50',
  }[variant]

  return (
    <button
      disabled={disabled || isLoading}
      className={`${base} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  )
}
