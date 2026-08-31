import { cookies } from '../storage/cookies'
import type { EligibilityCheckPayload, EligibilityReport } from '../../types'

const CITIZEN_JWT_KEY = 'scheme_citizen_jwt'
const ADMIN_JWT_KEY = 'scheme_admin_jwt'
const PROFILE_KEY = 'scheme_citizen_profile'
const REPORT_KEY = 'scheme_eligibility_report'

let inMemoryReport: EligibilityReport | null = null
let inMemoryProfile: EligibilityCheckPayload | null = null

const ADMIN_USER_KEY = 'scheme_admin_user'
const CITIZEN_USER_KEY = 'scheme_citizen_user'

export function getCitizenToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CITIZEN_JWT_KEY) || cookies.get(CITIZEN_JWT_KEY)
}

export function setCitizenToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CITIZEN_JWT_KEY, token)
  cookies.set(CITIZEN_JWT_KEY, token)
}
export const saveCitizenToken = setCitizenToken

export function clearCitizenToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CITIZEN_JWT_KEY)
  localStorage.removeItem(CITIZEN_USER_KEY)
  cookies.remove(CITIZEN_JWT_KEY)
}
export const removeCitizenToken = clearCitizenToken

export function saveCitizenUser(user: any): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CITIZEN_USER_KEY, JSON.stringify(user))
}

export function getCitizenUser(): any | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(CITIZEN_USER_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
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
export const saveAdminToken = setAdminToken

export function clearAdminToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ADMIN_JWT_KEY)
  localStorage.removeItem(ADMIN_USER_KEY)
  cookies.remove(ADMIN_JWT_KEY)
}
export const removeAdminToken = clearAdminToken

export function saveAdminUser(user: any): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user))
}

export function getAdminUser(): any | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(ADMIN_USER_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function saveCitizenProfile(profile: EligibilityCheckPayload): void {
  inMemoryProfile = profile
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    } catch (e) {
      console.warn('SessionStorage quota exceeded, using in-memory profile store.', e)
    }
  }
}

export function getSavedCitizenProfile(): EligibilityCheckPayload | null {
  if (inMemoryProfile) return inMemoryProfile
  if (typeof window !== 'undefined') {
    const data = sessionStorage.getItem(PROFILE_KEY)
    if (!data) return null
    try {
      inMemoryProfile = JSON.parse(data)
      return inMemoryProfile
    } catch {
      return null
    }
  }
  return null
}

export function saveEligibilityReport(report: EligibilityReport): void {
  inMemoryReport = report
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(REPORT_KEY, JSON.stringify(report))
    } catch (e) {
      console.warn('SessionStorage quota exceeded, using in-memory report store.', e)
      try {
        const compact = {
          ...report,
          ineligible_schemes: [],
        }
        sessionStorage.setItem(REPORT_KEY, JSON.stringify(compact))
      } catch {
        // Keep in memory
      }
    }
  }
}

export function getSavedEligibilityReport(): EligibilityReport | null {
  if (inMemoryReport) return inMemoryReport
  if (typeof window !== 'undefined') {
    const data = sessionStorage.getItem(REPORT_KEY)
    if (!data) return null
    try {
      inMemoryReport = JSON.parse(data)
      return inMemoryReport
    } catch {
      return null
    }
  }
  return null
}

