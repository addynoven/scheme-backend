import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { inferCategory, mapBackendReadiness, type BackendSchemeReadinessResponse } from '../repositories/vault.api';
import { useVaultStore } from '../store/vault.store';
import { ExtractedFactsSchema } from '../models/vault.model';

describe('Vault Module Tests', () => {

  // ── inferCategory ──────────────────────────────────────────────────────────

  describe('inferCategory', () => {
    it('maps Aadhaar Card → identity', () => {
      assert.strictEqual(inferCategory('Aadhaar Card'), 'identity');
    });
    it('maps Land Ownership Record → land', () => {
      assert.strictEqual(inferCategory('Land Ownership Record'), 'land');
    });
    it('maps 7/12 Extract → land', () => {
      assert.strictEqual(inferCategory('7/12 Extract'), 'land');
    });
    it('maps Bank Passbook → bank', () => {
      assert.strictEqual(inferCategory('Bank Passbook'), 'bank');
    });
    it('maps Income Certificate → income', () => {
      assert.strictEqual(inferCategory('Income Certificate'), 'income');
    });
    it('maps Ration Card → other', () => {
      assert.strictEqual(inferCategory('Ration Card'), 'other');
    });
    it('maps Caste Certificate → other', () => {
      assert.strictEqual(inferCategory('Caste Certificate'), 'other');
    });
    it('maps Family Entitlement Card → other (alternate ration name)', () => {
      assert.strictEqual(inferCategory('Family Entitlement Card'), 'other');
    });
    it('defaults unknown type → identity', () => {
      assert.strictEqual(inferCategory('Some Random Document'), 'identity');
    });
  });

  // ── mapBackendReadiness ────────────────────────────────────────────────────

  describe('mapBackendReadiness', () => {
    const backendResponse: BackendSchemeReadinessResponse = {
      scheme_id: 42,
      scheme_slug: 'pm-kisan',
      scheme_name: 'PM Kisan Samman Nidhi',
      is_ready_to_apply: false,
      readiness_percentage: 66.7,
      mandatory_total: 3,
      mandatory_available: 2,
      optional_total: 0,
      optional_available: 0,
      summary: '2/3 mandatory documents ready.',
      checklist: [
        {
          document_name: 'Aadhaar Card',
          description: 'Identity proof',
          is_mandatory: true,
          status: 'available',
          matched_vault_document_id: 101,
          matched_vault_document_name: 'aadhaar_2024.pdf',
        },
        {
          document_name: 'Bank Account Details',
          description: 'for DBT',
          is_mandatory: true,
          status: 'available',
          matched_vault_document_id: 102,
          matched_vault_document_name: 'bank_passbook.pdf',
        },
        {
          document_name: 'Land Ownership Record',
          description: 'Proof of landholding',
          is_mandatory: true,
          status: 'missing',
          matched_vault_document_id: null,
          matched_vault_document_name: null,
        },
        {
          document_name: 'Optional Income Proof',
          description: 'Optional',
          is_mandatory: false,
          status: 'missing',
          matched_vault_document_id: null,
          matched_vault_document_name: null,
        },
      ],
    };

    it('maps basic fields correctly', () => {
      const result = mapBackendReadiness(backendResponse, 'Ministry of Agriculture');
      assert.strictEqual(result.schemeId, '42');
      assert.strictEqual(result.schemeName, 'PM Kisan Samman Nidhi');
      assert.strictEqual(result.ministry, 'Ministry of Agriculture');
      assert.strictEqual(result.percentage, 66.7);
      assert.strictEqual(result.isReady, false);
      assert.strictEqual(result.presentCount, 2);
      assert.strictEqual(result.totalCount, 3);
    });

    it('only includes mandatory documents in requiredDocuments', () => {
      const result = mapBackendReadiness(backendResponse, 'Ministry');
      assert.strictEqual(result.requiredDocuments.length, 3);
    });

    it('marks uploaded documents as isUploaded=true', () => {
      const result = mapBackendReadiness(backendResponse, 'Ministry');
      const aadhaar = result.requiredDocuments.find((d) => d.name === 'Aadhaar Card');
      assert.ok(aadhaar);
      assert.strictEqual(aadhaar.isUploaded, true);
      assert.strictEqual(aadhaar.documentId, '101');
    });

    it('marks missing documents as isUploaded=false', () => {
      const result = mapBackendReadiness(backendResponse, 'Ministry');
      const land = result.requiredDocuments.find((d) => d.name === 'Land Ownership Record');
      assert.ok(land);
      assert.strictEqual(land.isUploaded, false);
      assert.strictEqual(land.documentId, undefined);
    });

    it('infers correct categories from document names', () => {
      const result = mapBackendReadiness(backendResponse, 'Ministry');
      const aadhaar = result.requiredDocuments.find((d) => d.name === 'Aadhaar Card');
      const bank = result.requiredDocuments.find((d) => d.name === 'Bank Account Details');
      const land = result.requiredDocuments.find((d) => d.name === 'Land Ownership Record');
      assert.strictEqual(aadhaar?.category, 'identity');
      assert.strictEqual(bank?.category, 'bank');
      assert.strictEqual(land?.category, 'land');
    });

    it('maps 100% ready scheme correctly', () => {
      const readyResponse: BackendSchemeReadinessResponse = {
        ...backendResponse,
        is_ready_to_apply: true,
        readiness_percentage: 100,
        mandatory_available: 3,
        checklist: backendResponse.checklist.map((item) => ({ ...item, status: 'available' as const, matched_vault_document_id: 1, matched_vault_document_name: 'doc.pdf' })),
      };
      const result = mapBackendReadiness(readyResponse, 'Ministry');
      assert.strictEqual(result.isReady, true);
      assert.strictEqual(result.percentage, 100);
      assert.strictEqual(result.presentCount, 3);
      assert.ok(result.requiredDocuments.every((d) => d.isUploaded));
    });
  });

  // ── Vault Store ────────────────────────────────────────────────────────────

  describe('useVaultStore', () => {
    beforeEach(() => {
      useVaultStore.getState().resetToInitial();
    });

    it('starts with empty documents after reset', () => {
      const { documents } = useVaultStore.getState();
      assert.strictEqual(documents.length, 0);
    });

    it('syncServerDocuments maps backend docs and infers categories', () => {
      useVaultStore.getState().syncServerDocuments([
        { id: 1, user_id: 1, household_member_id: null, citizen_uid: null, document_type: 'Aadhaar Card', document_number_masked: null, file_name: 'aadhaar.pdf', file_size_bytes: 1024 * 1024, mime_type: 'application/pdf', is_verified: true, download_url: null },
        { id: 2, user_id: 1, household_member_id: null, citizen_uid: null, document_type: 'Land Ownership Record', document_number_masked: null, file_name: 'land.pdf', file_size_bytes: 2 * 1024 * 1024, mime_type: 'application/pdf', is_verified: false, download_url: null },
        { id: 3, user_id: 1, household_member_id: null, citizen_uid: null, document_type: 'Ration Card', document_number_masked: null, file_name: 'ration.pdf', file_size_bytes: 512 * 1024, mime_type: 'application/pdf', is_verified: true, download_url: null },
      ]);
      const docs = useVaultStore.getState().documents;
      assert.strictEqual(docs.length, 3);
      assert.strictEqual(docs.find((d) => d.title === 'Aadhaar Card')?.category, 'identity');
      assert.strictEqual(docs.find((d) => d.title === 'Land Ownership Record')?.category, 'land');
      assert.strictEqual(docs.find((d) => d.title === 'Ration Card')?.category, 'other');
    });

    it('confirmExtractionAndSave adds document with inferred category', () => {
      useVaultStore.setState({ lastSavedDocTitle: 'Income Certificate', targetCategory: undefined });
      useVaultStore.getState().updateExtraction({ fullName: 'Test User', state: 'Maharashtra' });
      useVaultStore.getState().confirmExtractionAndSave();
      const docs = useVaultStore.getState().documents;
      assert.strictEqual(docs.length, 1);
      assert.strictEqual(docs[0].title, 'Income Certificate');
      assert.strictEqual(docs[0].category, 'income');
      assert.strictEqual(useVaultStore.getState().savedModalVisible, true);
    });

    it('confirmExtractionAndSave respects targetCategory over inferred category', () => {
      useVaultStore.setState({ lastSavedDocTitle: 'My Document', targetCategory: 'land' });
      useVaultStore.getState().confirmExtractionAndSave();
      const docs = useVaultStore.getState().documents;
      assert.strictEqual(docs[0].category, 'land');
    });

    it('deleteDocument removes the correct document', () => {
      useVaultStore.getState().syncServerDocuments([
        { id: 10, user_id: 1, household_member_id: null, citizen_uid: null, document_type: 'PAN Card', document_number_masked: null, file_name: 'pan.pdf', file_size_bytes: 500000, mime_type: 'application/pdf', is_verified: true, download_url: null },
      ]);
      useVaultStore.getState().deleteDocument('10');
      assert.strictEqual(useVaultStore.getState().documents.length, 0);
    });

    it('setDevScreen does not mutate documents', () => {
      useVaultStore.getState().syncServerDocuments([
        { id: 5, user_id: 1, household_member_id: null, citizen_uid: null, document_type: 'Land Record', document_number_masked: null, file_name: 'land.pdf', file_size_bytes: 100000, mime_type: 'application/pdf', is_verified: true, download_url: null },
      ]);
      useVaultStore.getState().setDevScreen('2_scheme_readiness');
      assert.strictEqual(useVaultStore.getState().documents.length, 1); // was being deleted before fix
      useVaultStore.getState().setDevScreen('6_updated_readiness');
      assert.strictEqual(useVaultStore.getState().documents.length, 1); // was injecting fake doc before fix
    });

    it('closeSavedModal transitions to 6_updated_readiness', () => {
      useVaultStore.getState().closeSavedModal();
      assert.strictEqual(useVaultStore.getState().activeDevScreen, '6_updated_readiness');
    });
  });

  // ── ExtractedFactsSchema ───────────────────────────────────────────────────

  describe('ExtractedFactsSchema', () => {
    it('accepts valid facts', () => {
      const result = ExtractedFactsSchema.safeParse({
        fullName: 'Rohit Kumar',
        dob: '15/08/1990',
        gender: 'male',
        state: 'Maharashtra',
        address: 'Pune, Maharashtra - 411001',
      });
      assert.strictEqual(result.success, true);
    });

    it('rejects empty required fields', () => {
      const result = ExtractedFactsSchema.safeParse({
        fullName: '',
        dob: '',
        gender: 'unknown',
        state: '',
        address: '',
      });
      assert.strictEqual(result.success, false);
    });
  });
});
