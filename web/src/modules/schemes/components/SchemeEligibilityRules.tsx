'use client'

import { CheckCircle2, XCircle, AlertCircle, ShieldCheck } from 'lucide-react'
import { type EligibilityRule, type SchemeExplanation } from '@/core'

interface SchemeEligibilityRulesProps {
  rules: EligibilityRule[]
  userExplanation?: SchemeExplanation
}

export function SchemeEligibilityRules({ rules, userExplanation }: SchemeEligibilityRulesProps) {
  if (!rules || rules.length === 0) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
        <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-blue-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Eligibility Criteria ({rules.length} Rules)</h3>
          <p className="text-xs text-zinc-400">
            {userExplanation
              ? `You meet ${userExplanation.criteria_passed} of ${userExplanation.criteria_total} criteria (${userExplanation.match_percentage}%)`
              : 'Deterministic rule engine parameters for qualification'}
          </p>
        </div>
      </div>

      {userExplanation?.summary_reason && (
        <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl text-xs text-zinc-300">
          <span className="font-semibold text-blue-400">Verdict Summary: </span>
          {userExplanation.summary_reason}
        </div>
      )}

      <div className="space-y-2">
        {rules.map((rule, idx) => {
          const fieldName = rule.field_name || rule.field || ''
          const operator = rule.operator || '=='
          const targetVal = rule.rule_value || rule.value || ''

          const userVerdict =
            userExplanation?.passed_criteria?.find((c) => c.field === fieldName) ||
            userExplanation?.failed_criteria?.find((c) => c.field === fieldName)

          return (
            <div
              key={idx}
              className="p-3 bg-zinc-950/40 rounded-2xl border border-zinc-800/80 flex items-center justify-between text-xs gap-3"
            >
              <div className="flex items-center gap-3">
                {userVerdict ? (
                  userVerdict.status === 'passed' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : userVerdict.status === 'failed' ? (
                    <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                  )
                ) : (
                  <div className="h-2 w-2 rounded-full bg-zinc-600 shrink-0" />
                )}

                <div>
                  <span className="font-mono text-zinc-300 font-semibold">{fieldName}</span>{' '}
                  <span className="text-zinc-500">{operator}</span>{' '}
                  <span className="font-mono text-blue-400">{targetVal}</span>
                  {rule.description && (
                    <p className="text-[11px] text-zinc-400 mt-0.5">{rule.description}</p>
                  )}
                  {userVerdict?.reason && (
                    <p className="text-[11px] text-zinc-500 mt-0.5">{userVerdict.reason}</p>
                  )}
                </div>
              </div>

              {userVerdict && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    userVerdict.status === 'passed'
                      ? 'bg-emerald-950 text-emerald-400'
                      : userVerdict.status === 'failed'
                      ? 'bg-red-950 text-red-400'
                      : 'bg-amber-950 text-amber-400'
                  }`}
                >
                  {userVerdict.status.toUpperCase()}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
