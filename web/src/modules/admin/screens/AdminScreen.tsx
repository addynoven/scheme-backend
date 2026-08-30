'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/router'
import {
  ShieldAlert,
  Search,
  Plus,
  Edit2,
  Trash2,
  Lock,
  LogOut,
  ArrowLeft,
  X,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Globe,
  Check,
} from 'lucide-react'
import {
  adminLogin,
  adminGetMe,
  adminListSchemes,
  adminCreateScheme,
  adminUpdateScheme,
  adminDeleteScheme,
  adminListIngestionSources,
  adminRunIngestionSync,
  adminListTriageItems,
  adminApproveTriageItem,
  adminRejectTriageItem,
  type Scheme,
  type IngestionSource,
  type IngestionTriageItem,
  type IngestionSyncRunResult,
} from '@/lib/api'
import {
  saveAdminToken,
  getAdminToken,
  removeAdminToken,
  saveAdminUser,
} from '@/lib/session'

const CATEGORIES = [
  'Business & Finance',
  'General',
]

const STATES = [
  { label: 'All India (National)', value: 'ALL_INDIA' },
  { label: 'Madhya Pradesh', value: 'Madhya Pradesh' },
  { label: 'Maharashtra', value: 'Maharashtra' },
  { label: 'Karnataka', value: 'Karnataka' },
  { label: 'Andhra Pradesh', value: 'Andhra Pradesh' },
  { label: 'Assam', value: 'Assam' },
  { label: 'Bihar', value: 'Bihar' },
  { label: 'Chhattisgarh', value: 'Chhattisgarh' },
  { label: 'Delhi', value: 'Delhi' },
  { label: 'Gujarat', value: 'Gujarat' },
  { label: 'Haryana', value: 'Haryana' },
  { label: 'Jharkhand', value: 'Jharkhand' },
  { label: 'Kerala', value: 'Kerala' },
  { label: 'Odisha', value: 'Odisha' },
  { label: 'Punjab', value: 'Punjab' },
  { label: 'Rajasthan', value: 'Rajasthan' },
  { label: 'Tamil Nadu', value: 'Tamil Nadu' },
  { label: 'Telangana', value: 'Telangana' },
  { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
  { label: 'Uttarakhand', value: 'Uttarakhand' },
  { label: 'West Bengal', value: 'West Bengal' },
]

const RULE_FIELDS = [
  { label: 'Age Requirement', field: 'age' },
  { label: 'Annual Family Income (₹)', field: 'annual_income' },
  { label: 'Gender', field: 'gender' },
  { label: 'State Residency', field: 'state' },
  { label: 'Occupation', field: 'occupation' },
]

const OPERATORS = [
  { label: '= (Equals)', value: 'eq' },
  { label: '≤ (Maximum)', value: 'lte' },
  { label: '≥ (Minimum)', value: 'gte' },
  { label: 'Between Range', value: 'between' },
  { label: 'In List (Comma separated)', value: 'in' },
]

export function AdminScreen() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('admin@gov.in')
  const [loginPassword, setLoginPassword] = useState('AdminPass123!')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Navigation tab
  const [mainTab, setMainTab] = useState<'schemes' | 'ingestion' | 'triage'>('schemes')

  // Schemes data
  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  // Ingestion & Triage data
  const [sources, setSources] = useState<IngestionSource[]>([])
  const [triageItems, setTriageItems] = useState<IngestionTriageItem[]>([])
  const [triageFilter, setTriageFilter] = useState<'pending_review' | 'approved' | 'rejected' | 'all'>('pending_review')
  const [syncRunning, setSyncRunning] = useState(false)
  const [syncResults, setSyncResults] = useState<IngestionSyncRunResult[] | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [triageActionLoading, setTriageActionLoading] = useState<number | null>(null)

  // Modal editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingScheme, setEditingScheme] = useState<Scheme | null>(null)
  const [activeTab, setActiveTab] = useState<'meta' | 'rules' | 'benefits' | 'docs'>('meta')
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Form payload inside modal
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    state: 'ALL_INDIA',
    category: 'General',
    tags: '',
    ministry: '',
    description: '',
    status: 'active',
    application_url: '',
    official_website: '',
    launch_date: '',
    benefits: [] as Array<{ title: string; description: string; amount?: number | null }>,
    eligibility_rules: [] as Array<{ field_name: string; operator: string; rule_value: string }>,
    required_documents: [] as Array<{ document_name: string; is_mandatory: boolean; description?: string }>,
  })

  // Verify auth on mount
  useEffect(() => {
    const token = getAdminToken()
    if (token) {
      adminGetMe()
        .then((res) => {
          if (res.role === 'admin') {
            setIsAdmin(true)
            setAdminEmail(res.email)
            loadSchemes()
            loadIngestionData()
          } else {
            handleLogout()
          }
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

  function loadSchemes() {
    setLoading(true)
    adminListSchemes({
      limit: 100,
      search: search || undefined,
      state: stateFilter !== 'All' ? stateFilter : undefined,
      category: categoryFilter !== 'All' ? categoryFilter : undefined,
      status: statusFilter !== 'All' ? statusFilter : undefined,
    })
      .then((res) => {
        setSchemes(res.items)
        setLoading(false)
      })
      .catch((err) => {
        if (err.message === 'UNAUTHORIZED') {
          handleLogout()
        }
        setLoading(false)
      })
  }

  async function loadIngestionData() {
    try {
      const [srcs, trgs] = await Promise.all([
        adminListIngestionSources(),
        adminListTriageItems(triageFilter === 'all' ? undefined : triageFilter),
      ])
      setSources(srcs)
      setTriageItems(trgs)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadSchemes()
    }
  }, [search, stateFilter, categoryFilter, statusFilter, isAdmin])

  useEffect(() => {
    if (isAdmin) {
      loadIngestionData()
    }
  }, [triageFilter, isAdmin])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError(null)

    try {
      const data = await adminLogin(loginEmail, loginPassword)
      saveAdminToken(data.access_token)
      const user = await adminGetMe()
      if (user.role !== 'admin') {
        throw new Error('Access denied. User does not have administrator privileges.')
      }
      saveAdminUser(user)
      setIsAdmin(true)
      setAdminEmail(user.email)
      loadSchemes()
      loadIngestionData()
    } catch (err: any) {
      setLoginError(err.message || 'Login failed')
    } finally {
      setLoginLoading(false)
    }
  }

  function handleLogout() {
    removeAdminToken()
    setIsAdmin(false)
    setAdminEmail(null)
    setSchemes([])
    setSources([])
    setTriageItems([])
  }

  async function handleRunSync(sourceKey?: string) {
    setSyncRunning(true)
    setSyncError(null)
    setSyncResults(null)
    try {
      const results = await adminRunIngestionSync(sourceKey)
      setSyncResults(results)
      await loadIngestionData()
      loadSchemes()
    } catch (err: any) {
      setSyncError(err.message || 'Sync failed')
    } finally {
      setSyncRunning(false)
    }
  }

  async function handleApproveTriage(id: number) {
    setTriageActionLoading(id)
    try {
      await adminApproveTriageItem(id)
      await loadIngestionData()
      loadSchemes()
    } catch (err: any) {
      alert(err.message || 'Failed to approve triage item')
    } finally {
      setTriageActionLoading(null)
    }
  }

  async function handleRejectTriage(id: number) {
    setTriageActionLoading(id)
    try {
      await adminRejectTriageItem(id)
      await loadIngestionData()
    } catch (err: any) {
      alert(err.message || 'Failed to reject triage item')
    } finally {
      setTriageActionLoading(null)
    }
  }

  // Toggle status between active and draft
  async function handleToggleStatus(scheme: Scheme) {
    const nextStatus = scheme.status === 'active' ? 'draft' : 'active'
    try {
      await adminUpdateScheme(scheme.id, { status: nextStatus })
      setSchemes((prev) =>
        prev.map((s) => (s.id === scheme.id ? { ...s, status: nextStatus } : s))
      )
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status')
    }
  }

  // Delete scheme
  async function handleDeleteScheme(scheme: Scheme) {
    if (!confirm(`Are you sure you want to permanently delete '${scheme.name}'?`)) return
    try {
      await adminDeleteScheme(scheme.id)
      setSchemes((prev) => prev.filter((s) => s.id !== scheme.id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete scheme')
    }
  }

  // Open modal in Create or Edit mode
  function openEditor(scheme?: Scheme) {
    setSaveError(null)
    setActiveTab('meta')
    if (scheme) {
      setEditingScheme(scheme)
      setFormData({
        name: scheme.name,
        slug: scheme.slug,
        state: scheme.state || 'ALL_INDIA',
        category: scheme.category || 'General',
        tags: scheme.tags || '',
        ministry: scheme.ministry,
        description: scheme.description,
        status: scheme.status || 'active',
        application_url: scheme.application_url || '',
        official_website: scheme.official_website || '',
        launch_date: scheme.launch_date || '',
        benefits: (scheme.benefits || []).map((b) => ({
          title: b.title || 'Direct Benefit',
          description: b.description,
          amount: b.amount,
        })),
        eligibility_rules: (scheme.eligibility_rules || []).map((r) => ({
          field_name: r.field_name || (r as any).field || 'age',
          operator: r.operator,
          rule_value: r.rule_value || (r as any).value || '',
        })),
        required_documents: (scheme.required_documents || []).map((d) => ({
          document_name: d.document_name,
          is_mandatory: d.is_mandatory,
          description: d.description || '',
        })),
      })
    } else {
      setEditingScheme(null)
      setFormData({
        name: '',
        slug: '',
        state: 'ALL_INDIA',
        category: 'General',
        tags: '',
        ministry: '',
        description: '',
        status: 'active',
        application_url: '',
        official_website: '',
        launch_date: '',
        benefits: [{ title: 'Financial Assistance', description: 'Direct DBT assistance', amount: 5000 }],
        eligibility_rules: [{ field_name: 'annual_income', operator: 'lte', rule_value: '250000' }],
        required_documents: [{ document_name: 'Aadhaar Card', is_mandatory: true, description: 'Identity proof' }],
      })
    }
    setIsEditorOpen(true)
  }

  // Save handler for modal
  async function handleSaveScheme(e: React.FormEvent) {
    e.preventDefault()
    setSaveLoading(true)
    setSaveError(null)

    try {
      const payload: any = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        state: formData.state,
        category: formData.category,
        tags: formData.tags,
        ministry: formData.ministry,
        description: formData.description,
        status: formData.status,
        application_url: formData.application_url || null,
        official_website: formData.official_website || null,
        launch_date: formData.launch_date || null,
        benefits: formData.benefits,
        eligibility_rules: formData.eligibility_rules,
        required_documents: formData.required_documents,
      }

      if (editingScheme) {
        await adminUpdateScheme(editingScheme.id, payload)
      } else {
        await adminCreateScheme(payload)
      }

      setIsEditorOpen(false)
      loadSchemes()
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save scheme')
    } finally {
      setSaveLoading(false)
    }
  }

  // Dynamic Rule Builder helpers
  function addRule() {
    setFormData({
      ...formData,
      eligibility_rules: [
        ...formData.eligibility_rules,
        { field_name: 'annual_income', operator: 'lte', rule_value: '300000' },
      ],
    })
  }

  function removeRule(index: number) {
    setFormData({
      ...formData,
      eligibility_rules: formData.eligibility_rules.filter((_, i) => i !== index),
    })
  }

  // Dynamic Benefit helpers
  function addBenefit() {
    setFormData({
      ...formData,
      benefits: [
        ...formData.benefits,
        { title: 'Subsidized Assistance', description: 'One-time support grant', amount: 10000 },
      ],
    })
  }

  function removeBenefit(index: number) {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index),
    })
  }

  // Dynamic Documents helpers
  function addDocument() {
    setFormData({
      ...formData,
      required_documents: [
        ...formData.required_documents,
        { document_name: 'Income Certificate', is_mandatory: true, description: 'Tehsildar issued' },
      ],
    })
  }

  function removeDocument(index: number) {
    setFormData({
      ...formData,
      required_documents: formData.required_documents.filter((_, i) => i !== index),
    })
  }

  if (checkingAuth) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  // ==========================================================================
  // VIEW A: ADMIN LOGIN SCREEN (If not authenticated)
  // ==========================================================================
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12 flex flex-col gap-6">
        <div className="rounded-3xl border border-zinc-800/90 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="flex flex-col gap-2 mb-6 text-center items-center">
            <div className="h-12 w-12 rounded-2xl bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400 mb-2">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
              Admin Portal Login
            </h1>
            <p className="text-xs text-zinc-400">
              Authorized Government officers and scheme administrators only.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">Admin Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="admin@gov.in"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loginLoading ? 'Authenticating...' : 'Sign In as Administrator'}
            </button>
          </form>

          {/* Quick preset credentials helper */}
          <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center">
            <p className="text-[11px] text-zinc-500">
              Demo Credentials: <span className="text-zinc-300 font-mono">admin@gov.in</span> / <span className="text-zinc-300 font-mono">AdminPass123!</span>
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link to="/" className="text-xs text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            <span>Return to Citizen Portal</span>
          </Link>
        </div>
      </div>
    )
  }

  // ==========================================================================
  // VIEW B: ADMIN SCHEME MANAGEMENT DASHBOARD
  // ==========================================================================
  const activeCount = schemes.filter((s) => s.status === 'active').length
  const pendingTriageCount = triageItems.filter((t) => t.status === 'pending_review').length

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-zinc-800/90 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 shadow-xl">
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 w-fit">
            <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" />
            <span>Welfare Schemes Management & Gov Sync Control Center · V1.5</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Government Operations Center
          </h1>
          <p className="text-xs text-zinc-400">
            Manage welfare catalog, trigger zero-bandwidth ingestion pipelines, and triage breaking government feed diffs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold text-zinc-300 block">{adminEmail}</span>
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Role: Administrator</span>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-1">
          <span className="text-xs text-zinc-500">Live Schemes</span>
          <span className="text-2xl font-extrabold text-zinc-100">{schemes.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-1">
          <span className="text-xs text-zinc-500">Active Published</span>
          <span className="text-2xl font-extrabold text-emerald-400">{activeCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-1">
          <span className="text-xs text-zinc-500">Ingestion Feeds</span>
          <span className="text-2xl font-extrabold text-indigo-400">{sources.length} Active</span>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-1">
          <span className="text-xs text-zinc-500">Breaking Triage Queue</span>
          <span className={`text-2xl font-extrabold ${pendingTriageCount > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
            {pendingTriageCount} Pending
          </span>
        </div>
      </div>

      {/* Main Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setMainTab('schemes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            mainTab === 'schemes'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Welfare Catalog ({schemes.length})</span>
        </button>

        <button
          onClick={() => {
            setMainTab('ingestion')
            loadIngestionData()
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            mainTab === 'ingestion'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <RefreshCw className="h-4 w-4" />
          <span>Gov Ingestion Pipeline</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
            {sources.length} Feeds
          </span>
        </button>

        <button
          onClick={() => {
            setMainTab('triage')
            loadIngestionData()
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            mainTab === 'triage'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
              : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Breaking Changes Triage</span>
          {pendingTriageCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-zinc-950 font-black animate-pulse">
              {pendingTriageCount}
            </span>
          )}
        </button>
      </div>

      {/* =====================================================================
          TAB 1: SCHEMES CATALOG & VISUAL EDITOR
          ===================================================================== */}
      {mainTab === 'schemes' && (
        <div className="flex flex-col gap-6">
          {/* Action Bar & Filters */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search schemes by name, slug, or ministry..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
              >
                <option value="All">All Regions</option>
                <option value="ALL_INDIA">National (All India)</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>

              <button
                onClick={() => openEditor()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 active:scale-95 transition-all cursor-pointer ml-auto"
              >
                <Plus className="h-4 w-4" />
                <span>New Scheme</span>
              </button>
            </div>
          </div>

          {/* Schemes Table */}
          <div className="rounded-3xl border border-zinc-800/90 bg-zinc-900/60 overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-zinc-500 text-sm">Loading schemes...</div>
            ) : schemes.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-sm">No schemes found matching filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800/80 bg-zinc-950/60 text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">Scheme</th>
                      <th className="py-3.5 px-4">Region</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Configured Rules</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {schemes.map((scheme) => {
                      const isActive = scheme.status === 'active'
                      return (
                        <tr key={scheme.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-zinc-100 text-sm">{scheme.name}</span>
                              <span className="text-[11px] text-zinc-400 font-mono">{scheme.slug}</span>
                              <span className="text-[11px] text-zinc-500 line-clamp-1">{scheme.ministry}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {scheme.state && scheme.state !== 'ALL_INDIA' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/60">
                                🏛️ {scheme.state}
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                                🇮🇳 National
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/60 text-blue-400 border border-blue-800/40">
                              {scheme.category || 'General'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-zinc-950 text-[11px] text-zinc-300 border border-zinc-800">
                                {scheme.eligibility_rules?.length || 0} Rules
                              </span>
                              <span className="px-2 py-0.5 rounded bg-zinc-950 text-[11px] text-zinc-300 border border-zinc-800">
                                {scheme.required_documents?.length || 0} Docs
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleStatus(scheme)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/60'
                                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                              <span className="capitalize">{scheme.status}</span>
                            </button>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <Link
                                to={`/schemes/${scheme.slug}` as any}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                                title="View Citizen Page"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                              <button
                                onClick={() => openEditor(scheme)}
                                className="p-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800/50 transition-colors cursor-pointer"
                                title="Edit Scheme & Rules"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteScheme(scheme)}
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 transition-colors cursor-pointer"
                                title="Delete Scheme"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: GOV INGESTION PIPELINE (V1.5)
          ===================================================================== */}
      {mainTab === 'ingestion' && (
        <div className="flex flex-col gap-6">
          {/* Header Action Card */}
          <div className="p-6 rounded-3xl border border-indigo-900/60 bg-gradient-to-r from-indigo-950/40 via-zinc-900/80 to-purple-950/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-zinc-100">
                  Government Feeds & Sync Engine
                </h2>
              </div>
              <p className="text-xs text-zinc-400 max-w-2xl">
                Executes the 4-Gate ingestion pipeline (RFC 7232 Zero-Bandwidth Check, MinIO Raw Archival, Circuit Breaker, Semantic SHA-256 Hashing).
              </p>
            </div>

            <button
              onClick={() => handleRunSync()}
              disabled={syncRunning}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${syncRunning ? 'animate-spin' : ''}`} />
              <span>{syncRunning ? 'Running 4-Gate Ingestion...' : 'Run Full Ingestion Sync Now'}</span>
            </button>
          </div>

          {/* Sync Results Banner */}
          {syncResults && (
            <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Sync Completed ({syncResults.length} Feeds Processed)</span>
                </span>
                <button
                  onClick={() => setSyncResults(null)}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Dismiss
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {syncResults.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="font-bold text-zinc-200">{r.source_key}</span>
                      <span className="text-zinc-400">{r.duration_ms.toFixed(1)}ms</span>
                    </div>
                    <span className="text-zinc-300 text-[11px]">{r.message}</span>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1 font-mono">
                      <span>Status: {r.status}</span>
                      <span>•</span>
                      <span>Downloaded: {r.bytes_downloaded} bytes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {syncError && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              {syncError}
            </div>
          )}

          {/* Registered Feeds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sources.map((src) => (
              <div
                key={src.id}
                className="p-5 rounded-3xl border border-zinc-800/90 bg-zinc-900/60 shadow-lg flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-400 font-semibold">{src.source_key}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        src.status === 'healthy' || src.status === 'active'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                      }`}
                    >
                      {src.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-100 leading-snug">{src.name}</h3>
                  <p className="text-[11px] font-mono text-zinc-500 break-all">{src.endpoint_url}</p>
                </div>

                <div className="pt-3 border-t border-zinc-800/60 flex flex-col gap-2 text-[11px]">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Last Checked:</span>
                    <span className="font-mono text-zinc-300">
                      {src.last_checked_at ? new Date(src.last_checked_at).toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Semantic Hash:</span>
                    <span className="font-mono text-zinc-500 truncate max-w-[120px]">
                      {src.content_hash ? src.content_hash.slice(0, 12) + '...' : 'Not hashed'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRunSync(src.source_key)}
                    disabled={syncRunning}
                    className="mt-2 w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Sync This Feed</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: BREAKING CHANGES TRIAGE QUEUE (V1.5)
          ===================================================================== */}
      {mainTab === 'triage' && (
        <div className="flex flex-col gap-6">
          {/* Triage Header & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl border border-zinc-800/90 bg-zinc-900/60">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <span>Government Breaking Changes Triage Queue</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Rule tightenings, benefit reductions, or mandatory document additions are quarantined here for 1-click confirmation before touching live schemes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={triageFilter}
                onChange={(e) => setTriageFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
              >
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All Items</option>
              </select>
            </div>
          </div>

          {/* Triage Items List */}
          {triageItems.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-zinc-800 bg-zinc-900/40 flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <span className="text-sm font-bold text-zinc-200">Triage Queue is Clean!</span>
              <span className="text-xs text-zinc-500">Zero unreviewed breaking government changes pending.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {triageItems.map((item) => {
                const isPending = item.status === 'pending_review'
                const before = item.diff_payload?.before_state || {}
                const after = item.diff_payload?.after_state || {}

                return (
                  <div
                    key={item.id}
                    className="p-6 rounded-3xl border border-zinc-800/90 bg-zinc-900/80 shadow-xl flex flex-col gap-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-800/60">
                          {item.change_type.replace('_', ' ')}
                        </span>
                        <h3 className="text-base font-bold text-zinc-100">{item.scheme_name}</h3>
                        <span className="text-xs font-mono text-zinc-500">({item.scheme_slug})</span>
                      </div>

                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold font-mono ${
                          item.status === 'pending_review'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                            : item.status === 'approved'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Diff Summary */}
                    <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed">
                      <span className="font-semibold text-zinc-200">Diff Detected: </span>
                      {item.diff_summary}
                    </div>

                    {/* Visual Before vs After Diff Boxes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Before (Current Rule) */}
                      <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                          Current Rule in Live Catalog
                        </span>
                        <div className="font-mono text-xs text-zinc-300 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                          {before.rule ? (
                            <span>{before.rule.field_name} {before.rule.operator} {before.rule.rule_value || before.rule.value_criteria}</span>
                          ) : before.benefit ? (
                            <span>Benefit: {before.benefit.title} ({before.benefit.description})</span>
                          ) : (
                            <span className="text-zinc-500">None / Discontinued</span>
                          )}
                        </div>
                      </div>

                      {/* After (Proposed by Gov API) */}
                      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          Proposed Rule from Government Feed
                        </span>
                        <div className="font-mono text-xs text-emerald-200 bg-zinc-950/80 p-3 rounded-xl border border-emerald-800/40 font-bold">
                          {after.rule ? (
                            <span>{after.rule.field_name} {after.rule.operator} {after.rule.rule_value || after.rule.value_criteria}</span>
                          ) : after.benefit ? (
                            <span>Benefit: {after.benefit.title} ({after.benefit.description})</span>
                          ) : after.document ? (
                            <span>Document: {after.document.document_name} ({after.document.is_mandatory ? 'Mandatory' : 'Optional'})</span>
                          ) : (
                            <span>{JSON.stringify(after)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons (if pending) */}
                    {isPending && (
                      <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleRejectTriage(item.id)}
                          disabled={triageActionLoading === item.id}
                          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-rose-950 text-zinc-300 hover:text-rose-300 border border-zinc-700 hover:border-rose-800 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                        >
                          ✕ Reject & Keep Current Rule
                        </button>

                        <button
                          onClick={() => handleApproveTriage(item.id)}
                          disabled={triageActionLoading === item.id}
                          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve & Apply to Live Scheme</span>
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SCHEME VISUAL EDITOR MODAL / DRAWER
          ===================================================================== */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col justify-between overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-zinc-100">
                  {editingScheme ? `Edit: ${editingScheme.name}` : 'Create New Welfare Scheme'}
                </h2>
                <span className="text-xs text-zinc-400">
                  Configure scheme rules, benefits, and required document checklist.
                </span>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {saveError && (
              <div className="my-3 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs">
                {saveError}
              </div>
            )}

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-800 py-3">
              <button
                type="button"
                onClick={() => setActiveTab('meta')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'meta' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Metadata
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rules')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'rules' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Visual Rule Builder ({formData.eligibility_rules.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('benefits')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'benefits' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Benefits ({formData.benefits.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('docs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'docs' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Required Documents ({formData.required_documents.length})
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveScheme} className="flex flex-col gap-4 py-4 overflow-y-auto max-h-[55vh] pr-2">
              {/* TAB 1: METADATA */}
              {activeTab === 'meta' && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-zinc-300">Scheme Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g. PM Kisan Samman Nidhi"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-zinc-300">URL Slug</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="pm-kisan-samman-nidhi"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-zinc-300">Jurisdiction / State</label>
                      <select
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {STATES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-zinc-300">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-zinc-300">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="active">Active (Published)</option>
                        <option value="draft">Draft (Hidden)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-zinc-300">Ministry / Department</label>
                    <input
                      type="text"
                      required
                      value={formData.ministry}
                      onChange={(e) => setFormData({ ...formData, ministry: e.target.value })}
                      className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Ministry of Agriculture and Farmers Welfare"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-zinc-300">Description</label>
                    <textarea
                      required
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Detailed overview of the scheme objectives..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-zinc-300">Application Portal URL</label>
                      <input
                        type="url"
                        value={formData.application_url}
                        onChange={(e) => setFormData({ ...formData, application_url: e.target.value })}
                        className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="https://pmkisan.gov.in/registration"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-zinc-300">Official Website URL</label>
                      <input
                        type="url"
                        value={formData.official_website}
                        onChange={(e) => setFormData({ ...formData, official_website: e.target.value })}
                        className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="https://pmkisan.gov.in"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: VISUAL RULE BUILDER */}
              {activeTab === 'rules' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">
                      Configure eligibility predicates visually without writing code:
                    </span>
                    <button
                      type="button"
                      onClick={addRule}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800 text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Rule</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.eligibility_rules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs"
                      >
                        <select
                          value={rule.field_name}
                          onChange={(e) => {
                            const updated = [...formData.eligibility_rules]
                            updated[idx].field_name = e.target.value
                            setFormData({ ...formData, eligibility_rules: updated })
                          }}
                          className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {RULE_FIELDS.map((f) => (
                            <option key={f.field} value={f.field}>
                              {f.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={rule.operator}
                          onChange={(e) => {
                            const updated = [...formData.eligibility_rules]
                            updated[idx].operator = e.target.value
                            setFormData({ ...formData, eligibility_rules: updated })
                          }}
                          className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-blue-400 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {OPERATORS.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          value={rule.rule_value}
                          onChange={(e) => {
                            const updated = [...formData.eligibility_rules]
                            updated[idx].rule_value = e.target.value
                            setFormData({ ...formData, eligibility_rules: updated })
                          }}
                          placeholder="e.g. 250000 or 18-50 or Male"
                          className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />

                        <button
                          type="button"
                          onClick={() => removeRule(idx)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/60 transition-colors cursor-pointer self-end sm:self-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: BENEFITS MANAGER */}
              {activeTab === 'benefits' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Define financial, subsidy, or in-kind assistance:</span>
                    <button
                      type="button"
                      onClick={addBenefit}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800 text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Benefit</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.benefits.map((b, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 flex flex-col gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Benefit Title (e.g. Direct Cash DBT)"
                            value={b.title}
                            onChange={(e) => {
                              const updated = [...formData.benefits]
                              updated[idx].title = e.target.value
                              setFormData({ ...formData, benefits: updated })
                            }}
                            className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="number"
                            placeholder="Amount ₹ (e.g. 6000)"
                            value={b.amount || ''}
                            onChange={(e) => {
                              const updated = [...formData.benefits]
                              updated[idx].amount = e.target.value ? Number(e.target.value) : null
                              setFormData({ ...formData, benefits: updated })
                            }}
                            className="w-32 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeBenefit(idx)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/60 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Description (e.g. ₹2,000 paid thrice every year)"
                          value={b.description}
                          onChange={(e) => {
                            const updated = [...formData.benefits]
                            updated[idx].description = e.target.value
                            setFormData({ ...formData, benefits: updated })
                          }}
                          className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-[11px]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: REQUIRED DOCUMENTS CHECKLIST */}
              {activeTab === 'docs' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Specify documents required for application readiness:</span>
                    <button
                      type="button"
                      onClick={addDocument}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800 text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Document</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.required_documents.map((d, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 flex items-center gap-3 text-xs"
                      >
                        <input
                          type="text"
                          placeholder="Document Name (e.g. Bank Passbook)"
                          value={d.document_name}
                          onChange={(e) => {
                            const updated = [...formData.required_documents]
                            updated[idx].document_name = e.target.value
                            setFormData({ ...formData, required_documents: updated })
                          }}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />

                        <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={d.is_mandatory}
                            onChange={(e) => {
                              const updated = [...formData.required_documents]
                              updated[idx].is_mandatory = e.target.checked
                              setFormData({ ...formData, required_documents: updated })
                            }}
                            className="rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                          <span className={d.is_mandatory ? 'text-rose-400 font-semibold' : 'text-zinc-400'}>
                            {d.is_mandatory ? 'Mandatory' : 'Optional'}
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() => removeDocument(idx)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/60 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saveLoading ? 'Saving Scheme...' : editingScheme ? 'Save Changes' : 'Create & Publish Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
