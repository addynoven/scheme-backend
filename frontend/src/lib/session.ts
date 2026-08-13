import type { EligibilityCheckPayload, EligibilityReport } from './api'

const PROFILE_KEY = 'scheme_citizen_profile'
const REPORT_KEY = 'scheme_eligibility_report'

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
