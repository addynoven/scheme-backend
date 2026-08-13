import type { EligibilityCheckPayload, EligibilityReport } from './api'

const PROFILE_KEY = 'scheme_citizen_profile'
const REPORT_KEY = 'scheme_eligibility_report'
const ADMIN_TOKEN_KEY = 'scheme_admin_jwt'
const ADMIN_USER_KEY = 'scheme_admin_user'

export function saveCitizenProfile(profile: EligibilityCheckPayload) {
  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function getSavedCitizenProfile(): EligibilityCheckPayload | null {
  const data = sessionStorage.getItem(PROFILE_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function saveEligibilityReport(report: EligibilityReport) {
  sessionStorage.setItem(REPORT_KEY, JSON.stringify(report))
}

export function getSavedEligibilityReport(): EligibilityReport | null {
  const data = sessionStorage.getItem(REPORT_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

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
