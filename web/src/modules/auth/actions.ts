import { authRepository } from './repositories'
import { type LoginInput, type RegisterInput } from './models'

export async function loginAction(data: LoginInput) {
  return authRepository.login(data)
}

export async function registerAction(data: RegisterInput) {
  return authRepository.register(data)
}
