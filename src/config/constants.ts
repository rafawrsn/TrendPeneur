export const CAPITAL_BANDS = [
  { key: 'lt_1', label: '< Rp1 juta', min: 0, max: 1_000_000 },
  { key: '1_5', label: 'Rp1-5 juta', min: 1_000_000, max: 5_000_000 },
  { key: '5_20', label: 'Rp5-20 juta', min: 5_000_000, max: 20_000_000 },
  { key: '20_50', label: 'Rp20-50 juta', min: 20_000_000, max: 50_000_000 },
  { key: 'gt_50', label: '> Rp50 juta', min: 50_000_000, max: Infinity },
] as const;

export type CapitalBandKey = (typeof CAPITAL_BANDS)[number]['key'];

export function getCapitalBand(key: string) {
  return CAPITAL_BANDS.find((b) => b.key === key);
}

export function getCapitalBandLabel(key: string | null | undefined): string {
  if (!key) return 'Belum diisi';
  return CAPITAL_BANDS.find((b) => b.key === key)?.label ?? 'Belum diisi';
}
