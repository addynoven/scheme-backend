import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_API_URL: z.string().default('http://127.0.0.1:8000'),
  NEXT_PUBLIC_AUTH_SECRET: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>
