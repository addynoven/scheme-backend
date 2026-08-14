import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from '@/router'
import { citizenGetMe, updateCitizenProfile } from '@/lib/api'
import { AuthGuard } from '@/components/AuthGuard'
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Home,
} from 'lucide-react'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry'
]

const OCCUPATIONS = [
  { value: 'farmer', label: 'Farmer / Agriculture (कृषक)' },
  { value: 'artisan', label: 'Artisan / Craftsman (कारीगर/शिल्पकार)' },
  { value: 'student', label: 'Student / Scholar (छात्र)' },
  { value: 'self_employed', label: 'Self-Employed / MSME (स्वरोजगार)' },
  { value: 'daily_wager', label: 'Daily Wage Laborer (दैनिक श्रमिक)' },
  { value: 'salaried', label: 'Salaried Employee (वेतनभोगी)' },
  { value: 'unemployed', label: 'Unemployed / Jobseeker (बेरोजगार)' },
  { value: 'retired', label: 'Senior Citizen / Retired (सेवानिवृत्त)' },
]

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  )
}

function ProfileContent() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [citizenUid, setCitizenUid] = useState('CIT-PENDING')
  const [householdUid, setHouseholdUid] = useState('HHD-PENDING')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '1988-01-01',
    gender: 'male',
    state: 'Madhya Pradesh',
    district: 'Sehore',
    annual_income: 90000,
    occupation: 'farmer',
    caste_category: 'OBC',
    residence_area: 'Rural',
    marital_status: 'Married',
    has_land: true,
    is_differently_abled: false,
  })

  useEffect(() => {
    citizenGetMe()
      .then((user) => {
        setCitizenUid(user.citizen_uid || 'CIT-PENDING')
        setHouseholdUid(user.household_uid || 'HHD-PENDING')
        setEmail(user.email || '')
        setPhone(user.phone || '')

        if (user.profile) {
          setFormData({
            full_name: user.profile.full_name || '',
            date_of_birth: user.profile.date_of_birth || '1988-01-01',
            gender: user.profile.gender || 'male',
            state: user.profile.state || 'Madhya Pradesh',
            district: user.profile.district || 'Sehore',
            annual_income: user.profile.annual_income || 0,
            occupation: user.profile.occupation || 'farmer',
            caste_category: user.profile.caste_category || 'General',
            residence_area: user.profile.residence_area || 'Rural',
            marital_status: user.profile.marital_status || 'Married',
            has_land: user.profile.has_land ?? false,
            is_differently_abled: user.profile.is_differently_abled ?? false,
          })
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Completeness score
  const calculateCompleteness = () => {
    let score = 0
    if (formData.full_name.trim()) score += 25
    if (formData.date_of_birth) score += 15
    if (formData.state) score += 15
    if (formData.district.trim()) score += 15
    if (formData.occupation) score += 15
    if (formData.annual_income > 0) score += 15
    return Math.min(score, 100)
  }

  const completeness = calculateCompleteness()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      await updateCitizenProfile(formData)
      setSuccess(true)
      setTimeout(() => {
        navigate('/')
      }, 1200)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="h-10 w-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-zinc-400">Loading citizen profile facts...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header with Sovereign IDs */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/20 border border-blue-500/20 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-[11px] font-mono font-bold text-blue-300">
                {citizenUid}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[11px] font-mono font-bold text-indigo-300 flex items-center gap-1">
                <Home className="h-3 w-3" />
                {householdUid}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Citizen Demographic Profile</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              {email} • {phone}
            </p>
          </div>

          <div className="bg-zinc-950/60 rounded-2xl p-4 border border-zinc-800/80 min-w-[180px]">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
              <span>Match Readiness</span>
              <span className="font-bold text-white">{completeness}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  completeness >= 80 ? 'bg-emerald-500' : completeness >= 50 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>Profile verified and saved! Redirecting to Command Center...</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="rounded-3xl bg-zinc-900/70 border border-zinc-800/80 p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Full Legal Name (as in Aadhaar)
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. Rajesh Kumar Sharma"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              required
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              <option value="male">Male (पुरुष)</option>
              <option value="female">Female (महिला)</option>
              <option value="transgender">Transgender (किन्नर/ट्रांसजेंडर)</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* State */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Permanent State (राज्य)
            </label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              District (जिला)
            </label>
            <input
              type="text"
              required
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              placeholder="e.g. Sehore, Bhopal, Patna"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Primary Occupation */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Primary Occupation (व्यवसाय)
            </label>
            <select
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              {OCCUPATIONS.map((occ) => (
                <option key={occ.value} value={occ.value}>
                  {occ.label}
                </option>
              ))}
            </select>
          </div>

          {/* Annual Income */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Annual Family Income (₹ INR)
            </label>
            <input
              type="number"
              min={0}
              step={5000}
              required
              value={formData.annual_income}
              onChange={(e) => setFormData({ ...formData, annual_income: Number(e.target.value) })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Social Category */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Social Category (जाति श्रेणी)
            </label>
            <select
              value={formData.caste_category}
              onChange={(e) => setFormData({ ...formData, caste_category: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              <option value="General">General / Unreserved</option>
              <option value="OBC">OBC (Other Backward Class)</option>
              <option value="SC">SC (Scheduled Caste)</option>
              <option value="ST">ST (Scheduled Tribe)</option>
              <option value="EWS">EWS (Economically Weaker Section)</option>
            </select>
          </div>

          {/* Residence Area */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Residence Area (क्षेत्र)
            </label>
            <select
              value={formData.residence_area}
              onChange={(e) => setFormData({ ...formData, residence_area: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              <option value="Rural">Rural (ग्रामीण)</option>
              <option value="Urban">Urban (शहरी)</option>
              <option value="Semi-Urban">Semi-Urban</option>
            </select>
          </div>
        </div>

        {/* Special Flags Checkboxes */}
        <div className="pt-4 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 cursor-pointer hover:border-zinc-700 transition-colors">
            <input
              type="checkbox"
              checked={formData.has_land}
              onChange={(e) => setFormData({ ...formData, has_land: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="text-xs font-semibold text-zinc-200">Agricultural Land Holder</div>
              <div className="text-[11px] text-zinc-500">Owns cultivable land (PM-Kisan, KCC)</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 cursor-pointer hover:border-zinc-700 transition-colors">
            <input
              type="checkbox"
              checked={formData.is_differently_abled}
              onChange={(e) => setFormData({ ...formData, is_differently_abled: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="text-xs font-semibold text-zinc-200">Person with Disability (Divyangjan)</div>
              <div className="text-[11px] text-zinc-500">Eligible for special pensions & assistive aids</div>
            </div>
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/"
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            ← Back to Command Center
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save & Evaluate 4,148 Schemes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
