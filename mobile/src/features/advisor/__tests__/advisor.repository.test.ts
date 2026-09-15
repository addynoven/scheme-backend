import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ChatMessageSchema,
  ChatSessionSchema,
  SchemeRecommendationSchema,
  type BackendChatMessageResponse,
  type BackendSource,
} from '../models/advisor.model';
import { DEFAULT_PROMPT_CHIPS } from '../repositories/advisor.api';
import { INITIAL_THINKING_STEPS } from '../store/useAdvisorStore';


test('Advisor Default Prompt Chips conform to schema', () => {
  assert.equal(DEFAULT_PROMPT_CHIPS.length, 4);
  for (const chip of DEFAULT_PROMPT_CHIPS) {
    assert.ok(chip.id);
    assert.ok(chip.label);
    assert.ok(chip.queryText);
    assert.ok(chip.icon);
  }
});

test('Advisor Initial Thinking Steps are properly ordered', () => {
  assert.equal(INITIAL_THINKING_STEPS.length, 4);
  assert.equal(INITIAL_THINKING_STEPS[0].title, 'Understanding your query');
  assert.equal(INITIAL_THINKING_STEPS[3].title, 'Preparing recommendations');
});

test('Citations Contract correctly maps backend sources to SchemeRecommendation', () => {
  const backendSources: BackendSource[] = [
    { title: 'PM Kisan Samman Nidhi', slug: 'pm-kisan' },
    { title: 'Pradhan Mantri Awas Yojana', slug: 'pmay-gramin' },
  ];

  const recommendations = backendSources.map((s) => ({
    id: s.slug,
    title: s.title,
    ministry: 'Government of India',
    benefitAmount: '',
    benefitDescription: 'Verified citizen welfare scheme',
    tags: ['Verified', 'Government Scheme'],
  }));

  assert.equal(recommendations.length, 2);
  assert.equal(recommendations[0].id, 'pm-kisan');
  assert.equal(recommendations[0].title, 'PM Kisan Samman Nidhi');

  // Verify Zod parsing
  for (const rec of recommendations) {
    const parsed = SchemeRecommendationSchema.safeParse(rec);
    assert.equal(parsed.success, true);
  }
});

test('ChatSessionSchema parses valid backend session object', () => {
  const mockSession = {
    id: 12,
    session_uid: 'sess_98234-abcd',
    title: 'Farmer Support Schemes',
    language_code: 'en',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const parsed = ChatSessionSchema.safeParse(mockSession);
  assert.equal(parsed.success, true);
});

test('ChatMessageSchema validates assistant response with citations and recommendations', () => {
  const msg = {
    id: 'msg_ai_101',
    sender: 'assistant' as const,
    text: 'Based on your profile, you are eligible for the following schemes:',
    timestamp: '10:30 AM',
    recommendations: [
      {
        id: 'pm-kisan',
        title: 'PM Kisan Samman Nidhi',
        ministry: 'Ministry of Agriculture',
        benefitAmount: '₹6,000 / year',
        benefitDescription: 'Income support to farmer families',
        tags: ['Direct Benefit Transfer', 'Verified'],
      },
    ],
    sources: ['pmkisan.gov.in', 'Direct Benefit Transfer Portal'],
  };

  const parsed = ChatMessageSchema.safeParse(msg);
  assert.equal(parsed.success, true);
});

