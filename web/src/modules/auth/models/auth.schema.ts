import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid 10-digit mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type RegisterInput = z.infer<typeof registerSchema>
