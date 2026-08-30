'use client'

import { useState, useCallback } from 'react'
import { voiceRepository } from '../repositories'
import { useVoiceStore } from '../store'
import { type VoiceChatResponse } from '@/core'

export function useVoice() {
  const {
    isRecording,
    isPlaying,
    sourceLang,
    voiceGender,
    setIsRecording,
    setIsPlaying,
    setSourceLang,
    setVoiceGender,
  } = useVoiceStore()

  const [loading, setLoading] = useState(false)
  const [lastResponse, setLastResponse] = useState<VoiceChatResponse | null>(null)

  const sendVoiceChat = useCallback(
    async (
      audioFile: File,
      sessionId?: number
    ) => {
      setLoading(true)
      try {
        const res = await voiceRepository.chat(audioFile, sessionId)
        setLastResponse(res)
        return res
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    isRecording,
    isPlaying,
    sourceLang,
    voiceGender,
    loading,
    lastResponse,
    setIsRecording,
    setIsPlaying,
    setSourceLang,
    setVoiceGender,
    sendVoiceChat,
  }
}
