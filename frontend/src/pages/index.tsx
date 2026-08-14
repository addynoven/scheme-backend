import { useState, useEffect } from 'react'
import { Link } from '@/router'
import {
  Search,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  GraduationCap,
  Tractor,
  HeartHandshake,
  HeartPulse,
  Home as HomeIcon,
  Briefcase,
  Users,
  MapPin,
  Building2,
  Coins,
  Loader2,
  FolderLock,
  MessageSquare,
  AlertCircle,
  UserCheck,
} from 'lucide-react'
import {
  searchSchemesPaginated,
  citizenGetMe,
  getFamilyEligibility,
  type Scheme,
  type FamilyEligibilityReport,
} from '@/lib/api'
import { getCitizenToken } from '@/lib/session'

const PERSONA_FILTERS = [
  { label: 'All Schemes', category: 'All', icon: Users },
  { label: 'Farmer & Agriculture', category: 'Agriculture', icon: Tractor },
  { label: 'Student & Education', category: 'Education', icon: GraduationCap },
  { label: 'Healthcare & Wellness', category: 'Healthcare', icon: HeartPulse },
  { label: 'Women & Child', category: 'Women & Child', icon: HeartHandshake },
  { label: 'Housing & Shelter', category: 'Housing', icon: HomeIcon },
  { label: 'Artisan & Skills', category: 'Employment & Skills', icon: Briefcase },
  { label: 'Business & MSME', category: 'Business & Finance', icon: Coins },
  { label: 'Social Welfare', category: 'Social Welfare', icon: ShieldCheck },
]

