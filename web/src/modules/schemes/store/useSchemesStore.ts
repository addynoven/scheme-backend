import { create } from 'zustand'
import { type Scheme } from '@/core'

interface SchemesState {
  searchQuery: string
  selectedCategory: string
  selectedState: string
  setSearchQuery: (q: string) => void
  setSelectedCategory: (cat: string) => void
  setSelectedState: (st: string) => void
}

export const useSchemesStore = create<SchemesState>((set) => ({
  searchQuery: '',
  selectedCategory: 'All',
  selectedState: 'ALL_INDIA',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setSelectedState: (selectedState) => set({ selectedState }),
}))
