import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  queryRouter,
  listHouseholdMembers,
  addHouseholdMember,
  getFamilyEligibility,
  listChatSessions,
  createChatSession,
  sendChatMessage,
  transcribeAudio,
  synthesizeSpeech,
} from '../src/core'

describe('V2.6 - V2.9 Frontend API Client Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('V2.6: queryRouter handles decomposed intent and cited answer', async () => {
    const mockResponse = {
      route_type: 'STRUCTURED_SQL_AND_OKF',
      normalized_intent: 'scholarship for daughter in MP',
      answer: 'Aapki beti ke liye MP Medhavi Yojana upyogi hai.',
      citations: ['knowledge/states/madhya_pradesh/medhavi-vidyarthi.md'],
      matched_schemes: [
        {
          name: 'Mukhyamantri Medhavi Vidyarthi Yojana',
          slug: 'mp-medhavi-vidyarthi',
          state: 'Madhya Pradesh',
          benefit_title: '100% Fee Waiver',
          application_url: 'https://scholarshipportal.mp.nic.in',
        },
      ],
    }

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })
    vi.stubGlobal('fetch', mockFetch)

    const res = await queryRouter('meri beti ke liye scholarship', 'Madhya Pradesh')
    expect(res.route_type).toBe('STRUCTURED_SQL_AND_OKF')
    expect(res.matched_schemes).toHaveLength(1)
    expect(res.citations).toContain('knowledge/states/madhya_pradesh/medhavi-vidyarthi.md')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/routing/query'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ question: 'meri beti ke liye scholarship', state: 'Madhya Pradesh' }),
      })
    )
  })

  it('V2.7: Household Family Welfare Graph CRUD and Eligibility Scan', async () => {
    const mockMembers = [
      {
        id: 1,
        full_name: 'Pooja Sharma',
        relationship: 'daughter',
        age: 14,
        gender: 'female',
        occupation: 'student',
        caste_category: 'General',
        annual_income: 0,
        is_student: true,
        has_disability: false,
      },
    ]

    const mockReport = {
      user_id: 1,
      total_family_members: 1,
      total_collective_schemes: 3,
      family_members_reports: [
        {
          member_id: 1,
          full_name: 'Pooja Sharma',
          relationship: 'daughter',
          age: 14,
          gender: 'female',
          eligible_schemes_count: 3,
          eligible_schemes: [
            { name: 'Sukanya Samriddhi Yojana', slug: 'sukanya-samriddhi', benefit_title: '8.2% Interest' },
          ],
        },
      ],
    }

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockMembers })
      .mockResolvedValueOnce({ ok: true, json: async () => mockMembers[0] })
      .mockResolvedValueOnce({ ok: true, json: async () => mockReport })
    vi.stubGlobal('fetch', mockFetch)

    const list = await listHouseholdMembers()
    expect(list).toHaveLength(1)
    expect(list[0].relationship).toBe('daughter')

    const added = await addHouseholdMember({
      full_name: 'Pooja Sharma',
      relationship: 'daughter',
      age: 14,
      gender: 'female',
      is_student: true,
      is_disabled: false,
    })
    expect(added.full_name).toBe('Pooja Sharma')

    const scan = await getFamilyEligibility()
    expect(scan.total_collective_schemes).toBe(3)
    expect(scan.family_members_reports[0].eligible_schemes).toHaveLength(1)
  })

  it('V2.8: Conversational Citizen Chat sessions and message exchange', async () => {
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

  it('V2.9: Voice Audio Transcription and Speech Synthesis', async () => {
    const mockTranscribe = { transcribed_text: 'meri beti ke liye yojana', detected_language: 'hi', confidence: 0.98 }
    const mockSynth = { language_code: 'hi', audio_format: 'mp3', audio_base64: 'SUQzBAAAAA==', synthesized_text: 'Aapke liye yojana hai' }

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockTranscribe })
      .mockResolvedValueOnce({ ok: true, json: async () => mockSynth })
    vi.stubGlobal('fetch', mockFetch)

    const dummyFile = new File(['dummy audio bytes'], 'query.mp3', { type: 'audio/mp3' })
    const transRes = await transcribeAudio(dummyFile)
    expect(transRes.transcribed_text).toBe('meri beti ke liye yojana')
    expect(transRes.detected_language).toBe('hi')

    const synthRes = await synthesizeSpeech('Aapke liye yojana hai', 'hi')
    expect(synthRes.audio_format).toBe('mp3')
    expect(synthRes.audio_base64).toBe('SUQzBAAAAA==')
  })
})
