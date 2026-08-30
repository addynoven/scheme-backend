'use client'

import React from 'react'
import NextLink, { LinkProps as NextLinkProps } from 'next/link'
import { useRouter, useParams as useNextParams, usePathname, useSearchParams } from 'next/navigation'

export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to?: string
  href?: string
  children: React.ReactNode
}

export function Link({ to, href, children, ...props }: LinkProps) {
  const target = to || href || '/'
  return (
    <NextLink href={target} {...props}>
      {children}
    </NextLink>
  )
}

export function useNavigate() {
  const router = useRouter()
  return (path: string | number) => {
    if (typeof path === 'number') {
      if (path === -1) window.history.back()
    } else {
      router.push(path)
    }
  }
}

export function useParams<T = Record<string, string>>(_routePattern?: string): T {
  const params = useNextParams()
  return (params || {}) as unknown as T
}

export function useLocation() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  return {
    pathname,
    search: searchParams?.toString() ? `?${searchParams.toString()}` : '',
  }
}
