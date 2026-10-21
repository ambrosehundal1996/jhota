import { analytics } from '../src/analytics';
import type { AiEstimate } from '@jota/domain';
import {
  acceptRoughEstimate,
  addDraftItem,
  confirmDraft,
  draftTotal,
  hasNewContext,
  isDraftEdited,
  itemConfidenceTag,
  removeDraftItem,
  rescaleDraftTotal,
  runAnalysis,
  setDraftContext,
  updateDraftItem,
} from '../src/features/ai/draft';
import { analyzeMealPhoto } from '../src/services/ai/photoAnalysis';
import { getState, initialAppData, setState, useAppStore } from '../src/state/appStore';
import type { AiDraft } from '../src/types/models';

jest.mock('../src/services/ai/photoAnalysis', () => ({ uploadMealPhoto: jest.fn(), analyzeMealPhoto: jest.fn() }));
jest.mock('../src/services/supabase/auth', () => ({ ensureSession: jest.fn() }));

const analyzeMock = analyzeMealPhoto as jest.MockedFunction<typeof analyzeMealPhoto>;

function mockEstimate(overrides: Partial<AiEstimate>, analysisId = 'a2'): void {
  analyzeMock.mockResolvedValueOnce({
    analysisId,
    model: 'test',
    estimate: {
      is_food: true,
      items: [],
      total_protein_g: 0,
      overall_confidence: null,
      review_notes: [],
      needs_clarification: false,
      clarification_question: null,
      ...overrides,
    },
  });
}

function readyDraft(): AiDraft {
  return {
    id: 'd1',
    date: '2026-10-09',
    photoUri: 'file:///tmp/photo.jpg',
    storagePath: 'u/2026-10-09/p.jpg',
    context: '',
    status: 'ready',
    error: null,
    analysisId: 'a1',
    rawItems: [
      { name: 'Grilled chicken', protein_g: 42 },
      { name: 'Rice', protein_g: 6 },
    ],
    rawTotal: 48,
    items: [
      {
        key: 'k1',
        name: 'Grilled chicken',
        portion: '6 oz',
        protein_g: 42,
        original_protein_g: 42,
        original_name: 'Grilled chicken',
        confidence: 'medium',
        uncertainty_reasons: ['uncertain_portion'],
      },
      {
        key: 'k2',
        name: 'Rice',
        portion: '1 cup',
        protein_g: 6,
        original_protein_g: 6,
        original_name: 'Rice',
        confidence: 'high',
        uncertainty_reasons: [],
      },
    ],
    overallConfidence: 'medium',
    reviewNotes: [],
    createdAt: '2026-10-09T18:00:00.000Z',
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useAppStore.setState(initialAppData(), true);
  setState({ aiDraft: readyDraft() });
});

test('nothing is logged until the estimate is confirmed', () => {
  expect(Object.keys(getState().logs)).toHaveLength(0);
});

test('editing the total rescales items and keeps the exact sum', () => {
  rescaleDraftTotal(60);
  const items = getState().aiDraft!.items;
  expect(draftTotal(items)).toBe(60);
  expect(items[0]!.protein_g).toBeCloseTo(52.5, 1);
});

test('confirming an unedited estimate logs one ai_photo entry per item', () => {
  const logs = confirmDraft();
  expect(logs.map(l => [l.food_name, l.protein_g, l.source, l.ai_was_edited])).toEqual([
    ['Grilled chicken', 42, 'ai_photo', false],
    ['Rice', 6, 'ai_photo', false],
  ]);
  expect(getState().aiDraft).toBeNull();
  const update = getState().outbox.find(i => i.table === 'ai_photo_analyses');
  expect(update).toMatchObject({ op: 'update', rowId: 'a1', patch: { status: 'confirmed', final_total_g: 48, was_edited: false } });
  expect(analytics.track).not.toHaveBeenCalledWith('ai_estimate_edited', expect.anything());
});

test('edits are recorded and tracked without sending item names', () => {
  updateDraftItem('k1', { protein_g: 35 });
  removeDraftItem('k2');
  addDraftItem();
  const added = getState().aiDraft!.items[1]!;
  updateDraftItem(added.key, { name: 'Greek yogurt', protein_g: 15 });
  confirmDraft();
  const update = getState().outbox.find(i => i.table === 'ai_photo_analyses');
  expect(update).toMatchObject({ patch: { final_total_g: 50, was_edited: true } });
  const call = (analytics.track as jest.Mock).mock.calls.find(([event]) => event === 'ai_estimate_edited');
  expect(call).toBeDefined();
  expect(JSON.stringify(call)).not.toMatch(/chicken|yogurt/i);
});

