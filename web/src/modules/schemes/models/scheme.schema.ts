import { z } from 'zod'

export const SchemeSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  state: z.string().optional(),
  skip: z.number().default(0),
  limit: z.number().default(24),
})
export type SchemeSearchInput = z.infer<typeof SchemeSearchSchema>
