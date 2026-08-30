import { z } from 'zod'

export const EligibilityCheckSchema = z.object({
  age: z.number().min(0).max(120).optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().min(1, 'Gender is required'),
  state: z.string().min(1, 'State is required'),
  district: z.string().optional(),
  annual_income: z.number().min(0).default(0),
  occupation: z.string().optional(),
  caste_category: z.string().optional(),
  is_differently_abled: z.boolean().default(false),
  marital_status: z.string().optional(),
  residence_area: z.string().optional(),
  has_land: z.boolean().default(false),
})
export type EligibilityCheckInput = z.infer<typeof EligibilityCheckSchema>
