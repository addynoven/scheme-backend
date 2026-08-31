import { getAdminToken, getCitizenToken } from '../auth/session'
import type {
  Benefit,
  EligibilityRule,
  RequiredDocument,
  OfficialSource,
  Scheme,
  CriterionVerdict,
  SchemeExplanation,
  EligibilityReport,
  EligibilityCheckPayload,
  UserDocument,
  DocumentReadinessItem,
  SchemeDocumentReadiness,
  ExtractedDocumentFacts,
  ExtractedDocumentFactsResponse,
  ConfirmFactsAndSyncProfileRequest,
  CitizenFactAuditItem,
  CitizenFactsAuditResponse,
  HouseholdMember,
  HouseholdMemberCreatePayload,
  HouseholdEligibilityMemberResult,
  HouseholdEligibilityResponse,
  FamilyEligibilityReport,
  ChatMessage,
  ChatSession,
  VoiceTranscriptionResponse,
  VoiceChatResponse,
  VoiceSynthesisResponse,
} from '../../types'

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

export async function listSchemesPaginated(params?: {
  skip?: number
  limit?: number
  category?: string
  state?: string
  ministry?: string
  search?: string
  sort_by?: string
}): Promise<PaginatedResult<Scheme>> {
  const query = new URLSearchParams()
  if (params?.skip !== undefined) query.set('skip', String(params.skip))
  if (params?.limit !== undefined) query.set('limit', String(params.limit))
  if (params?.category && params.category !== 'All') query.set('category', params.category)
  if (params?.state && params.state !== 'ALL_INDIA' && params.state !== 'All') query.set('state', params.state)
  if (params?.ministry && params.ministry !== 'All') query.set('ministry', params.ministry)
  if (params?.search) query.set('search', params.search)
  if (params?.sort_by) query.set('sort_by', params.sort_by)
  query.set('status', 'active')

  const res = await fetch(`${API_BASE}/schemes?${query.toString()}`)
  if (!res.ok) throw new Error('Failed to load schemes')
  return res.json()
}

