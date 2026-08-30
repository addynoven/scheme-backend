import NextLink from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'

export type Path =
  | `/`
  | `/admin`
  | `/chat`
  | `/check`
  | `/household`
  | `/login`
  | `/profile`
  | `/register`
  | `/results`
  | `/schemes/${string}`
  | `/vault`
  | `/voice`

export function Link({ to, href, children, className, ...props }: any) {
  const target = to || href || '/'
  return (
    <NextLink href={target} className={className} {...props}>
      {children}
    </NextLink>
  )
}

export function useNavigate() {
  const router = useRouter()
  return (to: string | number, options?: any) => {
    if (typeof to === 'number') {
      if (typeof window !== 'undefined') window.history.go(to)
    } else {
      router.push(to, undefined, options)
    }
  }
}

export function useLocation() {
  const router = useRouter()
  return {
    pathname: router.pathname,
    search: typeof window !== 'undefined' ? window.location.search : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
  }
}

export function useParams<T = any>(_path?: any): Record<string, string | string[] | undefined> & T {
  const router = useRouter()
  return router.query as any
}

export function Navigate({ to }: { to: string }) {
  const router = useRouter()
  React.useEffect(() => {
    router.push(to)
  }, [router, to])
  return null
}
