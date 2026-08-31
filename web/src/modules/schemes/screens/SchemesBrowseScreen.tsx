'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  MapPin,
  Tag,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  BookOpen,
  ArrowLeft,
} from 'lucide-react'
import { schemesRepository } from '../repositories'
import { type Scheme } from '@/core'

const INDIAN_STATES = [
  'All',
  'ALL_INDIA',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
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
]

const POPULAR_CATEGORIES = [
  'All',
  'Agriculture & Rural',
  'Healthcare & Wellness',
  'Education & Learning',
  'Social Welfare & Empowerment',
  'Financial Services & Banking',
  'Employment & Skill Training',
  'Housing & Shelter',
  'Women & Child Welfare',
  'Pensions & Senior Citizens',
]

const SORT_OPTIONS = [
  { label: 'Relevance / Default', value: '' },
  { label: 'Name (A to Z)', value: 'name_asc' },
  { label: 'Name (Z to A)', value: 'name_desc' },
  { label: 'Category', value: 'category_asc' },
  { label: 'Recently Added', value: 'id_desc' },
]

export function SchemesBrowseScreen() {
  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters State
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [stateFilter, setStateFilter] = useState('All')
  const [sortBy, setSortBy] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 12

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchSchemes = useCallback(async () => {
    setLoading(true)
    try {
      const skip = (page - 1) * pageSize
      const res = await schemesRepository.list({
        skip,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
        category: category !== 'All' ? category : undefined,
        state: stateFilter !== 'All' ? stateFilter : undefined,
        sort_by: sortBy || undefined,
      })
      setSchemes(res.items || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('Failed to load schemes:', err)
      setSchemes([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, category, stateFilter, sortBy])

  useEffect(() => {
    fetchSchemes()
  }, [fetchSchemes])

  const totalPages = Math.ceil(total / pageSize) || 1

  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setCategory('All')
    setStateFilter('All')
    setSortBy('')
    setPage(1)
  }

  const hasActiveFilters = Boolean(search || category !== 'All' || stateFilter !== 'All' || sortBy)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Chat</span>
          </Link>
          <div className="h-4 w-px bg-zinc-800" />
          <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-400" />
            Directory of Government Welfare Schemes
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/check"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Check My Eligibility</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Hero */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-blue-950/30 border border-zinc-800/90 shadow-xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            National & State Scheme Registry
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Browse & Discover Welfare Benefits
          </h2>
          <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Search across verified schemes across all Central Ministries and 28+ State Governments.
            Filter by your target sector or state jurisdiction to find direct cash benefits, subsidies, and grants.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search scheme name, ministry, keyword, or problem..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all"
              />
            </div>

            {/* Category Dropdown */}
            <div className="md:col-span-3">
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-xs sm:text-sm text-zinc-200 outline-none transition-all"
              >
                {POPULAR_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'All Categories / Sectors' : c}
                  </option>
                ))}
              </select>
            </div>

            {/* State Dropdown */}
            <div className="md:col-span-2">
              <select
                value={stateFilter}
                onChange={(e) => {
                  setStateFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-xs sm:text-sm text-zinc-200 outline-none transition-all"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'All Jurisdictions' : s === 'ALL_INDIA' ? 'National (All India)' : s}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl text-xs sm:text-sm text-zinc-200 outline-none transition-all"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count & Active Filter Reset */}
          <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
            <span className="font-medium">
              Showing {schemes.length > 0 ? (page - 1) * pageSize + 1 : 0} –{' '}
              {Math.min(page * pageSize, total)} of{' '}
              <strong className="text-zinc-200">{total.toLocaleString()}</strong> schemes
            </span>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Reset all filters
              </button>
            )}
          </div>
        </div>

        {/* Schemes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 animate-pulse space-y-3 h-52 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
                  <div className="h-3 bg-zinc-800/40 rounded w-full" />
                </div>
                <div className="h-8 bg-zinc-800/80 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : schemes.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
            <BookOpen className="h-10 w-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-zinc-200">No schemes found</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              We couldn&apos;t find any active welfare schemes matching your current search query or filter combination.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Clear Filters & Show All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {schemes.map((scheme) => (
              <div
                key={scheme.id}
                className="group p-5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/90 hover:border-blue-500/40 shadow-lg hover:shadow-blue-500/5 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Badges Row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-medium border border-blue-500/20 truncate max-w-[170px]">
                      {scheme.category || 'General Welfare'}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-medium">
                      <MapPin className="h-3 w-3 text-zinc-400" />
                      {scheme.state === 'ALL_INDIA' ? 'National' : scheme.state || 'All India'}
                    </span>
                  </div>

                  {/* Scheme Title */}
                  <h3 className="font-bold text-sm sm:text-base text-zinc-100 group-hover:text-blue-300 transition-colors leading-snug line-clamp-2">
                    <Link href={`/schemes/${scheme.slug}`}>
                      {scheme.name}
                    </Link>
                  </h3>

                  {/* Ministry */}
                  {scheme.ministry && (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <Building2 className="h-3 w-3 text-zinc-500 shrink-0" />
                      <span className="truncate">{scheme.ministry}</span>
                    </div>
                  )}

                  {/* Description Snippet */}
                  <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                    {scheme.description || 'No detailed description available for this welfare initiative.'}
                  </p>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <Link
                    href={`/schemes/${scheme.slug}`}
                    className="text-xs font-semibold text-blue-400 group-hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    <span>View Details</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>

                  <Link
                    href={`/check?target_scheme=${encodeURIComponent(scheme.slug)}`}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span>Check Match</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-zinc-400 font-medium">
              Page <strong className="text-zinc-100">{page}</strong> of{' '}
              <strong className="text-zinc-100">{totalPages}</strong>
            </span>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
