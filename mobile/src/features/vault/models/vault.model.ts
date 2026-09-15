import { z } from 'zod';

export const VaultDocumentCategorySchema = z.enum([
  'identity',
  'land',
  'income',
  'bank',
  'other',
]);
export type VaultDocumentCategory = z.infer<typeof VaultDocumentCategorySchema>;

export const VaultDocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  fileName: z.string(),
  fileSize: z.string(),
  mimeType: z.string().default('application/pdf'),
  category: VaultDocumentCategorySchema,
  uploadDate: z.string(),
  isVerified: z.boolean().default(false),
  extractedData: z.record(z.string(), z.string()).optional(),
});
export type VaultDocument = z.infer<typeof VaultDocumentSchema>;

export const RequiredDocumentStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: VaultDocumentCategorySchema,
  isUploaded: z.boolean(),
  documentId: z.string().optional(),
});
export type RequiredDocumentStatus = z.infer<typeof RequiredDocumentStatusSchema>;

export const SchemeReadinessSchema = z.object({
  schemeId: z.string(),
  schemeName: z.string(),
  ministry: z.string(),
  requiredDocuments: z.array(RequiredDocumentStatusSchema),
  presentCount: z.number(),
  totalCount: z.number(),
  percentage: z.number(),
  isReady: z.boolean(),
});
export type SchemeReadiness = z.infer<typeof SchemeReadinessSchema>;

export const ExtractedFactsSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  state: z.string().min(1, 'State is required'),
  address: z.string().min(1, 'Address is required'),
  documentNumber: z.string().optional(),
});
export type ExtractedFacts = z.infer<typeof ExtractedFactsSchema>;

export type UploadMethod = 'camera' | 'gallery' | 'file';

export type VaultDevScreen =
  | '1_open_vault'
  | '2_scheme_readiness'
  | '3_upload_document'
  | '4_extract_verify'
  | '5_document_saved'
  | '6_updated_readiness';
