import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'goone-storage' });

export const StorageKeys = {
  THEME: 'APP_THEME',
  LANGUAGE: 'APP_LANGUAGE',
  USER_PROFILE: 'APP_USER_PROFILE',
  CACHED_LISTINGS: 'APP_CACHED_LISTINGS',
  SYNC_QUEUE: 'APP_SYNC_QUEUE',
  USER_ROLE: 'APP_USER_ROLE',
};

// Helper to save JSON data
export const saveJSON = (key: string, value: any) => {
  storage.set(key, JSON.stringify(value));
};

// Helper to load JSON data
export const loadJSON = <T>(key: string): T | null => {
  const jsonString = storage.getString(key);
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.error(`Error parsing JSON for key ${key}`, e);
    return null;
  }
};
