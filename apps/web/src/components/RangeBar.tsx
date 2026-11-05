/**
 * Mirrors the layout in packages/domain rangeBar: the bar starts at 0g,
 * the goal zone stays visible, and a total past the max is not clipped.
 */
export function rangeLayout(total: number, min: number, max: number) {
  const span = Math.max(max - min, 1);
  const headroom = Math.max(span * 0.35, max * 0.15, 20);
  const scaleMax = Math.max(max + headroom, total, 1);
  const pct = (grams: number) => Math.min(100, (grams / scaleMax) * 100);
  return { minPct: pct(min), maxPct: pct(max), currentPct: pct(total) };
}

export function RangeBar({
  total,
  min,
  max,
  tone = "on-dark",
  labels = false,
}: {
  total: number;
  min: number;
  max: number;
  tone?: "on-dark" | "on-light";
  labels?: boolean;
}) {
  const { minPct, maxPct, currentPct } = rangeLayout(total, min, max);
  return (
    <div className={labels ? "bar-block" : undefined}>
      <div className={`bar ${tone === "on-light" ? "on-light" : ""}`} aria-hidden="true">
        <div className="bar-track" />
        <div className="bar-zone" style={{ left: `${minPct}%`, width: `${Math.max(maxPct - minPct, 1)}%` }} />
        <div className="bar-fill" style={{ width: `${currentPct}%` }} />
        <div className="bar-tick" style={{ left: `${minPct}%` }} />
        <div className="bar-tick" style={{ left: `${maxPct}%` }} />
        <div className="bar-marker" style={{ left: `${currentPct}%` }} />
      </div>
      {labels ? (
        <div className="bar-labels" aria-hidden="true">
          <span style={{ left: `${minPct}%` }}>{min}g</span>
          <span style={{ left: `${maxPct}%` }}>{max}g</span>
        </div>
      ) : null}
    </div>
  );
}
