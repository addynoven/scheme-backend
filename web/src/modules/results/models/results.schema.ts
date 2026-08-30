import { z } from 'zod'

export const ResultsFilterSchema = z.object({
  tab: z.enum(['eligible', 'nearly_eligible', 'ineligible']).default('eligible'),
  category: z.string().default('all'),
  search: z.string().default(''),
})
export type ResultsFilterInput = z.infer<typeof ResultsFilterSchema>
