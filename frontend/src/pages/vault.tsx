import { useState, useEffect, useRef } from 'react'
import { Link } from '@/router'
import {
  FolderLock,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Download,
  ExternalLink,
  Sparkles,
  LogOut,
  FileCheck,
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
  type UserDocument,
  type Scheme,
  type SchemeDocumentReadiness,
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
  const [checkingAuth, setCheckingAuth] = useState(true)

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

  // Verify auth on mount
  useEffect(() => {
    const token = getCitizenToken()
    if (token) {
      citizenGetMe()
        .then((res) => {
          setIsAuthenticated(true)
          setCitizenEmail(res.email)
          loadDocuments()
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

  function loadDocuments() {
    setLoadingDocs(true)
    listVaultDocuments()
      .then((docs) => {
        setDocuments(docs)
        setLoadingDocs(false)
      })
      .catch((err) => {
        if (err.message === 'UNAUTHORIZED') {
          handleLogout()
        }
        setLoadingDocs(false)
      })
  }

  function loadSchemesList() {
    fetchPopularSchemes(20).then((res) => {
      setSchemes(res)
      if (res.length > 0 && !selectedSchemeId) {
        const mudra = res.find((s) => s.slug === 'pm-mudra-yojana') || res[0]
        setSelectedSchemeId(mudra.id)
      }
    })
  }

  // Reload readiness whenever documents or selected scheme changes
  useEffect(() => {
    if (isAuthenticated && selectedSchemeId) {
      setLoadingReadiness(true)
      getSchemeDocumentReadiness(selectedSchemeId)
        .then((res) => {
          setReadiness(res)
          setLoadingReadiness(false)
        })
        .catch(() => {
          setLoadingReadiness(false)
        })
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
      const data = await citizenLogin(email, password)
      saveCitizenToken(data.access_token)
      const user = await citizenGetMe()
      saveCitizenUser(user)
      setIsAuthenticated(true)
      setCitizenEmail(user.email)
      loadDocuments()
      loadSchemesList()
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed')
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

  async function handleFileUpload(file: File) {
    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const doc = await uploadVaultDocument(file, selectedDocType, docMaskedNumber || undefined)
      setUploadSuccess(`Successfully uploaded "${doc.file_name}" to your secure vault!`)
      setDocMaskedNumber('')
      loadDocuments()
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleDeleteDoc(id: number, name: string) {
    if (!confirm(`Are you sure you want to remove "${name}" from your vault?`)) return
    try {
      await deleteVaultDocument(id)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete document')
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
  // VIEW A: CITIZEN VAULT LOGIN / REGISTER (If not authenticated)
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
              Citizen Document Vault · V1.3
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
            <span>Encrypted S3 Document Vault · V1.3</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Citizen Document Vault & Readiness Meter
          </h1>
          <p className="text-xs text-zinc-400">
            Upload your verified documents once. The system evaluates your live application readiness across all 19 flagship schemes.
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

      {/* Main 2-Column Grid: Left (Upload & Documents), Right (Live Scheme Readiness Meter) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ===================================================================
            LEFT COLUMN (7 cols): Document Upload Dropzone & Stored Files
            =================================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* UPLOAD CARD */}
          <div className="rounded-3xl border border-zinc-800/90 bg-zinc-900/60 p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-blue-400" />
                <span>Upload Document to Vault</span>
              </h2>
              <span className="text-xs text-zinc-500 font-mono">PDF, PNG, JPG (Max 10MB)</span>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-zinc-300">Document Type *</label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                >
                  {DOCUMENT_TYPES.map((dt) => (
                    <option key={dt.value} value={dt.value}>
                      {dt.icon} {dt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-zinc-300">Masked ID Number (Optional)</label>
                <input
                  type="text"
                  value={docMaskedNumber}
                  onChange={(e) => setDocMaskedNumber(e.target.value)}
                  placeholder="e.g. ABCDE1234F or XXXX-4532"
                  className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            {/* Dropzone Area */}
            <div
              onClick={() => {
                if (!uploading) fileInputRef.current?.click()
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2 transition-all group ${
                uploading
                  ? 'border-blue-500/50 bg-blue-950/20 cursor-wait'
                  : 'border-zinc-700/80 hover:border-blue-500/70 bg-zinc-950/60 hover:bg-zinc-950/90 cursor-pointer'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
              />
              <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-blue-400 group-hover:scale-105 transition-all">
                {uploading ? (
                  <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                ) : (
                  <UploadCloud className="h-5 w-5" />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-zinc-200 group-hover:text-blue-300 transition-colors">
                  {uploading ? (
                    'Uploading document to S3 vault...'
                  ) : (
                    <>Click to browse and upload <span className="text-blue-400 underline">{selectedDocType}</span></>
                  )}
                </span>
                <span className="text-[11px] text-zinc-500">
                  Select any PDF or image from your device (e.g. download.pdf)
                </span>
              </div>
            </div>
          </div>

          {/* STORED DOCUMENTS LIST */}
          <div className="rounded-3xl border border-zinc-800/90 bg-zinc-900/60 p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-bold text-zinc-100">
                  Vault Documents ({documents.length})
                </h2>
              </div>
              <span className="text-xs text-zinc-500">
                Encrypted in S3 Bucket: <span className="font-mono text-zinc-400">scheme-documents</span>
              </span>
            </div>

            {loadingDocs ? (
              <div className="p-8 text-center text-zinc-500 text-xs">Loading vault documents...</div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs">
                No documents uploaded yet. Upload your PAN card, Aadhaar, or Bank Passbook above to see your live application readiness score!
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => {
                  const sizeKB = (doc.file_size_bytes / 1024).toFixed(1)
                  return (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-3 text-xs hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400 shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-100">{doc.document_type}</span>
                            {doc.document_number_masked && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                                {doc.document_number_masked}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400">
                            {doc.file_name} · <span className="text-zinc-500">{sizeKB} KB</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.download_url && (
                          <a
                            href={doc.download_url.replace('http://minio:9000', 'http://localhost:9000')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition-colors"
                          >
                            <Download className="h-3 w-3" />
                            <span>View / Download</span>
                          </a>
                        )}

                        <button
                          onClick={() => handleDeleteDoc(doc.id, doc.file_name)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/60 transition-colors cursor-pointer"
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
                Select a target government welfare scheme to calculate your application readiness score based on your uploaded vault documents.
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
                              className="p-3 rounded-xl border bg-zinc-950/80 border-zinc-800 text-xs flex items-start gap-2.5"
                            >
                              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                              <div className="flex flex-col flex-1 gap-0.5">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-zinc-100">{item.document_name}</span>
                                  <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                      item.is_mandatory
                                        ? 'bg-rose-950/70 text-rose-300 border border-rose-800/50'
                                        : 'bg-zinc-800 text-zinc-400'
                                    }`}
                                  >
                                    {item.is_mandatory ? 'Mandatory' : 'Optional'}
                                  </span>
                                </div>
                                {item.description && (
                                  <span className="text-[11px] text-zinc-400">{item.description}</span>
                                )}
                                <span className="text-[10px] text-rose-400 mt-1 font-medium">
                                  Action: Upload this document to dropzone
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Link to Scheme Detail */}
                <Link
                  to={`/schemes/${readiness.scheme_slug}` as any}
                  className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold text-center border border-zinc-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>View Official Scheme Details & Application Portal</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
