import { lastNDates } from './dates';
import { isGoalReached } from './goalStatus';
import type { LocalDate, ProteinRange } from './types';

export interface ProgressDay {
  date: LocalDate;
  total: number;
  reached: boolean;
  tracked: boolean;
}

export interface WeeklySummary {
  days: ProgressDay[];
  /** Average over days with any protein recorded; null when nothing was tracked. */
  average: number | null;
  goalDays: number;
  trackedDays: number;
  totalDays: number;
}

export function weeklySummary(
  totalsByDate: Readonly<Record<LocalDate, number>>,
  endDate: LocalDate,
  range: ProteinRange,
  dayCount = 7,
): WeeklySummary {
  const days = lastNDates(endDate, dayCount).map(date => {
    const total = totalsByDate[date] ?? 0;
    return { date, total, reached: isGoalReached(total, range), tracked: total > 0 };
  });
  const tracked = days.filter(d => d.tracked);
  const average = tracked.length
    ? Math.round(tracked.reduce((sum, d) => sum + d.total, 0) / tracked.length)
    : null;
  return {
    days,
    average,
    goalDays: days.filter(d => d.reached).length,
    trackedDays: tracked.length,
    totalDays: dayCount,
  };
}

export interface Insight {
  id: string;
  eyebrow: string;
  text: string;
}

/** Plain, non-judgmental summaries. Never "missed", "failed", or "bad". */
export function buildInsights(summary: WeeklySummary, range: ProteinRange): Insight[] {
  const insights: Insight[] = [];
  if (summary.average === null) {
    insights.push({
      id: 'empty',
      eyebrow: 'This week',
      text: 'Log a meal or set a daily total and your weekly summary will appear here.',
    });
    return insights;
  }
  const diff = summary.average - range.min;
  const relation =
    diff >= 0
      ? diff === 0
        ? `right at your ${range.min}g goal.`
        : `${diff}g above your ${range.min}g goal.`
      : `${Math.abs(diff)}g from your ${range.min}g goal.`;
  insights.push({
    id: 'average',
    eyebrow: 'This week',
    text: `You averaged ${summary.average}g of protein per day this week, ${relation}`,
  });
  insights.push({
    id: 'consistency',
    eyebrow: 'Consistency',
    text:
      summary.goalDays > 0
        ? `You reached your goal on ${summary.goalDays} of the last ${summary.totalDays} days.`
        : `You tracked ${summary.trackedDays} of the last ${summary.totalDays} days. Every logged day builds the habit.`,
  });
  return insights;
}
