'use client'

import Link from 'next/link'
import { Plus, Edit2, Trash2, ShieldCheck, ChevronRight, User, CheckCircle2, AlertCircle } from 'lucide-react'
import { type HouseholdMember, type FamilyEligibilityReport } from '@/core'

interface HouseholdMemberListProps {
  primaryUser: any | null
  members: HouseholdMember[]
  report: FamilyEligibilityReport | null
  onAddMember: () => void
  onEditMember: (member: HouseholdMember) => void
  onDeleteMember: (id: number) => void
}

export function HouseholdMemberList({
  primaryUser,
  members,
  report,
  onAddMember,
  onEditMember,
  onDeleteMember,
}: HouseholdMemberListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Family Registry</h3>
          <p className="text-xs text-zinc-400">All registered dependents and family members</p>
        </div>
        <button
          onClick={onAddMember}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-2xl transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
        >
          <Plus className="h-4 w-4" /> Add Family Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Primary Citizen Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between group">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                  {primaryUser?.profile?.full_name?.charAt(0) || 'P'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {primaryUser?.profile?.full_name || 'Primary Citizen'}
                  </h4>
                  <span className="text-[11px] text-zinc-400">Head of Household (Self)</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                PRIMARY
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-zinc-400 mt-4">
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span>Age / Gender:</span>
                <span className="text-white font-medium">
                  {primaryUser?.profile?.age || 30} Yrs • {primaryUser?.profile?.gender || 'Male'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span>State:</span>
                <span className="text-white font-medium">{primaryUser?.profile?.state || 'Madhya Pradesh'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Verification:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> ID VERIFIED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-members Cards */}
        {members.map((member) => {
          const memberReport = (report?.family_members_reports || (report?.household_results as any[]) || []).find(
            (r: any) => r.member_id === member.id
          )

          return (
            <div
              key={member.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-sm">
                      {(member.full_name || member.member_name || 'M').charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{member.full_name || member.member_name}</h4>
                      <span className="text-[11px] text-zinc-400">{member.relationship}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      member.life_stage === 'MINOR'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : member.life_stage === 'SENIOR'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {member.life_stage || 'DEPENDENT'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-400 mt-4">
                  <div className="flex justify-between py-1 border-b border-zinc-800/60">
                    <span>Age / Gender:</span>
                    <span className="text-white font-medium">
                      {member.age} Yrs • {member.gender}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-800/60">
                    <span>Occupation:</span>
                    <span className="text-white font-medium capitalize">{member.occupation || 'Dependent'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Eligible Schemes:</span>
                    <span className="text-emerald-400 font-bold">
                      {memberReport?.eligible_schemes_count || memberReport?.eligible_count || 0} Programs
                    </span>
                  </div>
                </div>

                {memberReport?.eligible_schemes && memberReport.eligible_schemes.length > 0 && (
                  <div className="space-y-1 mt-3 pt-3 border-t border-zinc-800">
                    {memberReport.eligible_schemes.slice(0, 2).map((s: any) => (
                      <Link
                        key={s.slug}
                        href={`/schemes/${s.slug}`}
                        className="text-[11px] text-zinc-400 hover:text-indigo-300 block truncate"
                      >
                        • {s.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-4 mt-2 border-t border-zinc-800/80">
                <button
                  onClick={() => onEditMember(member)}
                  className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
                  title="Edit Member"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDeleteMember(member.id)}
                  className="p-1.5 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                  title="Delete Member"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
