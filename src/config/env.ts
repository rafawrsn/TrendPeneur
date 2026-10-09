export const IS_MOCK =
  (process.env.EXPO_PUBLIC_USE_MOCK ?? 'true').toLowerCase() !== 'false';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const DEV_ADMIN_KEY = process.env.EXPO_PUBLIC_DEV_ADMIN_KEY ?? '';

export const IS_DEV = __DEV__;

export const APP_VERSION = '1.0.0';
