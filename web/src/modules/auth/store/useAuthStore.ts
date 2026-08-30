'use client'

import { create } from 'zustand'
import type { UserMeResponse } from '../repositories'

interface AuthStore {
  user: UserMeResponse | null
  isAuthenticated: boolean
  setUser: (user: UserMeResponse | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  clear: () => set({ user: null, isAuthenticated: false }),
}))
