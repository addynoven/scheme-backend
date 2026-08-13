import { getAdminToken, getCitizenToken } from './session'

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

export interface UserDocument {
  id: number
  user_id: number
  document_type: string
  document_number_masked?: string | null
  file_name: string
  file_size_bytes: number
  mime_type: string
  is_verified: boolean
  download_url?: string | null
  created_at?: string
  updated_at?: string
}

export interface DocumentReadinessItem {
  document_name: string
  description?: string | null
  is_mandatory: boolean
  status: 'available' | 'missing'
  matched_vault_document_id?: number | null
  matched_vault_document_name?: string | null
}

export interface SchemeDocumentReadiness {
  scheme_id: number
  scheme_name: string
  scheme_slug: string
  is_ready_to_apply: boolean
  readiness_percentage: number
  mandatory_total: number
  mandatory_available: number
  optional_total: number
  optional_available: number
  checklist: DocumentReadinessItem[]
  summary: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  skip: number
  limit: number
}

const API_BASE = '/api'

function getAdminAuthHeaders(): Record<string, string> {
  const token = getAdminToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

function getCitizenAuthHeaders(): Record<string, string> {
  const token = getCitizenToken()
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// ============================================================================
// CITIZEN PUBLIC & ELIGIBILITY APIS
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

export async function searchSchemesPaginated(
  q?: string,
  category?: string,
  state?: string,
  skip = 0,
  limit = 24
): Promise<PaginatedResult<Scheme>> {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (category && category !== 'All') params.set('category', category)
  if (state && state !== 'ALL_INDIA' && state !== 'All') params.set('state', state)
  params.set('status', 'active')
  params.set('skip', String(skip))
  params.set('limit', String(limit))

  const res = await fetch(`${API_BASE}/schemes/search?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to search schemes')
  return res.json()
}

export async function searchSchemes(q?: string, category?: string, state?: string): Promise<Scheme[]> {
  const data = await searchSchemesPaginated(q, category, state, 0, 24)
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
// CITIZEN AUTH APIS
// ============================================================================

export async function citizenRegister(payload: { email: string; phone: string; password: string }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Registration failed')
  }
  return res.json()
}

export async function citizenLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Invalid credentials')
  }
  return res.json()
}

export async function citizenGetMe() {
  const headers = getCitizenAuthHeaders()
  headers['Content-Type'] = 'application/json'
  const res = await fetch(`${API_BASE}/auth/me`, { headers })
  if (!res.ok) throw new Error('Failed to load user profile')
  return res.json()
}

// ============================================================================
// DOCUMENT VAULT & READINESS APIS
// ============================================================================

export async function uploadVaultDocument(
  file: File,
  documentType: string,
  maskedNumber?: string
): Promise<UserDocument> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('document_type', documentType)
  if (maskedNumber) {
    formData.append('document_number_masked', maskedNumber)
  }

  const headers = getCitizenAuthHeaders()
  const res = await fetch(`${API_BASE}/vault/documents/upload`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to upload document')
  }
  return res.json()
}

export async function listVaultDocuments(): Promise<UserDocument[]> {
  const headers = getCitizenAuthHeaders()
  headers['Content-Type'] = 'application/json'
  const res = await fetch(`${API_BASE}/vault/documents`, { headers })
  if (!res.ok) {
    if (res.status === 401) throw new Error('UNAUTHORIZED')
    throw new Error('Failed to list vault documents')
  }
  return res.json()
}

export async function deleteVaultDocument(id: number): Promise<void> {
  const headers = getCitizenAuthHeaders()
  headers['Content-Type'] = 'application/json'
  const res = await fetch(`${API_BASE}/vault/documents/${id}`, {
    method: 'DELETE',
    headers,
  })
  if (!res.ok) throw new Error('Failed to delete document')
}

export async function getSchemeDocumentReadiness(schemeId: number): Promise<SchemeDocumentReadiness> {
  const headers = getCitizenAuthHeaders()
  headers['Content-Type'] = 'application/json'
  const res = await fetch(`${API_BASE}/vault/readiness/schemes/${schemeId}`, { headers })
  if (!res.ok) {
    if (res.status === 401) throw new Error('UNAUTHORIZED')
    throw new Error('Failed to evaluate scheme readiness')
  }
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
    headers: getAdminAuthHeaders(),
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
    headers: getAdminAuthHeaders(),
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
    headers: getAdminAuthHeaders(),
  })
  if (!res.ok) throw new Error('Scheme not found')
  return res.json()
}

export async function adminCreateScheme(payload: any): Promise<Scheme> {
  const res = await fetch(`${API_BASE}/admin/schemes`, {
    method: 'POST',
    headers: getAdminAuthHeaders(),
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
    headers: getAdminAuthHeaders(),
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
    headers: getAdminAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete scheme')
}

// ============================================================================
// V1.5 INGESTION & TRIAGE APIS
// ============================================================================

export interface IngestionSource {
  id: number
  source_key: string
  name: string
  endpoint_url: string
  source_type: string
  etag: string | null
  last_modified_header: string | null
  content_hash: string | null
  status: string
  failure_count: number
  last_checked_at: string | null
  last_synced_at: string | null
}

export interface IngestionTriageItem {
  id: number
  source_id: number
  scheme_slug: string
  scheme_name: string
  change_type: string
  impact_level: string
  diff_summary: string
  diff_payload: {
    before_state?: any
    after_state?: any
  }
  status: string
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface IngestionSyncRunResult {
  source_key: string
  status: string
  http_status: number | null
  bytes_downloaded: number
  raw_s3_key: string | null
  semantic_hash: string | null
  schemes_created: number
  schemes_updated: number
  breaking_changes_triaged: number
  message: string
  duration_ms: number
}

export async function adminListIngestionSources(): Promise<IngestionSource[]> {
  const res = await fetch(`${API_BASE}/admin/ingestion/sources`, {
    headers: getAdminAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load ingestion sources')
  return res.json()
}

export async function adminRunIngestionSync(sourceKey?: string): Promise<IngestionSyncRunResult[]> {
  const url = sourceKey
    ? `${API_BASE}/admin/ingestion/run?source_key=${encodeURIComponent(sourceKey)}`
    : `${API_BASE}/admin/ingestion/run`
  const res = await fetch(url, {
    method: 'POST',
    headers: getAdminAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Ingestion sync failed')
  }
  return res.json()
}

export async function adminListTriageItems(statusFilter: string = 'pending_review'): Promise<IngestionTriageItem[]> {
  const url = statusFilter
    ? `${API_BASE}/admin/ingestion/triage?status_filter=${encodeURIComponent(statusFilter)}`
    : `${API_BASE}/admin/ingestion/triage`
  const res = await fetch(url, {
    headers: getAdminAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load triage items')
  return res.json()
}

export async function adminApproveTriageItem(id: number): Promise<IngestionTriageItem> {
  const res = await fetch(`${API_BASE}/admin/ingestion/triage/${id}/approve`, {
    method: 'POST',
    headers: getAdminAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to approve triage item')
  }
  return res.json()
}

export async function adminRejectTriageItem(id: number): Promise<IngestionTriageItem> {
  const res = await fetch(`${API_BASE}/admin/ingestion/triage/${id}/reject`, {
    method: 'POST',
    headers: getAdminAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to reject triage item')
  }
  return res.json()
}

