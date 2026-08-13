import { useState, useEffect } from 'react'
import { Link } from '@/router'
import {
  Search,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
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
  FileText,
  Coins,
  Loader2,
} from 'lucide-react'
import { searchSchemesPaginated, type Scheme } from '@/lib/api'

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
  'All India',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
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
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }, 200)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategory, selectedState])

  const handleLoadMore = async () => {
    const nextPage = page + 1
    setLoadingMore(true)
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
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Hero Section */}
      <section className="relative rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 via-zinc-900/40 to-zinc-950/80 p-8 sm:p-14 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl flex flex-col items-start gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/80 border border-blue-800/60 text-blue-300 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>National Welfare Navigator · 4,160+ Schemes Indexed</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-100 leading-[1.1]">
            Find Government Benefits{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              You Actually Qualify For
            </span>
          </h1>

          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-2xl">
            Answer 4 simple questions or search by your need to discover official National and State welfare schemes, receive plain-English eligibility explanations, and track document readiness.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/check"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Check What I Qualify For</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>

            <a
              href="#explore"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white font-medium text-sm border border-zinc-700/60 transition-colors"
            >
              Browse 4,160+ Schemes
            </a>
          </div>
        </div>
      </section>

      {/* Live Catalog Metrics Bar */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-zinc-100">4,160+</div>
            <div className="text-xs text-zinc-400 font-medium">Official Schemes</div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-zinc-100">36</div>
            <div className="text-xs text-zinc-400 font-medium">States & UTs</div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-zinc-100">9,950+</div>
            <div className="text-xs text-zinc-400 font-medium">Eligibility Rules</div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-zinc-100">14,700+</div>
            <div className="text-xs text-zinc-400 font-medium">Required Docs</div>
          </div>
        </div>
      </section>

      {/* Discovery & Search Section */}
      <section id="explore" className="flex flex-col gap-6 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
                Explore Government Schemes
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-950/80 text-blue-400 border border-blue-800/60">
                {totalCount.toLocaleString()} available
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Filter by category, search by keywords, or choose your state to view applicable benefits.
            </p>
          </div>

          {/* Search Box & State Dropdown */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search schemes, benefits, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/80 transition-all shadow-inner"
              />
            </div>

            {/* State Picker Dropdown */}
            <div className="relative w-full sm:w-56">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/80 transition-all cursor-pointer"
              >
                {ALL_INDIAN_STATES.map((st) => (
                  <option key={st} value={st} className="bg-zinc-900 text-zinc-200">
                    {st === 'All India' ? '🇮🇳 All India (All States)' : `🏛️ ${st}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Persona Quick Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {PERSONA_FILTERS.map((filter) => {
            const Icon = filter.icon
            const isSelected = selectedCategory === filter.category
            return (
              <button
                key={filter.category}
                onClick={() => setSelectedCategory(filter.category)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{filter.label}</span>
              </button>
            )
          })}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <span>
            Showing <strong className="text-zinc-200">{schemes.length}</strong> of{' '}
            <strong className="text-zinc-200">{totalCount.toLocaleString()}</strong> schemes
            {selectedState !== 'All India' && ` in ${selectedState}`}
            {selectedCategory !== 'All' && ` (${selectedCategory})`}
          </span>
        </div>

        {/* Schemes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-64 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 animate-pulse p-6 flex flex-col justify-between"
              />
            ))}
          </div>
        ) : schemes.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-12 text-center flex flex-col items-center justify-center">
            <ShieldCheck className="h-10 w-10 text-zinc-600 mb-3" />
            <h3 className="text-lg font-semibold text-zinc-200 mb-1">No matching schemes found</h3>
            <p className="text-sm text-zinc-500 max-w-sm">
              Try searching with another keyword or select &quot;All India&quot; region.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {schemes.map((scheme) => (
                <div
                  key={scheme.id}
                  className="group rounded-2xl border border-zinc-800/90 bg-zinc-900/60 hover:bg-zinc-900/90 hover:border-zinc-700/80 transition-all p-6 flex flex-col justify-between shadow-lg shadow-black/40 relative overflow-hidden"
                >
                  <div className="flex flex-col gap-3">
                    {/* Category & State Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/60 text-blue-400 border border-blue-800/40">
                          {scheme.category || 'General'}
                        </span>
                        {scheme.state && scheme.state !== 'ALL_INDIA' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/60">
                            🏛️ {scheme.state}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                            🇮🇳 National
                          </span>
                        )}
                      </div>
                      {scheme.official_website && (
                        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                          Official <ExternalLink className="h-3 w-3" />
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-zinc-100 group-hover:text-blue-300 transition-colors line-clamp-2">
                      {scheme.name}
                    </h3>

                    {/* Ministry */}
                    <p className="text-xs text-zinc-500 line-clamp-1">
                      {scheme.ministry}
                    </p>

                    {/* Description */}
                    <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed mt-1">
                      {scheme.description}
                    </p>

                    {/* Benefits Preview */}
                    {scheme.benefits && scheme.benefits.length > 0 && (
                      <div className="mt-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-emerald-400 flex items-center gap-2">
                        <span className="font-bold">Benefit:</span>
                        <span className="truncate text-zinc-300">
                          {scheme.benefits[0].description}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                    <Link
                      to={`/schemes/${scheme.slug}` as any}
                      className="text-xs font-semibold text-blue-400 group-hover:text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>View Eligibility & Details</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {schemes.length < totalCount && (
              <div className="flex justify-center pt-4 pb-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-semibold text-sm border border-zinc-800 shadow-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                      <span>Loading schemes...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Schemes ({schemes.length} of {totalCount.toLocaleString()})</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
