import { completeOnboarding, setOnboardingGoal, setOnboardingWeight } from '../src/features/profile/actions';
import { deleteFoodLog, quickAdd, removeDailyOverride, setDailyOverride, undoLogs } from '../src/features/logging/actions';
import { getState, initialAppData, useAppStore } from '../src/state/appStore';
import { selectDay } from '../src/state/selectors';

const DATE = '2026-10-09';
const day = () => selectDay(getState(), DATE);

beforeEach(() => {
  useAppStore.setState(initialAppData(), true);
  setOnboardingGoal('build_muscle');
  setOnboardingWeight(185, 'lb');
  completeOnboarding({ min: 130, max: 185 }, false);
});

test('logs sum into the day total', () => {
  quickAdd({ grams: 40, date: DATE });
  quickAdd({ grams: 89, date: DATE });
  expect(day().total).toMatchObject({ total: 129, source: 'logs' });
  expect(day().status.reached).toBe(false);
  quickAdd({ grams: 1, date: DATE });
  expect(day().status.reached).toBe(true);
});

test("Set Today's Total replaces the logged total and keeps the entries", () => {
  quickAdd({ grams: 60, date: DATE });
  setDailyOverride(DATE, 145);
  expect(day().total).toMatchObject({ total: 145, loggedTotal: 60, source: 'override', entryCount: 1 });
  expect(day().logs).toHaveLength(1);
  expect(day().status.reached).toBe(true);
});

test('setting the total twice updates the same override row', () => {
  setDailyOverride(DATE, 100);
  setDailyOverride(DATE, 150);
  const rows = Object.values(getState().overrides).filter(o => o.log_date === DATE);
  expect(rows).toHaveLength(1);
  expect(rows[0]!.protein_total_g).toBe(150);
});

test('removing the override returns to the calculated total', () => {
  quickAdd({ grams: 60, date: DATE });
  setDailyOverride(DATE, 145);
  removeDailyOverride(DATE);
  expect(day().total).toMatchObject({ total: 60, source: 'logs' });
  setDailyOverride(DATE, 120);
  expect(Object.values(getState().overrides).filter(o => o.log_date === DATE)).toHaveLength(1);
  expect(day().total.total).toBe(120);
});

test('delete and undo restore a log; undoing an add removes it', () => {
  const log = quickAdd({ grams: 50, date: DATE });
  if (!log) throw new Error('expected log');
  const undo = deleteFoodLog(log.id);
  expect(day().total.total).toBe(0);
  undo();
  expect(day().total.total).toBe(50);
  undoLogs([log.id]);
  expect(day().total.total).toBe(0);
});
