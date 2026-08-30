import { voiceRepository } from './repositories'

export async function synthesizeSpeechAction(text: string, languageCode = 'hi') {
  return voiceRepository.synthesize(text, languageCode)
}
