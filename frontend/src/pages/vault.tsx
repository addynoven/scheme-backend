import { useState, useEffect, useRef } from 'react'
import {
  FolderLock,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Download,
  Sparkles,
  LogOut,
  FileCheck,
  Loader2,
  ShieldCheck,
  Edit3,
  X,
} from 'lucide-react'
import {
  citizenLogin,
  citizenRegister,
  citizenGetMe,
  uploadVaultDocument,
  listVaultDocuments,
  deleteVaultDocument,
  getSchemeDocumentReadiness,
  fetchPopularSchemes,
  extractVaultDocumentFacts,
  confirmAndSyncProfileFacts,
  listHouseholdMembers,
  type UserDocument,
  type Scheme,
  type SchemeDocumentReadiness,
  type ExtractedDocumentFactsResponse,
  type ConfirmFactsAndSyncProfileRequest,
  type HouseholdMember,
} from '@/lib/api'
import {
  saveCitizenToken,
  getCitizenToken,
  removeCitizenToken,
  saveCitizenUser,
} from '@/lib/session'

const DOCUMENT_TYPES = [
  { label: 'PAN Card (Income Tax / Business ID)', value: 'PAN Card', icon: '🪪' },
  { label: 'Aadhaar Card (UIDAI Proof of Identity)', value: 'Aadhaar Card', icon: '🆔' },
  { label: 'Bank Passbook / Statement (6 Months)', value: 'Bank Passbook', icon: '🏦' },
  { label: 'Income Certificate (Tehsildar / SDO)', value: 'Income Certificate', icon: '📜' },
  { label: 'Ration Card / BPL Card', value: 'Ration Card', icon: '🍚' },
  { label: 'Land Records (Khasra / Khatauni)', value: 'Land Records', icon: '🌾' },
  { label: '10th / 12th Educational Marksheet', value: '10th Marksheet', icon: '🎓' },
  { label: 'Business Address Proof / Udyam MSME', value: 'Business Address Proof', icon: '🏢' },
  { label: 'Birth Certificate / Age Proof', value: 'Birth Certificate', icon: '👶' },
]

