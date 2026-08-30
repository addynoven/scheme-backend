'use client'

import { useState } from 'react'
import { X, Plus, Trash2, Save } from 'lucide-react'
import { type Scheme } from '@/core'

interface AdminSchemeModalProps {
  scheme: Scheme | null
  isOpen: boolean
  onClose: () => void
  onSave: (payload: any) => Promise<void>
  categories: string[]
}

export function AdminSchemeModal({
  scheme,
  isOpen,
  onClose,
  onSave,
  categories,
}: AdminSchemeModalProps) {
  const isEditing = !!scheme

  const [name, setName] = useState(scheme?.name || '')
  const [slug, setSlug] = useState(scheme?.slug || '')
  const [category, setCategory] = useState(scheme?.category || categories[0] || 'General')
  const [state, setState] = useState(scheme?.state || '')
  const [ministry, setMinistry] = useState(scheme?.ministry || '')
  const [description, setDescription] = useState(scheme?.description || '')
  const [status, setStatus] = useState(scheme?.status || 'active')
  const [applicationUrl, setApplicationUrl] = useState(scheme?.application_url || '')
  const [officialWebsite, setOfficialWebsite] = useState(scheme?.official_website || '')
  const [benefits, setBenefits] = useState(
    scheme?.benefits?.map((b) => ({ description: b.description, amount: b.amount })) || [
      { description: 'Direct financial benefit transfer', amount: 5000 },
    ]
  )
  const [rules, setRules] = useState(
    scheme?.eligibility_rules?.map((r) => ({
      field_name: r.field_name || r.field || 'age',
      operator: r.operator || '>=',
      rule_value: r.rule_value || r.value || '18',
    })) || [{ field_name: 'age', operator: '>=', rule_value: '18' }]
  )
  const [documents, setDocuments] = useState(
    scheme?.required_documents?.map((d) => ({
      document_name: d.document_name,
      is_mandatory: d.is_mandatory,
    })) || [{ document_name: 'Aadhaar Card', is_mandatory: true }]
  )

  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSave({
        name,
        slug,
        category,
        state: state.trim() ? state.trim() : null,
        ministry,
        description,
        status,
        application_url: applicationUrl.trim() ? applicationUrl.trim() : null,
        official_website: officialWebsite.trim() ? officialWebsite.trim() : null,
        benefits,
        eligibility_rules: rules,
        required_documents: documents,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">
            {isEditing ? `Edit Scheme: ${scheme.name}` : 'Create New Welfare Scheme'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Scheme Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (!isEditing) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Slug *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">State (or Blank for Central)</label>
              <input
                type="text"
                value={state}
                placeholder="e.g. Madhya Pradesh"
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Ministry / Department *</label>
            <input
              type="text"
              value={ministry}
              placeholder="e.g. Ministry of Agriculture and Farmers Welfare"
              onChange={(e) => setMinistry(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Description *</label>
            <textarea
              value={description}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Application URL</label>
              <input
                type="url"
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Official Website</label>
              <input
                type="url"
                value={officialWebsite}
                onChange={(e) => setOfficialWebsite(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>

          {/* Benefits Builder */}
          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-200">Scheme Benefits</span>
              <button
                type="button"
                onClick={() => setBenefits([...benefits, { description: '', amount: 0 }])}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Benefit
              </button>
            </div>
            {benefits.map((b, idx) => (
              <div key={idx} className="flex gap-2 items-center mb-2">
                <input
                  type="text"
                  placeholder="Benefit description"
                  value={b.description}
                  onChange={(e) => {
                    const next = [...benefits]
                    next[idx].description = e.target.value
                    setBenefits(next)
                  }}
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
                <input
                  type="number"
                  placeholder="Amount ₹"
                  value={b.amount || ''}
                  onChange={(e) => {
                    const next = [...benefits]
                    next[idx].amount = Number(e.target.value) || 0
                    setBenefits(next)
                  }}
                  className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
                {benefits.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setBenefits(benefits.filter((_, i) => i !== idx))}
                    className="p-1 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Eligibility Rules Builder */}
          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-200">Eligibility Rules (Deterministic DSL)</span>
              <button
                type="button"
                onClick={() => setRules([...rules, { field_name: 'age', operator: '>=', rule_value: '18' }])}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Rule
              </button>
            </div>
            {rules.map((r, idx) => (
              <div key={idx} className="flex gap-2 items-center mb-2">
                <select
                  value={r.field_name}
                  onChange={(e) => {
                    const next = [...rules]
                    next[idx].field_name = e.target.value
                    setRules(next)
                  }}
                  className="w-36 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="age">Age</option>
                  <option value="gender">Gender</option>
                  <option value="state">State</option>
                  <option value="annual_income">Annual Income</option>
                  <option value="occupation">Occupation</option>
                  <option value="caste_category">Caste Category</option>
                  <option value="is_differently_abled">Differently Abled</option>
                  <option value="has_land">Has Land</option>
                  <option value="marital_status">Marital Status</option>
                </select>
                <select
                  value={r.operator}
                  onChange={(e) => {
                    const next = [...rules]
                    next[idx].operator = e.target.value
                    setRules(next)
                  }}
                  className="w-20 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="==">==</option>
                  <option value="!=">!=</option>
                  <option value="<=">&lt;=</option>
                  <option value=">=">&gt;=</option>
                  <option value="<">&lt;</option>
                  <option value=">">&gt;</option>
                  <option value="in">in</option>
                </select>
                <input
                  type="text"
                  placeholder="Target value"
                  value={r.rule_value}
                  onChange={(e) => {
                    const next = [...rules]
                    next[idx].rule_value = e.target.value
                    setRules(next)
                  }}
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
                {rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRules(rules.filter((_, i) => i !== idx))}
                    className="p-1 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {submitting ? 'Saving...' : isEditing ? 'Update Scheme' : 'Create Scheme'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
