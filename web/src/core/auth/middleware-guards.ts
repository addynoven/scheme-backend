export const publicRoutes = ['/login', '/register', '/api/auth']

export function isPublicPath(pathname: string): boolean {
  return publicRoutes.some((route) => pathname.startsWith(route))
}

export function isProtectedPath(pathname: string): boolean {
  return !isPublicPath(pathname)
}
