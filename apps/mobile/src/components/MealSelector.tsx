import { MEAL_TYPES, type MealType } from '@steady/domain';
import React from 'react';
import { MEAL_LABELS } from '../state/selectors';
import { SegmentedControl } from './SegmentedControl';

const OPTIONS = MEAL_TYPES.map(value => ({ value, label: MEAL_LABELS[value] }));

export function MealSelector({ value, onChange }: { value: MealType | null; onChange: (meal: MealType) => void }) {
  return <SegmentedControl options={OPTIONS} value={value} onChange={onChange} accessibilityLabel="Meal" />;
}
