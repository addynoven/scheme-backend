import {
  voiceChat as apiVoiceChat,
  synthesizeSpeech as apiSynthesizeSpeech,
  type VoiceChatResponse,
  type VoiceSynthesisResponse,
} from '@/core'

export const voiceRepository = {
  async chat(
    audioFile: File,
    sessionId?: number
  ): Promise<VoiceChatResponse> {
    return apiVoiceChat(audioFile, sessionId)
  },

  async synthesize(text: string, languageCode = 'hi'): Promise<VoiceSynthesisResponse> {
    return apiSynthesizeSpeech(text, languageCode)
  },
}
