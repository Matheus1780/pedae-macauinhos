import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { repository } from '../data';
import type { Snapshot, Command, Quote, Vehicle, CheckoutInput, Order } from '../domain/types';
import { feedback } from '../ui/feedback';
import { useTheme } from './ThemeProvider';
type Context = {
  data: Snapshot | null;
  loading: boolean;
  error: string | null;
  busy: boolean;
  demo: boolean;
  refresh: () => Promise<void>;
  send: (c: Command) => Promise<Snapshot>;
  notify: (text: string, error?: boolean) => void;
  quote: (address: string, vehicle: Vehicle) => Promise<Quote>;
  checkout: (input: CheckoutInput) => Promise<Order>;
  acceptSnapshot: (s: Snapshot) => void;
};
const AppContext = createContext<Context | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const [data, setData] = useState<Snapshot | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [pending, setPending] = useState(0),
    [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((text: string, error = false) => {
    setToast({ text, error });
    feedback(error ? 'error' : 'success');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 4500);
  }, []);
  const refresh = useCallback(async () => {
    setError(null);
    try {
      setData(await repository.load());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [refresh]);
  async function send(c: Command) {
    setPending((n) => n + 1);
    try {
      const next = await repository.dispatch(c);
      setData(next);
      return next;
    } finally {
      setPending((n) => n - 1);
    }
  }
  async function checkout(input: CheckoutInput) {
    setPending((n) => n + 1);
    try {
      const result = await repository.checkout(input);
      setData(result.snapshot);
      return result.order;
    } finally {
      setPending((n) => n - 1);
    }
  }
  return (
    <AppContext.Provider
      value={{
        data,
        loading,
        error,
        busy: pending > 0,
        demo: repository.mode === 'demo',
        refresh,
        send,
        notify,
        quote: (id, v) => repository.quote(id, v),
        checkout,
        acceptSnapshot: setData,
      }}
    >
      {children}
      {toast && (
        <Pressable
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          onPress={() => setToast(null)}
          style={[styles.toast, { backgroundColor: toast.error ? colors.errorSoft : colors.ink }]}
        >
          <Text style={[styles.message, { color: toast.error ? colors.error : colors.surface }]}>
            {toast.text}
          </Text>
        </Pressable>
      )}
    </AppContext.Provider>
  );
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('AppProvider ausente');
  return value;
}
const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 96,
    left: 20,
    right: 20,
    maxWidth: 680,
    alignSelf: 'center',
    padding: 16,
    borderRadius: 16,
    zIndex: 100,
  },
  message: { color: 'white', fontSize: 15, lineHeight: 22 },
});