export default function DocumentVaultPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [citizenEmail, setCitizenEmail] = useState<string | null>(null)
  const [primaryCitizenUid, setPrimaryCitizenUid] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Household & Member Filter State
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([])
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<number | 'all'>('all')
  const [uploadTargetMemberId, setUploadTargetMemberId] = useState<number | null>(null)

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('citizen.user@example.com')
  const [phone, setPhone] = useState('+919876543210')
  const [password, setPassword] = useState('CitizenPass123!')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Vault state
  const [documents, setDocuments] = useState<UserDocument[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  // Upload Form
  const [selectedDocType, setSelectedDocType] = useState('PAN Card')
  const [docMaskedNumber, setDocMaskedNumber] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Schemes for Readiness Calculation
  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [selectedSchemeId, setSelectedSchemeId] = useState<number | null>(null)
  const [readiness, setReadiness] = useState<SchemeDocumentReadiness | null>(null)
  const [loadingReadiness, setLoadingReadiness] = useState(false)

  // V2.0 Multimodal Fact Extraction & Verification Modal state
  const [extractingDocId, setExtractingDocId] = useState<number | null>(null)
  const [activeModalDocId, setActiveModalDocId] = useState<number | null>(null)
  const [activeModalData, setActiveModalData] = useState<ExtractedDocumentFactsResponse | null>(null)
  const [verificationForm, setVerificationForm] = useState<ConfirmFactsAndSyncProfileRequest>({})
  const [syncingProfile, setSyncingProfile] = useState(false)
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null)

  // Verify auth on mount
  useEffect(() => {
    const token = getCitizenToken()
    if (token) {
      citizenGetMe()
        .then((res) => {
          setIsAuthenticated(true)
          setCitizenEmail(res.email)
          setPrimaryCitizenUid(res.citizen_uid || null)
          listHouseholdMembers().then(setHouseholdMembers).catch(() => {})
          loadDocuments('all')
          loadSchemesList()
          setCheckingAuth(false)
        })
        .catch(() => {
          handleLogout()
          setCheckingAuth(false)
        })
    } else {
      setCheckingAuth(false)
    }
  }, [])

  function loadDocuments(filter = selectedMemberFilter) {
    setLoadingDocs(true)
    listVaultDocuments(filter === 'all' ? null : filter)
      .then((docs) => setDocuments(docs))
      .catch((err) => console.error(err))
      .finally(() => setLoadingDocs(false))
  }

  function loadSchemesList() {
    fetchPopularSchemes(25)
      .then((items) => {
        setSchemes(items)
        if (items.length > 0) {
          setSelectedSchemeId(items[0].id)
        }
      })
      .catch((err) => console.error(err))
  }

  // Recalculate readiness when selected scheme or documents change
  useEffect(() => {
    if (selectedSchemeId && isAuthenticated) {
      setLoadingReadiness(true)
      getSchemeDocumentReadiness(selectedSchemeId)
        .then((data) => setReadiness(data))
        .catch((err) => console.error(err))
        .finally(() => setLoadingReadiness(false))
    }
  }, [selectedSchemeId, documents, isAuthenticated])

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError(null)

    try {
      if (authMode === 'register') {
        await citizenRegister({ email, phone, password })
      }
      const loginRes = await citizenLogin(email, password)
      saveCitizenToken(loginRes.access_token)

      const userRes = await citizenGetMe()
      saveCitizenUser(userRes)

      setIsAuthenticated(true)
      setCitizenEmail(userRes.email)
      loadDocuments()
      loadSchemesList()
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please check credentials.')
    } finally {
      setAuthLoading(false)
    }
  }

  function handleLogout() {
    removeCitizenToken()
    setIsAuthenticated(false)
    setCitizenEmail(null)
    setDocuments([])
    setReadiness(null)
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setUploadError('Please choose a PDF or image file to upload.')
      return
    }

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const uploadedDoc = await uploadVaultDocument(
        file,
        selectedDocType,
        docMaskedNumber || undefined,
        uploadTargetMemberId
      )
      setUploadSuccess(`Successfully stored "${uploadedDoc.file_name}" in your secure MinIO S3 Vault.`)
      setDocMaskedNumber('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      loadDocuments()
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document to S3 storage.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteDoc(id: number, name: string) {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}" from your vault?`)) {
      return
    }
    try {
      await deleteVaultDocument(id)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } catch (err: any) {
      alert(`Error deleting document: ${err.message}`)
    }
  }

  async function handleExtractFacts(docId: number) {
    setExtractingDocId(docId)
    setUploadError(null)
    try {
      const res = await extractVaultDocumentFacts(docId)
      setActiveModalDocId(docId)
      setActiveModalData(res)
      setVerificationForm({
        full_name: res.extracted_facts.full_name || '',
        date_of_birth: res.extracted_facts.date_of_birth || '',
        gender: res.extracted_facts.gender || '',
        state: res.extracted_facts.state || '',
        district: res.extracted_facts.district || '',
        annual_income: res.extracted_facts.annual_income ?? undefined,
        occupation: res.extracted_facts.occupation || '',
        caste_category: res.extracted_facts.caste_category || '',
        has_land: res.extracted_facts.has_land ?? undefined,
        is_differently_abled: res.extracted_facts.is_differently_abled ?? undefined,
      })
    } catch (err: any) {
      alert(`Fact extraction failed: ${err.message}`)
    } finally {
      setExtractingDocId(null)
    }
  }

  async function handleConfirmAndSync() {
    if (!activeModalDocId) return
    setSyncingProfile(true)
    try {
      const res = await confirmAndSyncProfileFacts(activeModalDocId, verificationForm)
      setSyncSuccessToast(res.message || 'Profile successfully updated from verified facts.')
      setActiveModalData(null)
      setActiveModalDocId(null)
      loadDocuments()
      if (selectedSchemeId) {
        getSchemeDocumentReadiness(selectedSchemeId).then((data) => setReadiness(data))
      }
      setTimeout(() => setSyncSuccessToast(null), 6000)
    } catch (err: any) {
      alert(`Profile sync failed: ${err.message}`)
    } finally {
      setSyncingProfile(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  // ==========================================================================
  // VIEW A: CITIZEN VAULT LOGIN / REGISTER
  // ==========================================================================
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-10 flex flex-col gap-6">
        <div className="rounded-3xl border border-zinc-800/90 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="flex flex-col gap-2 mb-6 text-center items-center">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-2">
              <FolderLock className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
              Citizen Document Vault · V2.0
            </h1>
            <p className="text-xs text-zinc-400">
              Store your Aadhaar, PAN card, and certificates securely in MinIO S3 and track your live scheme application readiness score.
            </p>
          </div>

          <div className="flex rounded-xl bg-zinc-950 p-1 mb-6 border border-zinc-800">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                authMode === 'login' ? 'bg-blue-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                authMode === 'register' ? 'bg-blue-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              New Citizen Account
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="citizen@india.gov.in"
              />
            </div>

            {authMode === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Mobile Phone (+91)</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="+919876543210"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {authLoading
                ? 'Authenticating...'
                : authMode === 'login'
                ? 'Open Document Vault'
                : 'Create Account & Open Vault'}
            </button>
          </form>

          {/* Quick preset credentials helper */}
          <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center">
            <p className="text-[11px] text-zinc-500">
              Demo Credentials: <span className="text-zinc-300 font-mono">citizen.user@example.com</span> / <span className="text-zinc-300 font-mono">CitizenPass123!</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================================================
  // VIEW B: AUTHENTICATED CITIZEN VAULT & READINESS DASHBOARD
  // ==========================================================================
  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-zinc-800/90 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 shadow-xl">
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/80 border border-blue-800/60 text-blue-300 w-fit">
            <FolderLock className="h-3.5 w-3.5 text-blue-400" />
            <span>Encrypted S3 Document Vault · V2.0 (Gemini 3.5 Flash)</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Citizen Document Vault & Live AI Fact Extractor
          </h1>
          <p className="text-xs text-zinc-400">
            Upload verified documents once. Gemini Vision auto-extracts your demographics with human-verified confirmation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold text-zinc-300 block">{citizenEmail}</span>
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Vault Active</span>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {syncSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{syncSuccessToast}</span>
          </div>
          <button onClick={() => setSyncSuccessToast(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main 2-Column Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ===================================================================
            LEFT COLUMN (7 cols): Document Upload & Stored Items
            =================================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Document Upload Card */}
          <div className="rounded-3xl border border-zinc-800/90 bg-zinc-900/60 p-6 shadow-xl flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-100">
                <UploadCloud className="h-4 w-4 text-blue-400" />
                <span>Upload Document to Vault</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">Max 10MB · PDF, JPG, PNG</span>
            </div>

            {uploadError && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <FileCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5 text-xs sm:col-span-1">
                  <label className="font-semibold text-zinc-300">Document Type *</label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                  >
                    {DOCUMENT_TYPES.map((dt) => (
                      <option key={dt.value} value={dt.value}>
                        {dt.icon} {dt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 text-xs sm:col-span-1">
                  <label className="font-semibold text-zinc-300">Target Family Member</label>
                  <select
                    value={uploadTargetMemberId === null ? '' : String(uploadTargetMemberId)}
                    onChange={(e) => setUploadTargetMemberId(e.target.value === '' ? null : Number(e.target.value))}
                    className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                  >
                    <option value="">👤 Self (Primary - {primaryCitizenUid || 'Head'})</option>
                    {householdMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.life_stage === 'MINOR' ? '🧒' : m.life_stage === 'SENIOR' ? '👵' : '👤'} {m.full_name} ({m.relationship} • {m.citizen_uid})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 text-xs sm:col-span-1">
                  <label className="font-semibold text-zinc-300">Masked ID / Certificate No.</label>
                  <input
                    type="text"
                    value={docMaskedNumber}
                    onChange={(e) => setDocMaskedNumber(e.target.value)}
                    placeholder="e.g. XXXX-XXXX-4532"
                    className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  required
                  accept="image/*,.pdf"
                  className="w-full text-xs text-zinc-400 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                />

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {uploading ? 'Storing in S3...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>

          {/* Stored Documents List Card */}
          <div className="rounded-3xl border border-zinc-800/90 bg-zinc-900/60 p-6 shadow-xl flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-400" />
                <h2 className="text-sm font-bold text-zinc-100">
                  Your Vault Documents ({documents.length})
                </h2>
              </div>
              <span className="text-[11px] text-zinc-500">Encrypted in MinIO S3</span>
            </div>

            {/* Member Filter Pills */}
            {householdMembers.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  onClick={() => {
                    setSelectedMemberFilter('all')
                    loadDocuments('all')
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedMemberFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  All Family Docs
                </button>
                {householdMembers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMemberFilter(m.id)
                      loadDocuments(m.id)
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      selectedMemberFilter === m.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <span>{m.life_stage === 'MINOR' ? '🧒' : m.life_stage === 'SENIOR' ? '👵' : '👤'}</span>
                    <span>{m.full_name}</span>
                  </button>
                ))}
              </div>
            )}

            {loadingDocs ? (
              <div className="py-12 text-center text-zinc-500 text-xs">Loading vault items...</div>
            ) : documents.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-2 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40">
                <FolderLock className="h-8 w-8 text-zinc-600" />
                <span className="text-xs font-semibold text-zinc-400">Your Document Vault is empty</span>
                <span className="text-[11px] text-zinc-500 max-w-xs">
                  Upload your Aadhaar Card, PAN Card, or Income Certificate above to automatically evaluate your scheme application readiness.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => {
                  const sizeKB = Math.round(doc.file_size_bytes / 1024)
                  const icon = DOCUMENT_TYPES.find((d) => d.value === doc.document_type)?.icon || '📄'
                  const isExtractingThis = extractingDocId === doc.id

                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl shrink-0">
                          {icon}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-zinc-100">{doc.document_type}</span>
                            {doc.citizen_uid && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                {doc.citizen_uid}
                              </span>
                            )}
                            {doc.is_verified && (
                              <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-800/70 font-semibold">
                                <ShieldCheck className="h-3 w-3" />
                                <span>Verified</span>
                              </span>
                            )}
                            {doc.document_number_masked && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                                {doc.document_number_masked}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 font-mono truncate max-w-xs">
                            {doc.file_name} · <span className="text-zinc-500">{sizeKB} KB</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {/* ✨ AI Fact Extraction Button */}
                        <button
                          type="button"
                          onClick={() => handleExtractFacts(doc.id)}
                          disabled={isExtractingThis}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 text-[11px] font-semibold border border-indigo-800/60 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                        >
                          {isExtractingThis ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>AI Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 text-indigo-400" />
                              <span>Extract Facts</span>
                            </>
                          )}
                        </button>

                        {doc.download_url && (
                          <a
                            href={doc.download_url.replace('http://minio:9000', 'http://localhost:9000')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition-colors"
                          >
                            <Download className="h-3 w-3" />
                            <span>Download</span>
                          </a>
                        )}

                        <button
                          onClick={() => handleDeleteDoc(doc.id, doc.file_name)}
                          className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-950/60 transition-colors cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================
            RIGHT COLUMN (5 cols): Live Scheme Application Readiness Meter
            =================================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="rounded-3xl border border-zinc-800/90 bg-zinc-900/60 p-6 shadow-xl flex flex-col gap-5 sticky top-24">
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Live Application Readiness Evaluator</span>
              </div>
              <h2 className="text-lg font-bold text-zinc-100">
                Check Scheme Readiness
              </h2>
              <span className="text-xs text-zinc-400">
                Select a target welfare scheme to calculate your application readiness score based on your uploaded vault documents.
              </span>
            </div>

            {/* Scheme Selector Dropdown */}
            <div className="flex flex-col gap-1.5 text-xs">
              <label className="font-semibold text-zinc-300">Target Welfare Scheme</label>
              <select
                value={selectedSchemeId ?? ''}
                onChange={(e) => setSelectedSchemeId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
              >
                {schemes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.state && s.state !== 'ALL_INDIA' ? `[${s.state}] ` : '[National] '}
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Readiness Card */}
            {loadingReadiness ? (
              <div className="py-8 text-center text-zinc-500 text-xs">Evaluating documents...</div>
            ) : readiness ? (
              <div className="flex flex-col gap-4">
                {/* Readiness Meter Gauge */}
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Application Readiness</span>
                    <span
                      className={`text-lg font-extrabold font-mono ${
                        readiness.readiness_percentage === 100
                          ? 'text-emerald-400'
                          : readiness.readiness_percentage > 0
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {readiness.readiness_percentage}% Ready
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        readiness.readiness_percentage === 100
                          ? 'bg-emerald-500'
                          : readiness.readiness_percentage >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${readiness.readiness_percentage}%` }}
                    />
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">{readiness.summary}</p>
                </div>

                {/* Document Requirement Checklist */}
                <div className="flex flex-col gap-4">
                  {/* Ready in Vault Section */}
                  {readiness.checklist.some((item) => item.status === 'available') && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span>Ready in Vault ({readiness.checklist.filter((i) => i.status === 'available').length})</span>
                      </span>
                      <div className="space-y-2">
                        {readiness.checklist
                          .filter((item) => item.status === 'available')
                          .map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl border bg-emerald-950/30 border-emerald-800/50 text-xs flex items-start gap-2.5 shadow-sm"
                            >
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                              <div className="flex flex-col flex-1 gap-0.5">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-emerald-200">{item.document_name}</span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/60">
                                    ✓ Ready
                                  </span>
                                </div>
                                {item.description && (
                                  <span className="text-[11px] text-zinc-400">{item.description}</span>
                                )}
                                <span className="text-[10px] text-emerald-400 font-mono mt-1">
                                  📎 {item.matched_vault_document_name}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Documents Section */}
                  {readiness.checklist.some((item) => item.status === 'missing') && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
                        <span>Missing Documents ({readiness.checklist.filter((i) => i.status === 'missing').length})</span>
                      </span>
                      <div className="space-y-2">
                        {readiness.checklist
                          .filter((item) => item.status === 'missing')
                          .map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl border bg-rose-950/20 border-rose-900/40 text-xs flex items-start gap-2.5"
                            >
                              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                              <div className="flex flex-col flex-1 gap-0.5">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-rose-200">{item.document_name}</span>
                                  {item.is_mandatory && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800">
                                      Mandatory
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <span className="text-[11px] text-zinc-400">{item.description}</span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* =====================================================================
          CITIZEN VERIFICATION MODAL (V2.0 Zero Misread Digit Safeguard)
          ===================================================================== */}
      {activeModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-xl w-full rounded-3xl border border-zinc-700/90 bg-zinc-900 p-6 sm:p-8 shadow-2xl flex flex-col gap-6 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {activeModalData.detected_document_type}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {Math.round(activeModalData.confidence_score * 100)}% AI Confidence
                  </span>
                </div>
                <h3 className="text-xl font-bold text-zinc-100 tracking-tight mt-1">
                  Citizen Verification & Profile Sync
                </h3>
                <p className="text-xs text-zinc-400">
                  {activeModalData.evidence_summary}
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveModalData(null)
                  setActiveModalDocId(null)
                }}
                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Misread Digit Alert Note */}
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 flex items-start gap-2.5">
              <Edit3 className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <p>
                <strong>Zero Misread Digit Safeguard:</strong> Please review and correct any detected fields before merging into your official citizen profile.
              </p>
            </div>

            {/* Verification Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-zinc-300">Full Name</label>
                <input
                  type="text"
                  value={verificationForm.full_name || ''}
                  onChange={(e) => setVerificationForm({ ...verificationForm, full_name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-zinc-300">Date of Birth (YYYY-MM-DD)</label>
                <input
                  type="text"
                  value={verificationForm.date_of_birth || ''}
                  onChange={(e) => setVerificationForm({ ...verificationForm, date_of_birth: e.target.value })}
                  placeholder="1990-08-15"
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-zinc-300">Gender</label>
                <select
                  value={verificationForm.gender || 'male'}
                  onChange={(e) => setVerificationForm({ ...verificationForm, gender: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-zinc-300">State / Location</label>
                <input
                  type="text"
                  value={verificationForm.state || ''}
                  onChange={(e) => setVerificationForm({ ...verificationForm, state: e.target.value })}
                  placeholder="e.g. Madhya Pradesh, Maharashtra"
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-zinc-300">Annual Family Income (₹ INR)</label>
                <input
                  type="number"
                  value={verificationForm.annual_income ?? ''}
                  onChange={(e) => setVerificationForm({ ...verificationForm, annual_income: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g. 180000"
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-zinc-300">Caste Category</label>
                <select
                  value={verificationForm.caste_category || 'General'}
                  onChange={(e) => setVerificationForm({ ...verificationForm, caste_category: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                >
                  <option value="General">General / Open</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setActiveModalData(null)
                  setActiveModalDocId(null)
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAndSync}
                disabled={syncingProfile}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white transition-all shadow-lg shadow-blue-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {syncingProfile ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Syncing Profile...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Confirm & Sync to Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
