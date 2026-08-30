import { z } from 'zod'

export const ProfileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  date_of_birth: z.string().optional().nullable(),
  gender: z.string().min(1, 'Gender is required'),
  state: z.string().min(1, 'State is required'),
  district: z.string().optional(),
  annual_income: z.number().min(0).default(0),
  occupation: z.string().optional(),
  caste_category: z.string().optional(),
  marital_status: z.string().optional(),
  has_land: z.boolean().default(false),
  is_differently_abled: z.boolean().default(false),
})
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>
