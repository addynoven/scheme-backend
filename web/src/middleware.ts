import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token =
    request.cookies.get('scheme_citizen_jwt')?.value ||
    request.cookies.get('better-auth.session_token')?.value

  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')

  // If user is accessing protected route without a session cookie, redirect to login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If user is authenticated and trying to access login/register, redirect to dashboard
  if (token && (pathname === '/login' || pathname === '/register')) {
    const homeUrl = new URL('/', request.url)
    return NextResponse.redirect(homeUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
