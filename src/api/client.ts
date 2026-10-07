import { Platform } from 'react-native';
import { cache } from './cache';
import { setOnline } from './connectivity';

// One place that knows where the API lives and how to talk to it. On the web build the API is served from the same
// site (/api/...). A native build needs EXPO_PUBLIC_API_URL because there is no "same site".
const BASE = Platform.OS === 'web' ? '' : (process.env.EXPO_PUBLIC_API_URL ?? '');

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setToken = (t: string | null) => {
  token = t;
};
// Called when the server says the session is no longer valid (expired or tampered token).
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

export class ApiError extends Error {
  constructor(message: string, public status: number, public details: Record<string, any> = {}) {
    super(message);
  }
  /** machine-readable reason from the server, e.g. 'SWITCH_REQUIRED' */
  get code(): string | undefined {
    return this.details.code;
  }
}

const TIMEOUT_MS = 25_000;

type Options = { fresh?: boolean };

// GET answers are saved on the phone. With no network (or a request that never answers) the last saved answer is
// returned instead, so screens still open. `fresh` skips that fallback: used to find out whether we are really online.
async function request<T>(method: string, path: string, body?: unknown, opts: Options = {}): Promise<T> {
  let res: Response;
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : null) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl?.signal,
    });
  } catch {
    setOnline(false);
    if (method === 'GET' && !opts.fresh) {
      const saved = await cache.get<T>(path);
      if (saved !== null) return saved;
    }
    throw new ApiError('No connection. Check your internet and try again.', 0);
  } finally {
    if (timer) clearTimeout(timer);
  }
  setOnline(true);
  const payload = await res.json().catch(() => null);
  if (res.status === 401 && token && onUnauthorized) onUnauthorized();
  if (!res.ok || !payload?.ok) throw new ApiError(payload?.error ?? `Something went wrong (${res.status})`, res.status, payload ?? {});
  if (method === 'GET') cache.set(path, payload.data);
  return payload.data as T;
}

export const api = {
  get: <T>(path: string, opts?: Options) => request<T>('GET', path, undefined, opts),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};
