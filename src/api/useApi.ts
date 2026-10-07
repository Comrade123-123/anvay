import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from './client';

// Loads one GET endpoint when the screen opens. `reload` fetches again (used by the retry button).
export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<T>(path);
      if (alive.current) setData(result);
    } catch (e) {
      if (alive.current) setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  return { data, error, loading, reload: load };
}
