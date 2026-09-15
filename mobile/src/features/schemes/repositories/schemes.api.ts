import { apiClient } from '../../../core/api/client';
import { AppError } from '../../../core/errors/error-handler';
import { err, ok, type Result } from '../../../core/errors/result';
import { mmkvStorage } from '../../../core/storage/mmkv';
import {
  BenefitType,
  PaginatedSchemes,
  SchemeCategory,
  SchemeFilter,
  SchemeItem,
} from '../models/schemes.model';


export interface BackendBenefit {
  id: number;
  scheme_id: number;
  title: string;
  description: string;
}

export interface BackendEligibilityRule {
  id: number;
  scheme_id: number;
  field_name: string;
  operator: string;
  rule_value: string;
}

export interface BackendRequiredDoc {
  id: number;
  scheme_id: number;
  document_name: string;
  is_mandatory: boolean;
  description: string | null;
}

export interface BackendOfficialSource {
  id: number;
  scheme_id: number;
  title: string;
  url: string;
  source_type: string;
}

export interface BackendSchemeDetail {
  id: number;
  name: string;
  slug: string;
  state: string;
  category: string;
  tags: string | null;
  ministry: string;
  description: string;
  status: string;
  application_url: string | null;
  official_website: string | null;
  launch_date: string | null;
  benefits?: BackendBenefit[];
  eligibility_rules?: BackendEligibilityRule[];
  required_documents?: BackendRequiredDoc[];
  official_sources?: BackendOfficialSource[];
}

export interface BackendPaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface BackendCategoriesResponse {
  categories: Array<{
    category: string;
    count: number;
  }>;
}

const CACHE_KEY_SCHEMES = 'cached_schemes_list';
const CACHE_KEY_CATEGORIES = 'cached_categories_list';
const CACHE_KEY_SCHEME_DETAIL_PREFIX = 'cached_scheme_detail_';

function normalizeCategory(rawCategory: string): SchemeCategory {
  if (!rawCategory) return 'General';
  return rawCategory.trim();
}

function normalizeBenefitType(raw: BackendSchemeDetail): BenefitType {
  const texts = [
    raw.name || '',
    raw.category || '',
    raw.tags || '',
    raw.description || '',
    ...(raw.benefits || []).map((b) => `${b.title} ${b.description}`),
  ];
  const combined = texts.join(' ').toLowerCase();

  // Explicit pension, stipend, direct cash benefit, or savings deposit -> cash_grant
  if (
    /\b(pension|allowance|scholarship|stipend|savings deposit|fixed deposit|dbt)\b/.test(combined) &&
    !/\b(business loan|micro-credit|mudra|collateral-free|loan)\b/.test(combined)
  ) {
    return 'cash_grant';
  }

  // Loans: check for loan, credit, mudra, collateral-free
  if (
    /\b(loan|loans|micro-credit|mudra|collateral-free|lending|overdraft|credit guarantee)\b/.test(combined)
  ) {
    return 'loan';
  }

  // Subsidies: check for subsidy, subsidized, concession
  if (/\b(subsidy|subsidized|rebate|concession)\b/.test(combined)) {
    return 'subsidy';
  }

  return 'cash_grant';
}

function extractBenefitAmount(benefits?: BackendBenefit[]): string | undefined {
  if (!benefits || benefits.length === 0) return undefined;
  for (const b of benefits) {
    const combined = `${b.title} ${b.description}`;
    const match = combined.match(/(?:₹\s*|\bRs\.?\s*)(\d[\d,.]*)\s*(lakhs?|crores?|cr|thousand|k)?(?:\s*(?:\/|per)\s*(year|yr|month|installment|annum))?/i);
    if (match && match[1]) {
      const num = match[1].replace(/[.,]$/, '').trim();
      if (!num) continue;
      const unit = match[2] ? ` ${match[2].trim()}` : '';
      const freq = match[3] ? ` / ${match[3].trim()}` : '';
      return `₹${num}${unit}${freq}`;
    }
  }
  return undefined;
}

export function mapBackendSchemeToItem(raw: BackendSchemeDetail, isBookmarked = false): SchemeItem {
  const firstBenefit = raw.benefits?.[0];
  const summary = firstBenefit ? firstBenefit.description : raw.description;
  const benefitAmount = extractBenefitAmount(raw.benefits);

  const tags: string[] = raw.tags
    ? raw.tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
    : [raw.category];

  return {
    id: raw.slug || String(raw.id),
    title: raw.name,
    ministry: raw.ministry,
    benefitAmount,
    benefitSummary: summary,
    jurisdiction: raw.state === 'ALL_INDIA' ? 'All India' : raw.state,
    category: normalizeCategory(raw.category),
    benefitType: normalizeBenefitType(raw),
    tags,
    description: raw.description,
    launchDate: raw.launch_date || undefined,
    officialUrl: raw.official_website || raw.application_url || undefined,
    isBookmarked,
    rawBenefits: raw.benefits?.map((b) => ({ title: b.title, description: b.description })),
    eligibilityRules: raw.eligibility_rules?.map((r) => ({
      field_name: r.field_name,
      operator: r.operator,
      rule_value: r.rule_value,
    })),
    requiredDocuments: raw.required_documents?.map((d) => ({
      document_name: d.document_name,
      is_mandatory: d.is_mandatory,
      description: d.description,
    })),
    officialSources: raw.official_sources?.map((s) => ({
      title: s.title,
      url: s.url,
      source_type: s.source_type,
    })),
  };
}

