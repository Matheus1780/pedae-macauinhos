import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '../src/state/AppProvider';
import { LoadGate } from '../src/ui/components';
import { ThemeProvider, useTheme } from '../src/state/ThemeProvider';
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
function AppContent() {
  const { dark, colors } = useTheme();
  return (
    <AppProvider>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <LoadGate>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </LoadGate>
    </AppProvider>
  );
}
