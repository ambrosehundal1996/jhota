import type { OutboxItem, SyncedTable } from '../types/models';
import { nowIso, uuid } from '../utils/id';
import { setState } from './appStore';
import { scheduleSync } from '../services/sync/scheduler';

/**
 * Queue a full-row upsert. Multiple writes to the same row coalesce into the latest one,
 * so the outbox stays small even with many offline edits.
 */
export function enqueueUpsert(table: SyncedTable, rowId: string, row: Record<string, unknown>): void {
  setState(state => {
    const outbox = state.outbox.filter(item => !(item.table === table && item.rowId === rowId && item.op === 'upsert'));
    const item: OutboxItem = { id: uuid(), table, op: 'upsert', rowId, row, attempts: 0, enqueuedAt: nowIso() };
    return { outbox: [...outbox, item] };
  });
  scheduleSync();
}

/** Queue a partial update for rows the client may update but not insert (e.g. AI analyses). */
export function enqueueUpdate(table: SyncedTable, rowId: string, patch: Record<string, unknown>): void {
  setState(state => {
    const existing = state.outbox.find(item => item.table === table && item.rowId === rowId && item.op === 'update');
    const merged = existing && existing.op === 'update' ? { ...existing.patch, ...patch } : patch;
    const outbox = state.outbox.filter(item => item !== existing);
    const item: OutboxItem = { id: uuid(), table, op: 'update', rowId, patch: merged, attempts: 0, enqueuedAt: nowIso() };
    return { outbox: [...outbox, item] };
  });
  scheduleSync();
}
