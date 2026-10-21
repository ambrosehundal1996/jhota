import type { GoalType } from '@jota/domain';
import type { IconName } from '../components';

export const GOAL_OPTIONS: { value: GoalType; title: string; subtitle: string; icon: IconName }[] = [
  { value: 'build_muscle', title: 'Build muscle', subtitle: 'Get stronger and add lean mass', icon: 'dumbbell' },
  { value: 'lose_fat', title: 'Lose fat', subtitle: 'Lean out while keeping muscle', icon: 'trendDown' },
  { value: 'maintain_health', title: 'Maintain muscle & health', subtitle: 'Stay strong as the years add up', icon: 'heart' },
  { value: 'eat_more_protein', title: 'Simply eat more protein', subtitle: 'No program — just more of it', icon: 'fork' },
];

export const goalTitle = (goal: GoalType | null | undefined) =>
  GOAL_OPTIONS.find(o => o.value === goal)?.title ?? 'Not set';
