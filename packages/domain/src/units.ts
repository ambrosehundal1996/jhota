import type { WeightUnit } from './types';

export const LB_PER_KG = 2.20462;

export const WEIGHT_LIMITS: Record<WeightUnit, { min: number; max: number }> = {
  lb: { min: 50, max: 700 },
  kg: { min: 23, max: 318 },
};

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function toPounds(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? value : value * LB_PER_KG;
}

export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value;
  const converted = from === 'kg' ? value * LB_PER_KG : value / LB_PER_KG;
  return roundTo(converted, 1);
}

export function isValidWeight(value: number, unit: WeightUnit): boolean {
  const limits = WEIGHT_LIMITS[unit];
  return Number.isFinite(value) && value >= limits.min && value <= limits.max;
}
