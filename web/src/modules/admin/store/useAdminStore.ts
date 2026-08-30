import { create } from 'zustand'
import { type Scheme, type IngestionSource, type IngestionTriageItem } from '@/core'

interface AdminState {
  activeTab: 'schemes' | 'ingestion' | 'triage'
  categoryFilter: string
  statusFilter: string
  searchQuery: string
  editingScheme: Scheme | null
  isSchemeModalOpen: boolean
  setActiveTab: (tab: 'schemes' | 'ingestion' | 'triage') => void
  setCategoryFilter: (cat: string) => void
  setStatusFilter: (st: string) => void
  setSearchQuery: (q: string) => void
  setEditingScheme: (scheme: Scheme | null) => void
  setIsSchemeModalOpen: (open: boolean) => void
}

export const useAdminStore = create<AdminState>((set) => ({
  activeTab: 'schemes',
  categoryFilter: 'All',
  statusFilter: 'All',
  searchQuery: '',
  editingScheme: null,
  isSchemeModalOpen: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setEditingScheme: (editingScheme) => set({ editingScheme, isSchemeModalOpen: !!editingScheme }),
  setIsSchemeModalOpen: (isSchemeModalOpen) => set({ isSchemeModalOpen }),
}))
