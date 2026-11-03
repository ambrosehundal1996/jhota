/** Copy for the photo-analysis wait. Time buckets are reassurance, not backend milestones. */
export function analysisCopy(elapsedSec: number): { headline: string; supporting: string; showCancel: boolean } {
  if (elapsedSec >= 20) {
    return {
      headline: 'Taking a little longer than usual.',
      supporting: 'Your meal is still being analyzed.',
      showCancel: true,
    };
  }
  if (elapsedSec >= 8) {
    return {
      headline: 'Finding your protein.',
      supporting: 'Still working on your meal.',
      showCancel: false,
    };
  }
  return {
    headline: 'Finding your protein.',
    supporting: 'Analyzing your meal',
    showCancel: false,
  };
}
