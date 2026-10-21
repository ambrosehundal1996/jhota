import type { FoodSearchResponse } from '@jota/domain';
import { requireUser } from '../../lib/auth.js';
import { searchFoods } from '../../lib/foods/index.js';
import { errorResponse, handle, json, preflight } from '../../lib/http.js';
import { rateLimit } from '../../lib/rateLimit.js';

export const GET = handle(async request => {
  const { userId } = await requireUser(request);
  rateLimit(`search:${userId}`, 60, 60_000);
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (query.length < 2 || query.length > 80) {
    return errorResponse(400, 'invalid_query', 'Search for at least 2 characters.');
  }
  const results = await searchFoods(query);
  const body: FoodSearchResponse = { query, results };
  return json(body);
});

export const OPTIONS = preflight;
