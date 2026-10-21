import { requireUser } from '../../lib/auth.js';
import { getFoodDetails } from '../../lib/foods/index.js';
import { errorResponse, handle, json, preflight } from '../../lib/http.js';
import { rateLimit } from '../../lib/rateLimit.js';

export const GET = handle(async request => {
  const { userId } = await requireUser(request);
  rateLimit(`details:${userId}`, 120, 60_000);
  const params = new URL(request.url).searchParams;
  const provider = params.get('provider') ?? '';
  const id = params.get('id') ?? '';
  if (!provider || !id || id.length > 40) return errorResponse(400, 'invalid_request', 'Missing food id.');
  const food = await getFoodDetails(provider, id);
  if (!food) return errorResponse(404, 'not_found', 'We could not find that food.');
  return json({ food });
});

export const OPTIONS = preflight;
