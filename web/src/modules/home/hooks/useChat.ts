'use client'

import { useState, useEffect, useCallback } from 'react'
import { homeRepository } from '../repositories'
import { useChatStore } from '../store'
import { type ChatMessage, type ChatSession } from '@/core'

export function useChat() {
  const {
    currentSessionId,
    sessions,
    messages,
    streamBuffer,
    streamCitations,
    isStreaming,
    setCurrentSessionId,
    setSessions,
    setMessages,
    setStreamBuffer,
    setStreamCitations,
    setIsStreaming,
  } = useChatStore()

  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('Citizen')

  const loadSessions = useCallback(async () => {
    try {
      const data = await homeRepository.listSessions()
      setSessions(data || [])
    } catch {}
  }, [setSessions])

  const loadUser = useCallback(async () => {
    try {
      const user = await homeRepository.getMe()
      if (user?.profile?.full_name) setUserName(user.profile.full_name)
    } catch {}
  }, [])

  useEffect(() => {
    loadSessions()
    loadUser()
  }, [loadSessions, loadUser])

  const selectSession = useCallback(async (sessionId: number) => {
    setLoading(true)
    setCurrentSessionId(sessionId)
    try {
      const session = await homeRepository.getSession(sessionId)
      setMessages(session.messages || [])
    } catch {
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [setCurrentSessionId, setMessages])

  const ensureSession = useCallback(async () => {
    if (currentSessionId) return currentSessionId
    const newSession = await homeRepository.createSession('New Welfare Consultation')
    setCurrentSessionId(newSession.id)
    setSessions([newSession, ...sessions])
    return newSession.id
  }, [currentSessionId, sessions, setCurrentSessionId, setSessions])

  const sendQuery = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsStreaming(true)
    setStreamBuffer('')
    setStreamCitations([])

    let accumulatedText = ''
    let accumulatedCitations: string[] = []

    try {
      const sessionId = await ensureSession()
      await homeRepository.streamMessage(
        sessionId,
        text,
        (token: string, citations?: string[]) => {
          accumulatedText += token
          setStreamBuffer(accumulatedText)
          if (citations && citations.length > 0) {
            accumulatedCitations = Array.from(new Set([...accumulatedCitations, ...citations]))
            setStreamCitations(accumulatedCitations)
          }
        },
        async () => {
          setIsStreaming(false)
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              role: 'assistant',
              content: accumulatedText,
              citations: accumulatedCitations,
              created_at: new Date().toISOString(),
            },
          ])
          setStreamBuffer('')
          setStreamCitations([])
          await loadSessions()
        },
        async (err: any) => {
          try {
            const resp = await homeRepository.sendMessage(sessionId, text)
            setMessages((prev) => [...prev, resp])
          } finally {
            setIsStreaming(false)
            setStreamBuffer('')
            setStreamCitations([])
          }
        }
      )
    } catch {
      setIsStreaming(false)
    }
  }, [isStreaming, ensureSession, setMessages, setIsStreaming, setStreamBuffer, setStreamCitations, loadSessions])

  return {
    currentSessionId,
    sessions,
    messages,
    streamBuffer,
    streamCitations,
    isStreaming,
    userName,
    loading,
    selectSession,
    sendQuery,
    reloadSessions: loadSessions,
  }
}
