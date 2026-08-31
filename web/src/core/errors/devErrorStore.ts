import { create } from 'zustand'

export interface DevErrorDetails {
  id?: string
  title: string
  errorCode?: string | null
  httpStatus?: number | null
  origin: 'Backend API' | 'Frontend Client' | 'SSE Stream'
  endpoint?: string
  message: string
  stackTrace?: string | null
  solution?: string | null
  rawPayload?: any
  timestamp: string
}

interface DevErrorState {
  isOpen: boolean
  activeError: DevErrorDetails | null
  errorHistory: DevErrorDetails[]
  openDevError: (error: DevErrorDetails) => void
  closeDevError: () => void
  clearHistory: () => void
}

export const useDevErrorStore = create<DevErrorState>((set) => ({
  isOpen: false,
  activeError: null,
  errorHistory: [],
  openDevError: (error: DevErrorDetails) =>
    set((state) => ({
      isOpen: true,
      activeError: error,
      errorHistory: [error, ...state.errorHistory.slice(0, 19)],
    })),
  closeDevError: () => set({ isOpen: false, activeError: null }),
  clearHistory: () => set({ errorHistory: [], activeError: null, isOpen: false }),
}))

export function captureDevError(error: Partial<DevErrorDetails>) {
  const fullError: DevErrorDetails = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: error.title || 'Application Error',
    errorCode: error.errorCode || 'UNHANDLED_ERROR',
    httpStatus: error.httpStatus || 500,
    origin: error.origin || 'Frontend Client',
    endpoint: error.endpoint,
    message: error.message || 'An unexpected error occurred',
    stackTrace: error.stackTrace || (error instanceof Error ? (error as Error).stack : null),
    solution: error.solution,
    rawPayload: error.rawPayload,
    timestamp: new Date().toISOString(),
  }

  useDevErrorStore.getState().openDevError(fullError)
  console.error('🚨 [DevError Captured]:', fullError)
}
