'use client'

import { Search, Plus, Edit2, Trash2, Globe } from 'lucide-react'
import { type Scheme } from '@/core'

interface AdminSchemesTableProps {
  schemes: Scheme[]
  searchQuery: string
  onSearchChange: (q: string) => void
  categoryFilter: string
  onCategoryChange: (cat: string) => void
  statusFilter: string
  onStatusChange: (st: string) => void
  onAddScheme: () => void
  onEditScheme: (scheme: Scheme) => void
  onDeleteScheme: (id: number) => void
  categories: string[]
}

export function AdminSchemesTable({
  schemes,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  onAddScheme,
  onEditScheme,
  onDeleteScheme,
  categories,
}: AdminSchemesTableProps) {
  const filtered = schemes.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ministry.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCat = categoryFilter === 'All' || s.category === categoryFilter
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter
    return matchesSearch && matchesCat && matchesStatus
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search schemes by name, ministry, keyword..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-red-500"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-red-500"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <button
          onClick={onAddScheme}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Scheme
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Scheme Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Ministry / State</th>
                <th className="px-4 py-3">Rules / Docs</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No schemes found matching filters
                  </td>
                </tr>
              ) : (
                filtered.map((scheme) => (
                  <tr key={scheme.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white max-w-xs truncate">
                      {scheme.name}
                      <span className="block text-[10px] font-mono text-slate-500">{scheme.slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-slate-300">
                        {scheme.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>{scheme.ministry}</div>
                      <span className="text-[10px] text-slate-500">{scheme.state || 'National / Central'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-blue-400 font-medium">
                        {scheme.eligibility_rules?.length || 0} rules
                      </span>{' '}
                      •{' '}
                      <span className="text-purple-400 font-medium">
                        {scheme.required_documents?.length || 0} docs
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          scheme.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : scheme.status === 'draft'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {scheme.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => onEditScheme(scheme)}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                        title="Edit Scheme"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteScheme(scheme.id)}
                        className="p-1.5 hover:bg-red-950/60 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                        title="Delete Scheme"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
