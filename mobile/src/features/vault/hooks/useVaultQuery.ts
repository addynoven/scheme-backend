import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vaultKeys } from '../keys';
import {
  BackendSchemeReadinessResponse,
  BackendVaultDocument,
  vaultApi,
} from '../repositories/vault.api';

/**
 * Hook to fetch all citizen documents from PostgreSQL vault.
 * Follows blueprint §5.3: TanStack Query server caching.
 */
export function useVaultDocumentsQuery(householdMemberId?: number) {
  return useQuery<BackendVaultDocument[], Error>({
    queryKey: vaultKeys.documents(),
    queryFn: async () => {
      const result = await vaultApi.listDocuments(householdMemberId);
      if (!result.ok) {
        throw result.error;
      }
      return result.data;
    },
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Hook to check scheme document readiness against citizen's uploaded documents.
 */
export function useSchemeReadinessQuery(schemeId: string | number) {
  const isValid = Boolean(schemeId) && schemeId !== '0';
  return useQuery<BackendSchemeReadinessResponse, Error>({
    queryKey: vaultKeys.readiness(schemeId),
    queryFn: async () => {
      const result = await vaultApi.getSchemeReadiness(schemeId);
      if (!result.ok) {
        throw result.error;
      }
      return result.data;
    },
    enabled: isValid,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Mutation hook for standard upload to FastAPI backend.
 */
export function useUploadDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      uri: string;
      fileName: string;
      mimeType: string;
      documentType: string;
      documentNumberMasked?: string;
      householdMemberId?: number;
    }) => {
      const result = await vaultApi.uploadDocument(params);
      if (!result.ok) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.documents() });
      queryClient.invalidateQueries({ queryKey: vaultKeys.all });
    },
  });
}

/**
 * Mutation hook for DIRECT signed upload to Cloudinary CDN (zero double-upload).
 */
export function useUploadDocumentDirectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      uri: string;
      fileName: string;
      mimeType: string;
      documentType: string;
      documentNumberMasked?: string;
      householdMemberId?: number;
    }) => {
      const result = await vaultApi.uploadDocumentDirect(params);
      if (!result.ok) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.documents() });
      queryClient.invalidateQueries({ queryKey: vaultKeys.all });
    },
  });
}

/**
 * Mutation hook for deleting document by ID.
 */
export function useDeleteDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: number) => {
      const result = await vaultApi.deleteDocument(documentId);
      if (!result.ok) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.documents() });
      queryClient.invalidateQueries({ queryKey: vaultKeys.all });
    },
  });
}
