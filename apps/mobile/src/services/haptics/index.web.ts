export type HapticKind = 'light' | 'medium' | 'selection' | 'success' | 'error';

export function haptic(_kind: HapticKind): void {
  // Browsers have no equivalent to iOS impact feedback.
}
