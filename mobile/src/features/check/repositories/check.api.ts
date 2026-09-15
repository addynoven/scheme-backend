import { apiClient } from '../../../core/api/client';
import { AppError } from '../../../core/errors/error-handler';
import { ok, type Result } from '../../../core/errors/result';
import {
  BenefitType,
  EligibilityFormData,
  EligibilityResultSummary,
  EligibleScheme,
  SchemeCriterion,
} from '../models/check.model';


export interface BackendCriterionVerdict {
  field: string;
  criterion_title: string;
  status: 'passed' | 'failed' | 'missing_info';
  your_value: unknown;
  required_condition: string;
  reason: string;
}

export interface BackendSchemeExplanation {
  scheme_id: number;
  scheme_name: string;
  scheme_slug: string;
  state?: string;
  ministry: string;
  description: string;
  status: 'eligible' | 'nearly_eligible' | 'ineligible';
  is_eligible: boolean;
  match_percentage: number;
  criteria_passed: number;
  criteria_total: number;
  summary_reason: string;
  passed_criteria: BackendCriterionVerdict[];
  failed_criteria: BackendCriterionVerdict[];
  benefits_summary: string[];
  application_url?: string;
}

export interface BackendEligibilityReportResponse {
  total_evaluated: number;
  eligible_count: number;
  nearly_eligible_count: number;
  ineligible_count: number;
  eligible_schemes: BackendSchemeExplanation[];
  nearly_eligible_schemes: BackendSchemeExplanation[];
  ineligible_schemes: BackendSchemeExplanation[];
}

function inferBenefitType(text: string): BenefitType {
  const lower = text.toLowerCase();
  if (lower.includes('loan') || lower.includes('credit')) return 'loan';
  if (lower.includes('subsidy') || lower.includes('cylinder') || lower.includes('solar')) return 'subsidy';
  return 'cash';
}

function mapExplanationToEligibleScheme(raw: BackendSchemeExplanation): EligibleScheme {
  const benefitSummary = raw.benefits_summary[0] || raw.description;
  const match = benefitSummary.match(
    /(?:₹\s*|\bRs\.?\s*)(\d[\d,.]*)\s*(lakhs?|crores?|cr|thousand|k)?(?:\s*(?:\/|per)\s*(year|yr|month|installment|annum))?/i
  );
  let benefitAmount = '₹5,000 - ₹25,000';
  if (match && match[1]) {
    const num = match[1].replace(/[.,]$/, '').trim();
    if (num) {
      const unit = match[2] ? ` ${match[2].trim()}` : '';
      const freq = match[3] ? ` / ${match[3].trim()}` : '';
      benefitAmount = `₹${num}${unit}${freq}`;
    }
  }

  const criteriaList: SchemeCriterion[] = [
    ...raw.passed_criteria.map((c) => ({
      text: `${c.criterion_title}: ${c.required_condition}`,
      satisfied: true,
    })),
    ...raw.failed_criteria.map((c) => ({
      text: `${c.criterion_title}: ${c.required_condition}`,
      satisfied: false,
    })),
  ];

  const firstFailed = raw.failed_criteria[0];

  return {
    id: raw.scheme_slug || String(raw.scheme_id),
    name: raw.scheme_name,
    ministry: raw.ministry,
    benefitAmount,
    benefitPeriod: 'Annual Benefit',
    benefitType: inferBenefitType(benefitSummary),
    matchReasons: [raw.summary_reason, ...raw.benefits_summary],
    isEligible: raw.is_eligible,
    criteriaList,
    missingCondition: firstFailed ? firstFailed.criterion_title : undefined,
    userConditionValue: firstFailed ? String(firstFailed.your_value) : undefined,
    requiredConditionValue: firstFailed ? firstFailed.required_condition : undefined,
  };
}

export class CheckApiRepository {
  async evaluate(formData: EligibilityFormData): Promise<Result<EligibilityResultSummary, AppError>> {
    // 1. Format payload matching FastAPI EligibilityCheckRequest
    const dobFormatted = formData.demographics.dob.includes('/')
      ? formData.demographics.dob.split('/').reverse().join('-')
      : formData.demographics.dob;

    const payload = {
      date_of_birth: dobFormatted || '1994-01-01',
      gender: formData.demographics.gender,
      state: formData.demographics.state,
      district: formData.demographics.district,
      annual_income: formData.economic.annualIncome,
      occupation: formData.economic.occupation,
      caste_category: formData.economic.category.toUpperCase(),
      is_differently_abled: formData.assets.isPwd,
      marital_status: formData.assets.isWidowSingleParent ? 'Widowed / Single Mother' : 'Married',
      residence_area: formData.assets.isRural ? 'Rural' : 'Urban',
      has_land: formData.assets.ownsLand,
    };

    const result = await apiClient.post<BackendEligibilityReportResponse>('/eligibility/explain', payload);

    if (result.ok && result.data) {
      const eligibleSchemes = result.data.eligible_schemes.map(mapExplanationToEligibleScheme);
      const nearlyEligibleSchemes = result.data.nearly_eligible_schemes.map(mapExplanationToEligibleScheme);

      return ok({
        totalEligibleCount: result.data.eligible_count,
        totalBenefitEstimate: `₹${result.data.eligible_count * 6000}/yr+`,
        eligibleSchemes,
        nearlyEligibleSchemes,
      });
    }

    return result as Result<EligibilityResultSummary, AppError>;
  }
}


export const checkApi = new CheckApiRepository();
