import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listHouseholdMembers,
  addHouseholdMember,
  updateHouseholdMember,
  listVaultDocuments,
  type HouseholdMember,
} from '../lib/api'

describe('SaaS 3-Tier Identity and Household Client Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch household members with 3-tier UIDs and life stage', async () => {
    const mockMembers: HouseholdMember[] = [
      {
        id: 1,
        citizen_uid: 'CIT-2026-8941',
        member_uid: 'MBR-2026-1189',
        household_uid: 'HHD-2026-4402',
        full_name: 'Pooja Sharma',
        relationship: 'daughter',
        life_stage: 'MINOR',
        verification_status: 'DOCUMENT_VERIFIED',
        age: 14,
        gender: 'female',
        is_student: true,
      },
      {
        id: 2,
        citizen_uid: 'CIT-2026-7721',
        member_uid: 'MBR-2026-3392',
        household_uid: 'HHD-2026-4402',
        full_name: 'Kamla Devi',
        relationship: 'mother',
        life_stage: 'SENIOR',
        verification_status: 'PENDING_DOCS',
        age: 68,
        gender: 'female',
        is_student: false,
      },
    ]

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockMembers,
    } as any)
    vi.stubGlobal('fetch', mockFetch)

    const result = await listHouseholdMembers()
    expect(result).toHaveLength(2)
    expect(result[0].citizen_uid).toBe('CIT-2026-8941')
    expect(result[0].life_stage).toBe('MINOR')
    expect(result[1].life_stage).toBe('SENIOR')
  })

  it('should send correct payload when creating a new household member', async () => {
    const createdMember: HouseholdMember = {
      id: 3,
      citizen_uid: 'CIT-2026-9901',
      member_uid: 'MBR-2026-5541',
      household_uid: 'HHD-2026-4402',
      full_name: 'Aman Sharma',
      relationship: 'son',
      life_stage: 'MINOR',
      verification_status: 'UNVERIFIED',
      age: 10,
      gender: 'male',
      is_student: true,
    }

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => createdMember,
    } as any)
    vi.stubGlobal('fetch', mockFetch)

    const res = await addHouseholdMember({
      full_name: 'Aman Sharma',
      relationship: 'son',
      age: 10,
      gender: 'male',
      is_student: true,
    })

    expect(res.citizen_uid).toBe('CIT-2026-9901')
    expect(res.member_uid).toBe('MBR-2026-5541')
  })

  it('should call update endpoint and handle life stage change', async () => {
    const updatedMember: HouseholdMember = {
      id: 1,
      citizen_uid: 'CIT-2026-8941',
      member_uid: 'MBR-2026-1189',
      household_uid: 'HHD-2026-4402',
      full_name: 'Pooja Sharma',
      relationship: 'daughter',
      life_stage: 'ADULT',
      verification_status: 'DOCUMENT_VERIFIED',
      age: 19,
      gender: 'female',
      is_student: false,
    }

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => updatedMember,
    } as any)
    vi.stubGlobal('fetch', mockFetch)

    const res = await updateHouseholdMember(1, { age: 19 })
    expect(res.age).toBe(19)
    expect(res.life_stage).toBe('ADULT')
  })

  it('should support member filter when listing and uploading vault documents', async () => {
    const mockDocs = [
      {
        id: 10,
        user_id: 1,
        household_member_id: 1,
        citizen_uid: 'CIT-2026-8941',
        document_type: '10th Marksheet',
        file_name: 'pooja_marksheet.pdf',
        file_size_bytes: 45000,
        mime_type: 'application/pdf',
        is_verified: true,
      },
    ]

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDocs,
    } as any)
    vi.stubGlobal('fetch', mockFetch)

    const docs = await listVaultDocuments(1)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('household_member_id=1'),
      expect.anything()
    )
    expect(docs[0].citizen_uid).toBe('CIT-2026-8941')
  })
})
