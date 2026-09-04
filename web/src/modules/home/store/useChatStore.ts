import { create } from 'zustand'
import { type ChatMessage, type ChatSession } from '@/core'

interface ChatState {
  currentSessionId: number | string | null
  sessions: ChatSession[]
  messages: ChatMessage[]
  streamBuffer: string
  streamCitations: string[]
  isStreaming: boolean
  isVoiceModalOpen: boolean
  isServiceBlocked: boolean
  serviceErrorMessage: string | null
  isMemoryInspectorOpen: boolean
  activeMemoryTrace: any | null
  activePromptSnippet: string | null
  setCurrentSessionId: (id: number | string | null) => void
  setSessions: (sessions: ChatSession[]) => void
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void
  setStreamBuffer: (buffer: string) => void
  setStreamCitations: (citations: string[]) => void
  setIsStreaming: (isStreaming: boolean) => void
  setIsVoiceModalOpen: (open: boolean) => void
  setIsServiceBlocked: (blocked: boolean, message?: string | null) => void
  resetServiceBlock: () => void
  openMemoryInspector: (trace: any, snippet?: string) => void
  closeMemoryInspector: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  currentSessionId: null,
  sessions: [],
  messages: [],
  streamBuffer: '',
  streamCitations: [],
  isStreaming: false,
  isVoiceModalOpen: false,
  isServiceBlocked: false,
  serviceErrorMessage: null,
  isMemoryInspectorOpen: false,
  activeMemoryTrace: null,
  activePromptSnippet: null,
  setCurrentSessionId: (currentSessionId) => set({ currentSessionId }),
  setSessions: (sessions) => set({ sessions }),
  setMessages: (messages) =>
    set((state) => ({
      messages: typeof messages === 'function' ? messages(state.messages) : messages,
    })),
  setStreamBuffer: (streamBuffer) => set({ streamBuffer }),
  setStreamCitations: (streamCitations) => set({ streamCitations }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setIsVoiceModalOpen: (isVoiceModalOpen) => set({ isVoiceModalOpen }),
  setIsServiceBlocked: (isServiceBlocked, serviceErrorMessage = null) =>
    set({ isServiceBlocked, serviceErrorMessage }),
  resetServiceBlock: () => set({ isServiceBlocked: false, serviceErrorMessage: null }),
  openMemoryInspector: (trace, snippet) =>
    set({ isMemoryInspectorOpen: true, activeMemoryTrace: trace, activePromptSnippet: snippet || null }),
  closeMemoryInspector: () => set({ isMemoryInspectorOpen: false }),
}))
