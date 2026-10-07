import { Platform } from 'react-native';

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
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : null) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('No connection. Check your internet and try again.', 0);
  }
  const payload = await res.json().catch(() => null);
  if (res.status === 401 && token && onUnauthorized) onUnauthorized();
  if (!res.ok || !payload?.ok) throw new ApiError(payload?.error ?? `Something went wrong (${res.status})`, res.status);
  return payload.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};
