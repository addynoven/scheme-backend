import { describe, it } from 'node:test';
import assert from 'node:assert';
import { optimizeCloudinaryUrl } from '../cloudinary';

describe('Cloudinary Storage Helper', () => {
  it('returns original url if not hosted on cloudinary', () => {
    const rawUrl = 'https://example.com/images/doc.png';
    assert.strictEqual(optimizeCloudinaryUrl(rawUrl), rawUrl);
  });

  it('injects f_auto, q_auto, and width transformations for images', () => {
    const originalUrl =
      'https://res.cloudinary.com/dzao8h1ay/image/upload/v1789373267/vault/user_1/test_card.png';
    const optimized = optimizeCloudinaryUrl(originalUrl, { width: 400 });

    assert.ok(optimized.includes('f_auto,q_auto,w_400'));
    assert.ok(optimized.includes('vault/user_1/test_card.png'));
    assert.strictEqual(
      optimized.startsWith('https://res.cloudinary.com/dzao8h1ay/image/upload/f_auto,q_auto,w_400/'),
      true
    );
  });

  it('supports custom dimensions and crop modes', () => {
    const originalUrl =
      'https://res.cloudinary.com/dzao8h1ay/image/upload/v1/profiles/user_99.png';
    const optimized = optimizeCloudinaryUrl(originalUrl, {
      width: 200,
      height: 200,
      crop: 'thumb',
    });

    assert.ok(optimized.includes('w_200,h_200,c_thumb'));
  });
});
