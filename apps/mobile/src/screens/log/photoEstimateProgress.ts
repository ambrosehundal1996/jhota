export const ESTIMATE_STEPS = [
  { id: 'save', label: 'Saving your photo' },
  { id: 'look', label: 'Looking at the meal' },
  { id: 'identify', label: 'Identifying foods' },
  { id: 'estimate', label: 'Estimating protein' },
  { id: 'check', label: 'Checking the totals' },
] as const;

/** Typical wall-clock for a successful estimate, used only for the bar and copy. */
export const ESTIMATE_EXPECTED_SECONDS = 12;

export function estimateStep(status: 'uploading' | 'analyzing', elapsedSec: number): number {
  if (status === 'uploading') return 0;
  if (elapsedSec < 2.2) return 1;
  if (elapsedSec < 5.5) return 2;
  if (elapsedSec < 9) return 3;
  return 4;
}

/** Determinate-looking bar. Approaches ~92% while we wait; never claims 100% until done. */
export function estimateBarProgress(status: 'uploading' | 'analyzing', elapsedSec: number): number {
  if (status === 'uploading') return Math.min(0.16, 0.05 + elapsedSec * 0.1);
  return 0.18 + 0.74 * (1 - Math.exp(-elapsedSec / 6));
}
