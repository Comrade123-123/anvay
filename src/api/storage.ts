import AsyncStorage from '@react-native-async-storage/async-storage';

// Tiny key-value store for things that must survive an app restart (the sign-in token). Every call is wrapped so a
// blocked or full storage (private browsing, quota) never crashes the app; the student just has to sign in again.
export const storage = {
  async get(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};