export async function getSchemeCategories(): Promise<Array<{ category: string; count: number }>> {
  const res = await fetch(`${API_BASE}/schemes/categories`)
  if (!res.ok) throw new Error('Failed to load scheme categories')
  return res.json()
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

export async function updateCitizenProfile(payload: {
  full_name: string
  date_of_birth: string
  gender: string
  state: string
  district: string
  annual_income: number
  occupation: string
  caste_category?: string
  is_differently_abled?: boolean
  marital_status?: string
  residence_area?: string
  has_land?: boolean
}) {
  const headers = getCitizenAuthHeaders()
  headers['Content-Type'] = 'application/json'
  const res = await fetch(`${API_BASE}/users/me/profile`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to update citizen profile')
  }
  return res.json()
}

// ============================================================================
// DOCUMENT VAULT & READINESS APIS
// ============================================================================

export async function uploadVaultDocument(
  file: File,
  documentType: string,
  maskedNumber?: string,
  householdMemberId?: number | null
): Promise<UserDocument> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('document_type', documentType)
  if (maskedNumber) {
    formData.append('document_number_masked', maskedNumber)
  }
  if (householdMemberId) {
    formData.append('household_member_id', String(householdMemberId))
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

export async function listVaultDocuments(householdMemberId?: number | null): Promise<UserDocument[]> {
  const headers = getCitizenAuthHeaders()
  headers['Content-Type'] = 'application/json'
  const url = householdMemberId
    ? `${API_BASE}/vault/documents?household_member_id=${householdMemberId}`
    : `${API_BASE}/vault/documents`
  const res = await fetch(url, { headers })
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

export async function extractVaultDocumentFacts(documentId: number): Promise<ExtractedDocumentFactsResponse> {
  const headers = getCitizenAuthHeaders()
  headers['Content-Type'] = 'application/json'
  const res = await fetch(`${API_BASE}/vault/documents/${documentId}/extract-facts`, {
    method: 'POST',
    headers,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to extract facts from document')
  }
  return res.json()
}

export async function confirmAndSyncProfileFacts(
  documentId: number,
  data: ConfirmFactsAndSyncProfileRequest
): Promise<{ status: string; synced_fields: string[]; message: string; profile: any }> {
  const headers = getCitizenAuthHeaders()
  headers['Content-Type'] = 'application/json'
  const res = await fetch(`${API_BASE}/vault/documents/${documentId}/confirm-and-sync-profile`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to sync confirmed facts to profile')
  }
  return res.json()
}

export async function extractQuickDocument(
  file: File,
  documentType?: string
): Promise<ExtractedDocumentFactsResponse> {
  const formData = new FormData()
  formData.append('file', file)
  if (documentType) {
    formData.append('document_type', documentType)
  }

  const headers = getCitizenAuthHeaders()
  const res = await fetch(`${API_BASE}/ocr/extract`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to auto-extract document facts')
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

// ============================================================================
// V2.6 TWO-STAGE QUERY ROUTER APIS
// ============================================================================

export interface QueryRouteResponse {
  route_type: string
  normalized_intent: string
  answer: string
  citations: string[]
  matched_schemes: Array<{
    name: string
    slug: string
    state?: string
    benefit_title?: string
    application_url?: string
  }>
  execution_plan?: {
    sql_facts?: any
    okf_paths?: string[]
    web_queries?: string[]
  }
}

export async function queryRouter(question: string, state?: string): Promise<QueryRouteResponse> {
  const res = await fetch(`${API_BASE}/routing/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCitizenAuthHeaders(),
    },
    body: JSON.stringify({ question, state }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Query routing failed')
  }
  return res.json()
}

// ============================================================================
// V2.7 HOUSEHOLD & FAMILY WELFARE GRAPH APIS
// ============================================================================

export async function listHouseholdMembers(): Promise<HouseholdMember[]> {
  const res = await fetch(`${API_BASE}/household/members`, {
    headers: getCitizenAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load household members')
  return res.json()
}

export async function getHouseholdMember(id: number): Promise<HouseholdMember> {
  const res = await fetch(`${API_BASE}/household/members/${id}`, {
    headers: getCitizenAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch family member')
  return res.json()
}

export async function addHouseholdMember(payload: {
  full_name: string
  relationship: string
  age: number
  date_of_birth?: string | null
  gender: string
  occupation?: string | null
  caste_category?: string | null
  annual_income?: number | null
  is_student?: boolean
  is_disabled?: boolean
  aadhaar_last_four?: string | null
}): Promise<HouseholdMember> {
  const res = await fetch(`${API_BASE}/household/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCitizenAuthHeaders(),
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to add family member')
  }
  return res.json()
}

export async function updateHouseholdMember(
  id: number,
  payload: Partial<HouseholdMember>
): Promise<HouseholdMember> {
  const res = await fetch(`${API_BASE}/household/members/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getCitizenAuthHeaders(),
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to update family member')
  }
  return res.json()
}

export async function deleteHouseholdMember(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/household/members/${id}`, {
    method: 'DELETE',
    headers: getCitizenAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete family member')
}

export async function getFamilyEligibility(): Promise<FamilyEligibilityReport> {
  const res = await fetch(`${API_BASE}/household/eligibility`, {
    headers: getCitizenAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to run family welfare scan')
  return res.json()
}

// ============================================================================
// V2.8 CONVERSATIONAL CITIZEN CHAT APIS
// ============================================================================

export async function listChatSessions(): Promise<ChatSession[]> {
  const res = await fetch(`${API_BASE}/chat/sessions`, {
    headers: getCitizenAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to list chat sessions')
  return res.json()
}

export async function createChatSession(title: string = 'New Welfare Assistance'): Promise<ChatSession> {
  const res = await fetch(`${API_BASE}/chat/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCitizenAuthHeaders(),
    },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error('Failed to create chat session')
  return res.json()
}

export async function getChatSession(sessionId: number): Promise<ChatSession> {
  const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, {
    headers: getCitizenAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load chat session')
  return res.json()
}

export async function updateChatSessionTitle(sessionId: number, title: string): Promise<ChatSession> {
  const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getCitizenAuthHeaders(),
    },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error('Failed to update chat session title')
  return res.json()
}

export async function deleteChatSession(sessionId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: getCitizenAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete chat session')
}

export async function sendChatMessage(
  sessionId: number,
  content: string,
  languageCode: string = 'en'
): Promise<ChatMessage> {
  console.log(`💬 [API sendChatMessage] POST /chat/sessions/${sessionId}/messages | Content:`, content)
  const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCitizenAuthHeaders(),
    },
    body: JSON.stringify({ content, language_code: languageCode }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error(`❌ [API sendChatMessage] Error response HTTP ${res.status}:`, err)
    throw new Error(err.message || 'Failed to send message')
  }
  const data = await res.json()
  console.log(`✅ [API sendChatMessage] Response received:`, data)
  return data
}

export async function streamChatMessage(
  sessionId: number,
  content: string,
  onToken: (token: string, citations?: string[]) => void,
  onDone: (messageId: number) => void,
  onError: (err: Error) => void
): Promise<void> {
  console.log(`📡 [API streamChatMessage] Connecting to SSE stream | Session: ${sessionId} | Query: "${content}"`)
  try {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getCitizenAuthHeaders(),
      },
      body: JSON.stringify({ content }),
    })

    if (!res.ok || !res.body) {
      console.error(`❌ [API streamChatMessage] SSE HTTP error ${res.status}: ${res.statusText}`)
      throw new Error(`SSE streaming failed with status ${res.status}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let tokenCount = 0

    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        console.log(`🏁 [API streamChatMessage] Stream EOF reached | Total tokens emitted: ${tokenCount}`)
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim()
          if (!jsonStr) continue
          try {
            const data = JSON.parse(jsonStr)
            if (data.type === 'token') {
              tokenCount++
              onToken(data.token, data.citations)
            } else if (data.type === 'done') {
              console.log(`✨ [API streamChatMessage] 'done' event received. Message ID: ${data.message_id}`)
              onDone(data.message_id)
            } else if (data.type === 'error') {
              console.warn(`⚠️ [API streamChatMessage] 'error' event received:`, data)
              onError(new Error(data.message || 'Streaming error'))
            }
          } catch (e) {
            console.error('❌ [API streamChatMessage] SSE JSON parse error:', e)
          }
        }
      }
    }
  } catch (err: any) {
    console.error(`❌ [API streamChatMessage] Uncaught error:`, err)
    onError(err)
  }
}

// ============================================================================
// V2.9 VOICE-FIRST SPEECH INTERFACE APIS
// ============================================================================

export async function transcribeAudio(file: File): Promise<VoiceTranscriptionResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/voice/transcribe`, {
    method: 'POST',
    headers: getCitizenAuthHeaders(),
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Audio transcription failed')
  }
  return res.json()
}

export async function voiceChat(file: File, sessionId?: number): Promise<VoiceChatResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const url = sessionId ? `${API_BASE}/voice/chat?session_id=${sessionId}` : `${API_BASE}/voice/chat`
  const res = await fetch(url, {
    method: 'POST',
    headers: getCitizenAuthHeaders(),
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Voice chat failed')
  }
  return res.json()
}

export async function synthesizeSpeech(text: string, languageCode: string = 'hi'): Promise<VoiceSynthesisResponse> {
  const res = await fetch(`${API_BASE}/voice/synthesize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCitizenAuthHeaders(),
    },
    body: JSON.stringify({ text, language_code: languageCode }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Speech synthesis failed')
  }
  return res.json()
}

export async function getVoiceTools(): Promise<any> {
  const res = await fetch(`${API_BASE}/voice/tools`)
  if (!res.ok) throw new Error('Failed to fetch voice tools')
  return res.json()
}


