// Price and duration are placeholders — TBD by the app owner.
export const PLAN = {
  code: 'premium_monthly',
  name: 'Premium (contoh)',
  priceIdr: 49000,
  durationDays: 30,
} as const;

export const AI_DAILY_QUOTA = 5;

export const PAYMENT_EXPIRY_HOURS = 24;

export const MAX_REUPLOADS = 3;

export const PROOF_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_PROOF_TYPES = ['jpg', 'jpeg', 'png', 'webp'] as const;

export const APP_VERSION = '1.0.0';

export const TREND_RANGES = ['1y', '3y', '5y', 'max'] as const;
export type TrendRange = (typeof TREND_RANGES)[number];

export const TREND_RANGE_LABELS: Record<TrendRange, string> = {
  '1y': '1 th',
  '3y': '3 th',
  '5y': '5 th',
  max: 'Maks',
};
