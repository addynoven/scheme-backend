import { apiClient } from '../../../core/api/client';
import { err, type Result } from '../../../core/errors/result';
import { AppError } from '../../../core/errors/error-handler';
import type { RequiredDocumentStatus, SchemeReadiness, VaultDocument } from '../models/vault.model';

/**
 * Maps a raw document type/title string to a VaultDocument category.
 * Single source of truth used by:
 *   - vault.store → syncServerDocuments (backend sync)
 *   - vault.store → confirmExtractionAndSave (local upload)
 *   - mapBackendReadiness (requirement icon display)
 */
export function inferCategory(titleOrType: string): VaultDocument['category'] {
  const t = titleOrType.toLowerCase();
  if (t.includes('land') || t.includes('7/12') || t.includes('patta') || t.includes('khasra') || t.includes('khatauni')) return 'land';
  if (t.includes('income') || t.includes('salary')) return 'income';
  if (t.includes('bank') || t.includes('passbook') || t.includes('account')) return 'bank';
  if (
    t.includes('ration') || t.includes('caste') || t.includes('community certificate') ||
    t.includes('domicile') || t.includes('residence certificate') ||
    t.includes('bpl card') || t.includes('family entitlement')
  ) return 'other';
  return 'identity';
}

/**
 * Converts the backend /vault/readiness/schemes/{id} response to the SchemeReadiness
 * UI model consumed by ReadinessMeter and RequiredDocsList.
 *
 * Only mandatory documents are shown in the gauge — optional docs are informational only.
 */
export function mapBackendReadiness(
  response: BackendSchemeReadinessResponse,
  ministry: string,
): SchemeReadiness {
  const mandatoryDocs = response.checklist.filter((item) => item.is_mandatory);

  const requiredDocuments: RequiredDocumentStatus[] = mandatoryDocs.map((item, index) => ({
    id: `req-${index}`,
    name: item.document_name,
    description: item.description ?? '',
    category: inferCategory(item.document_name),
    isUploaded: item.status === 'available',
    documentId: item.matched_vault_document_id != null ? String(item.matched_vault_document_id) : undefined,
  }));

  return {
    schemeId: String(response.scheme_id),
    schemeName: response.scheme_name,
    ministry,
    requiredDocuments,
    presentCount: response.mandatory_available,
    totalCount: response.mandatory_total,
    percentage: response.readiness_percentage,
    isReady: response.is_ready_to_apply,
  };
}



export interface DirectUploadParamsResponse {
  upload_url: string;
  cloud_name: string;
  api_key: string;
  timestamp: number;
  signature: string;
  public_id: string;
  folder: string;
}

export interface BackendVaultDocument {
  id: number;
  user_id: number;
  household_member_id: number | null;
  citizen_uid: string | null;
  document_type: string;
  document_number_masked: string | null;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  is_verified: boolean;
  download_url: string | null;
}

export interface BackendReadinessItem {
  document_name: string;
  description: string | null;
  is_mandatory: boolean;
  status: 'available' | 'missing' | 'pending_verification';
  matched_vault_document_id: number | null;
  matched_vault_document_name: string | null;
}

export interface BackendSchemeReadinessResponse {
  scheme_id: number;
  scheme_slug: string;
  scheme_name: string;
  is_ready_to_apply: boolean;
  readiness_percentage: number;
  mandatory_total: number;
  mandatory_available: number;
  optional_total: number;
  optional_available: number;
  summary: string;
  checklist: BackendReadinessItem[];
}

