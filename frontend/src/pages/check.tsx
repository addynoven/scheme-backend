import { useState, useEffect } from 'react'
import { useNavigate, Link } from '@/router'
import {
  CheckCircle2,
  ArrowRight,
  User,
  MapPin,
  IndianRupee,
  Briefcase,
  Sparkles,
  ArrowLeft,
  Sliders,
  ChevronDown,
} from 'lucide-react'
import { checkEligibility, type EligibilityCheckPayload } from '@/lib/api'
import { saveCitizenProfile, saveEligibilityReport, getSavedCitizenProfile } from '@/lib/session'

const ALL_36_INDIAN_STATES_AND_UTS = [
  // 28 Indian States
  { name: 'Andhra Pradesh', type: 'State' },
  { name: 'Arunachal Pradesh', type: 'State' },
  { name: 'Assam', type: 'State' },
  { name: 'Bihar', type: 'State' },
  { name: 'Chhattisgarh', type: 'State' },
  { name: 'Goa', type: 'State' },
  { name: 'Gujarat', type: 'State' },
  { name: 'Haryana', type: 'State' },
  { name: 'Himachal Pradesh', type: 'State' },
  { name: 'Jharkhand', type: 'State' },
  { name: 'Karnataka', type: 'State' },
  { name: 'Kerala', type: 'State' },
  { name: 'Madhya Pradesh', type: 'State' },
  { name: 'Maharashtra', type: 'State' },
  { name: 'Manipur', type: 'State' },
  { name: 'Meghalaya', type: 'State' },
  { name: 'Mizoram', type: 'State' },
  { name: 'Nagaland', type: 'State' },
  { name: 'Odisha', type: 'State' },
  { name: 'Punjab', type: 'State' },
  { name: 'Rajasthan', type: 'State' },
  { name: 'Sikkim', type: 'State' },
  { name: 'Tamil Nadu', type: 'State' },
  { name: 'Telangana', type: 'State' },
  { name: 'Tripura', type: 'State' },
  { name: 'Uttar Pradesh', type: 'State' },
  { name: 'Uttarakhand', type: 'State' },
  { name: 'West Bengal', type: 'State' },
  // 8 Union Territories
  { name: 'Andaman and Nicobar Islands', type: 'Union Territory' },
  { name: 'Chandigarh', type: 'Union Territory' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'Union Territory' },
  { name: 'Delhi', type: 'Union Territory' },
  { name: 'Jammu and Kashmir', type: 'Union Territory' },
  { name: 'Ladakh', type: 'Union Territory' },
  { name: 'Lakshadweep', type: 'Union Territory' },
  { name: 'Puducherry', type: 'Union Territory' },
]

const OCCUPATIONS = [
  { id: 'farmer', label: 'Farmer / Agriculturalist / Cultivator' },
  { id: 'daily_wage', label: 'Daily Wage Worker / Farm Labourer' },
  { id: 'student', label: 'Student / Exam Aspirant / Graduate' },
  { id: 'artisan', label: 'Artisan / Craftsman / Traditional Weaver' },
  { id: 'business', label: 'Small Business Owner / MSME / Trader / Street Vendor' },
  { id: 'self_employed', label: 'Self-Employed / Freelancer' },
  { id: 'unemployed', label: 'Unemployed / Job Seeker' },
  { id: 'sanitation_health', label: 'Healthcare / Anganwadi / Sanitation Worker' },
  { id: 'senior_citizen', label: 'Senior Citizen / Retired / Pensioner' },
  { id: 'homemaker', label: 'Homemaker / Housewife' },
  { id: 'other', label: 'Other / Private Sector Employee' },
]

const CASTE_CATEGORIES = [
  { id: 'General', label: 'General / Open' },
  { id: 'OBC', label: 'OBC (Other Backward Class)' },
  { id: 'SC', label: 'SC (Scheduled Caste)' },
  { id: 'ST', label: 'ST (Scheduled Tribe)' },
  { id: 'EWS', label: 'EWS (Economically Weaker Section)' },
]

const INCOME_PRESETS = [
  { label: '< ₹1.5L (BPL)', value: 120000 },
  { label: '₹2.5 Lakh', value: 250000 },
  { label: '₹3.5 Lakh', value: 350000 },
  { label: '₹5.0 Lakh', value: 500000 },
  { label: '₹8.0 Lakh', value: 800000 },
  { label: '₹10L+', value: 1200000 },
]

