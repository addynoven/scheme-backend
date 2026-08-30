export const householdKeys = {
  all: ['household'] as const,
  members: () => [...householdKeys.all, 'members'] as const,
  familyEligibility: () => [...householdKeys.all, 'family-eligibility'] as const,
}
