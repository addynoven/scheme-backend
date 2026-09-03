import { API_BASE, getAuthHeaders, request, type Result, type AppError } from '@/core'
import type { LoginInput, RegisterInput } from '../models'

export interface AuthTokenResponse {
  access_token: string
  refresh_token?: string
  token_type: string
}

export interface UserMeResponse {
  id: number
  email: string
  role: string
  citizen_uid?: string
  household_uid?: string
  profile?: any
}

export const authRepository = {
  async login(payload: LoginInput): Promise<Result<AuthTokenResponse, AppError>> {
    return request<AuthTokenResponse>(`/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  },

  async register(payload: RegisterInput): Promise<Result<any, AppError>> {
    return request<any>(`/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  },

  async getMe(): Promise<Result<UserMeResponse, AppError>> {
    return request<UserMeResponse>(`/api/auth/me`, {
      headers: getAuthHeaders('citizen'),
    })
  },
}
