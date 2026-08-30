import { z } from 'zod'

export const VoiceChatSchema = z.object({
  audio_base64: z.string().min(1, 'Audio data is required'),
  session_id: z.number().optional().nullable(),
  citizen_uid: z.string().optional().nullable(),
  source_lang: z.string().default('hi-IN'),
})
export type VoiceChatInput = z.infer<typeof VoiceChatSchema>

export const SynthesizeSpeechSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  target_lang: z.string().default('hi-IN'),
  voice_gender: z.enum(['FEMALE', 'MALE']).default('FEMALE'),
})
export type SynthesizeSpeechInput = z.infer<typeof SynthesizeSpeechSchema>
