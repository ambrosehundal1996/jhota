import { describe, expect, it } from 'vitest';
import { feedbackRequestSchema } from '../feedback.js';

describe('feedbackRequestSchema', () => {
  it('accepts a short note', () => {
    expect(feedbackRequestSchema.parse({ message: '  Love the widget  ', displayName: 'Alex' })).toEqual({
      message: 'Love the widget',
      displayName: 'Alex',
    });
  });

  it('rejects empty or oversized notes', () => {
    expect(() => feedbackRequestSchema.parse({ message: '   ' })).toThrow();
    expect(() => feedbackRequestSchema.parse({ message: 'x'.repeat(1501) })).toThrow();
  });
});
