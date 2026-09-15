import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listChatSessions,
  createChatSession,
  sendChatMessage,
} from '../lib/api'

describe('Conversational Citizen Chat Client Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('Conversational Citizen Chat sessions and message exchange', async () => {
    const mockSessions = [{ id: 101, title: 'Scholarship Guidance', created_at: '2026-08-14T10:00:00Z', messages: [] }]
    const mockCreated = { id: 102, title: 'New Consultation', created_at: '2026-08-14T10:05:00Z', messages: [] }
    const mockMsg = { id: 501, role: 'assistant' as const, content: 'Namaste! Main aapki sahayata ke liye taiyar hoon.', citations: [], created_at: '2026-08-14T10:05:01Z' }

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockSessions })
      .mockResolvedValueOnce({ ok: true, json: async () => mockCreated })
      .mockResolvedValueOnce({ ok: true, json: async () => mockMsg })
    vi.stubGlobal('fetch', mockFetch)

    const sessions = await listChatSessions()
    expect(sessions).toHaveLength(1)

    const session = await createChatSession('New Consultation')
    expect(session.id).toBe(102)

    const sent = await sendChatMessage(102, 'Hello')
    expect(sent.content).toContain('Namaste')
  })
})
