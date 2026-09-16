import { z } from 'zod';

export const VaultDocumentCategorySchema = z.enum([
  'identity',
  'land',
  'income',
  'bank',
  'other',
]);
export type VaultDocumentCategory = z.infer<typeof VaultDocumentCategorySchema>;

export const PRESET_DOCUMENTS_BY_CATEGORY: Record<VaultDocumentCategory, string[]> = {
  identity: ['Aadhaar Card', 'PAN Card', 'Voter ID Card', 'Passport', 'Driving License'],
  income: ['Income Certificate', 'Salary Slip', 'Form 16', 'BPL Ration Card'],
  land: ['Land Ownership Record (7/12)', 'Patta / Khasra / Khatauni', 'Kisan Credit Passbook'],
  bank: ['Bank Passbook', 'Bank Statement', 'Cancelled Cheque'],
  other: ['Caste Certificate', 'Domicile / Residence Certificate', 'Disability Certificate'],
};

export const CATEGORY_LABELS: Record<VaultDocumentCategory, { label: string; icon: string }> = {
  identity: { label: 'Identity', icon: 'id-card-o' },
  income: { label: 'Income', icon: 'file-text-o' },
  land: { label: 'Land', icon: 'map-o' },
  bank: { label: 'Bank', icon: 'bank' },
  other: { label: 'Other', icon: 'file-o' },
};

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
  fileUri: z.string().optional(),
  downloadUrl: z.string().optional(),
});
export type VaultDocument = z.infer<typeof VaultDocumentSchema>;

export interface DocumentUploadPayload {
  title: string;
  category: VaultDocumentCategory;
  method: UploadMethod;
  fileUri?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

export type UploadMethod = 'camera' | 'gallery' | 'file';

export type VaultDevScreen =
  | '1_open_vault'
  | '2_scheme_readiness'
  | '3_upload_document'
  | '5_document_saved'
  | '6_updated_readiness';
