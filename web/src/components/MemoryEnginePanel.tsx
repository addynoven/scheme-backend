'use client'

import React, { useState } from 'react'
import { Brain, Cpu, Database, History, Wrench, X, Sparkles, CheckCircle2, ChevronRight, Activity } from 'lucide-react'

export interface MemoryTrace {
  working_memory?: {
    model_name?: string
    provider?: string
    system_instruction_summary?: string
    iterations_count?: number
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
    turn_duration_ms?: number
  }
  semantic_memory?: {
    recalled_facts_count?: number
    recalled_facts?: Array<{ key: string; value: string; status?: string }>
    profile_summary?: Record<string, any>
  }
  episodic_memory?: {
    session_turns_count?: number
    history_events?: Array<{ sender: string; snippet: string; timestamp: string }>
  }
  procedural_memory?: {
    available_tools_count?: number
    tools_executed_count?: number
    tools_executed?: Array<{
      name: string
      args: Record<string, any>
      duration_ms: number
      status: string
      matched_count: number
    }>
  }
}

interface MemoryEnginePanelProps {
  isOpen: boolean
  onClose: () => void
  memoryTrace?: MemoryTrace | null
  activeMessageSnippet?: string
}

export function MemoryEnginePanel({
  isOpen,
  onClose,
  memoryTrace,
  activeMessageSnippet,
}: MemoryEnginePanelProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'semantic' | 'working' | 'episodic' | 'procedural'>('all')

  if (!isOpen) return null

  const working = memoryTrace?.working_memory
  const semantic = memoryTrace?.semantic_memory
  const episodic = memoryTrace?.episodic_memory
  const procedural = memoryTrace?.procedural_memory

  const recalledFacts = semantic?.recalled_facts || []
  const toolsExecuted = procedural?.tools_executed || []
  const historyEvents = episodic?.history_events || []

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800 shadow-2xl flex flex-col transition-all duration-300">
      {/* Drawer Header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">Memory Engine Inspector</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Mini LangSmith
              </span>
            </div>
            <p className="text-xs text-zinc-400">Agentic Context & Reasoning Workspace</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Model & Latency Bar */}
      <div className="px-4 py-2.5 bg-zinc-900/40 border-b border-zinc-800/50 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-blue-400" />
          <span className="font-mono text-zinc-200">{working?.model_name || 'gemini-3.8-flash'}</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          {working?.turn_duration_ms !== undefined && (
            <span className="text-emerald-400 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {working.turn_duration_ms}ms
            </span>
          )}
          <span>{working?.total_tokens || 0} tokens</span>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="p-2 border-b border-zinc-800/60 flex items-center gap-1 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'all'
              ? 'bg-purple-600/20 border border-purple-500/40 text-purple-200'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          All Memory ({recalledFacts.length + toolsExecuted.length + historyEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('semantic')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'semantic'
              ? 'bg-blue-600/20 border border-blue-500/40 text-blue-200'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          Facts ({recalledFacts.length})
        </button>
        <button
          onClick={() => setActiveTab('procedural')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'procedural'
              ? 'bg-amber-600/20 border border-amber-500/40 text-amber-200'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          Tools ({toolsExecuted.length})
        </button>
        <button
          onClick={() => setActiveTab('episodic')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'episodic'
              ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-200'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          Episodes ({historyEvents.length})
        </button>
      </div>

      {/* Main Memory Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Active Query Context */}
        {activeMessageSnippet && (
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-xs">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 block mb-1">
              Active User Prompt Turn
            </span>
            <p className="text-zinc-200 italic font-mono">{activeMessageSnippet}</p>
          </div>
        )}

        {/* 1. SEMANTIC MEMORY (Long-term Facts) */}
        {(activeTab === 'all' || activeTab === 'semantic') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Semantic Memory (User Profile & Facts)
                </h4>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {recalledFacts.length} facts in prompt
              </span>
            </div>

            {recalledFacts.length === 0 ? (
              <p className="text-xs text-zinc-500 italic p-3 bg-zinc-900/40 rounded-xl border border-zinc-900">
                No persistent citizen facts recalled for this turn.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {recalledFacts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-blue-950/20 border border-blue-800/30 flex items-start justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          FACT
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          IN PROMPT
                        </span>
                      </div>
                      <p className="text-zinc-200 font-medium capitalize">
                        {fact.key.replace('_', ' ')}: <span className="text-white font-semibold">{fact.value}</span>
                      </p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. PROCEDURAL MEMORY (Tools & Skills Executed) */}
        {(activeTab === 'all' || activeTab === 'procedural') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Procedural Memory (Tools & Skills)
                </h4>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {toolsExecuted.length} tools executed
              </span>
            </div>

            {toolsExecuted.length === 0 ? (
              <p className="text-xs text-zinc-500 italic p-3 bg-zinc-900/40 rounded-xl border border-zinc-900">
                No external tools invoked during this execution turn.
              </p>
            ) : (
              <div className="space-y-2.5">
                {toolsExecuted.map((tool, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          TOOL CALL
                        </span>
                        <span className="font-mono text-amber-200 font-semibold">{tool.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">{tool.duration_ms}ms</span>
                    </div>

                    <div className="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                      <span className="text-zinc-500 block text-[9px] uppercase tracking-wider mb-1">Arguments:</span>
                      <pre>{JSON.stringify(tool.args, null, 2)}</pre>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                      <span>Matches Found: <strong className="text-white">{tool.matched_count}</strong></span>
                      <span className="text-emerald-400 font-medium">Status: {tool.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. WORKING MEMORY (Context Window) */}
        {(activeTab === 'all' || activeTab === 'working') && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Working Memory (Context Window & Tokens)
              </h4>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/30 text-xs space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2 bg-zinc-950/60 rounded-lg border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 uppercase block">Prompt</span>
                  <span className="text-purple-300 font-bold">{working?.prompt_tokens || 0}</span>
                </div>
                <div className="p-2 bg-zinc-950/60 rounded-lg border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 uppercase block">Completion</span>
                  <span className="text-purple-300 font-bold">{working?.completion_tokens || 0}</span>
                </div>
                <div className="p-2 bg-zinc-950/60 rounded-lg border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 uppercase block">Total</span>
                  <span className="text-emerald-300 font-bold">{working?.total_tokens || 0}</span>
                </div>
              </div>

              {working?.system_instruction_summary && (
                <div className="p-2.5 bg-zinc-950/80 rounded-lg border border-zinc-800 text-[11px] text-zinc-400 font-mono">
                  <span className="text-zinc-500 block text-[9px] uppercase tracking-wider mb-1">System Instruction Snippet:</span>
                  <p className="line-clamp-3">{working.system_instruction_summary}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. EPISODIC MEMORY (Timeline Events) */}
        {(activeTab === 'all' || activeTab === 'episodic') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Episodic Memory (Event Timeline)
                </h4>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {episodic?.session_turns_count || 0} session turns
              </span>
            </div>

            {historyEvents.length === 0 ? (
              <p className="text-xs text-zinc-500 italic p-3 bg-zinc-900/40 rounded-xl border border-zinc-900">
                First turn in this conversation session.
              </p>
            ) : (
              <div className="space-y-2">
                {historyEvents.map((event, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-emerald-950/10 border border-emerald-800/20 text-xs flex items-start gap-2.5"
                  >
                    <ChevronRight className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-emerald-400">
                        {event.sender}
                      </span>
                      <p className="text-zinc-300 font-mono text-[11px] line-clamp-2">
                        {event.snippet}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
