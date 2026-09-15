import { z } from 'zod';

export const SchemeCategorySchema = z.string();
export type SchemeCategory = z.infer<typeof SchemeCategorySchema>;

export const BenefitTypeSchema = z.enum([
  'all',
  'cash_grant',
  'subsidy',
  'loan',
]);
export type BenefitType = z.infer<typeof BenefitTypeSchema>;

export const SchemeItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  ministry: z.string(),
  benefitAmount: z.string().optional(),
  benefitSummary: z.string(),
  jurisdiction: z.string().default('All India'),
  category: SchemeCategorySchema,
  benefitType: BenefitTypeSchema,
  tags: z.array(z.string()),
  description: z.string(),
  launchDate: z.string().optional(),
  officialUrl: z.string().optional(),
  isBookmarked: z.boolean().default(false),
  iconName: z.string().optional(),
  iconColor: z.string().optional(),
  iconBg: z.string().optional(),
  rawBenefits: z.array(z.object({ title: z.string(), description: z.string() })).optional(),
  eligibilityRules: z.array(z.object({
    field_name: z.string(),
    operator: z.string(),
    rule_value: z.string(),
  })).optional(),
  requiredDocuments: z.array(z.object({
    document_name: z.string(),
    is_mandatory: z.boolean(),
    description: z.string().optional().nullable(),
  })).optional(),
  officialSources: z.array(z.object({
    title: z.string(),
    url: z.string(),
    source_type: z.string().optional().nullable(),
  })).optional(),
});
export type SchemeItem = z.infer<typeof SchemeItemSchema>;

export const SchemeFilterSchema = z.object({
  query: z.string().default(''),
  category: SchemeCategorySchema.default('all'),
  benefitType: BenefitTypeSchema.default('all'),
  jurisdiction: z.string().default('All India'),
  sort: z.enum(['relevant', 'benefit', 'popular']).default('relevant'),
});
export type SchemeFilter = z.infer<typeof SchemeFilterSchema>;

export interface CategoryCardMeta {
  id: SchemeCategory;
  title: string;
  count: string;
  icon: string;
  iconColor: string;
  bgGradient: string[];
}

export interface PaginatedSchemes {
  items: SchemeItem[];
  total: number;
  skip: number;
  limit: number;
  hasMore: boolean;
}
