import { cookies } from '../storage/cookies'

const CITIZEN_JWT_KEY = 'scheme_citizen_jwt'
const ADMIN_JWT_KEY = 'scheme_admin_jwt'

export function getCitizenToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CITIZEN_JWT_KEY) || cookies.get(CITIZEN_JWT_KEY)
}

export function setCitizenToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CITIZEN_JWT_KEY, token)
  cookies.set(CITIZEN_JWT_KEY, token)
}

export function clearCitizenToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CITIZEN_JWT_KEY)
  cookies.remove(CITIZEN_JWT_KEY)
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ADMIN_JWT_KEY) || cookies.get(ADMIN_JWT_KEY)
}

export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ADMIN_JWT_KEY, token)
  cookies.set(ADMIN_JWT_KEY, token)
}

export function clearAdminToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ADMIN_JWT_KEY)
  cookies.remove(ADMIN_JWT_KEY)
}
