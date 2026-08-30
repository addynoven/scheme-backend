import { z } from 'zod'

export const AdminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
export type AdminLoginInput = z.infer<typeof AdminLoginSchema>

export const AdminSchemeFormSchema = z.object({
  name: z.string().min(3, 'Scheme name is required'),
  slug: z.string().min(2, 'Slug is required'),
  category: z.string().min(1, 'Category is required'),
  state: z.string().optional(),
  ministry: z.string().min(1, 'Ministry is required'),
  description: z.string().min(10, 'Description is required'),
  status: z.enum(['active', 'inactive', 'draft']).default('active'),
  application_url: z.string().url().optional().or(z.literal('')),
  official_website: z.string().url().optional().or(z.literal('')),
  launch_date: z.string().optional(),
})
export type AdminSchemeFormInput = z.infer<typeof AdminSchemeFormSchema>

export const AdminTriageDecisionSchema = z.object({
  item_id: z.number(),
  decision: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
})
export type AdminTriageDecisionInput = z.infer<typeof AdminTriageDecisionSchema>
