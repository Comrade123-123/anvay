import AsyncStorage from '@react-native-async-storage/async-storage';

// Tiny key-value store for things that must survive an app restart (the sign-in token, saved screens, the outbox).
// Every call is wrapped so a blocked or full storage (private browsing, quota) never crashes the app.
export const storage = {
  async get(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  // Returns false when the value could not be stored (storage full or blocked), so callers can tell the student.
  async set(key: string, value: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
  async keys(prefix: string): Promise<string[]> {
    try {
      return (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(prefix));
    } catch {
      return [];
    }
  },
};
