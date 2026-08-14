import { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Trash2,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  HeartPulse,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import {
  type HouseholdMember,
  type FamilyEligibilityReport,
  listHouseholdMembers,
  addHouseholdMember,
  deleteHouseholdMember,
  getFamilyEligibility,
} from '@/lib/api'

export default function HouseholdPage() {
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [report, setReport] = useState<FamilyEligibilityReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // Form State
  const [fullName, setFullName] = useState('')
  const [relationship, setRelationship] = useState('daughter')
  const [age, setAge] = useState<number>(14)
  const [gender, setGender] = useState('female')
  const [occupation, setOccupation] = useState('student')
  const [casteCategory, setCasteCategory] = useState('General')
  const [isStudent, setIsStudent] = useState(true)
  const [hasDisability, setHasDisability] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    setLoading(true)
    try {
      const data = await listHouseholdMembers()
      setMembers(data)
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await addHouseholdMember({
        full_name: fullName,
        relationship,
        age: Number(age),
        gender,
        occupation,
        caste_category: casteCategory,
        annual_income: 0,
        is_student: isStudent,
        has_disability: hasDisability,
      })
      setShowAddModal(false)
      // Reset Form
      setFullName('')
      setAge(14)
      await loadMembers()
    } catch (e: any) {
      setError(e.message || 'Failed to add member')
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteHouseholdMember(id)
      setMembers((prev) => prev.filter((m) => m.id !== id))
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

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-zinc-900 border border-blue-900/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Users className="h-3.5 w-3.5" />
            <span>V2.7 Family Welfare Graph</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Household Welfare & Family Graph
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
            Government welfare in India is family-centric. Add your daughters, sons, spouse, and elderly parents to discover Sukanya Samriddhi, Ladli Behna, and National Old Age Pensions simultaneously.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 border border-zinc-700"
          >
            <UserPlus className="h-4 w-4 text-blue-400" />
            <span>Add Family Member</span>
          </button>

          <button
            onClick={handleScanFamily}
            disabled={scanning || members.length === 0}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-blue-600/25 flex items-center gap-2"
          >
            {scanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>Scan Family Welfare</span>
          </button>
        </div>
      </div>

      {/* Family Members Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <span>Registered Family Members</span>
          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-normal">
            {members.length}
          </span>
        </h2>

        {loading ? (
          <div className="p-8 text-center text-zinc-500 text-sm">Loading family members...</div>
        ) : members.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-8 text-center text-zinc-500">
            <Users className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
            <p className="text-sm">No family members registered yet.</p>
            <p className="text-xs text-zinc-600 mt-1">
              Add your daughter, son, spouse, or senior parents to calculate collective welfare.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m) => (
              <div
                key={m.id}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-zinc-100 text-base">{m.full_name}</h3>
                      <div className="inline-block px-2 py-0.5 rounded-md bg-blue-950/80 border border-blue-800/40 text-blue-300 text-[11px] font-medium uppercase mt-1">
                        {m.relationship}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                      title="Delete member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-400">
                    <div>
                      <span className="text-zinc-500">Age: </span>
                      <span className="text-zinc-200 font-medium">{m.age} yrs</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Gender: </span>
                      <span className="text-zinc-200 font-medium capitalize">{m.gender}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Role: </span>
                      <span className="text-zinc-200 font-medium capitalize">{m.occupation || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Category: </span>
                      <span className="text-zinc-200 font-medium">{m.caste_category || 'General'}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.is_student && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                        <GraduationCap className="h-3 w-3 text-indigo-400" />
                        Student
                      </span>
                    )}
                    {m.has_disability && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                        <HeartPulse className="h-3 w-3 text-emerald-400" />
                        PwD
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Family Eligibility Scan Report */}
      {report && (
        <div className="space-y-6 pt-6 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span>Family Welfare Report</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Evaluated in &lt; 0.05ms across all 4,148 schemes.
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-sm font-semibold">
              {report.total_collective_schemes} Total Eligible Schemes
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.family_members_reports.map((mr) => (
              <div
                key={mr.member_id}
                className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div>
                    <h3 className="font-semibold text-zinc-100 text-sm">{mr.full_name}</h3>
                    <p className="text-[11px] text-zinc-500 uppercase">{mr.relationship} · {mr.age} yrs</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 border border-blue-800 text-xs font-semibold">
                    {mr.eligible_schemes_count} Schemes
                  </span>
                </div>

                <div className="space-y-2">
                  {mr.eligible_schemes.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <h4 className="text-xs font-medium text-zinc-200 truncate">{s.name}</h4>
                        <p className="text-[10px] text-emerald-400 font-medium truncate">{s.benefit_title || 'Financial Welfare'}</p>
                      </div>
                      <a
                        href={s.application_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-white shrink-0 p-1"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-400" />
                <span>Add Family Member</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Pooja Sharma"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Relationship</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="daughter">Daughter</option>
                    <option value="son">Son</option>
                    <option value="spouse">Spouse</option>
                    <option value="mother">Mother</option>
                    <option value="father">Father</option>
                    <option value="sister">Sister</option>
                    <option value="brother">Brother</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Social Category</label>
                  <select
                    value={casteCategory}
                    onChange={(e) => setCasteCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Occupation</label>
                <select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="student">Student</option>
                  <option value="farmer">Farmer</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="homemaker">Homemaker</option>
                  <option value="artisan">Artisan</option>
                  <option value="salaried">Salaried</option>
                </select>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isStudent}
                    onChange={(e) => setIsStudent(e.target.checked)}
                    className="rounded bg-zinc-950 border-zinc-800 text-blue-600 focus:ring-0"
                  />
                  <span>Is Student?</span>
                </label>

                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasDisability}
                    onChange={(e) => setHasDisability(e.target.checked)}
                    className="rounded bg-zinc-950 border-zinc-800 text-blue-600 focus:ring-0"
                  />
                  <span>Has Disability (PwD)?</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-md shadow-blue-600/20"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
