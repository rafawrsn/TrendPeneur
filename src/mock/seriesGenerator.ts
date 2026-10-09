import type { TrendPoint, TrendSummary } from '../api/types';

// Deterministic PRNG seeded by string
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Archetype =
  | 'steady_growth'
  | 'emerging'
  | 'viral_decline'
  | 'seasonal'
  | 'stable'
  | 'declining';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Generate monthly trend points for the last `months` months ending at current month.
 * Values on 0-100 scale.
 */
export function generateSeries(slug: string, archetype: Archetype, months = 120): TrendPoint[] {
  const seed = hashString(slug);
  const rng = mulberry32(seed);
  const now = new Date();
  const points: TrendPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    const t = (months - 1 - i) / (months - 1); // 0 to 1
    const noise = (rng() - 0.5) * 8;
    const seasonalAmp = 6;
    const seasonal = Math.sin((d.getMonth() / 12) * Math.PI * 2) * seasonalAmp;

    let value = 50;

    switch (archetype) {
      case 'steady_growth':
        value = 30 + t * 40 + seasonal * 0.5 + noise;
        break;
      case 'emerging':
        // Low for years, accelerating in last 2-3 years
        value = 15 + Math.pow(t, 3) * 60 + noise;
        break;
      case 'viral_decline': {
        // Sharp spike then decline
        const spikeStart = 0.6;
        const spikePeak = 0.72;
        if (t < spikeStart) {
          value = 20 + t * 15 + noise;
        } else if (t < spikePeak) {
          const spikeT = (t - spikeStart) / (spikePeak - spikeStart);
          value = 35 + spikeT * 55 + noise;
        } else {
          const declineT = (t - spikePeak) / (1 - spikePeak);
          value = 90 - declineT * 50 + noise;
        }
        break;
      }
      case 'seasonal':
        value = 45 + seasonal + noise;
        break;
      case 'stable':
        value = 50 + noise * 0.7;
        break;
      case 'declining':
        value = 70 - t * 35 + noise;
        break;
    }

    points.push({ period, value: clamp(Math.round(value), 2, 98) });
  }

  return points;
}

export function computeSummary(points: TrendPoint[]): TrendSummary {
  const n = points.length;
  const last6 = points.slice(-6);
  const prev6 = points.slice(-12, -6);
  const avgLast = last6.reduce((s, p) => s + p.value, 0) / last6.length;
  const avgPrev = prev6.length > 0 ? prev6.reduce((s, p) => s + p.value, 0) / prev6.length : avgLast;

  const diff = avgLast - avgPrev;
  let direction: 'naik' | 'stabil' | 'turun' = 'stabil';
  if (diff > 3) direction = 'naik';
  else if (diff < -3) direction = 'turun';

  let peak = points[0];
  let low = points[0];
  for (const p of points) {
    if (p.value > peak.value) peak = p;
    if (p.value < low.value) low = p;
  }

  // Detect seasonality: check if there's a strong yearly pattern
  const years = Math.floor(n / 12);
  let seasonal = false;
  if (years >= 2) {
    const monthAvgs: number[] = [];
    for (let m = 0; m < 12; m++) {
      const vals: number[] = [];
      for (let y = 0; y < years; y++) {
        const idx = y * 12 + m;
        if (idx < n) vals.push(points[idx].value);
      }
      if (vals.length > 0) monthAvgs.push(vals.reduce((s, v) => s + v, 0) / vals.length);
    }
    const overallAvg = monthAvgs.reduce((s, v) => s + v, 0) / monthAvgs.length;
    const variance = monthAvgs.reduce((s, v) => s + (v - overallAvg) ** 2, 0) / monthAvgs.length;
    seasonal = Math.sqrt(variance) > 5;
  }

  return { direction, peak: { period: peak.period, value: peak.value }, low: { period: low.period, value: low.value }, seasonal };
}

export function sliceByRange(points: TrendPoint[], range: string): TrendPoint[] {
  switch (range) {
    case '1y': return points.slice(-12);
    case '3y': return points.slice(-36);
    case '5y': return points.slice(-60);
    case 'max': return points;
    default: return points;
  }
}

export function computeMomentum(points: TrendPoint[]): number {
  const last6 = points.slice(-6);
  const prev6 = points.slice(-12, -6);
  const avgLast = last6.reduce((s, p) => s + p.value, 0) / last6.length;
  const avgPrev = prev6.length > 0 ? prev6.reduce((s, p) => s + p.value, 0) / prev6.length : avgLast;
  return Math.round((avgLast - avgPrev) * 10) / 10;
}

export function computeSparkline(points: TrendPoint[], count = 12): number[] {
  const slice = points.slice(-count);
  return slice.map((p) => p.value);
}

// Compute analysis signals from the full series
export interface TrendSignals {
  cagr: number; // compound annual growth rate (approx)
  momentum: number;
  volatility: number;
  peakRatio: number; // peak relative to average
  seasonality: boolean;
  viralSpikeIndex: number; // 0-1, how much of a viral spike there was
}

export function computeSignals(points: TrendPoint[]): TrendSignals {
  const values = points.map((p) => p.value);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const peak = Math.max(...values);
  const low = Math.min(...values);

  // CAGR approx: (end/start)^(1/years) - 1
  const startVal = values[0];
  const endVal = values[values.length - 1];
  const years = values.length / 12;
  const cagr = startVal > 0 ? (Math.pow(endVal / startVal, 1 / years) - 1) * 100 : 0;

  // Momentum
  const last6 = values.slice(-6);
  const prev6 = values.slice(-12, -6);
  const avgLast = last6.reduce((s, v) => s + v, 0) / last6.length;
  const avgPrev = prev6.length > 0 ? prev6.reduce((s, v) => s + v, 0) / prev6.length : avgLast;
  const momentum = avgLast - avgPrev;

  // Volatility: std dev of monthly changes
  const changes: number[] = [];
  for (let i = 1; i < values.length; i++) changes.push(values[i] - values[i - 1]);
  const changeAvg = changes.reduce((s, v) => s + v, 0) / changes.length;
  const volatility = Math.sqrt(changes.reduce((s, v) => s + (v - changeAvg) ** 2, 0) / changes.length);

  // Viral spike: peak relative to the surrounding values
  const peakIdx = values.indexOf(peak);
  const beforePeak = values.slice(Math.max(0, peakIdx - 6), peakIdx);
  const beforeAvg = beforePeak.length > 0 ? beforePeak.reduce((s, v) => s + v, 0) / beforePeak.length : avg;
  const viralSpikeIndex = clamp((peak - beforeAvg) / 50, 0, 1);

  return {
    cagr: Math.round(cagr * 10) / 10,
    momentum: Math.round(momentum * 10) / 10,
    volatility: Math.round(volatility * 10) / 10,
    peakRatio: Math.round((peak / avg) * 10) / 10,
    seasonality: computeSummary(points).seasonal,
    viralSpikeIndex: Math.round(viralSpikeIndex * 100) / 100,
  };
}
