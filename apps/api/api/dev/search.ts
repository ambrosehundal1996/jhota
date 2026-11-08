import { searchFoods } from '../../lib/foods/index.js';
import { errorResponse, handle, json } from '../../lib/http.js';
import { requirePlayground } from '../../lib/playground.js';
import { rateLimit } from '../../lib/rateLimit.js';

export const GET = handle(async request => {
  requirePlayground(request);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  rateLimit(`playground-search:${ip}`, 30, 60_000);
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (query.length < 2 || query.length > 80) {
    return errorResponse(400, 'invalid_query', 'Search for at least 2 characters.');
  }
  const results = await searchFoods(query, 10);
  return json({ query, source: 'usda', results });
});