const ALL_INDIAN_STATES = [
  'All India', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

export default function HomePage() {
  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [totalCount, setTotalCount] = useState<number>(4160)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedState, setSelectedState] = useState('All India')
  const [page, setPage] = useState(0)
  const pageSize = 24

  // Authenticated Citizen & Household State
  const [citizenUser, setCitizenUser] = useState<any | null>(null)
  const [familyReport, setFamilyReport] = useState<FamilyEligibilityReport | null>(null)

  useEffect(() => {
    const token = getCitizenToken()
    if (token) {
      citizenGetMe()
        .then((u) => {
          setCitizenUser(u)
          if (u.profile) {
            getFamilyEligibility()
              .then(setFamilyReport)
              .catch(() => {})
          }
        })
        .catch(() => setCitizenUser(null))
    } else {
      setCitizenUser(null)
      setFamilyReport(null)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    setPage(0)
    const timer = setTimeout(() => {
      searchSchemesPaginated(
        searchQuery,
        selectedCategory,
        selectedState === 'All India' ? undefined : selectedState,
        0,
        pageSize
      )
        .then((res) => {
          setSchemes(res.items || [])
          setTotalCount(res.total || 0)
        })
        .catch(() => {
          setSchemes([])
          setTotalCount(0)
        })
        .finally(() => setLoading(false))
    }, 200)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategory, selectedState])

  const handleLoadMore = async () => {
    if (loadingMore || schemes.length >= totalCount) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const res = await searchSchemesPaginated(
        searchQuery,
        selectedCategory,
        selectedState === 'All India' ? undefined : selectedState,
        nextPage * pageSize,
        pageSize
      )
      setSchemes((prev) => [...prev, ...(res.items || [])])
      setPage(nextPage)
    } catch {
      // ignore
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="space-y-10">
      {/* SaaS Citizen Command Center / Hero Banner */}
      {citizenUser ? (
        <div className="rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/80 border border-zinc-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800/80">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[11px] font-mono font-bold text-blue-400">
                  {citizenUser.citizen_uid || 'CIT-2026-XXXX'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[11px] font-mono font-bold text-indigo-400 flex items-center gap-1">
                  <HomeIcon className="h-3 w-3" />
                  {citizenUser.household_uid || 'HHD-2026-XXXX'}
                </span>
                {citizenUser.profile ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    Profile Active ({citizenUser.profile.state})
                  </span>
                ) : (
                  <Link
                    to="/profile"
                    className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-medium text-amber-400 flex items-center gap-1 hover:bg-amber-500/20"
                  >
                    <AlertCircle className="h-3 w-3" />
                    Complete Profile Setup →
                  </Link>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome back, {citizenUser.profile?.full_name || 'Citizen'}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Your sovereign citizen identity is continuously scanning 4,148 national and state welfare schemes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/household"
                className="px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-semibold text-xs transition-all flex items-center gap-2"
              >
                <span>👨‍👩‍👧 Family Graph</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/vault"
                className="px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-semibold text-xs transition-all flex items-center gap-2"
              >
                <FolderLock className="h-3.5 w-3.5 text-blue-400" />
                <span>Document Vault</span>
              </Link>
              <Link
                to="/chat"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Grounded AI Advisor</span>
              </Link>
            </div>
          </div>

          {/* Family Roster Welfare Breakdown */}
          {familyReport && familyReport.family_members_reports.length > 0 && (
            <div className="mt-6 pt-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Household Multi-Member Welfare Radar
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
                    {familyReport.total_collective_schemes} Total Benefits Unlocked
                  </span>
                </div>
                <Link to="/household" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                  Manage Family +
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {familyReport.family_members_reports.map((member) => (
                  <div
                    key={member.member_id}
                    className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-indigo-500/40 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                            {member.full_name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 capitalize">
                            {member.relationship}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">{member.citizen_uid}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          member.life_stage === 'MINOR'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : member.life_stage === 'SENIOR'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {member.life_stage}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-zinc-800/60">
                      <span className="text-zinc-400">Eligible Schemes:</span>
                      <span className="font-bold text-emerald-400">{member.eligible_schemes_count} Programs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Guest / Unauthenticated Hero */
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-blue-950/40 via-zinc-900/40 to-zinc-950 border border-blue-900/30 p-8 sm:p-12 text-center shadow-2xl">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Sovereign Citizen Welfare Engine & Family Graph</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Unlock Every Welfare Benefit You & Your Family Deserve
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Register your household profile to get a permanent sovereign Citizen ID, trackable member sub-profiles for children & parents, and zero-guesswork scheme recommendations.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/register"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>Create Household Profile</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-sm transition-all"
              >
                Sign In with Citizen ID
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schemes by name, keyword, or benefit (e.g. Kisan, Scholarship, Housing, Mudra)..."
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors backdrop-blur-md"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl pl-10 pr-8 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none cursor-pointer"
              >
                {ALL_INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Persona Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {PERSONA_FILTERS.map((p) => {
            const Icon = p.icon
            const isSelected = selectedCategory === p.category
            return (
              <button
                key={p.category}
                onClick={() => setSelectedCategory(p.category)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{p.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <span>
            Showing <strong className="text-white">{schemes.length}</strong> of{' '}
            <strong className="text-white">{totalCount}</strong> welfare schemes
          </span>
          {selectedCategory !== 'All' && (
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
              Category: {selectedCategory}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-xs text-zinc-400 font-medium">Scanning Scheme Database...</p>
          </div>
        ) : schemes.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-zinc-900/40 border border-zinc-800/80 p-8">
            <Building2 className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Matching Schemes Found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
              Try adjusting your search query, selecting another category, or broadening your state filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('All')
                setSelectedState('All India')
              }}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {schemes.map((s) => (
              <div
                key={s.id}
                className="group flex flex-col justify-between rounded-3xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 p-6 transition-all duration-200 shadow-lg hover:shadow-2xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-wide">
                      {s.category || 'Welfare'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {s.state || 'All India'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2 mb-2 leading-snug">
                    {s.name}
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed mb-4">
                    {s.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <Link
                    to="/schemes/:slug"
                    params={{ slug: s.slug }}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>View Scheme Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  {s.application_url && (
                    <a
                      href={s.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Open Official Portal"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {schemes.length < totalCount && !loading && (
          <div className="text-center pt-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 transition-colors inline-flex items-center gap-2"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Loading More Schemes...</span>
                </>
              ) : (
                <span>Load More Schemes ({totalCount - schemes.length} Remaining)</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
