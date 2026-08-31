'use client'

import React, { useState, useEffect } from 'react'
import {
  AlertTriangle,
  X,
  Copy,
  Check,
  Terminal,
  Activity,
  Lightbulb,
  ExternalLink,
} from 'lucide-react'
import { useDevErrorStore } from '@/core/errors/devErrorStore'

export const DevErrorModal: React.FC = () => {
  const { isOpen, activeError, closeDevError } = useDevErrorStore()
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'fix' | 'stack' | 'raw'>('fix')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDevError()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeDevError])

  if (!isOpen || !activeError) return null

  const handleCopy = () => {
    const diagnosticReport = `
=========================================
🚨 [Antigravity System Diagnostic Report]
=========================================
Title: ${activeError.title}
Error Code: ${activeError.errorCode || 'N/A'}
HTTP Status: ${activeError.httpStatus || 'N/A'}
Origin: ${activeError.origin}
Endpoint: ${activeError.endpoint || 'N/A'}
Timestamp: ${activeError.timestamp}

--- MESSAGE ---
${activeError.message}

--- FIX SUGGESTION ---
${activeError.solution || 'No automated solution available.'}

--- STACK TRACE ---
${activeError.stackTrace || 'No stack trace provided.'}
=========================================
`.trim()

    navigator.clipboard.writeText(diagnosticReport)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isRateLimit =
    activeError.errorCode === 'AI_RATE_LIMIT_EXCEEDED' ||
    activeError.httpStatus === 429 ||
    activeError.message.includes('429')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-zinc-950 border border-red-500/40 rounded-2xl shadow-2xl shadow-red-950/50 flex flex-col overflow-hidden text-zinc-100 font-sans">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-red-950/20 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 font-mono text-[11px] font-semibold tracking-wider uppercase border border-red-500/30">
                  {activeError.errorCode || 'DEV ERROR'}
                </span>
                {activeError.httpStatus && (
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono text-[11px]">
                    HTTP {activeError.httpStatus}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-mono text-[11px] border border-blue-500/20">
                  {activeError.origin}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1.5 leading-snug">
                {activeError.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy diagnostic report"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Report</span>
                </>
              )}
            </button>
            <button
              onClick={closeDevError}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center border-b border-zinc-800/80 bg-zinc-900/50 px-4 pt-1">
          <button
            onClick={() => setActiveTab('fix')}
            className={`px-3 py-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'fix'
                ? 'border-red-500 text-white bg-zinc-900/60'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
            <span>Quick Fix & Solution</span>
          </button>
          <button
            onClick={() => setActiveTab('stack')}
            className={`px-3 py-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'stack'
                ? 'border-red-500 text-white bg-zinc-900/60'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            <span>Python / Client Stack Trace</span>
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'raw'
                ? 'border-red-500 text-white bg-zinc-900/60'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-blue-400" />
            <span>Request Telemetry</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
          {activeTab === 'fix' && (
            <div className="space-y-4">
              {/* Primary Error Explanation Box */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-200 space-y-2">
                <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
                  What Happened
                </h3>
                <p className="leading-relaxed whitespace-pre-wrap text-zinc-300">
                  {activeError.message}
                </p>
              </div>

              {/* Actionable Unblock Steps */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 space-y-2">
                <h3 className="font-semibold text-amber-300 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  How to Fix in Dev Mode
                </h3>
                {isRateLimit ? (
                  <div className="space-y-2 text-xs leading-relaxed text-amber-100">
                    <p>
                      Your Gemini API key hit Google rate limits (<code className="px-1.5 py-0.5 bg-black/50 rounded font-mono text-amber-300">HTTP 429: Too Many Requests</code>).
                    </p>
                    <div className="p-3 bg-black/60 rounded-lg border border-amber-500/20 font-mono text-[11px] text-zinc-300 space-y-1">
                      <p className="text-emerald-400"># 1. Open backend/.env and toggle provider to agy CLI:</p>
                      <p className="text-zinc-100 font-bold">LLM_PROVIDER=agy</p>
                      <p className="text-zinc-400">AGY_MODEL=gemini-3.7-flash-low</p>
                      <p className="text-emerald-400 mt-2"># 2. Restart backend server:</p>
                      <p className="text-zinc-100">cd backend && uv run uvicorn app.main:app --reload</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-100 leading-relaxed">
                    {activeError.solution ||
                      'Check the server terminal logs and Python traceback under the "Stack Trace" tab to diagnose the issue.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'stack' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                <span>Captured Traceback</span>
                <span className="font-mono text-[10px]">Python 3.13 / Next.js Client</span>
              </div>
              <div className="p-4 rounded-xl bg-black border border-zinc-800 overflow-x-auto font-mono text-[11px] leading-relaxed text-red-300 max-h-[380px] whitespace-pre select-text">
                {activeError.stackTrace || 'No stack trace captured for this error.'}
              </div>
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5 text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Origin:</span>
                  <span>{activeError.origin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Endpoint:</span>
                  <span className="text-blue-400 truncate max-w-[300px]">{activeError.endpoint || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Timestamp:</span>
                  <span>{activeError.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Error Code:</span>
                  <span className="text-red-400">{activeError.errorCode || 'N/A'}</span>
                </div>
              </div>

              {activeError.rawPayload && (
                <div className="space-y-1">
                  <span className="text-zinc-500 text-[11px]">Raw Payload:</span>
                  <pre className="p-3 rounded-xl bg-black border border-zinc-800 text-[10px] text-zinc-400 overflow-x-auto">
                    {JSON.stringify(activeError.rawPayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Dev Mode Active · Press <strong className="text-zinc-400 font-mono">Esc</strong> to dismiss
          </span>
          <button
            onClick={closeDevError}
            className="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
