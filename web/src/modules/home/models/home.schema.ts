import { z } from 'zod'

export const SendChatMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
  session_id: z.number().optional(),
})
export type SendChatMessageInput = z.infer<typeof SendChatMessageSchema>
