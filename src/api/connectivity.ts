import { useEffect, useState } from 'react';

// Whether the phone can reach the server right now. On the web the browser tells us (online / offline events); on a
// phone, and as a double check on the web, every API call reports whether it got through. No extra library needed.
type Listener = (online: boolean) => void;

const hasWindow = typeof window !== 'undefined' && typeof window.addEventListener === 'function';
let online = hasWindow && typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
const listeners = new Set<Listener>();

export function setOnline(next: boolean) {
  if (next === online) return;
  online = next;
  listeners.forEach((fn) => fn(next));
}

export const isOnline = () => online;

export function subscribeConnectivity(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

if (hasWindow) {
  window.addEventListener('online', () => setOnline(true));
  window.addEventListener('offline', () => setOnline(false));
}

// True on Wi-Fi / wired, false on a mobile connection, null when the browser cannot say.
export function onUnmeteredNetwork(): boolean | null {
  const type = typeof navigator !== 'undefined' ? (navigator as any).connection?.type : undefined;
  if (!type) return null;
  return type !== 'cellular';
}

export function useOnline(): boolean {
  const [value, setValue] = useState(online);
  useEffect(() => {
    setValue(online);
    return subscribeConnectivity(setValue);
  }, []);
  return value;
}
