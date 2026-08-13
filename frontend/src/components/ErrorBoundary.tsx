import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 max-w-lg mx-auto py-12">
          <div className="h-16 w-16 rounded-2xl bg-rose-950/50 border border-rose-800/80 flex items-center justify-center text-rose-400 mb-6 shadow-xl">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">
            Something went wrong
          </h1>

          <p className="text-zinc-400 text-xs sm:text-sm mb-6 leading-relaxed">
            {this.state.error?.message ||
              'An unexpected error occurred while rendering this view.'}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </button>

            <button
              onClick={this.handleGoHome}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-colors cursor-pointer"
            >
              <Home className="h-4 w-4" />
              Return Home
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
