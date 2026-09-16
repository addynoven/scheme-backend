import { z } from 'zod';

export const OccupationTypeSchema = z.enum([
  'farmer',
  'student',
  'artisan',
  'salaried',
  'self_employed',
  'unemployed',
]);
export type OccupationType = z.infer<typeof OccupationTypeSchema>;

export const SocialCategorySchema = z.enum(['general', 'obc', 'sc', 'st', 'ews']);
export type SocialCategory = z.infer<typeof SocialCategorySchema>;

export const GenderTypeSchema = z.enum(['male', 'female', 'other']);
export type GenderType = z.infer<typeof GenderTypeSchema>;

export const BenefitTypeSchema = z.enum(['cash', 'subsidy', 'loan']);
export type BenefitType = z.infer<typeof BenefitTypeSchema>;

export const DemographicsDataSchema = z.object({
  dob: z.string().min(1, 'Date of birth is required'),
  gender: GenderTypeSchema.default('male'),
  state: z.string().default('Maharashtra'),
  district: z.string().default('Pune'),
});
export type DemographicsData = z.infer<typeof DemographicsDataSchema>;

export const EconomicDataSchema = z.object({
  occupation: OccupationTypeSchema.default('farmer'),
  category: SocialCategorySchema.default('obc'),
  annualIncome: z.number().default(120000),
});
export type EconomicData = z.infer<typeof EconomicDataSchema>;

export const AssetsDataSchema = z.object({
  ownsLand: z.boolean().default(true),
  landSizeAcres: z.number().default(2),
  isPwd: z.boolean().default(false),
  isWidowSingleParent: z.boolean().default(false),
  hasRationCard: z.boolean().default(true),
  isRural: z.boolean().default(true),
});
export type AssetsData = z.infer<typeof AssetsDataSchema>;

export const EligibilityFormDataSchema = z.object({
  demographics: DemographicsDataSchema,
  economic: EconomicDataSchema,
  assets: AssetsDataSchema,
});
export type EligibilityFormData = z.infer<typeof EligibilityFormDataSchema>;

export const DEFAULT_ELIGIBILITY_FORM: EligibilityFormData = {
  demographics: {
    dob: '15/08/1998',
    gender: 'male',
    state: 'Maharashtra',
    district: 'Pune',
  },
  economic: {
    occupation: 'farmer',
    category: 'obc',
    annualIncome: 120000,
  },
  assets: {
    ownsLand: true,
    landSizeAcres: 2,
    isPwd: false,
    isWidowSingleParent: false,
    hasRationCard: true,
    isRural: true,
  },
};

export interface SchemeCriterion {
  text: string;
  satisfied: boolean;
}

export interface EligibleScheme {
  id: string;
  name: string;
  ministry: string;
  benefitAmount: string;
  benefitPeriod: string;
  benefitType: BenefitType;
  matchReasons: string[];
  isEligible: boolean;
  criteriaList?: SchemeCriterion[];
  missingCondition?: string;
  userConditionValue?: string;
  requiredConditionValue?: string;
}

export interface EligibilityResultSummary {
  totalEligibleCount: number;
  totalBenefitEstimate: string;
  eligibleSchemes: EligibleScheme[];
  nearlyEligibleSchemes: EligibleScheme[];
}

export type CheckScreenStep =
  | '0_start'
  | '1_demographics'
  | '2_economic'
  | '3_assets'
  | '4_review'
  | '5_processing'
  | '6_results_summary'
  | '7_eligible_list'
  | '8_scheme_details'
  | '9_nearly_eligible';
