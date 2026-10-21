import type { NormalizedFood } from '@jota/domain';
import { TtlCache } from '../cache.js';
import { HttpError } from '../env.js';
import { openFoodFactsProvider } from './openFoodFacts.js';
import type { FoodProvider } from './types.js';
import { usdaProvider } from './usda.js';

const providers: Record<string, FoodProvider> = {
  usda: usdaProvider,
  off: openFoodFactsProvider,
};

/** Text search order. Add FatSecret/Nutritionix here later; the API contract does not change. */
const searchProviders: FoodProvider[] = [usdaProvider];
/** Barcode lookup order: crowd-sourced OFF first (best UPC coverage), USDA branded as fallback. */
const barcodeProviders: FoodProvider[] = [openFoodFactsProvider, usdaProvider];

// USDA and OFF data may be cached; restricted providers must opt out here.
const searchCache = new TtlCache<NormalizedFood[]>(10 * 60_000);
const detailCache = new TtlCache<NormalizedFood | null>(60 * 60_000);

export async function searchFoods(query: string, limit = 25): Promise<NormalizedFood[]> {
  const key = `${query.trim().toLowerCase()}|${limit}`;
  const cached = searchCache.get(key);
  if (cached) return cached;
  const settled = await Promise.allSettled(searchProviders.map(p => p.searchFoods(query, { limit })));
  const ok = settled.filter((s): s is PromiseFulfilledResult<NormalizedFood[]> => s.status === 'fulfilled');
  if (!ok.length) throw new HttpError(502, 'provider_unavailable', 'Food search is temporarily unavailable.');
  const results = ok.flatMap(s => s.value).slice(0, limit);
  searchCache.set(key, results);
  return results;
}

export async function getFoodDetails(provider: string, id: string): Promise<NormalizedFood | null> {
  const source = providers[provider];
  if (!source) throw new HttpError(400, 'unknown_provider', 'Unknown food provider.');
  const key = `${provider}:${id}`;
  const cached = detailCache.get(key);
  if (cached !== undefined) return cached;
  const food = await source.getFoodDetails(id);
  detailCache.set(key, food);
  return food;
}

export async function lookupBarcode(barcode: string): Promise<NormalizedFood | null> {
  const key = `barcode:${barcode}`;
  const cached = detailCache.get(key);
  if (cached !== undefined) return cached;
  for (const provider of barcodeProviders) {
    try {
      const food = await provider.lookupBarcode(barcode);
      if (food) {
        detailCache.set(key, food);
        return food;
      }
    } catch (error) {
      console.warn(`[foods] ${provider.id} barcode lookup failed`, error);
    }
  }
  detailCache.set(key, null);
  return null;
}
