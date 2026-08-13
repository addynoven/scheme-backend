import type { EligibilityCheckPayload, EligibilityReport } from './api'

const PROFILE_KEY = 'scheme_citizen_profile'
const REPORT_KEY = 'scheme_eligibility_report'
const ADMIN_TOKEN_KEY = 'scheme_admin_jwt'
const ADMIN_USER_KEY = 'scheme_admin_user'
const CITIZEN_TOKEN_KEY = 'scheme_citizen_jwt'
const CITIZEN_USER_KEY = 'scheme_citizen_user'

let inMemoryReport: EligibilityReport | null = null
let inMemoryProfile: EligibilityCheckPayload | null = null

export function saveCitizenProfile(profile: EligibilityCheckPayload) {
  inMemoryProfile = profile
  try {
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch (e) {
    console.warn('SessionStorage quota exceeded, using in-memory profile store.', e)
  }
}

export function getSavedCitizenProfile(): EligibilityCheckPayload | null {
  if (inMemoryProfile) return inMemoryProfile
  const data = sessionStorage.getItem(PROFILE_KEY)
  if (!data) return null
  try {
    inMemoryProfile = JSON.parse(data)
    return inMemoryProfile
  } catch {
    return null
  }
}

export function saveEligibilityReport(report: EligibilityReport) {
  inMemoryReport = report
  try {
    sessionStorage.setItem(REPORT_KEY, JSON.stringify(report))
  } catch (e) {
    console.warn('SessionStorage quota exceeded, using in-memory report store.', e)
    // Attempt saving compact version without large descriptions if possible
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

export function getSavedEligibilityReport(): EligibilityReport | null {
  if (inMemoryReport) return inMemoryReport
  const data = sessionStorage.getItem(REPORT_KEY)
  if (!data) return null
  try {
    inMemoryReport = JSON.parse(data)
    return inMemoryReport
  } catch {
    return null
  }
}

// Admin Auth Session
export function saveAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function removeAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_USER_KEY)
}

export function saveAdminUser(user: any) {
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user))
}

export function getAdminUser(): any | null {
  const data = localStorage.getItem(ADMIN_USER_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

// Citizen Auth Session
export function saveCitizenToken(token: string) {
  localStorage.setItem(CITIZEN_TOKEN_KEY, token)
}

export function getCitizenToken(): string | null {
  return localStorage.getItem(CITIZEN_TOKEN_KEY)
}

export function removeCitizenToken() {
  localStorage.removeItem(CITIZEN_TOKEN_KEY)
  localStorage.removeItem(CITIZEN_USER_KEY)
}

export function saveCitizenUser(user: any) {
  localStorage.setItem(CITIZEN_USER_KEY, JSON.stringify(user))
}

export function getCitizenUser(): any | null {
  const data = localStorage.getItem(CITIZEN_USER_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}
