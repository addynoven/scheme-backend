import { homeRepository } from './repositories'

export async function sendChatMessageAction(sessionId: number, content: string) {
  return homeRepository.sendMessage(sessionId, content)
}
