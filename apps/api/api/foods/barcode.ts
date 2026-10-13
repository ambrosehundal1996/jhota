import { requireUser } from '../../lib/auth.js';
import { lookupBarcode } from '../../lib/foods/index.js';
import { normalizeBarcode } from '../../lib/foods/types.js';
import { errorResponse, handle, json } from '../../lib/http.js';
import { rateLimit } from '../../lib/rateLimit.js';

export const GET = handle(async request => {
  const { userId } = await requireUser(request);
  rateLimit(`barcode:${userId}`, 60, 60_000);
  const code = normalizeBarcode(new URL(request.url).searchParams.get('code') ?? '');
  if (code.length < 8 || code.length > 14) return errorResponse(400, 'invalid_barcode', 'That barcode looks incomplete.');
  const food = await lookupBarcode(code);
  if (!food) return errorResponse(404, 'not_found', 'We don’t have this product yet.');
  return json({ food });
});
