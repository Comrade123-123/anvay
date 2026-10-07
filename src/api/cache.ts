import { storage } from './storage';

// Keeps the last good answer of every screen's data, so the app still shows something with no network.
// Switching "Save documents on phone" off in Offline & sync stops saving and clears what was saved.
const PREFIX = 'anvay.cache:';
const PREF_KEY = 'anvay.pref';

type Prefs = { wifiOnly: boolean; saveOffline: boolean };
let prefs: Prefs = { wifiOnly: false, saveOffline: true };
let loaded: Promise<void> | null = null;

const load = () =>
  (loaded ??= storage.get(PREF_KEY).then((raw) => {
    try {
      if (raw) prefs = { ...prefs, ...JSON.parse(raw) };
    } catch {}
  }));

export const cache = {
  async prefs(): Promise<Prefs> {
    await load();
    return prefs;
  },
  async setPrefs(next: Partial<Prefs>) {
    await load();
    prefs = { ...prefs, ...next };
    await storage.set(PREF_KEY, JSON.stringify(prefs));
    if (next.saveOffline === false) await cache.clear();
  },
  async get<T>(path: string): Promise<T | null> {
    await load();
    if (!prefs.saveOffline) return null;
    const raw = await storage.get(PREFIX + path);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async set(path: string, data: unknown) {
    await load();
    if (prefs.saveOffline) await storage.set(PREFIX + path, JSON.stringify(data));
  },
  async count(): Promise<number> {
    return (await storage.keys(PREFIX)).length;
  },
  async clear() {
    for (const k of await storage.keys(PREFIX)) await storage.remove(k);
  },
};
