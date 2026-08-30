import { describe, it, expect, vi } from 'vitest'
import { streamChatMessage } from '../src/core'

describe('V2.8 SSE Streaming Reader Test', () => {
  it('correctly reads SSE tokens, aggregates citations, and calls onDone', async () => {
    const ssePayload = [
      'data: {"type": "token", "token": "Aapke ", "citations": []}\n\n',
      'data: {"type": "token", "token": "liye Ladli Behna ", "citations": []}\n\n',
      'data: {"type": "token", "token": "Yojana hai.", "citations": ["samagra.gov.in"]}\n\n',
      'data: {"type": "done", "message_id": 999}\n\n',
    ].join('')

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(ssePayload))
        controller.close()
      },
    })

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      body: stream,
    })
    vi.stubGlobal('fetch', mockFetch)

    const tokens: string[] = []
    const citations: string[] = []
    let completedId = 0

    await streamChatMessage(
      101,
      'ladli behna batao',
      (token: string, cits?: string[]) => {
        tokens.push(token)
        if (cits) citations.push(...cits)
      },
      (msgId?: any) => {
        completedId = msgId || 0
      },
      (err?: any) => {
        throw err
      }
    )

    expect(tokens.join('')).toBe('Aapke liye Ladli Behna Yojana hai.')
    expect(citations).toContain('samagra.gov.in')
    expect(completedId).toBe(999)
  })
})
