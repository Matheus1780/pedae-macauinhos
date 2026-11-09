import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SystemUI from 'expo-system-ui';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, type Palette } from '../ui/theme';
export type ThemePreference = 'system' | 'light' | 'dark';
const KEY = 'pedeae.appearance.v1';
type ThemeContextValue = {
  colors: Palette;
  dark: boolean;
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => Promise<void>;
};
const ThemeContext = createContext<ThemeContextValue | null>(null);
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setValue] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((value) => {
        if (alive && (value === 'light' || value === 'dark' || value === 'system')) setValue(value);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  const setPreference = useCallback(async (value: ThemePreference) => {
    await AsyncStorage.setItem(KEY, value);
    setValue(value);
  }, []);
  const dark = preference === 'dark' || (preference === 'system' && system === 'dark');
  const colors = dark ? darkColors : lightColors;
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);
  return (
    <ThemeContext.Provider value={{ colors, dark, preference, setPreference }}>
      {ready ? children : null}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('ThemeProvider ausente');
  return value;
}
