'use client'

import React, { useState, useEffect } from 'react'
import { Link } from '@/router'
import {
  Users,
  UserPlus,
  Trash2,
  Sparkles,
  ChevronRight,
  Loader2,
  FolderLock,
  Edit2,
  Home,
  Baby,
  User,
  Heart,
} from 'lucide-react'
import {
  type HouseholdMember,
  type FamilyEligibilityReport,
  listHouseholdMembers,
  addHouseholdMember,
  updateHouseholdMember,
  deleteHouseholdMember,
  getFamilyEligibility,
  citizenGetMe,
} from '@/lib/api'
import { AuthGuard } from '@/components/AuthGuard'

export function HouseholdScreen() {
  return (
    <AuthGuard requireProfile={true}>
      <HouseholdContent />
    </AuthGuard>
  )
}

function HouseholdContent() {
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [report, setReport] = useState<FamilyEligibilityReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null)

  // Primary Citizen Details
  const [primaryUser, setPrimaryUser] = useState<any | null>(null)

  // Form State for Add / Edit
  const [fullName, setFullName] = useState('')
  const [relationship, setRelationship] = useState('daughter')
  const [age, setAge] = useState<number>(14)
  const [dob, setDob] = useState('2012-05-15')
  const [gender, setGender] = useState('female')
  const [occupation, setOccupation] = useState('student')
  const [casteCategory, setCasteCategory] = useState('General')
  const [annualIncome, setAnnualIncome] = useState<number>(0)
  const [isStudent, setIsStudent] = useState(true)
  const [hasDisability, setHasDisability] = useState(false)
  const [aadhaarLastFour, setAadhaarLastFour] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [u, mems] = await Promise.all([citizenGetMe(), listHouseholdMembers()])
      setPrimaryUser(u)
      setMembers(mems)

      // Auto run family welfare scan
      const elig = await getFamilyEligibility().catch(() => null)
      if (elig) setReport(elig)
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingMember(null)
    setFullName('')
    setRelationship('daughter')
    setAge(14)
    setDob('2012-05-15')
    setGender('female')
    setOccupation('student')
    setCasteCategory(primaryUser?.profile?.caste_category || 'General')
    setAnnualIncome(0)
    setIsStudent(true)
    setHasDisability(false)
    setAadhaarLastFour('')
    setError(null)
    setShowAddModal(true)
  }

  function openEditModal(m: HouseholdMember) {
    setEditingMember(m)
    setFullName(m.full_name)
    setRelationship(m.relationship)
    setAge(m.age)
    setDob(m.date_of_birth || '')
    setGender(m.gender)
    setOccupation(m.occupation || 'unemployed')
    setCasteCategory(m.caste_category || 'General')
    setAnnualIncome(m.annual_income || 0)
    setIsStudent(m.is_student)
    setHasDisability(m.is_disabled || m.has_disability || false)
    setAadhaarLastFour(m.aadhaar_last_four || '')
    setError(null)
    setShowAddModal(true)
  }

  async function handleSaveMember(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      if (editingMember) {
        await updateHouseholdMember(editingMember.id, {
          full_name: fullName,
          relationship,
          age: Number(age),
          date_of_birth: dob || null,
          gender,
          occupation,
          caste_category: casteCategory,
          annual_income: Number(annualIncome),
          is_student: isStudent,
          is_disabled: hasDisability,
          aadhaar_last_four: aadhaarLastFour || null,
        })
      } else {
        await addHouseholdMember({
          full_name: fullName,
          relationship,
          age: Number(age),
          date_of_birth: dob || null,
          gender,
          occupation,
          caste_category: casteCategory,
          annual_income: Number(annualIncome),
          is_student: isStudent,
          is_disabled: hasDisability,
          aadhaar_last_four: aadhaarLastFour || null,
        })
      }
      setShowAddModal(false)
      await loadData()
    } catch (e: any) {
      setError(e.message || 'Failed to save family member')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to remove this family member?')) return
    try {
      await deleteHouseholdMember(id)
      await loadData()
    } catch (e: any) {
      alert(e.message || 'Failed to delete member')
    }
  }

  async function handleScanFamily() {
    setScanning(true)
    try {
      const data = await getFamilyEligibility()
      setReport(data)
    } catch (e: any) {
      alert(e.message || 'Failed to evaluate family welfare')
    } finally {
      setScanning(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-zinc-400">Loading Household & Family Welfare Graph...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Household Header */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-zinc-950 border border-indigo-500/20 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[11px] font-mono font-bold text-indigo-400 flex items-center gap-1">
                <Home className="h-3 w-3" />
                {primaryUser?.household_uid || 'HHD-2026-XXXX'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[11px] font-mono font-bold text-blue-400">
                Primary: {primaryUser?.citizen_uid || 'CIT-2026-XXXX'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Household Welfare & Family Roster
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Track sovereign IDs, life stages (Minor 🧒 / Adult 👤 / Senior 👵), and targeted benefit pipelines for every family member.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleScanFamily}
              disabled={scanning}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {scanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>Evaluate 4,148 Schemes</span>
            </button>

            <button
              onClick={openAddModal}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold text-xs transition-all flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4 text-indigo-400" />
              <span>Add Family Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* Family Members Roster Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-400" />
            <span>Registered Family Members ({members.length + 1} Total)</span>
          </h2>
          <span className="text-xs text-zinc-500">Every member possesses a unique trackable Citizen UID</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Head of Household Card (Primary Citizen) */}
          <div className="rounded-3xl bg-zinc-900/80 border border-blue-500/30 p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 px-3 py-1 bg-blue-500/20 border-b border-l border-blue-500/30 rounded-bl-2xl text-[10px] font-bold text-blue-300">
              HEAD OF HOUSEHOLD
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
                  {primaryUser?.profile?.full_name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {primaryUser?.profile?.full_name || 'Primary Citizen'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-mono text-blue-400 font-bold">
                      {primaryUser?.citizen_uid || 'CIT-2026-XXXX'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-zinc-800/80 my-3">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Occupation</span>
                  <span className="font-semibold text-zinc-200 capitalize">
                    {primaryUser?.profile?.occupation || 'Farmer'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Life Stage</span>
                  <span className="font-bold text-blue-400">ADULT (Head)</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">State</span>
                  <span className="font-semibold text-zinc-200">
                    {primaryUser?.profile?.state || 'Madhya Pradesh'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Category</span>
                  <span className="font-semibold text-zinc-200">
                    {primaryUser?.profile?.caste_category || 'OBC'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Link
                to="/profile"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <span>Edit Primary Profile</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/vault"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="View Vault Documents"
              >
                <FolderLock className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Sub-Members Cards */}
          {members.map((member) => {
            const memberReport = report?.family_members_reports.find(
              (r) => r.member_id === member.id
            )

            return (
              <div
                key={member.id}
                className="rounded-3xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 p-6 shadow-xl flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                          member.life_stage === 'MINOR'
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                            : member.life_stage === 'SENIOR'
                            ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                            : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                        }`}
                      >
                        {member.life_stage === 'MINOR' ? (
                          <Baby className="h-6 w-6" />
                        ) : member.life_stage === 'SENIOR' ? (
                          <Heart className="h-6 w-6" />
                        ) : (
                          <User className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors">
                          {member.full_name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-zinc-400">
                            {member.citizen_uid}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500">
                            ({member.member_uid})
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        member.life_stage === 'MINOR'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : member.life_stage === 'SENIOR'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      {member.life_stage}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-zinc-800/80 my-3">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Relationship</span>
                      <span className="font-semibold text-zinc-200 capitalize">
                        {member.relationship}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Age / Gender</span>
                      <span className="font-semibold text-zinc-200">
                        {member.age} yrs • {member.gender}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Status</span>
                      <span className="font-semibold text-zinc-200 capitalize">
                        {member.is_student ? 'Student' : member.occupation || 'Unemployed'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Verification</span>
                      <span
                        className={`text-[10px] font-semibold ${
                          member.verification_status === 'DOCUMENT_VERIFIED'
                            ? 'text-emerald-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        {member.verification_status}
                      </span>
                    </div>
                  </div>

                  {memberReport && (
                    <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 mb-2">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-zinc-400">Eligible Welfare Schemes:</span>
                        <span className="font-bold text-emerald-400">
                          {memberReport.eligible_schemes_count} Programs
                        </span>
                      </div>
                      {memberReport.eligible_schemes.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {memberReport.eligible_schemes.slice(0, 2).map((s) => (
                            <Link
                              key={s.slug}
                              to={`/schemes/${s.slug}`}
                              className="text-[11px] text-zinc-300 hover:text-indigo-300 block truncate"
                            >
                              • {s.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(member)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Edit Member Demographics & Age"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                      title="Remove Member"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <Link
                    to="/vault"
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <span>Upload Docs in Vault</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add / Edit Family Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white">
                {editingMember ? 'Update Family Member Profile' : 'Add New Family Member'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Pooja Sharma, Kamla Devi"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                    Relationship
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="daughter">Daughter (पुत्री)</option>
                    <option value="son">Son (पुत्र)</option>
                    <option value="spouse">Spouse / Partner (पति/पत्नी)</option>
                    <option value="mother">Mother (माताजी)</option>
                    <option value="father">Father (पिताजी)</option>
                    <option value="grandparent">Grandparent (दादा/दादी)</option>
                    <option value="dependent">Dependent (आश्रित)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="female">Female (महिला)</option>
                    <option value="male">Male (पुरुष)</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    required
                    value={age}
                    onChange={(e) => {
                      const newAge = Number(e.target.value)
                      setAge(newAge)
                      if (newAge < 18) setIsStudent(true)
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                    Date of Birth (Optional)
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="student, retired, tailor"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                    Aadhaar Last 4 Digits
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={aadhaarLastFour}
                    onChange={(e) => setAadhaarLastFour(e.target.value)}
                    placeholder="e.g. 9402"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isStudent}
                    onChange={(e) => setIsStudent(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-950 text-indigo-600"
                  />
                  <span>Currently Studying / Student</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasDisability}
                    onChange={(e) => setHasDisability(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-950 text-indigo-600"
                  />
                  <span>Person with Disability</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20"
                >
                  {editingMember ? 'Update Member Profile' : 'Issue Member ID & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
