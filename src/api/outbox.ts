import { useEffect, useState } from 'react';
import { api, ApiError } from './client';
import { cache } from './cache';
import { onUnmeteredNetwork, subscribeConnectivity } from './connectivity';
import { storage } from './storage';

// Things the student did with no network (a grievance) wait here on the phone and are sent, in order, as soon as the
// server can be reached again. Nothing is silently dropped: an item the server rejects is reported once and removed.
const QUEUE_KEY = 'anvay.outbox';
const SYNCED_KEY = 'anvay.lastSynced';

export type OutboxItem = {
  id: string;
  kind: 'grievance';
  title: string;
  sub: string;
  payload: Record<string, unknown>;
  createdAt: number;
};

export type FlushResult = { sent: number; rejected: string[]; remaining: number; offline: boolean; skipped?: 'wifi' };

type Listener = () => void;
const listeners = new Set<Listener>();
const flushed = new Set<(r: FlushResult) => void>();
const notify = () => listeners.forEach((fn) => fn());

async function read(): Promise<OutboxItem[]> {
  const raw = await storage.get(QUEUE_KEY);
  try {
    return raw ? (JSON.parse(raw) as OutboxItem[]) : [];
  } catch {
    return [];
  }
}

async function write(items: OutboxItem[]): Promise<boolean> {
  if (items.length === 0) {
    await storage.remove(QUEUE_KEY);
    return true;
  }
  return storage.set(QUEUE_KEY, JSON.stringify(items));
}

let flushing: Promise<FlushResult> | null = null;

export const outbox = {
  list: read,
  lastSynced: async () => {
    const raw = await storage.get(SYNCED_KEY);
    return raw ? Number(raw) : null;
  },
  markSynced: async () => {
    await storage.set(SYNCED_KEY, String(Date.now()));
    notify();
  },

  // False if the phone had no room to keep it; the caller must tell the student it was NOT saved.
  async add(item: Omit<OutboxItem, 'id' | 'createdAt'>): Promise<boolean> {
    const items = await read();
    items.push({ ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: Date.now() });
    const ok = await write(items);
    notify();
    return ok;
  },

  async clear() {
    await write([]);
    notify();
  },

  // Sends what is waiting. `force` ignores the "sync only on Wi-Fi" setting (the student pressed the button).
  flush(force = false): Promise<FlushResult> {
    flushing ??= (async (): Promise<FlushResult> => {
      try {
        const items = await read();
        if (!force && (await cache.prefs()).wifiOnly && onUnmeteredNetwork() === false) {
          return { sent: 0, rejected: [], remaining: items.length, offline: false, skipped: 'wifi' };
        }
        let sent = 0;
        const rejected: string[] = [];
        let offline = false;
        const left: OutboxItem[] = [];
        for (const it of items) {
          if (offline) {
            left.push(it);
            continue;
          }
          try {
            await api.post('/grievances', it.payload);
            sent++;
          } catch (e) {
            if (e instanceof ApiError && e.status === 0) {
              offline = true;
              left.push(it);
            } else if (e instanceof ApiError && (e.status >= 500 || e.status === 401)) {
              left.push(it); // try again later
            } else {
              rejected.push(`${it.title}: ${e instanceof Error ? e.message : 'not accepted'}`);
            }
          }
        }
        await write(left);
        if (sent > 0 || (items.length > 0 && !offline)) await outbox.markSynced();
        notify();
        const result = { sent, rejected, remaining: left.length, offline };
        if (sent || rejected.length) flushed.forEach((fn) => fn(result));
        return result;
      } finally {
        flushing = null;
      }
    })();
    return flushing;
  },

  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  onFlushed(fn: (r: FlushResult) => void) {
    flushed.add(fn);
    return () => {
      flushed.delete(fn);
    };
  },
};

// Send what is waiting whenever the connection comes back.
subscribeConnectivity((online) => {
  if (online) outbox.flush();
});

export function useOutbox() {
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const [list, synced] = await Promise.all([outbox.list(), outbox.lastSynced()]);
      if (alive) {
        setItems(list);
        setLastSynced(synced);
      }
    };
    refresh();
    const off = outbox.subscribe(refresh);
    return () => {
      alive = false;
      off();
    };
  }, []);
  return { items, lastSynced };
}
