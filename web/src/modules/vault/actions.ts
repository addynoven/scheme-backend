import { vaultRepository } from './repositories'

export async function uploadVaultDocumentAction(file: File, documentType: string, memberId?: number | null) {
  return vaultRepository.uploadDocument(file, documentType, memberId)
}
