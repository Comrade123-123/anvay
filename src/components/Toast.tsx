import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily } from '../theme/typography';
import { useResponsive } from '../theme/responsive';

// App-wide "demo" toast: buttons that have no real destination in this frontend-only build call `useToast()(message)`
// so a tap always gives visible feedback. No state leaks into screens; the provider sits once in App.tsx.
type Show = (message: string) => void;
const ToastContext = createContext<Show>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<Show>((m) => {
    setMessage(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(''), 2400);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {!!message && (
        <View pointerEvents="none" style={[styles.wrap, { bottom: r.s(88) + Math.max(insets.bottom, 0) }]}>
          <View style={[styles.toast, { maxWidth: r.maxContentWidth - 32, paddingHorizontal: r.s(14), paddingVertical: r.s(10), borderRadius: r.s(10) }]}>
            <Text style={[styles.text, { fontSize: r.fs(12) }]}>{message}</Text>
          </View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 16, zIndex: 999 },
  toast: { backgroundColor: '#1F2836' },
  text: { fontFamily: fontFamily.medium, color: '#fff', textAlign: 'center' },
});
