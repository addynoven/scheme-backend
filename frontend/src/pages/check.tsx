import { useState, useEffect } from 'react'
import { useNavigate, Link } from '@/router'
import {
  CheckCircle2,
  ArrowRight,
  User,
  MapPin,
  IndianRupee,
  Briefcase,
  Calendar,
  Sparkles,
  ArrowLeft,
} from 'lucide-react'
import { checkEligibility, type EligibilityCheckPayload } from '@/lib/api'
import { saveCitizenProfile, saveEligibilityReport, getSavedCitizenProfile } from '@/lib/session'

const INDIAN_STATES = [
  'Madhya Pradesh',
  'Maharashtra',
  'Karnataka',
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Gujarat',
  'Haryana',
  'Jharkhand',
  'Kerala',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
]

const OCCUPATIONS = [
  { id: 'farmer', label: 'Farmer / Agriculturalist' },
  { id: 'student', label: 'Student' },
  { id: 'artisan', label: 'Artisan / Craftsman / Tradesperson' },
  { id: 'senior_citizen', label: 'Senior Citizen / Retired' },
  { id: 'business', label: 'Small Business / Self-Employed' },
  { id: 'unemployed', label: 'Unemployed / Job Seeker' },
  { id: 'other', label: 'Other / Private Sector' },
]

const INCOME_PRESETS = [
  { label: '< ₹1.5 Lakh', value: 120000 },
  { label: '₹2.5 Lakh', value: 250000 },
  { label: '₹5.0 Lakh', value: 500000 },
  { label: '₹8.0 Lakh', value: 800000 },
]

export default function EligibilityCheckPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<EligibilityCheckPayload>({
    age: 28,
    gender: 'male',
    state: 'Madhya Pradesh',
    annual_income: 120000,
    occupation: 'farmer',
  })

  useEffect(() => {
    const saved = getSavedCitizenProfile()
    if (saved) {
      setFormData(saved)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      saveCitizenProfile(formData)
      const report = await checkEligibility(formData)
      saveEligibilityReport(report)
      navigate('/results')
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate eligibility. Please check your connection.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Back Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors w-fit"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Home</span>
      </Link>

      {/* Form Container */}
      <div className="rounded-3xl border border-zinc-800/90 bg-zinc-900/60 p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/80 border border-blue-800/60 text-blue-300 w-fit">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Instant Eligibility Evaluator · V1.1</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
            Check Your Scheme Eligibility
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Provide your basic details below to evaluate National and State government schemes you qualify for.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* 1. Age & Gender Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Age */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-400" />
                Age (Years)
              </label>
              <input
                type="number"
                min={0}
                max={120}
                required
                value={formData.age ?? ''}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="e.g. 35"
              />
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-400" />
                Gender
              </label>
              <select
                value={formData.gender || 'male'}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="transgender">Transgender</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* 2. State */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-400" />
              State of Residence
            </label>
            <select
              value={formData.state || 'Madhya Pradesh'}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
            >
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Occupation */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-blue-400" />
              Primary Occupation
            </label>
            <select
              value={formData.occupation || 'farmer'}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
            >
              {OCCUPATIONS.map((occ) => (
                <option key={occ.id} value={occ.id}>
                  {occ.label}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Annual Income */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5 text-blue-400" />
              Annual Family Income (₹ INR)
            </label>
            <input
              type="number"
              min={0}
              step={10000}
              required
              value={formData.annual_income ?? ''}
              onChange={(e) => setFormData({ ...formData, annual_income: Number(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="e.g. 150000"
            />

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[11px] text-zinc-500 mr-1">Quick Select:</span>
              {INCOME_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => setFormData({ ...formData, annual_income: preset.value })}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    formData.annual_income === preset.value
                      ? 'bg-blue-900/60 border-blue-700 text-blue-200'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-zinc-800/80 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Evaluating National & State Schemes...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>See Eligible Schemes</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
