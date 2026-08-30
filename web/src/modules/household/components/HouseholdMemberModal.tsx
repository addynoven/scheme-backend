'use client'

import { useState } from 'react'
import { X, Save, User, ShieldCheck } from 'lucide-react'
import { type HouseholdMember } from '@/core'

interface HouseholdMemberModalProps {
  member: HouseholdMember | null
  isOpen: boolean
  onClose: () => void
  onSave: (payload: any) => Promise<void>
}

const RELATIONSHIPS = ['Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Other']
const OCCUPATIONS = ['student', 'farmer', 'employed', 'self-employed', 'unemployed', 'retired']
const CASTES = ['General', 'OBC', 'SC', 'ST', 'EWS']

export function HouseholdMemberModal({
  member,
  isOpen,
  onClose,
  onSave,
}: HouseholdMemberModalProps) {
  const isEditing = !!member

  const [fullName, setFullName] = useState(member?.full_name || member?.member_name || '')
  const [relationship, setRelationship] = useState(member?.relationship || 'Spouse')
  const [age, setAge] = useState<number | ''>(member?.age ?? 25)
  const [dob, setDob] = useState(member?.date_of_birth || '')
  const [gender, setGender] = useState(member?.gender || 'Female')
  const [occupation, setOccupation] = useState(member?.occupation || 'unemployed')
  const [casteCategory, setCasteCategory] = useState(member?.caste_category || 'General')
  const [annualIncome, setAnnualIncome] = useState<number | ''>(member?.annual_income ?? 0)
  const [isStudent, setIsStudent] = useState(!!member?.is_student)
  const [hasDisability, setHasDisability] = useState(member?.is_disabled || member?.has_disability || false)
  const [aadhaarLastFour, setAadhaarLastFour] = useState(member?.aadhaar_last_four || '')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await onSave({
        full_name: fullName,
        member_name: fullName,
        relationship,
        age: Number(age),
        date_of_birth: dob || null,
        gender,
        occupation,
        caste_category: casteCategory,
        annual_income: Number(annualIncome),
        is_student: isStudent,
        is_disabled: hasDisability,
        has_disability: hasDisability,
        aadhaar_last_four: aadhaarLastFour || null,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save family member')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isEditing ? `Edit Dependent: ${fullName}` : 'Add New Family Member'}
              </h3>
              <p className="text-xs text-zinc-400">Updates the whole-family eligibility graph</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 text-zinc-400 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="m-5 mb-0 p-3 bg-red-950/60 border border-red-800 rounded-2xl text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Full Legal Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Relationship to Head *</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Age *</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Gender *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Caste Category</label>
              <select
                value={casteCategory}
                onChange={(e) => setCasteCategory(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              >
                {CASTES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Occupation</label>
              <select
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              >
                {OCCUPATIONS.map((o) => (
                  <option key={o} value={o}>
                    {o.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Annual Income ₹</label>
              <input
                type="number"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
              <input
                type="checkbox"
                checked={isStudent}
                onChange={(e) => setIsStudent(e.target.checked)}
                className="rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-0"
              />
              <span>Currently Student</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
              <input
                type="checkbox"
                checked={hasDisability}
                onChange={(e) => setHasDisability(e.target.checked)}
                className="rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-0"
              />
              <span>Differently Abled (PwD)</span>
            </label>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {submitting ? 'Saving...' : isEditing ? 'Update Dependent' : 'Register Dependent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
