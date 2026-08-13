import { getAdminToken } from './session'

export interface Benefit {
  id: number
  title?: string
  benefit_type?: string
  description: string
  amount?: number | null
}

export interface EligibilityRule {
  id: number
  field_name?: string
  field?: string
  operator: string
  rule_value?: string
  value?: string
  description?: string | null
}

export interface RequiredDocument {
  id: number
  document_name: string
  is_mandatory: boolean
  description?: string | null
}

export interface OfficialSource {
  id: number
  title?: string
  source_name?: string
  url?: string
  source_url?: string
  source_type?: string
}

export interface Scheme {
  id: number
  name: string
  slug: string
  state?: string
  category: string
  tags?: string | null
  ministry: string
  description: string
  status: string
  application_url?: string | null
  official_website?: string | null
  launch_date?: string | null
  created_at?: string
  updated_at?: string
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
  state?: string
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
  application_url?: string | null
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

export interface PaginatedResult<T> {
  items: T[]
  total: number
  skip: number
  limit: number
}

const API_BASE = '/api'

function getAuthHeaders(): Record<string, string> {
  const token = getAdminToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// ============================================================================
// CITIZEN PUBLIC APIS
// ============================================================================

export async function fetchPopularSchemes(limit = 8, state?: string): Promise<Scheme[]> {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  params.set('status', 'active')
  if (state && state !== 'ALL_INDIA' && state !== 'All') {
    params.set('state', state)
  }
  const res = await fetch(`${API_BASE}/schemes?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to load popular schemes')
  const data = await res.json()
  return data.items || []
}

export async function searchSchemes(q?: string, category?: string, state?: string): Promise<Scheme[]> {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (category && category !== 'All') params.set('category', category)
  if (state && state !== 'ALL_INDIA' && state !== 'All') params.set('state', state)
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

// ============================================================================
// ADMIN APIS
// ============================================================================

export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Invalid admin credentials')
  }
  return res.json()
}

export async function adminGetMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to verify admin session')
  return res.json()
}

export async function adminListSchemes(params?: {
  skip?: number
  limit?: number
  state?: string
  category?: string
  status?: string
  search?: string
}): Promise<PaginatedResult<Scheme>> {
  const q = new URLSearchParams()
  if (params?.skip !== undefined) q.set('skip', String(params.skip))
  if (params?.limit !== undefined) q.set('limit', String(params.limit))
  if (params?.state && params.state !== 'All') q.set('state', params.state)
  if (params?.category && params.category !== 'All') q.set('category', params.category)
  if (params?.status && params.status !== 'All') q.set('status', params.status)
  if (params?.search) q.set('search', params.search)

  const res = await fetch(`${API_BASE}/admin/schemes?${q.toString()}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('UNAUTHORIZED')
    }
    throw new Error('Failed to load schemes')
  }
  return res.json()
}

export async function adminGetScheme(id: number): Promise<Scheme> {
  const res = await fetch(`${API_BASE}/admin/schemes/${id}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Scheme not found')
  return res.json()
}

export async function adminCreateScheme(payload: any): Promise<Scheme> {
  const res = await fetch(`${API_BASE}/admin/schemes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to create scheme')
  }
  return res.json()
}

export async function adminUpdateScheme(id: number, payload: any): Promise<Scheme> {
  const res = await fetch(`${API_BASE}/admin/schemes/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to update scheme')
  }
  return res.json()
}

export async function adminDeleteScheme(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/schemes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete scheme')
}

export async function adminAddRule(schemeId: number, rule: any): Promise<EligibilityRule> {
  const res = await fetch(`${API_BASE}/admin/schemes/${schemeId}/rules`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(rule),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to add rule')
  }
  return res.json()
}

export async function adminDeleteRule(ruleId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/rules/${ruleId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete rule')
}

export async function adminAddDocument(schemeId: number, doc: any): Promise<RequiredDocument> {
  const res = await fetch(`${API_BASE}/admin/schemes/${schemeId}/documents`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(doc),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to add document')
  }
  return res.json()
}

export async function adminDeleteDocument(docId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/documents/${docId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete document')
}

export async function adminAddBenefit(schemeId: number, benefit: any): Promise<Benefit> {
  const res = await fetch(`${API_BASE}/admin/schemes/${schemeId}/benefits`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(benefit),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to add benefit')
  }
  return res.json()
}

export async function adminDeleteBenefit(benefitId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/benefits/${benefitId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete benefit')
}
