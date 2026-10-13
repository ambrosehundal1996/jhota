import type { ProteinRange } from '@steady/domain';
import { create } from 'zustand';

interface PendingRange {
  range: ProteinRange | null;
  isCustom: boolean;
  set: (value: { range: ProteinRange; isCustom: boolean }) => void;
}

/** The range chosen on the Range step, committed when the user taps "Start Tracking". */
export const usePendingRange = create<PendingRange>(set => ({
  range: null,
  isCustom: false,
  set: value => set(value),
}));
