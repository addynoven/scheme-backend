export interface Benefit {
  id: number
  benefit_type: string
  description: string
  amount: number | null
}

export interface EligibilityRule {
  id: number
  field: string
  operator: string
  value: string
  description: string | null
}

export interface RequiredDocument {
  id: number
  document_name: string
  is_mandatory: boolean
  description: string | null
}

export interface OfficialSource {
  id: number
  source_name: string
  source_url: string
}

export interface Scheme {
  id: number
  name: string
  slug: string
  category: string
  tags: string | null
  ministry: string
  description: string
  status: string
  application_url: string | null
  official_website: string | null
  launch_date: string | null
  benefits: Benefit[]
  eligibility_rules: EligibilityRule[]
  required_documents: RequiredDocument[]
  official_sources: OfficialSource[]
}

export interface CriterionVerdict {
  field: string
  criterion_title: string
  status: 'passed' | 'failed' | 'missing_info'
  your_value: any
  required_condition: string
  reason: string
}

export interface SchemeExplanation {
  scheme_id: number
  scheme_name: string
  scheme_slug: string
  ministry: string
  description: string
  status: 'eligible' | 'nearly_eligible' | 'ineligible'
  is_eligible: boolean
  match_percentage: number
  criteria_passed: number
  criteria_total: number
  summary_reason: string
  passed_criteria: CriterionVerdict[]
  failed_criteria: CriterionVerdict[]
  benefits_summary: string[]
  application_url: string | null
}

export interface EligibilityReport {
  total_evaluated: number
  eligible_count: number
  nearly_eligible_count: number
  ineligible_count: number
  eligible_schemes: SchemeExplanation[]
  nearly_eligible_schemes: SchemeExplanation[]
  ineligible_schemes: SchemeExplanation[]
}

export interface EligibilityCheckPayload {
  age?: number
  date_of_birth?: string
  gender?: string
  state?: string
  district?: string
  annual_income?: number
  occupation?: string
}

const API_BASE = '/api'

export async function fetchPopularSchemes(limit = 6): Promise<Scheme[]> {
  const res = await fetch(`${API_BASE}/schemes?limit=${limit}&status=active`)
  if (!res.ok) throw new Error('Failed to load popular schemes')
  const data = await res.json()
  return data.items || []
}

export async function searchSchemes(q?: string, category?: string): Promise<Scheme[]> {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (category && category !== 'All') params.set('category', category)
  params.set('status', 'active')

  const res = await fetch(`${API_BASE}/schemes/search?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to search schemes')
  const data = await res.json()
  return data.items || []
}

export async function getSchemeBySlug(slug: string): Promise<Scheme> {
  const res = await fetch(`${API_BASE}/schemes/slug/${slug}`)
  if (!res.ok) throw new Error('Scheme not found')
  return res.json()
}

export async function checkEligibility(payload: EligibilityCheckPayload): Promise<EligibilityReport> {
  const res = await fetch(`${API_BASE}/eligibility/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Eligibility check failed')
  return res.json()
}
