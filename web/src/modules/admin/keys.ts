export const adminKeys = {
  all: ['admin'] as const,
  me: () => [...adminKeys.all, 'me'] as const,
  schemes: (filters?: Record<string, any>) => [...adminKeys.all, 'schemes', filters] as const,
  ingestionSources: () => [...adminKeys.all, 'ingestion-sources'] as const,
  triageItems: () => [...adminKeys.all, 'triage-items'] as const,
}
