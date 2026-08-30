import { adminRepository } from './repositories'

export async function adminLoginAction(formData: { email: string; password: string }) {
  return adminRepository.login(formData)
}
