export const checkKeys = {
  all: ['check'] as const,
  evaluation: (payload: Record<string, any>) => [...checkKeys.all, 'evaluation', payload] as const,
}
