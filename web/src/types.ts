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
  caste_category?: string
  is_differently_abled?: boolean
  marital_status?: string
  residence_area?: string
  has_land?: boolean
}

export interface UserDocument {
  id: number
  user_id: number
  household_member_id?: number | null
  citizen_uid?: string | null
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

export interface ExtractedDocumentFacts {
  full_name?: string | null
  date_of_birth?: string | null
  age?: number | null
  gender?: string | null
  state?: string | null
  district?: string | null
  annual_income?: number | null
  occupation?: string | null
  caste_category?: string | null
  has_land?: boolean | null
  is_differently_abled?: boolean | null
  document_number_masked?: string | null
}

export interface ExtractedDocumentFactsResponse {
  status: string
  document_id?: number | null
  detected_document_type: string
  confidence_score: number
  evidence_summary: string
  extracted_facts: ExtractedDocumentFacts
  applicable_profile_fields: string[]
}

export interface ConfirmFactsAndSyncProfileRequest {
  full_name?: string | null
  date_of_birth?: string | null
  gender?: string | null
  state?: string | null
  district?: string | null
  annual_income?: number | null
  occupation?: string | null
  caste_category?: string | null
  is_differently_abled?: boolean | null
  marital_status?: string | null
  residence_area?: string | null
  has_land?: boolean | null
  document_number_masked?: string | null
}

export interface CitizenFactAuditItem {
  id: number
  fact_key: string
  fact_value: string
  source_document_id?: number | null
  source_document_name?: string | null
  verified_by_user_id?: number | null
  verified_at: string
}

export interface CitizenFactsAuditResponse {
  user_id: number
  citizen_uid?: string | null
  total_facts: number
  verified_facts: CitizenFactAuditItem[]
}

export interface HouseholdMember {
  id: number
  primary_user_id?: number
  user_id?: number
  citizen_uid?: string
  member_uid?: string
  household_uid?: string
  full_name: string
  member_name?: string
  relationship: string
  life_stage?: 'MINOR' | 'ADULT' | 'SENIOR' | string
  verification_status?: 'UNVERIFIED' | 'PENDING_DOCS' | 'DOCUMENT_VERIFIED' | string
  date_of_birth?: string | null
  age: number
  gender: string
  occupation?: string | null
  caste_category?: string | null
  annual_income?: number | null
  is_student?: boolean
  is_disabled?: boolean
  has_disability?: boolean
  is_differently_abled?: boolean
  aadhaar_last_four?: string | null
  state?: string
  district?: string
  marital_status?: string | null
  residence_area?: string | null
  has_land?: boolean | null
  created_at?: string
  updated_at?: string
}

export interface HouseholdMemberCreatePayload {
  member_name?: string
  full_name?: string
  relationship: string
  age: number
  gender: string
  occupation?: string | null
  annual_income?: number | null
  caste_category?: string | null
  is_differently_abled?: boolean
  state?: string
  district?: string
  marital_status?: string | null
  residence_area?: string | null
  has_land?: boolean | null
}

export interface HouseholdMemberReport {
  member_id: number
  citizen_uid: string
  member_uid: string
  full_name: string
  relationship: string
  life_stage: string
  verification_status: string
  age: number
  gender: string
  eligible_schemes_count: number
  eligible_schemes: Array<{
    name: string
    slug: string
    benefit_title?: string
    application_url?: string
  }>
}

export interface FamilyEligibilityReport {
  household_uid: string
  total_family_members: number
  total_eligible_schemes_found?: number
  total_collective_schemes?: number
  family_members_reports?: HouseholdMemberReport[]
  household_results?: HouseholdMemberReport[] | HouseholdEligibilityMemberResult[]
}

export interface HouseholdEligibilityMemberResult {
  member_id: number
  member_name: string
  relationship: string
  eligible_count: number
  nearly_eligible_count: number
  eligible_schemes: SchemeExplanation[]
  nearly_eligible_schemes: SchemeExplanation[]
}

export interface HouseholdEligibilityResponse {
  household_uid: string
  total_members: number
  total_eligible_schemes_found: number
  household_results: HouseholdEligibilityMemberResult[]
}

export interface ChatMessage {
  id: number
  session_id?: number
  role: 'user' | 'assistant' | 'system'
  content: string
  status?: 'success' | 'service_unavailable' | 'rate_limit_exceeded' | 'error'
  error_code?: string | null
  stack_trace?: string | null
  citations?: string[]
  created_at: string
}

export interface ChatSession {
  id: number
  user_id?: number
  title: string
  created_at: string
  updated_at?: string
  messages: ChatMessage[]
}

export interface VoiceTranscriptionResponse {
  transcribed_text: string
  detected_language: string
  confidence: number
}

export interface VoiceChatResponse {
  session_id?: number
  transcribed_text?: string
  detected_language?: string
  answer?: string
  transcript?: string
  text_response?: string
  citations?: string[]
  matched_schemes?: Array<{
    name: string
    slug: string
    benefit_title?: string
    application_url?: string
  }> | Scheme[]
  synthesized_speech_base64?: string | null
  synthesized_audio_base64?: string | null
  audio_mime_type?: string | null
  execution_time_ms?: number
}

export interface VoiceSynthesisResponse {
  language_code: string
  audio_format: string
  audio_base64: string
  synthesized_text: string
}
