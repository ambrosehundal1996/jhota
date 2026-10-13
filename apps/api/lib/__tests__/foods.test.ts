import { describe, expect, it } from 'vitest';
import { normalizeOffProduct } from '../foods/openFoodFacts.js';
import { normalizeUsdaDetailFood, normalizeUsdaSearchFood, rankUsdaResults } from '../foods/usda.js';

describe('USDA normalization', () => {
  it('scales branded per-100g search values to the labeled serving', () => {
    const food = normalizeUsdaSearchFood({
      fdcId: 123,
      description: 'TOTAL 0% GREEK YOGURT',
      dataType: 'Branded',
      brandOwner: 'FAGE USA DAIRY INDUSTRY INC',
      brandName: 'FAGE',
      gtinUpc: '0689544080046',
      servingSize: 170,
      servingSizeUnit: 'g',
      householdServingFullText: '1 container',
      foodNutrients: [
        { nutrientId: 1003, value: 10.6 },
        { nutrientId: 1008, value: 53 },
        { nutrientId: 1005, value: 3.5 },
        { nutrientId: 1004, value: 0 },
      ],
    });
    expect(food).toMatchObject({
      id: '123',
      provider: 'usda',
      name: 'Total 0% Greek Yogurt',
      brand: 'Fage',
      servingDescription: '1 container (170g)',
      servingGrams: 170,
      proteinG: 18,
      caloriesKcal: 90.1,
      barcode: '0689544080046',
    });
  });

  it('uses the first survey measure for generic foods', () => {
    const food = normalizeUsdaSearchFood({
      fdcId: 9,
      description: 'Eggs, whole, cooked',
      dataType: 'Survey (FNDDS)',
      foodNutrients: [{ nutrientNumber: '203', value: 12.6 }],
      foodMeasures: [
        { disseminationText: 'Quantity not specified', gramWeight: 50, rank: 1 },
        { disseminationText: '1 large', gramWeight: 50, rank: 2 },
      ],
    });
    expect(food).toMatchObject({ servingDescription: '1 large (50g)', proteinG: 6.3, name: 'Eggs, whole, cooked' });
  });

  it('falls back to 100g servings', () => {
    const food = normalizeUsdaSearchFood({
      fdcId: 1,
      description: 'Chicken breast',
      dataType: 'Foundation',
      foodNutrients: [{ nutrientId: 1003, value: 31 }],
    });
    expect(food).toMatchObject({ servingDescription: '100g', servingQuantity: 100, servingUnit: 'g', proteinG: 31 });
  });

  it('prefers branded label nutrients in details', () => {
    const food = normalizeUsdaDetailFood({
      fdcId: 5,
      description: 'Protein shake',
      dataType: 'Branded',
      servingSize: 325,
      servingSizeUnit: 'ml',
      householdServingFullText: '1 bottle',
      foodNutrients: [{ nutrient: { id: 1003 }, amount: 9.2 }],
      labelNutrients: { protein: { value: 30 }, calories: { value: 160 } },
    });
    expect(food).toMatchObject({ proteinG: 30, caloriesKcal: 160, servingDescription: '1 bottle (325ml)' });
  });

  it('drops foods with no protein data', () => {
    expect(normalizeUsdaSearchFood({ fdcId: 2, description: 'Water', dataType: 'Foundation', foodNutrients: [] })).toBeNull();
  });

  it('ranks generic exact matches above branded items', () => {
    const ranked = rankUsdaResults('greek yogurt', [
      { fdcId: 1, description: 'GREEK YOGURT VANILLA', dataType: 'Branded' },
      { fdcId: 2, description: 'Greek yogurt', dataType: 'Survey (FNDDS)' },
    ]);
    expect(ranked.map(f => f.fdcId)).toEqual([2, 1]);
  });
});

describe('Open Food Facts normalization', () => {
  it('uses per-serving values when present', () => {
    const food = normalizeOffProduct({
      code: '0041196910759',
      product_name: 'Plain Non-Fat Greek Yogurt',
      brands: 'Chobani, Chobani Inc',
      serving_size: '150 g',
      serving_quantity: 150,
      nutriments: { proteins_serving: 15, proteins_100g: 10, 'energy-kcal_serving': 80 },
    });
    expect(food).toMatchObject({ id: '0041196910759', provider: 'off', brand: 'Chobani', proteinG: 15, caloriesKcal: 80 });
  });

  it('derives serving values from per-100g data', () => {
    const food = normalizeOffProduct({
      code: '12345678',
      product_name: 'Skyr',
      serving_quantity: '150',
      serving_size: '150g',
      nutriments: { proteins_100g: 11 },
    });
    expect(food?.proteinG).toBe(16.5);
  });

  it('rejects implausible crowd-sourced values', () => {
    expect(
      normalizeOffProduct({ code: '12345678', product_name: 'Bad', serving_quantity: 10, nutriments: { proteins_serving: 40 } }),
    ).toBeNull();
    expect(normalizeOffProduct({ code: '12345678', product_name: 'Bad', nutriments: { proteins_100g: 140 } })).toBeNull();
  });
});
