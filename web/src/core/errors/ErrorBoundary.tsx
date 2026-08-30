'use client'

import React, { Component, type ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { captureError } from './error-handler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorMessage: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureError(error, `ErrorBoundary: ${info.componentStack}`)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex-1 min-h-[300px] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl">
            <div className="h-12 w-12 mx-auto rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-1">Component Encountered an Issue</h3>
            <p className="text-xs text-zinc-400 mb-4 break-words">
              {this.state.errorMessage || 'An unexpected error occurred while rendering this interface.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, errorMessage: null })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Component</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
