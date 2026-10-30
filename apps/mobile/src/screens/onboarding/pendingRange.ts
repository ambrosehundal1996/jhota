import type { ProteinRange } from '@jota/domain';
import { create } from 'zustand';

interface PendingRange {
  range: ProteinRange | null;
  isCustom: boolean;
  set: (value: { range: ProteinRange; isCustom: boolean }) => void;
}

/** The range chosen on the Range step, committed when onboarding finishes. */
export const usePendingRange = create<PendingRange>(set => ({
  range: null,
  isCustom: false,
  set: value => set(value),
}));
