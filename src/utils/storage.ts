import { Platform } from 'react-native';

type StorageMap = Record<string, string>;

let memoryStore: StorageMap = {};

// Lazy-load SecureStore only on native platforms
let secureStore: { getItem: (k: string) => Promise<string | null>; setItem: (k: string, v: string) => Promise<void>; deleteItem: (k: string) => Promise<void> } | null = null;

async function getSecureStore() {
  if (Platform.OS === 'web') return null;
  if (secureStore) return secureStore;
  try {
    const mod = await import('expo-secure-store');
    secureStore = {
      getItem: (k: string) => mod.getItemAsync(k),
      setItem: (k: string, v: string) => mod.setItemAsync(k, v),
      deleteItem: (k: string) => mod.deleteItemAsync(k),
    };
    return secureStore;
  } catch {
    return null;
  }
}

function getWebLocalStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }
  return null;
}

export async function storageGet(key: string): Promise<string | null> {
  const ss = await getSecureStore();
  if (ss) {
    try {
      return await ss.getItem(key);
    } catch {
      // fall through
    }
  }
  const ls = getWebLocalStorage();
  if (ls) {
    try {
      return ls.getItem(key);
    } catch {
      // fall through
    }
  }
  return memoryStore[key] ?? null;
}

export async function storageSet(key: string, value: string): Promise<void> {
  const ss = await getSecureStore();
  if (ss) {
    try {
      await ss.setItem(key, value);
      return;
    } catch {
      // fall through to web/memory
    }
  }
  const ls = getWebLocalStorage();
  if (ls) {
    try {
      ls.setItem(key, value);
    } catch {
      // fall through
    }
  }
  memoryStore[key] = value;
}

export async function storageDelete(key: string): Promise<void> {
  const ss = await getSecureStore();
  if (ss) {
    try {
      await ss.deleteItem(key);
      return;
    } catch {
      // fall through
    }
  }
  const ls = getWebLocalStorage();
  if (ls) {
    try {
      ls.removeItem(key);
    } catch {
      // fall through
    }
  }
  delete memoryStore[key];
}

export async function storageGetJSON<T>(key: string): Promise<T | null> {
  const raw = await storageGet(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function storageSetJSON<T>(key: string, value: T): Promise<void> {
  await storageSet(key, JSON.stringify(value));
}
