import { describe, expect, it } from 'vitest';
import { extractOutputText, finalizeEstimate } from '../ai/analyzeMealPhoto.js';
import { eventToSubscriptionRow, resolveUserId } from '../revenuecat.js';

const USER = '6f1c1c9e-2b7a-4b0e-9a64-1f6f3f1e2a10';

describe('AI estimate post-processing', () => {
  it('rounds items and recomputes the total from them', () => {
    const result = finalizeEstimate({
      is_food: true,
      items: [
        { name: ' Chicken breast ', portion: '6 oz', protein_g: 49.6, confidence: 'medium' },
        { name: 'Rice', portion: '1 cup', protein_g: 4.2, confidence: 'high' },
        { name: 'Broccoli', portion: '1 cup', protein_g: 2.6, confidence: 'high' },
      ],
      total_protein_g: 60,
      notes: '',
    });
    expect(result.items.map(i => [i.name, i.protein_g])).toEqual([
      ['Chicken breast', 50],
      ['Rice', 4],
      ['Broccoli', 3],
    ]);
    expect(result.total_protein_g).toBe(57);
  });

  it('extracts structured output text and surfaces refusals', () => {
    expect(extractOutputText({ output: [{ content: [{ type: 'output_text', text: '{"a":1}' }] }] })).toBe('{"a":1}');
    expect(() => extractOutputText({ output: [{ content: [{ type: 'refusal', refusal: 'no' }] }] })).toThrow();
  });
});

describe('RevenueCat webhook mapping', () => {
  const now = Date.UTC(2026, 9, 9);

  it('ignores anonymous RevenueCat ids and finds the Supabase user', () => {
    expect(resolveUserId({ type: 'X', app_user_id: '$RCAnonymousID:abc', aliases: [USER] })).toBe(USER);
  });

  it('trial start is active', () => {
    const row = eventToSubscriptionRow(
      { type: 'INITIAL_PURCHASE', app_user_id: USER, period_type: 'TRIAL', expiration_at_ms: now + 7 * 86400000 },
      now,
    );
    expect(row).toMatchObject({ is_active: true, period_type: 'TRIAL', will_renew: true });
  });

  it('cancellation stays active until expiry; expiration deactivates', () => {
    expect(
      eventToSubscriptionRow({ type: 'CANCELLATION', app_user_id: USER, expiration_at_ms: now + 1000 }, now),
    ).toMatchObject({ is_active: true, will_renew: false });
    expect(
      eventToSubscriptionRow({ type: 'EXPIRATION', app_user_id: USER, expiration_at_ms: now - 1000 }, now),
    ).toMatchObject({ is_active: false });
  });

  it('skips test events', () => {
    expect(eventToSubscriptionRow({ type: 'TEST', app_user_id: USER }, now)).toBeNull();
  });
});
