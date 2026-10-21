import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyzeMealPhoto, parseEstimate, PROTEIN_PHOTO_SYSTEM_PROMPT } from '../ai/analyzeMealPhoto.js';
import { HttpError } from '../env.js';

/** Wraps mocked model JSON the way the Responses API returns structured output. */
const respond = (json: unknown) => ({ output: [{ content: [{ type: 'output_text', text: JSON.stringify(json) }] }] });

const item = (overrides: Record<string, unknown>) => ({
  name: 'Food',
  portion_description: '',
  estimated_weight_g: null,
  protein_g: 0,
  confidence: 'high',
  uncertainty_reasons: [],
  ...overrides,
});

const estimate = (overrides: Record<string, unknown>) => ({
  is_food: true,
  items: [],
  total_protein_g: 0,
  overall_confidence: 'high',
  review_notes: [],
  needs_clarification: false,
  clarification_question: null,
  ...overrides,
});

describe('AI photo confidence', () => {
  it('clear photo of three boiled eggs is high confidence with no notes', () => {
    const result = parseEstimate(
      respond(estimate({ items: [item({ name: 'Boiled eggs', portion_description: '3 large eggs', estimated_weight_g: 150, protein_g: 19 })], total_protein_g: 19 })),
    );
    expect(result).toMatchObject({ overall_confidence: 'high', total_protein_g: 19, review_notes: [], needs_clarification: false });
    expect(result.items[0]).toMatchObject({ confidence: 'high', uncertainty_reasons: [], estimated_weight_g: 150 });
  });

  it('chicken breast with an uncertain serving is medium and explains why', () => {
    const result = parseEstimate(
      respond(
        estimate({
          items: [item({ name: 'Grilled chicken breast', protein_g: 46, confidence: 'medium', uncertainty_reasons: ['uncertain_portion'] })],
          overall_confidence: 'medium',
          review_notes: ['Chicken portion is estimated from the photo.'],
        }),
      ),
    );
    expect(result.overall_confidence).toBe('medium');
    expect(result.items[0]?.uncertainty_reasons).toEqual(['uncertain_portion']);
    expect(result.review_notes).toEqual(['Chicken portion is estimated from the photo.']);
  });

  it('chicken and rice keep their own confidence levels; the chicken drives the meal', () => {
    const result = parseEstimate(
      respond(
        estimate({
          items: [
            item({ name: 'Chicken', protein_g: 46, confidence: 'medium', uncertainty_reasons: ['uncertain_portion'] }),
            item({ name: 'White rice', protein_g: 4, confidence: 'high' }),
          ],
        }),
      ),
    );
    expect(result.items.map(i => i.confidence)).toEqual(['medium', 'high']);
    expect(result.overall_confidence).toBe('medium');
  });

  it('mixed curry with an unclear protein source is low even if the model says otherwise', () => {
    const result = parseEstimate(
      respond(
        estimate({
          items: [
            item({ name: 'Mixed curry', protein_g: 30, confidence: 'low', uncertainty_reasons: ['unclear_food_identity', 'hidden_ingredients'] }),
            item({ name: 'Rice', protein_g: 3, confidence: 'high' }),
          ],
          overall_confidence: 'medium',
          review_notes: ['Protein source in the curry is unclear.'],
        }),
      ),
    );
    expect(result.overall_confidence).toBe('low');
  });

  it('smoothie with unknown ingredients asks for clarification instead of inventing protein', () => {
    const result = parseEstimate(
      respond(
        estimate({
          items: [],
          overall_confidence: 'low',
          needs_clarification: true,
          clarification_question: 'Does this smoothie have protein powder, yogurt, or milk in it?',
          review_notes: ['Smoothie ingredients could not be determined.'],
        }),
      ),
    );
    expect(result).toMatchObject({
      is_food: true,
      items: [],
      total_protein_g: 0,
      overall_confidence: null,
      needs_clarification: true,
      clarification_question: 'Does this smoothie have protein powder, yogurt, or milk in it?',
    });
  });

  it('packaged product with a readable label is high confidence', () => {
    const result = parseEstimate(
      respond(estimate({ items: [item({ name: 'Protein bar', portion_description: '1 bar (60g), per label', estimated_weight_g: 60, protein_g: 20 })] })),
    );
    expect(result.overall_confidence).toBe('high');
    expect(result.total_protein_g).toBe(20);
  });

  it('partially obstructed meal keeps relevant reasons and drops unknown codes', () => {
    const result = parseEstimate(
      respond(
        estimate({
          items: [
            item({
              name: 'Cooked chicken',
              protein_g: 25,
              confidence: 'medium',
              uncertainty_reasons: ['hidden_ingredients', 'poor_image_quality', 'made_up_reason', 'hidden_ingredients'],
            }),
          ],
          review_notes: ['Some food is partially hidden.'],
        }),
      ),
    );
    expect(result.items[0]?.uncertainty_reasons).toEqual(['hidden_ingredients', 'poor_image_quality']);
    expect(result.overall_confidence).toBe('medium');
  });

  it('non-food image returns no items, zero protein and no confidence', () => {
    const result = parseEstimate(
      respond(estimate({ is_food: false, items: [item({ name: 'Keyboard', protein_g: 5 })], total_protein_g: 5, overall_confidence: 'high' })),
    );
    expect(result).toMatchObject({ is_food: false, items: [], total_protein_g: 0, overall_confidence: null, needs_clarification: false });
  });

  it('a low-confidence garnish does not lower a clear main protein', () => {
    const result = parseEstimate(
      respond(
        estimate({
          items: [
            item({ name: 'Grilled chicken breast', protein_g: 46, confidence: 'high' }),
            item({ name: 'Herb garnish', protein_g: 0, confidence: 'low', uncertainty_reasons: ['unclear_food_identity'] }),
          ],
        }),
      ),
    );
    expect(result.overall_confidence).toBe('high');
  });

  it('a low-confidence main protein lowers the whole meal', () => {
    const result = parseEstimate(
      respond(
        estimate({
          items: [
            item({ name: 'Chicken or paneer', protein_g: 40, confidence: 'low', uncertainty_reasons: ['unclear_food_identity'] }),
            item({ name: 'Side salad', protein_g: 3, confidence: 'high' }),
          ],
        }),
      ),
    );
    expect(result.overall_confidence).toBe('low');
  });

  it('missing or invalid confidence fields degrade gracefully instead of failing', () => {
    const result = parseEstimate(
      respond({
        is_food: true,
        items: [
          { name: 'Chicken', portion_description: '1 breast', protein_g: 40, confidence: 'very high' },
          { name: 'Rice', protein_g: 4 },
          { name: '', protein_g: 10, confidence: 'high' },
          { name: 'Bad value', protein_g: -3, confidence: 'high' },
        ],
        total_protein_g: 54,
        review_notes: 'Portions are estimated.',
      }),
    );
    expect(result.items.map(i => [i.name, i.confidence, i.uncertainty_reasons])).toEqual([
      ['Chicken', null, []],
      ['Rice', null, []],
    ]);
    // Unrated items can't support a high rating.
    expect(result.overall_confidence).toBe('medium');
    expect(result.review_notes).toEqual(['Portions are estimated.']);
    expect(result.needs_clarification).toBe(false);
  });

  it('rejects output that is not an estimate at all', () => {
    expect(() => parseEstimate(respond({ items: [] }))).toThrow(HttpError);
    expect(() => parseEstimate({ output: [{ content: [{ type: 'output_text', text: 'not json' }] }] })).toThrow(HttpError);
  });

  it('computes the total from rounded items rather than trusting the model', () => {
    const result = parseEstimate(
      respond(
        estimate({
          items: [
            item({ name: ' Chicken breast ', protein_g: 49.6 }),
            item({ name: 'Rice', protein_g: 4.2 }),
            item({ name: 'Broccoli', protein_g: 2.6 }),
          ],
          total_protein_g: 999,
        }),
      ),
    );
    expect(result.items.map(i => [i.name, i.protein_g])).toEqual([
      ['Chicken breast', 50],
      ['Rice', 4],
      ['Broccoli', 3],
    ]);
    expect(result.total_protein_g).toBe(57);
  });

  it('keeps at most two distinct review notes', () => {
    const result = parseEstimate(
      respond(
        estimate({
          items: [item({ name: 'Stew', protein_g: 20, confidence: 'low' })],
          review_notes: ['Stew ingredients are hidden.', 'stew ingredients are hidden.', 'Portion is hard to judge.', 'Third note.'],
        }),
      ),
    );
    expect(result.review_notes).toEqual(['Stew ingredients are hidden.', 'Portion is hard to judge.']);
  });

  it('clarification without a question gets a sensible default and keeps defensible items', () => {
    const result = parseEstimate(
      respond(
        estimate({
          items: [item({ name: 'White rice', protein_g: 4, confidence: 'high' })],
          needs_clarification: true,
          clarification_question: null,
        }),
      ),
    );
    expect(result.needs_clarification).toBe(true);
    expect(result.clarification_question).toMatch(/\?/);
    expect(result.items).toHaveLength(1);
  });
});

