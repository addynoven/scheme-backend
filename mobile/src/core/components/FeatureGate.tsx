import React, { type ReactNode } from 'react';
import { flags, type FeatureFlagKey } from '../config/flags';

export interface FeatureGateProps {
  readonly flag: FeatureFlagKey;
  readonly fallback?: ReactNode;
  readonly children: ReactNode;
}

/**
 * Declarative Feature Flag Gate.
 * Follows blueprint §2: renders children only if the flag is enabled.
 */
export function FeatureGate({ flag, fallback = null, children }: FeatureGateProps) {
  const isEnabled = flags[flag];

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
