import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { DemoRepository } from './demoRepository';
import { ApiRepository } from './apiRepository';
import type { Repository } from './contracts';
const mode = process.env.EXPO_PUBLIC_DATA_MODE ?? 'demo';
if (!['demo', 'api'].includes(mode))
  throw new Error('EXPO_PUBLIC_DATA_MODE precisa ser demo ou api.');
// Web uses an HttpOnly session cookie supplied by the backend, never localStorage tokens.
const vault = {
  get: async () => (Platform.OS === 'web' ? null : SecureStore.getItemAsync('pedeae.session')),
  set: async (token: string | null) => {
    if (Platform.OS === 'web') return;
    if (token) await SecureStore.setItemAsync('pedeae.session', token);
    else await SecureStore.deleteItemAsync('pedeae.session');
  },
};
export const repository: Repository =
  mode === 'api'
    ? new ApiRepository(process.env.EXPO_PUBLIC_API_URL ?? '', vault)
    : new DemoRepository(AsyncStorage);
