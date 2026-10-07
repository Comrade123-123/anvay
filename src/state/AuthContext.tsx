import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError, setToken, setUnauthorizedHandler } from '../api/client';
import { storage } from '../api/storage';
import { cache } from '../api/cache';
import { outbox } from '../api/outbox';
import type { SignInResult, Student } from '../api/types';

const TOKEN_KEY = 'anvay.token';

type Auth = {
  /** false until the saved session (if any) has been checked */
  ready: boolean;
  student: Student | null;
  signIn: (result: SignInResult) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Auth>({ ready: false, student: null, signIn: async () => {}, signOut: async () => {} });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children, onSignedOut }: { children: React.ReactNode; onSignedOut?: () => void }) {
  const [ready, setReady] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const signedOutCb = useRef(onSignedOut);
  signedOutCb.current = onSignedOut;

  const signOut = useCallback(async () => {
    setToken(null);
    setStudent(null);
    await storage.remove(TOKEN_KEY);
    // nothing saved for this student stays on the phone after they sign out
    await cache.clear();
    await outbox.clear();
  }, []);

  // Restore the saved session once, on app start.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await storage.get(TOKEN_KEY);
      if (saved) {
        setToken(saved);
        try {
          const me = await api.get<Student>('/me');
          if (!cancelled) setStudent(me);
        } catch (e) {
          // Only a rejected session ends the sign-in; being offline on start must not log the student out.
          if (e instanceof ApiError && e.status === 401) await signOut();
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [signOut]);

  // An expired or invalid token anywhere in the app signs the student out and returns to the welcome screen.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut().then(() => signedOutCb.current?.());
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const signIn = useCallback(async ({ token, student: s }: SignInResult) => {
    setToken(token);
    setStudent(s);
    await storage.set(TOKEN_KEY, token);
  }, []);

  const value = useMemo(() => ({ ready, student, signIn, signOut }), [ready, student, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
