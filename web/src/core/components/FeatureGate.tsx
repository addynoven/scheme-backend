'use client'

import React, { type ReactNode } from 'react'
import { useFeatureFlags } from '../config/useFeatureFlags'
import type { FeatureFlags } from '../config/featureFlags.schema'

interface Props {
  flag: keyof FeatureFlags
  children: ReactNode
  fallback?: ReactNode
}

export function FeatureGate({ flag, children, fallback = null }: Props) {
  const isEnabled = useFeatureFlags((state) => state.flags[flag])
  return isEnabled ? <>{children}</> : <>{fallback}</>
}
