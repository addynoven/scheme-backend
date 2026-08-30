import { create } from 'zustand'

interface VoiceState {
  isRecording: boolean
  isPlaying: boolean
  sourceLang: string
  voiceGender: 'FEMALE' | 'MALE'
  setIsRecording: (recording: boolean) => void
  setIsPlaying: (playing: boolean) => void
  setSourceLang: (lang: string) => void
  setVoiceGender: (gender: 'FEMALE' | 'MALE') => void
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isRecording: false,
  isPlaying: false,
  sourceLang: 'hi-IN',
  voiceGender: 'FEMALE',
  setIsRecording: (isRecording) => set({ isRecording }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setSourceLang: (sourceLang) => set({ sourceLang }),
  setVoiceGender: (voiceGender) => set({ voiceGender }),
}))
