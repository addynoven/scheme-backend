import { z } from 'zod'

export const VaultUploadSchema = z.object({
  document_type: z.string().min(1, 'Document type is required'),
  file: z.any(),
  household_member_id: z.number().optional().nullable(),
})
export type VaultUploadInput = z.infer<typeof VaultUploadSchema>

export const ConfirmExtractedFactsSchema = z.object({
  full_name: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  annual_income: z.number().optional().nullable(),
  occupation: z.string().optional().nullable(),
  caste_category: z.string().optional().nullable(),
  has_land: z.boolean().optional().nullable(),
  is_differently_abled: z.boolean().optional().nullable(),
})
export type ConfirmExtractedFactsInput = z.infer<typeof ConfirmExtractedFactsSchema>
