import { z } from 'zod'

export const HouseholdMemberFormSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  age: z.number().min(0).max(120),
  date_of_birth: z.string().optional().nullable(),
  gender: z.string().min(1, 'Gender is required'),
  occupation: z.string().optional(),
  caste_category: z.string().optional(),
  annual_income: z.number().min(0).default(0),
  is_student: z.boolean().default(false),
  is_disabled: z.boolean().default(false),
  aadhaar_last_four: z.string().regex(/^\d{4}$/, 'Must be exactly 4 digits').optional().or(z.literal('')),
})
export type HouseholdMemberFormInput = z.infer<typeof HouseholdMemberFormSchema>
