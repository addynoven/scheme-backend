'use client'

import React from 'react'
import NextLink from 'next/link'
import { useRouter, useParams as useNextParams } from 'next/navigation'

export function Link({ to, href, children, ...props }: any) {
  const target = href || to || '/'
  return (
    <NextLink href={target} {...props}>
      {children}
    </NextLink>
  )
}

export function useNavigate() {
  const router = useRouter()
  return (path: any) => {
    if (typeof path === 'number') {
      router.back()
    } else {
      router.push(String(path))
    }
  }
}

export function useParams(routeStr?: any) {
  return useNextParams() || {}
}

export const Navigate = ({ to }: { to: any }) => {
  const router = useRouter()
  if (typeof window !== 'undefined') {
    router.push(String(to))
  }
  return null
}
