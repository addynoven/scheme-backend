export const resultsKeys = {
  all: ['results'] as const,
  report: () => [...resultsKeys.all, 'report'] as const,
}
