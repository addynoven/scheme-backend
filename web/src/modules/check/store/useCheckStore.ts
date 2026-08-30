import { create } from 'zustand'
import { type EligibilityCheckPayload } from '@/core'

interface CheckState {
  formData: EligibilityCheckPayload
  setFormData: (data: Partial<EligibilityCheckPayload>) => void
  resetForm: () => void
}

const initialForm: EligibilityCheckPayload = {
  gender: 'Female',
  state: 'Madhya Pradesh',
  district: 'Bhopal',
  annual_income: 180000,
  occupation: 'unemployed',
  caste_category: 'General',
  marital_status: 'Married',
  residence_area: 'Rural',
  has_land: false,
  is_differently_abled: false,
  age: 28,
}

export const useCheckStore = create<CheckState>((set) => ({
  formData: initialForm,
  setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
  resetForm: () => set({ formData: initialForm }),
}))
