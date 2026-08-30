'use client'

import { create } from 'zustand'
import { defaultFeatureFlags, featureFlagsSchema, type FeatureFlags } from './featureFlags.schema'

interface FeatureFlagStore {
  flags: FeatureFlags
  setOverride: (flag: keyof FeatureFlags, value: boolean) => void
  resetOverrides: () => void
  reconcileRemote: (payload: unknown) => void
}

export const useFeatureFlags = create<FeatureFlagStore>((set) => ({
  flags: defaultFeatureFlags,
  setOverride: (flag, value) =>
    set((state) => ({
      flags: { ...state.flags, [flag]: value },
    })),
  resetOverrides: () => set({ flags: defaultFeatureFlags }),
  reconcileRemote: (payload: unknown) => {
    const parsed = featureFlagsSchema.partial().safeParse(payload)
    if (parsed.success) {
      set((state) => ({
        flags: { ...state.flags, ...parsed.data },
      }))
    }
  },
}))
