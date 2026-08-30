import { resultsRepository } from './repositories'

export async function fetchDocumentReadinessAction(schemeId: number) {
  return resultsRepository.getDocumentReadiness(schemeId)
}
