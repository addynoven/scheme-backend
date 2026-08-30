export const homeKeys = {
  all: ['chat'] as const,
  sessions: () => [...homeKeys.all, 'sessions'] as const,
  session: (id: number) => [...homeKeys.all, 'session', id] as const,
}
