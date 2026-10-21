import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { defaultNotificationPrefs, getState, LOCAL_USER_ID, setState, type AppData } from '../../state/appStore';
import type { OutboxItem, SyncedTable } from '../../types/models';
import { ensureSession } from '../supabase/auth';
import { getSupabase } from '../supabase/client';
import { registerSyncRunner, scheduleSync } from './scheduler';

type CollectionKey = 'logs' | 'overrides' | 'favorites' | 'customFoods' | 'savedMeals' | 'savedMealItems';

const COLLECTIONS: { table: SyncedTable; key: CollectionKey }[] = [
  { table: 'custom_foods', key: 'customFoods' },
  { table: 'saved_meals', key: 'savedMeals' },
  { table: 'saved_meal_items', key: 'savedMealItems' },
  { table: 'favorites', key: 'favorites' },
  { table: 'food_logs', key: 'logs' },
  { table: 'daily_overrides', key: 'overrides' },
];

/** Parents before children so foreign keys resolve. */
const PUSH_ORDER: SyncedTable[] = [
  'protein_tracker_profiles',
  'notification_preferences',
  'custom_foods',
  'saved_meals',
  'saved_meal_items',
  'favorites',
  'food_logs',
  'daily_overrides',
  'ai_photo_analyses',
];

const CONFLICT_TARGET: Partial<Record<SyncedTable, string>> = {
  protein_tracker_profiles: 'id',
  notification_preferences: 'user_id',
  daily_overrides: 'user_id,log_date',
};

const MAX_ATTEMPTS = 8;

let running = false;
let online = true;

export type SyncStatus = { lastSyncedAt: string | null; lastError: string | null };
let status: SyncStatus = { lastSyncedAt: null, lastError: null };
export const getSyncStatus = () => status;

async function pushOutbox(userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const pending = getState().outbox.filter(item => {
    if (item.op !== 'upsert') return true;
    const owner = item.row.user_id ?? item.row.id;
    return owner === userId;
  });
  if (!pending.length) return;

  const done = new Set<string>();
  const failed = new Set<string>();

  for (const table of PUSH_ORDER) {
    const upserts = pending.filter((i): i is Extract<OutboxItem, { op: 'upsert' }> => i.table === table && i.op === 'upsert');
    if (upserts.length) {
      const { error } = await supabase
        .from(table)
        .upsert(upserts.map(i => i.row), { onConflict: CONFLICT_TARGET[table] ?? 'id' });
      if (error) {
        status = { ...status, lastError: error.message };
        upserts.forEach(i => failed.add(i.id));
      } else {
        upserts.forEach(i => done.add(i.id));
      }
    }
    for (const item of pending.filter(i => i.table === table && i.op === 'update')) {
      if (item.op !== 'update') continue;
      const { error } = await supabase.from(table).update(item.patch).eq('id', item.rowId);
      (error ? failed : done).add(item.id);
    }
  }

  setState(state => ({
    outbox: state.outbox
      .filter(item => !done.has(item.id))
      .map(item => (failed.has(item.id) ? { ...item, attempts: item.attempts + 1 } : item))
      .filter(item => {
        if (item.attempts < MAX_ATTEMPTS) return true;
        console.warn('[sync] dropping write after repeated failures', item.table, item.rowId);
        return false;
      }),
  }));
}

function pendingRowIds(table: SyncedTable): Set<string> {
  return new Set(getState().outbox.filter(i => i.table === table).map(i => i.rowId));
}

async function pullChanges(userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { data: profile } = await supabase.from('protein_tracker_profiles').select('*').eq('id', userId).maybeSingle();
  if (profile && !pendingRowIds('protein_tracker_profiles').has(userId)) {
    const local = getState().profile;
    if (!local || local.updated_at <= profile.updated_at) setState({ profile: profile as AppData['profile'] });
  }

  const { data: prefs } = await supabase.from('notification_preferences').select('*').eq('user_id', userId).maybeSingle();
  if (prefs && !pendingRowIds('notification_preferences').has(userId)) {
    setState({ notificationPrefs: { ...defaultNotificationPrefs(userId), ...(prefs as AppData['notificationPrefs']) } });
  }

  for (const { table, key } of COLLECTIONS) {
    const since = getState().lastPulledAt[table] ?? '1970-01-01T00:00:00Z';
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true })
      .limit(1000);
    if (error || !data?.length) continue;
    const pending = pendingRowIds(table);
    setState(state => {
      const current = { ...(state[key] as Record<string, { id: string }>) };
      if (table === 'daily_overrides') {
        // One override per date: the server row replaces any local row for the same date.
        for (const row of data as { id: string; log_date: string }[]) {
          for (const [id, existing] of Object.entries(current as Record<string, { id: string; log_date?: string }>)) {
            if (existing.log_date === row.log_date && id !== row.id && !pending.has(id)) delete current[id];
          }
        }
      }
      for (const row of data as { id: string }[]) {
        if (!pending.has(row.id)) current[row.id] = row;
      }
      const last = (data[data.length - 1] as { updated_at: string }).updated_at;
      return { [key]: current, lastPulledAt: { ...state.lastPulledAt, [table]: last } } as Partial<AppData>;
    });
  }
}

export async function syncNow(): Promise<void> {
  if (running || !online || !getSupabase()) return;
  running = true;
  try {
    let userId = getState().userId;
    if (userId === LOCAL_USER_ID) userId = (await ensureSession()) ?? LOCAL_USER_ID;
    if (userId === LOCAL_USER_ID) return;
    await pushOutbox(userId);
    await pullChanges(userId);
    status = { lastSyncedAt: new Date().toISOString(), lastError: null };
  } catch (error) {
    status = { ...status, lastError: error instanceof Error ? error.message : String(error) };
  } finally {
    running = false;
  }
}

export function startSyncEngine(): () => void {
  registerSyncRunner(syncNow);
  const netSub = NetInfo.addEventListener(state => {
    const next = state.isConnected !== false && state.isInternetReachable !== false;
    if (next && !online) scheduleSync(0);
    online = next;
  });
  const appSub = AppState.addEventListener('change', s => s === 'active' && scheduleSync(0));
  scheduleSync(0);
  return () => {
    netSub();
    appSub.remove();
  };
}