export class SchemesApiRepository {
  /**
   * Fetches schemes with pagination and total count from FastAPI backend.
   */
  async getSchemesPaginated(
    filter?: Partial<SchemeFilter>,
    skip: number = 0,
    limit: number = 50
  ): Promise<Result<PaginatedSchemes, AppError>> {
    const params: Record<string, string | number | boolean | undefined> = {
      skip,
      limit: Math.min(Math.max(limit, 1), 100),
    };

    if (filter?.query && filter.query.trim().length > 0) {
      params.search = filter.query.trim();
    }
    if (filter?.category && filter.category !== 'all') {
      params.category = filter.category;
    }
    if (filter?.jurisdiction && filter.jurisdiction !== 'All India') {
      if (filter.jurisdiction === 'Central' || filter.jurisdiction === 'Central Only') {
        params.state = 'Central';
      } else {
        params.state = filter.jurisdiction;
      }
    }
    if (filter?.benefitType && filter.benefitType !== 'all') {
      params.benefit_type = filter.benefitType;
    }

    const result = await apiClient.get<BackendPaginatedResponse<BackendSchemeDetail>>('/schemes', {
      params,
    });

    if (result.ok) {
      const items = result.data.items.map((raw) => mapBackendSchemeToItem(raw));
      const total = result.data.total ?? items.length;
      return ok({
        items,
        total,
        skip,
        limit,
        hasMore: skip + items.length < total,
      });
    }

    // Offline / Network Error fallback to MMKV or static mock
    try {
      const cached = mmkvStorage.getString(CACHE_KEY_SCHEMES);
      if (cached) {
        const parsed = JSON.parse(cached) as SchemeItem[];
        const localFiltered = parsed.filter((s) => {
          if (!filter?.query) return true;
          return (
            s.title.toLowerCase().includes(filter.query.toLowerCase()) ||
            s.ministry.toLowerCase().includes(filter.query.toLowerCase())
          );
        });
        return ok({
          items: localFiltered.slice(skip, skip + limit),
          total: localFiltered.length,
          skip,
          limit,
          hasMore: skip + limit < localFiltered.length,
        });
      }
    } catch {
      // ignore
    }

    return ok({
      items: [],
      total: 0,
      skip,
      limit,
      hasMore: false,
    });
  }

  /**
   * Fetches schemes from FastAPI backend with automatic MMKV offline caching.
   */
  async getSchemes(filter?: Partial<SchemeFilter>): Promise<Result<SchemeItem[], AppError>> {
    const res = await this.getSchemesPaginated(filter, 0, 100);
    if (res.ok) {
      try {
        mmkvStorage.set(CACHE_KEY_SCHEMES, JSON.stringify(res.data.items));
      } catch {
        // ignore
      }
      return ok(res.data.items);
    }
    return ok([]);
  }

  /**
   * Fetches single scheme detail by slug or ID.
   * Caches the result in MMKV so the detail screen loads instantly on
   * repeat visits and works offline (shows stale data with a banner).
   */
  async getSchemeById(idOrSlug: string): Promise<Result<SchemeItem, AppError>> {
    const cacheKey = `${CACHE_KEY_SCHEME_DETAIL_PREFIX}${idOrSlug}`;

    // ── Network fetch ──────────────────────────────────────────────────────
    const endpoint = isNaN(Number(idOrSlug)) ? `/schemes/slug/${idOrSlug}` : `/schemes/${idOrSlug}`;
    const result = await apiClient.get<BackendSchemeDetail>(endpoint);

    if (result.ok) {
      const item = mapBackendSchemeToItem(result.data);
      // Persist to MMKV for offline / repeat access
      try {
        mmkvStorage.set(cacheKey, JSON.stringify(item));
      } catch {
        // ignore storage errors
      }
      return ok(item);
    }

    // ── Offline fallback: return stale MMKV data if available ──────────────
    try {
      const cached = mmkvStorage.getString(cacheKey);
      if (cached) {
        return ok(JSON.parse(cached) as SchemeItem);
      }
    } catch {
      // ignore
    }

    return result as Result<SchemeItem, AppError>;
  }


  /**
   * Fetches scheme categories with real scheme counts from backend.
   */
  async getCategories(): Promise<Result<BackendCategoriesResponse['categories'], AppError>> {
    const result = await apiClient.get<BackendCategoriesResponse>('/schemes/categories');
    if (result.ok) {
      try {
        mmkvStorage.set(CACHE_KEY_CATEGORIES, JSON.stringify(result.data.categories));
      } catch {
        // ignore
      }
      return ok(result.data.categories);
    }

    try {
      const cached = mmkvStorage.getString(CACHE_KEY_CATEGORIES);
      if (cached) {
        return ok(JSON.parse(cached));
      }
    } catch {
      // ignore
    }

    return result as Result<BackendCategoriesResponse['categories'], AppError>;
  }
}

export const schemesApi = new SchemesApiRepository();