export class VaultApiRepository {
  /**
   * DIRECT SIGNED UPLOAD (Single Upload: Mobile -> Cloudinary CDN -> Backend Confirm)
   * Eliminates double-uploading through backend server, saving RAM & bandwidth.
   */
  async uploadDocumentDirect(params: {
    uri: string;
    fileName: string;
    mimeType: string;
    documentType: string;
    documentNumberMasked?: string;
    householdMemberId?: number;
  }): Promise<Result<BackendVaultDocument, AppError>> {
    // 1. Fetch cryptographic signature from backend
    const paramsResult = await apiClient.post<DirectUploadParamsResponse>(
      '/vault/documents/direct-upload-params',
      {
        document_type: params.documentType,
        file_name: params.fileName,
        household_member_id: params.householdMemberId,
      }
    );

    if (!paramsResult.ok) {
      return paramsResult;
    }

    const sig = paramsResult.data;

    // 2. Direct upload to Cloudinary CDN using signed params
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('api_key', sig.api_key);
    cloudinaryFormData.append('timestamp', String(sig.timestamp));
    cloudinaryFormData.append('signature', sig.signature);
    cloudinaryFormData.append('public_id', sig.public_id);
    cloudinaryFormData.append('file', {
      uri: params.uri,
      name: params.fileName,
      type: params.mimeType,
    } as unknown as Blob);

    let cloudinaryRes: Response;
    try {
      cloudinaryRes = await fetch(sig.upload_url, {
        method: 'POST',
        body: cloudinaryFormData,
      });
    } catch (fetchError) {
      return err(
        new AppError('Direct upload to Cloudinary CDN failed', {
          code: 'CLOUDINARY_NETWORK_ERROR',
          cause: fetchError,
        })
      );
    }

    if (!cloudinaryRes.ok) {
      const errText = await cloudinaryRes.text();
      return err(
        new AppError(`Cloudinary CDN upload failed with status ${cloudinaryRes.status}`, {
          code: 'CLOUDINARY_HTTP_ERROR',
          statusCode: cloudinaryRes.status,
          details: { error: errText },
        })
      );
    }

    const cloudinaryData = (await cloudinaryRes.json()) as {
      secure_url: string;
      bytes: number;
      public_id: string;
    };

    // 3. Register document in citizen vault on backend
    return apiClient.post<BackendVaultDocument>('/vault/documents/direct-upload-confirm', {
      document_type: params.documentType,
      document_number_masked: params.documentNumberMasked,
      household_member_id: params.householdMemberId,
      public_id: cloudinaryData.public_id,
      secure_url: cloudinaryData.secure_url,
      file_name: params.fileName,
      file_size_bytes: cloudinaryData.bytes || 0,
      mime_type: params.mimeType,
    });
  }

  /**
   * Uploads a document to FastAPI backend, which validates and stores in Cloudinary.
   */
  async uploadDocument(params: {
    uri: string;
    fileName: string;
    mimeType: string;
    documentType: string;
    documentNumberMasked?: string;
    householdMemberId?: number;
  }): Promise<Result<BackendVaultDocument, AppError>> {
    const formData = new FormData();
    formData.append('document_type', params.documentType);
    if (params.documentNumberMasked) {
      formData.append('document_number_masked', params.documentNumberMasked);
    }
    if (params.householdMemberId) {
      formData.append('household_member_id', String(params.householdMemberId));
    }

    formData.append('file', {
      uri: params.uri,
      name: params.fileName,
      type: params.mimeType,
    } as unknown as Blob);

    return apiClient.post<BackendVaultDocument>('/vault/documents/upload', formData);
  }

  /**
   * Retrieves all documents stored in the citizen's vault.
   */
  async listDocuments(householdMemberId?: number): Promise<Result<BackendVaultDocument[], AppError>> {
    const params = householdMemberId ? { household_member_id: householdMemberId } : undefined;
    return apiClient.get<BackendVaultDocument[]>('/vault/documents', { params });
  }

  /**
   * Checks the readiness status of a citizen for a given scheme ID or slug.
   */
  async getSchemeReadiness(schemeId: string | number): Promise<Result<BackendSchemeReadinessResponse, AppError>> {
    return apiClient.get<BackendSchemeReadinessResponse>(`/vault/readiness/schemes/${schemeId}`);
  }

  /**
   * Deletes a document by ID permanently.
   */
  async deleteDocument(documentId: number): Promise<Result<void, AppError>> {
    return apiClient.delete<void>(`/vault/documents/${documentId}`);
  }
}

export const vaultApi = new VaultApiRepository();
