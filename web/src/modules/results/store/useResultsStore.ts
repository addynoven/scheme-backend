import { create } from 'zustand'

interface ResultsState {
  activeTab: 'eligible' | 'nearly_eligible' | 'ineligible'
  selectedCategory: string
  searchQuery: string
  setActiveTab: (tab: 'eligible' | 'nearly_eligible' | 'ineligible') => void
  setSelectedCategory: (category: string) => void
  setSearchQuery: (searchQuery: string) => void
}

export const useResultsStore = create<ResultsState>((set) => ({
  activeTab: 'eligible',
  selectedCategory: 'all',
  searchQuery: '',
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}))
