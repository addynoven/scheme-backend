import { schemesRepository } from './repositories'

export async function fetchSchemeDetailAction(slug: string) {
  return schemesRepository.getBySlug(slug)
}
