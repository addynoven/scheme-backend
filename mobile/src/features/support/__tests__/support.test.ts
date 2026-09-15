import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FAQ_DATA, FaqItem } from '../models/support.model';

describe('Support Module Unit Tests', () => {
  it('loads FAQ items with valid categories', () => {
    assert.ok(FAQ_DATA.length >= 6, 'Should have at least 6 FAQs');
    const eligibilityFaq = FAQ_DATA.find((f: FaqItem) => f.id === 'faq-eligibility');
    assert.ok(eligibilityFaq, 'Should contain eligibility FAQ');
    assert.strictEqual(eligibilityFaq?.category, 'schemes');
  });

  it('filters FAQs by keyword query', () => {
    const query = 'vault';
    const matches = FAQ_DATA.filter(
      (f: FaqItem) =>
        f.question.toLowerCase().includes(query) ||
        f.answer.toLowerCase().includes(query)
    );
    assert.ok(matches.length >= 1, 'Should find Vault-related FAQ');
    assert.strictEqual(matches[0].id, 'faq-upload');
  });

  it('filters FAQs by category', () => {
    const accountFaqs = FAQ_DATA.filter((f: FaqItem) => f.category === 'account');
    assert.ok(accountFaqs.length >= 2, 'Should find account FAQs');
    assert.ok(accountFaqs.every((f: FaqItem) => f.category === 'account'));
  });
});
