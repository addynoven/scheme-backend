'use client'

import React, { useState, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from './queryClient'

interface Props {
  children: ReactNode
}

export function QueryProvider({ children }: Props) {
  const [queryClient] = useState(() => createQueryClient())

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