describe('confidence after user edits', () => {
  test('unedited items show the AI rating; edited items are labelled as the user’s', () => {
    const [chicken, rice] = getState().aiDraft!.items;
    expect(itemConfidenceTag(chicken!)).toBe('medium');
    expect(itemConfidenceTag(rice!)).toBe('high');
    expect(isDraftEdited(getState().aiDraft!)).toBe(false);

    updateDraftItem('k1', { protein_g: 50 });
    updateDraftItem('k2', { name: 'Brown rice' });
    addDraftItem();
    const items = getState().aiDraft!.items;
    expect(items.map(itemConfidenceTag)).toEqual(['user_adjusted', 'user_adjusted', 'user_added']);
    expect(isDraftEdited(getState().aiDraft!)).toBe(true);
  });

  test('confirming keeps the user’s value and records which items they adjusted', () => {
    updateDraftItem('k1', { protein_g: 50 });
    const logs = confirmDraft();
    expect(logs[0]).toMatchObject({ protein_g: 50, ai_original_protein_g: 42, ai_was_edited: true });
    const update = getState().outbox.find(i => i.table === 'ai_photo_analyses');
    expect(update).toMatchObject({
      patch: {
        final_items: [
          { name: 'Grilled chicken', protein_g: 50, confidence: 'medium', user_adjusted: true },
          { name: 'Rice', protein_g: 6, confidence: 'high', user_adjusted: false },
        ],
      },
    });
  });
});

describe('analysis results', () => {
  beforeEach(() => {
    setState({ aiDraft: { ...readyDraft(), status: 'picked', analysisId: null, items: [], rawItems: null } });
  });

  test('a low-confidence result is still reviewable and tracked without item names', async () => {
    mockEstimate({
      items: [
        { name: 'Mixed curry', portion_description: '1 bowl', estimated_weight_g: null, protein_g: 30, confidence: 'low', uncertainty_reasons: ['hidden_ingredients'] },
      ],
      total_protein_g: 30,
      overall_confidence: 'low',
      review_notes: ['Protein source in the curry is unclear.'],
    });
    await runAnalysis();
    const draft = getState().aiDraft!;
    expect(draft).toMatchObject({ status: 'ready', overallConfidence: 'low', reviewNotes: ['Protein source in the curry is unclear.'] });
    expect(draft.items[0]).toMatchObject({ portion: '1 bowl', confidence: 'low', uncertainty_reasons: ['hidden_ingredients'] });
    expect(analytics.track).toHaveBeenCalledWith('ai_analysis_confidence_assigned', {
      overall_confidence: 'low',
      item_count: 1,
      low_confidence_items: 1,
      needs_clarification: false,
    });
    expect(analytics.track).toHaveBeenCalledWith('ai_low_confidence_result', expect.anything());
    expect(JSON.stringify((analytics.track as jest.Mock).mock.calls)).not.toMatch(/curry/i);
  });

  test('clarification waits for new information before calling the model again', async () => {
    mockEstimate({ needs_clarification: true, clarification_question: 'Is this chicken or paneer?' }, 'a2');
    await runAnalysis();
    expect(getState().aiDraft).toMatchObject({ status: 'clarify', clarificationQuestion: 'Is this chicken or paneer?' });
    expect(analytics.track).toHaveBeenCalledWith('ai_clarification_requested', expect.objectContaining({ needs_clarification: true }));

    expect(hasNewContext(getState().aiDraft!)).toBe(false);
    await runAnalysis();
    expect(analyzeMock).toHaveBeenCalledTimes(1);

    setDraftContext('It’s paneer, about 150g');
    mockEstimate(
      {
        items: [
          { name: 'Paneer', portion_description: '150g', estimated_weight_g: 150, protein_g: 27, confidence: 'high', uncertainty_reasons: [] },
        ],
        total_protein_g: 27,
        overall_confidence: 'high',
      },
      'a3',
    );
    await runAnalysis();
    expect(analyzeMock).toHaveBeenLastCalledWith('u/2026-10-09/p.jpg', 'It’s paneer, about 150g');
    expect(getState().aiDraft).toMatchObject({ status: 'ready', analysisId: 'a3', overallConfidence: 'high' });
    expect(getState().outbox.find(i => i.table === 'ai_photo_analyses')).toMatchObject({ rowId: 'a2', patch: { status: 'discarded' } });
    expect(analytics.track).toHaveBeenCalledWith('ai_clarification_completed', { outcome: 'reanalyzed', overall_confidence: 'high' });
  });

  test('the user can keep a rough estimate from a clarification request', async () => {
    mockEstimate({
      items: [{ name: 'Rice', portion_description: '1 cup', estimated_weight_g: 160, protein_g: 4, confidence: 'high', uncertainty_reasons: [] }],
      total_protein_g: 4,
      overall_confidence: 'high',
      needs_clarification: true,
      clarification_question: 'What’s in the sauce?',
    });
    await runAnalysis();
    acceptRoughEstimate();
    expect(getState().aiDraft?.status).toBe('ready');
    expect(analytics.track).toHaveBeenCalledWith('ai_clarification_completed', { outcome: 'kept_estimate', overall_confidence: 'high' });
  });
});
