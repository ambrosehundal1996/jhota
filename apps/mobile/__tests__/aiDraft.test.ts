import { analytics } from '../src/analytics';
import { addDraftItem, confirmDraft, draftTotal, removeDraftItem, rescaleDraftTotal, updateDraftItem } from '../src/features/ai/draft';
import { getState, initialAppData, setState, useAppStore } from '../src/state/appStore';
import type { AiDraft } from '../src/types/models';

jest.mock('../src/services/ai/photoAnalysis', () => ({ uploadMealPhoto: jest.fn(), analyzeMealPhoto: jest.fn() }));
jest.mock('../src/services/supabase/auth', () => ({ ensureSession: jest.fn() }));

function readyDraft(): AiDraft {
  return {
    id: 'd1',
    date: '2026-10-09',
    meal: 'dinner',
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
      { key: 'k1', name: 'Grilled chicken', portion: '6 oz', protein_g: 42, original_protein_g: 42 },
      { key: 'k2', name: 'Rice', portion: '1 cup', protein_g: 6, original_protein_g: 6 },
    ],
    notes: null,
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
