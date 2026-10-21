import { describe, expect, it } from 'vitest';
import { computeOverallConfidence } from '..';

describe('computeOverallConfidence', () => {
  it('is null with no items', () => {
    expect(computeOverallConfidence([])).toBeNull();
  });

  it('follows the item carrying most of the protein', () => {
    expect(computeOverallConfidence([{ protein_g: 46, confidence: 'medium' }, { protein_g: 3, confidence: 'high' }])).toBe('medium');
    expect(computeOverallConfidence([{ protein_g: 30, confidence: 'low' }, { protein_g: 3, confidence: 'high' }])).toBe('low');
  });

  it('ignores negligible uncertain items', () => {
    expect(computeOverallConfidence([{ protein_g: 46, confidence: 'high' }, { protein_g: 0, confidence: 'low' }])).toBe('high');
    expect(computeOverallConfidence([{ protein_g: 46, confidence: 'high' }, { protein_g: 2, confidence: 'low' }])).toBe('high');
  });

  it('adds up many small uncertain items', () => {
    const items = [
      { protein_g: 10, confidence: 'low' as const },
      { protein_g: 10, confidence: 'low' as const },
      { protein_g: 10, confidence: 'low' as const },
      { protein_g: 40, confidence: 'high' as const },
    ];
    expect(computeOverallConfidence(items)).toBe('low');
  });

  it('treats unrated items as medium', () => {
    expect(computeOverallConfidence([{ protein_g: 20, confidence: null }])).toBe('medium');
  });

  it('uses the least certain item when nothing has protein', () => {
    expect(computeOverallConfidence([{ protein_g: 0, confidence: 'high' }, { protein_g: 0, confidence: 'low' }])).toBe('low');
  });
});
