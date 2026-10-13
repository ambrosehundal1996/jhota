export interface RevenueCatEvent {
  type: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  transferred_to?: string[];
  product_id?: string;
  period_type?: string;
  store?: string;
  entitlement_ids?: string[] | null;
  expiration_at_ms?: number | null;
  event_timestamp_ms?: number;
}

export interface SubscriptionRow {
  user_id: string;
  entitlement: string;
  is_active: boolean;
  period_type: string | null;
  product_id: string | null;
  store: string | null;
  expires_at: string | null;
  will_renew: boolean | null;
  last_event_type: string;
  last_event_at: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Pick the Supabase user id among RevenueCat ids (anonymous $RCAnonymousID values are ignored). */
export function resolveUserId(event: RevenueCatEvent): string | null {
  const candidates = [
    ...(event.transferred_to ?? []),
    event.app_user_id,
    event.original_app_user_id,
    ...(event.aliases ?? []),
  ];
  return candidates.find((id): id is string => !!id && UUID.test(id)) ?? null;
}

const ACTIVATING = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE', 'TRANSFER', 'SUBSCRIPTION_EXTENDED', 'TEMPORARY_ENTITLEMENT_GRANT']);

export function eventToSubscriptionRow(event: RevenueCatEvent, now = Date.now()): SubscriptionRow | null {
  const userId = resolveUserId(event);
  if (!userId || event.type === 'TEST') return null;
  const expiresMs = event.expiration_at_ms ?? null;
  const notExpired = expiresMs === null ? ACTIVATING.has(event.type) : expiresMs > now;
  const isActive = event.type === 'EXPIRATION' ? false : notExpired;
  return {
    user_id: userId,
    entitlement: event.entitlement_ids?.[0] ?? 'pro',
    is_active: isActive,
    period_type: event.period_type ?? null,
    product_id: event.product_id ?? null,
    store: event.store ?? null,
    expires_at: expiresMs ? new Date(expiresMs).toISOString() : null,
    will_renew: event.type === 'CANCELLATION' || event.type === 'EXPIRATION' ? false : ACTIVATING.has(event.type) ? true : null,
    last_event_type: event.type,
    last_event_at: new Date(event.event_timestamp_ms ?? now).toISOString(),
  };
}
