import { apiClient } from '../../../core/api/client';
import { AppError } from '../../../core/errors/error-handler';
import { err, ok, type Result } from '../../../core/errors/result';
import { mmkvStorage } from '../../../core/storage/mmkv';
import {
  BackendChatMessageResponse,
  BackendChatSessionResponse,
  ChatMessage,
  PromptChip,
  SchemeRecommendation,
} from '../models/advisor.model';
import type { AdvisorRepository } from './advisor.repository';

export const DEFAULT_PROMPT_CHIPS: readonly PromptChip[] = [
  {
    id: 'chip-farmer',
    icon: '🌾',
    label: 'Farmer pump subsidies',
    queryText: 'I am a farmer and I want to know about schemes for drip irrigation.',
  },
  {
    id: 'chip-scholarship',
    icon: '🎓',
    label: 'College scholarships',
    queryText: 'What college scholarships are available for higher education?',
  },
  {
    id: 'chip-maternal',
    icon: '🤱',
    label: 'Maternal allowances',
    queryText: 'What maternal allowances and healthcare support schemes are available for mothers?',
  },
  {
    id: 'chip-pension',
    icon: '🧓',
    label: 'Pension for senior citizens',
    queryText: 'What monthly pension schemes are available for senior citizens?',
  },
];


const ACTIVE_SESSION_STORAGE_KEY = 'active_advisor_session_uid';

export class ApiAdvisorRepository implements AdvisorRepository {
  private activeSessionId: string | null = null;

  async getPromptChips(): Promise<Result<PromptChip[], AppError>> {
    try {
      const catRes = await apiClient.get<{ categories: Array<{ category: string; count: number }> }>(
        '/schemes/categories'
      );
      if (catRes.ok && catRes.data?.categories && catRes.data.categories.length > 0) {
        const iconMap: Record<string, string> = {
          agriculture: '🌾',
          education: '🎓',
          women: '🤱',
          child: '🤱',
          health: '🏥',
          social: '🧓',
          employment: '💼',
          business: '🏢',
        };

        const chips: PromptChip[] = catRes.data.categories.slice(0, 4).map((c) => {
          const lower = c.category.toLowerCase();
          const matchEntry = Object.entries(iconMap).find(([k]) => lower.includes(k));
          const emoji = matchEntry ? matchEntry[1] : '📋';

          return {
            id: `chip_${lower.replace(/\s+/g, '_')}`,
            label: `${c.category} schemes`,
            queryText: `What schemes are available under ${c.category}?`,
            icon: emoji,
          };
        });

        return ok(chips);
      }
    } catch {
      // ignore
    }

    return ok([...DEFAULT_PROMPT_CHIPS]);
  }

  async listSessions(): Promise<Result<BackendChatSessionResponse[], AppError>> {
    return apiClient.get<BackendChatSessionResponse[]>('/chat/sessions');
  }

  async getSession(sessionId: string): Promise<Result<BackendChatSessionResponse, AppError>> {
    return apiClient.get<BackendChatSessionResponse>(`/chat/sessions/${sessionId}`);
  }

  async createSession(title: string = 'New Welfare Consultation'): Promise<Result<BackendChatSessionResponse, AppError>> {
    const result = await apiClient.post<BackendChatSessionResponse>('/chat/sessions', {
      title,
      language_code: 'en',
    });

    if (result.ok && result.data) {
      const key = result.data.session_uid || String(result.data.id);
      this.activeSessionId = key;
      try {
        mmkvStorage.set(ACTIVE_SESSION_STORAGE_KEY, key);
      } catch {
        // ignore
      }
    }

    return result;
  }

  async deleteSession(sessionId: string): Promise<Result<void, AppError>> {
    const res = await apiClient.delete<void>(`/chat/sessions/${sessionId}`);
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
      try {
        mmkvStorage.remove(ACTIVE_SESSION_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    return res;
  }

  async getOrCreateSession(): Promise<string> {
    if (this.activeSessionId) {
      return this.activeSessionId;
    }

    try {
      const stored = mmkvStorage.getString(ACTIVE_SESSION_STORAGE_KEY);
      if (stored) {
        this.activeSessionId = stored;
        return stored;
      }
    } catch {
      // ignore
    }

    const sessionRes = await this.createSession('New Welfare Consultation');
    if (sessionRes.ok && sessionRes.data) {
      const key = sessionRes.data.session_uid || String(sessionRes.data.id);
      this.activeSessionId = key;
      return key;
    }

    // If session creation failed on backend, throw error to fail loudly
    throw new Error(sessionRes.ok ? 'Session UID missing' : sessionRes.error.message);
  }

  setActiveSessionId(sessionId: string | null): void {
    this.activeSessionId = sessionId;
    if (sessionId) {
      mmkvStorage.set(ACTIVE_SESSION_STORAGE_KEY, sessionId);
    } else {
      mmkvStorage.remove(ACTIVE_SESSION_STORAGE_KEY);
    }
  }

  async askAdvisor(
    query: string,
    sessionId?: string,
    onProgress?: (stepIndex: number) => void
  ): Promise<Result<ChatMessage, AppError>> {
    // Step 1: Understanding query
    onProgress?.(0);

    let activeId = sessionId;
    if (!activeId) {
      try {
        activeId = await this.getOrCreateSession();
      } catch (sessionErr: any) {
        return err(
          new AppError(sessionErr?.message || 'Could not establish chat session on server', {
            code: 'SESSION_CREATE_FAILED',
          })
        );
      }
    }

    // Step 2: Finding schemes & tools
    onProgress?.(1);

    const result = await apiClient.post<BackendChatMessageResponse>(
      `/chat/sessions/${activeId}/messages`,
      {
        content: query,
        language_code: 'en',
      },
      { timeoutMs: 30000 }
    );

    // Step 3: Checking eligibility
    onProgress?.(2);

    if (!result.ok) {
      // FAIL LOUDLY: Never mask backend errors with mock data!
      return result;
    }

    // Step 4: Preparing recommendations
    onProgress?.(3);

    const data = result.data;
    const recommendations: SchemeRecommendation[] = (data.sources || []).map((s) => ({
      id: s.slug,
      title: s.title,
      ministry:
        s.jurisdiction ||
        (s.state && s.state.toUpperCase() !== 'ALL_INDIA'
          ? `Government of ${s.state}`
          : 'Government of India'),
      benefitAmount: '',
      benefitDescription: s.summary || '',
      tags: [
        '✓ Verified',
        s.category || (s.state && s.state.toUpperCase() !== 'ALL_INDIA' ? s.state : 'Central Scheme'),
      ].filter(Boolean),
    }));

    const sources =
      data.citations && data.citations.length > 0
        ? data.citations
        : (data.sources || []).map((s) => s.title);

    const timeStr = new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date());

    const msg: ChatMessage = {
      id: `msg_ai_${data.id || Date.now()}`,
      sender: 'assistant',
      text: data.content,
      timestamp: timeStr,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      sources: sources.length > 0 ? sources : undefined,
    };

    return ok(msg);
  }
}

export const apiAdvisorRepository = new ApiAdvisorRepository();