export default function EligibilityCheckPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [formData, setFormData] = useState<EligibilityCheckPayload>({
    age: 28,
    gender: 'Female',
    state: 'Uttar Pradesh',
    district: '',
    annual_income: 180000,
    occupation: 'farmer',
    caste_category: 'General',
    is_differently_abled: false,
    marital_status: 'Married',
    residence_area: 'Rural',
    has_land: true,
  })

  useEffect(() => {
    const saved = getSavedCitizenProfile()
    if (saved) {
      setFormData((prev) => ({ ...prev, ...saved }))
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
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Back Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors w-fit cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Home</span>
      </Link>

      {/* Form Container */}
      <div className="rounded-3xl border border-zinc-800/90 bg-zinc-900/60 p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/80 border border-blue-800/60 text-blue-300 w-fit">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Instant Eligibility Evaluator · 4,160+ Schemes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
            Check Your Scheme Eligibility
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Provide your basic profile details below. The deterministic engine matches you across all 36 States/UTs and Central Ministries in &lt;1 second.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Section 1: Core Demographics (State & Location) */}
          <div className="flex flex-col gap-4 p-5 rounded-2xl bg-zinc-950/50 border border-zinc-800/70">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <MapPin className="h-4 w-4" />
              <span>1. Location & State of Residence (All 36 States/UTs)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* State Dropdown */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>State / Union Territory *</span>
                  <span className="text-[10px] text-zinc-500">36 Available</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.state || 'Uttar Pradesh'}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    required
                  >
                    <optgroup label="🏛️ 28 Indian States" className="bg-zinc-900 text-zinc-300 font-semibold">
                      {ALL_36_INDIAN_STATES_AND_UTS.filter((s) => s.type === 'State').map((s) => (
                        <option key={s.name} value={s.name} className="bg-zinc-900 text-zinc-200 font-normal">
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🇮🇳 8 Union Territories" className="bg-zinc-900 text-zinc-300 font-semibold">
                      {ALL_36_INDIAN_STATES_AND_UTS.filter((s) => s.type === 'Union Territory').map((s) => (
                        <option key={s.name} value={s.name} className="bg-zinc-900 text-zinc-200 font-normal">
                          {s.name} (UT)
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* District Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-300">
                  District <span className="text-zinc-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lucknow, Pune, Patna, Jaipur..."
                  value={formData.district || ''}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Personal Identity (Age & Gender) */}
          <div className="flex flex-col gap-4 p-5 rounded-2xl bg-zinc-950/50 border border-zinc-800/70">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <User className="h-4 w-4" />
              <span>2. Personal Profile (Age & Gender)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Age */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Age (Years) *</span>
                  <span className="text-xs font-bold text-blue-400">{formData.age} yrs</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={formData.age || 28}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.age || 28}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-16 px-2.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-center text-zinc-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-300">
                  Gender *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Female', label: 'Female 👩' },
                    { id: 'Male', label: 'Male 👨' },
                    { id: 'Other', label: 'Other ⚧' },
                  ].map((g) => {
                    const isSelected =
                      (formData.gender || '').toLowerCase() === g.id.toLowerCase()
                    return (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => setFormData({ ...formData, gender: g.id })}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {g.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Occupation & Livelihood */}
          <div className="flex flex-col gap-4 p-5 rounded-2xl bg-zinc-950/50 border border-zinc-800/70">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <Briefcase className="h-4 w-4" />
              <span>3. Primary Occupation & Trade</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300">
                Select Your Profession *
              </label>
              <div className="relative">
                <select
                  value={formData.occupation || 'farmer'}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  required
                >
                  {OCCUPATIONS.map((occ) => (
                    <option key={occ.id} value={occ.id} className="bg-zinc-900 text-zinc-200">
                      {occ.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Section 4: Annual Family Income */}
          <div className="flex flex-col gap-4 p-5 rounded-2xl bg-zinc-950/50 border border-zinc-800/70">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <IndianRupee className="h-4 w-4" />
              <span>4. Annual Family Income (INR)</span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={formData.annual_income || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, annual_income: Number(e.target.value) })
                  }
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-base font-bold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  required
                />
              </div>

              {/* Income Quick Presets */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {INCOME_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.label}
                    onClick={() => setFormData({ ...formData, annual_income: preset.value })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all cursor-pointer ${
                      formData.annual_income === preset.value
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5: Advanced Demographic Attributes Toggle */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-xs font-semibold text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-400" />
                <span>Additional Social & Demographic Filters (Caste, Disability, Area)</span>
              </div>
              <span className="text-[11px] text-blue-400 underline">
                {showAdvanced ? 'Hide Details' : 'Expand 4 Filters'}
              </span>
            </button>

            {showAdvanced && (
              <div className="mt-4 pt-4 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Caste / Social Category */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-300">
                    Social Category / Reservation
                  </label>
                  <select
                    value={formData.caste_category || 'General'}
                    onChange={(e) => setFormData({ ...formData, caste_category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {CASTE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Marital Status */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-300">
                    Marital Status
                  </label>
                  <select
                    value={formData.marital_status || 'Married'}
                    onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Single">Single / Unmarried</option>
                    <option value="Married">Married</option>
                    <option value="Widowed / Single Mother">Widowed / Single Mother / Destitute</option>
                  </select>
                </div>

                {/* Area of Residence */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-300">
                    Area of Residence
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Rural', 'Urban'].map((area) => {
                      const isSel = (formData.residence_area || 'Rural') === area
                      return (
                        <button
                          type="button"
                          key={area}
                          onClick={() => setFormData({ ...formData, residence_area: area })}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isSel
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {area === 'Rural' ? '🌾 Rural / Gramin' : '🏙️ Urban / Nagar'}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Divyangjan / Disability Toggle */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-300">
                    Person with Disability (Divyangjan)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: false, label: 'No (General)' },
                      { val: true, label: 'Yes (PwD >= 40%) ♿' },
                    ].map((d) => {
                      const isSel = Boolean(formData.is_differently_abled) === d.val
                      return (
                        <button
                          type="button"
                          key={String(d.val)}
                          onClick={() => setFormData({ ...formData, is_differently_abled: d.val })}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isSel
                              ? 'bg-amber-600 border-amber-500 text-white'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {d.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-base shadow-xl shadow-blue-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Evaluating across 4,160+ schemes...</span>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span>Evaluate My Scheme Eligibility (Instant)</span>
                <ArrowRight className="h-5 w-5 ml-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