describe('analyzeMealPhoto request', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('sends user portion context and the confidence-aware prompt; a stated weight can yield high confidence', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    const fetchMock = vi.fn(async (_url: string, _init: { body: string }) => ({
      ok: true,
      json: async () =>
        respond(
          estimate({
            items: [item({ name: 'Cooked chicken breast', portion_description: '200g cooked (from your note)', estimated_weight_g: 200, protein_g: 62 })],
          }),
        ),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { estimate: result } = await analyzeMealPhoto({ imageUrl: 'https://example.com/p.jpg', userContext: "That's 200g of cooked chicken" });

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body) as {
      max_output_tokens: number;
      reasoning: { effort: string };
      input: { content: { type: string; text?: string }[] }[];
      text: { format: { strict: boolean; schema: { required: string[] } } };
    };
    expect(body.max_output_tokens).toBeGreaterThanOrEqual(2048);
    expect(body.reasoning.effort).toBe('low');
    expect(body.input[0]?.content[0]?.text).toBe(PROTEIN_PHOTO_SYSTEM_PROMPT);
    expect(PROTEIN_PHOTO_SYSTEM_PROMPT).toContain('Return the most plausible central estimate.');
    expect(PROTEIN_PHOTO_SYSTEM_PROMPT).not.toMatch(/be conservative/i);
    expect(body.input[1]?.content[0]?.text).toContain("That's 200g of cooked chicken");
    expect(body.text.format.strict).toBe(true);
    expect(body.text.format.schema.required).toContain('needs_clarification');
    expect(result.overall_confidence).toBe('high');
    expect(result.items[0]?.uncertainty_reasons).toEqual([]);
  });
});
