import { create } from 'zustand'
import { type HouseholdMember } from '@/core'

interface HouseholdState {
  editingMember: HouseholdMember | null
  isModalOpen: boolean
  setEditingMember: (member: HouseholdMember | null) => void
  setIsModalOpen: (open: boolean) => void
}

export const useHouseholdStore = create<HouseholdState>((set) => ({
  editingMember: null,
  isModalOpen: false,
  setEditingMember: (editingMember) => set({ editingMember, isModalOpen: !!editingMember }),
  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
}))
