import type { AnalysisResult, Product } from '../api/types';
import type { TrendSignals } from './seriesGenerator';
import { getCapitalBand } from '../config/constants';
import { formatRupiah } from '../utils/format';

export interface AnalysisInput {
  product: Product;
  signals: TrendSignals;
  capitalBand: string | null;
  businessMode?: string | null;
  timeCommitment?: string | null;
  experience?: string | null;
}

export interface AnalysisProvider {
  analyze(input: AnalysisInput): Promise<AnalysisResult>;
}

function labelForScore(score: number): 'rendah' | 'sedang' | 'tinggi' | 'sangat_tinggi' {
  if (score >= 80) return 'sangat_tinggi';
  if (score >= 60) return 'tinggi';
  if (score >= 40) return 'sedang';
  return 'rendah';
}

function dirIcon(d: string): string {
  return d === 'naik' ? 'naik' : d === 'turun' ? 'turun' : 'stabil';
}

function pick<T>(arr: T[], n: number, seed: number): T[] {
  // Deterministic pick of n items from arr
  const result: T[] = [];
  const indices = arr.map((_, i) => i);
  let s = seed;
  for (let i = 0; i < n && indices.length > 0; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const idx = s % indices.length;
    result.push(arr[indices[idx]]);
    indices.splice(idx, 1);
  }
  return result;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export class MockAnalysisProvider implements AnalysisProvider {
  async analyze(input: AnalysisInput): Promise<AnalysisResult> {
    await delay(400);
    const { product, signals, capitalBand } = input;
    const seed = hashStr(product.slug + (capitalBand ?? 'none'));

    let score: number;
    let confidence: 'rendah' | 'sedang' | 'tinggi';
    const outlook: { horizonYears: number; direction: 'naik' | 'stabil' | 'turun'; rationale: string }[] = [];

    switch (product.archetype as string) {
      case 'steady_growth':
        score = 70 + (seed % 16);
        confidence = 'tinggi';
        outlook.push(
          { horizonYears: 1, direction: 'naik', rationale: 'Tren pertumbuhan konsisten dengan momentum positif berkelanjutan.' },
          { horizonYears: 3, direction: 'naik', rationale: 'Permintaan stabil dan kategori matang, proyeksi tetap naik.' },
          { horizonYears: 5, direction: 'stabil', rationale: 'Pertumbuhan mulai melambat seiring kematangan pasar, namun tetap sehat.' },
          { horizonYears: 10, direction: 'stabil', rationale: 'Kategori mapan, kemungkinan stabil dengan potensi inovasi produk.' },
        );
        break;
      case 'emerging':
        score = 62 + (seed % 14);
        confidence = 'sedang';
        outlook.push(
          { horizonYears: 1, direction: 'naik', rationale: 'Tren sedang dalam fase akselerasi, pertumbuhan cepat.' },
          { horizonYears: 3, direction: 'naik', rationale: 'Potensi besar dengan adopsi yang terus meningkat.' },
          { horizonYears: 5, direction: 'naik', rationale: 'Kategori semakin dikenal, proyeksi tetap positif.' },
          { horizonYears: 10, direction: 'naik', rationale: 'Jika tren berlanjut, kategori ini bisa menjadi mainstream.' },
        );
        break;
      case 'stable':
        score = 55 + (seed % 14);
        confidence = 'tinggi';
        outlook.push(
          { horizonYears: 1, direction: 'stabil', rationale: 'Permintaan konsisten tanpa fluktuasi signifikan.' },
          { horizonYears: 3, direction: 'stabil', rationale: 'Pasar matang, proyeksi stabil.' },
          { horizonYears: 5, direction: 'stabil', rationale: 'Tetap stabil dengan risiko kompetisi yang meningkat.' },
          { horizonYears: 10, direction: 'stabil', rationale: 'Kategori mapan, kemungkinan tetap stabil dengan diferensiasi.' },
        );
        break;
      case 'seasonal':
        score = 50 + (seed % 16);
        confidence = 'sedang';
        outlook.push(
          { horizonYears: 1, direction: 'stabil', rationale: 'Pola musiman kuat, stabil sepanjang tahun dengan puncak musiman.' },
          { horizonYears: 3, direction: 'stabil', rationale: 'Tren musiman berulang, secara umum stabil.' },
          { horizonYears: 5, direction: 'stabil', rationale: 'Tetap mengikuti pola musiman, risiko pergeseran preferensi.' },
          { horizonYears: 10, direction: 'turun', rationale: 'Kategori musiman rentan perubahan tren jangka panjang.' },
        );
        break;
      case 'viral_decline':
        score = 20 + (seed % 19);
        confidence = 'tinggi';
        outlook.push(
          { horizonYears: 1, direction: 'turun', rationale: 'Tren sudah melewati puncak dan terus menurun.' },
          { horizonYears: 3, direction: 'turun', rationale: 'Penurunan berlanjut seiring menurunnya minat pasar.' },
          { horizonYears: 5, direction: 'turun', rationale: 'Risiko besar kategori ini kehilangan relevansi.' },
          { horizonYears: 10, direction: 'turun', rationale: 'Sulit bertahan tanpa inovasi atau pivot besar.' },
        );
        break;
      case 'declining':
        score = 25 + (seed % 16);
        confidence = 'tinggi';
        outlook.push(
          { horizonYears: 1, direction: 'turun', rationale: 'Tren penurunan konsisten, minat pasar terus berkurang.' },
          { horizonYears: 3, direction: 'turun', rationale: 'Penurunan berlanjut, kompetisi dan perubahan preferensi.' },
          { horizonYears: 5, direction: 'turun', rationale: 'Kategori semakin tersingkir, perlu pivot.' },
          { horizonYears: 10, direction: 'turun', rationale: 'Kemungkinan besar tidak relevan tanpa transformasi besar.' },
        );
        break;
      default:
        score = 50;
        confidence = 'sedang';
        outlook.push(
          { horizonYears: 1, direction: 'stabil', rationale: 'Data terbatas, proyeksi konservatif.' },
          { horizonYears: 3, direction: 'stabil', rationale: 'Data terbatas untuk proyeksi jangka panjang.' },
          { horizonYears: 5, direction: 'stabil', rationale: 'Tetap konservatif.' },
          { horizonYears: 10, direction: 'stabil', rationale: 'Tetap konservatif.' },
        );
    }

    if (product.partial) {
      confidence = confidence === 'tinggi' ? 'sedang' : 'rendah';
      score = Math.max(10, score - 5);
    }

    score = Math.max(5, Math.min(95, score));

    const resilienceLabel = labelForScore(score);

    // Drivers and risks
    const driversMap: Record<string, string[]> = {
      steady_growth: ['Permintaan konsisten dan terus tumbuh', 'Kategori matang dengan basis konsumen stabil', 'Mudah dimulai dengan modal kecil', 'Margin sehat dan repeat order tinggi'],
      emerging: ['Tren sedang naik dengan adopsi cepat', 'Pasar belum jenuh, peluang early mover', 'Minim kompetitor besar', 'Cocok untuk target konsumen muda'],
      stable: ['Permintaan konsisten sepanjang tahun', 'Risiko tren musiman rendah', 'Model bisnis dapat diprediksi', 'Kategori mapan dengan supply chain jelas'],
      seasonal: ['Puncak musiman memberikan lonjakan penjualan', 'Dapat dikombinasi dengan produk lain', 'Pola dapat diprediksi untuk perencanaan stok', 'Cocok untuk strategi kampanye periodik'],
      viral_decline: ['Masih ada permintaan residual dari tren', 'Harga produk bisa turun untuk clearance', 'Peluang repositioning dengan inovasi', 'Dapat dimanfaatkan untuk market testing'],
      declining: ['Peluang pivot ke kategori terkait', 'Pasokan murah karena permintaan menurun', 'Dapat dikemas ulang sebagai niche', 'Cocok untuk eksperimen konsep baru'],
    };
    const risksMap: Record<string, string[]> = {
      steady_growth: ['Kompetisi meningkat seiring kategori tumbuh', 'Margin bisa tertekan oleh pemain besar', 'Kebutuhan modal kerja untuk stok', 'Risiko perubahan preferensi konsumen jangka panjang'],
      emerging: ['Riwayat data terbatas, proyeksi kurang pasti', 'Tren bisa cepat berubah', 'Belum ada standar kualitas yang jelas', 'Risiko regulasi baru untuk kategori'],
      stable: ['Pertumbuhan terbatas, sulit scale cepat', 'Kompetisi harga ketat', 'Diferensiasi produk menjadi tantangan', 'Risiko disrupsi teknologi'],
      seasonal: ['Penjualan rendah di luar musim puncak', 'Sulit mengelola stok di luar musim', 'Ketergantungan pada kalender tertentu', 'Risiko tren musiman bergeser'],
      viral_decline: ['Tren sesaat yang sulit dipertahankan', 'Penurunan minat yang tajam', 'Stok bisa menumpuk saat tren reda', 'Sulit menarik konsumen baru', 'Risiko citra produk terpuruk'],
      declining: ['Penurunan permintaan yang konsisten', 'Kompetisi dari kategori pengganti', 'Nilai residu produk rendah', 'Investasi awal berisiko tidak kembali'],
    };

    const drivers = pick(driversMap[product.archetype as string] ?? driversMap.stable, 4, seed);
    const risks = pick(risksMap[product.archetype as string] ?? risksMap.stable, 4, seed + 1);

    // Capital fit
    const band = getCapitalBand(capitalBand ?? '');
    let level: 'sesuai' | 'perlu_penyesuaian' | 'kurang_sesuai' = 'sesuai';
    if (band) {
      if (product.typicalCapitalMax <= band.max && product.typicalCapitalMin >= band.min) {
        level = 'sesuai';
      } else if (product.typicalCapitalMin > band.max) {
        level = 'kurang_sesuai';
      } else if (product.typicalCapitalMax > band.max) {
        level = 'perlu_penyesuaian';
      }
    } else {
      level = 'perlu_penyesuaian';
    }

    const capitalFit = {
      level,
      estimatedStartCapitalIdr: { min: product.typicalCapitalMin, max: product.typicalCapitalMax },
      assumptions: [
        'Skala awal: online / rumahan',
        'Belum termasuk sewa tempat',
        'Estimasi berdasarkan harga pasar saat ini',
        'Kebutuhan modal dapat bervariasi per wilayah',
      ].slice(0, level === 'kurang_sesuai' ? 4 : 3),
    };

    // Starter steps
    const starterStepsMap: Record<string, string[]> = {
      steady_growth: ['Riset supplier dan harga pokok produksi', 'Mulai jualan online via marketplace dan media sosial', 'Bangun base konsumen dengan kualitas dan konsistensi', 'Scale bertahap setelah repeat order stabil'],
      emerging: ['Pelajari kategori dan target konsumen secara mendalam', 'Coba pre-order untuk validasi permintaan', 'Bangun brand sejak awal untuk differensiasi', 'Siapkan stok awal yang minimal untuk testing'],
      stable: ['Fokus pada efisiensi operasional', 'Bangun channel distribusi yang konsisten', 'Diferensiasi dengan packaging atau service', 'Pertahankan margin dengan kontrol biaya'],
      seasonal: ['Rencanakan stok mengikuti kalender musim', 'Diversifikasi produk untuk periode non-puncak', 'Siapkan kampanye promosi jauh hari', 'Kelola cash flow untuk siklus musiman'],
      viral_decline: ['Pertimbangkan ulang sebelum masuk kategori ini', 'Jika tetap lanjut, fokus pada harga kompetitif', 'Siapkan exit plan sejak awal', 'Eksperimen dengan reposisi produk atau niche baru'],
      declining: ['Pertimbangkan pivot ke kategori terkait yang masih tumbuh', 'Manfaatkan pasokan murah untuk market testing', 'Kemas ulang produk sebagai niche atau premium', 'Minimalkan investasi awal dan uji secara bertahap'],
    };
    const starterSteps = (starterStepsMap[product.archetype as string] ?? starterStepsMap.stable).slice(0, 4);

    // Data limitations
    const dataLimitations: string[] = [];
    if (product.partial) {
      dataLimitations.push('Data hanya tersedia dari 2 sumber, analisis kurang komprehensif.');
    }
    if (confidence === 'rendah') {
      dataLimitations.push('Tingkat kepercayaan rendah karena keterbatasan data historis.');
    }
    if (signals.volatility > 15) {
      dataLimitations.push('Volatilitas tinggi dalam data tren, proyeksi mungkin kurang stabil.');
    }

    const oneLineSummaries: Record<string, string> = {
      steady_growth: 'Produk dengan pertumbuhan konsisten dan ketahanan baik untuk jangka panjang.',
      emerging: 'Kategori sedang naik daun dengan potensi besar, namun masih perlu validasi.',
      stable: 'Kategori mapan dengan permintaan stabil, cocok untuk bisnis yang dapat diprediksi.',
      seasonal: 'Produk dengan pola musiman kuat, perlu strategi khusus untuk bertahan di luar musim.',
      viral_decline: 'Tren sesaat yang sudah melewati puncak, berisiko untuk jangka panjang.',
      declining: 'Kategori yang terus menurun, pertimbangkan untuk pivot.',
    };

    return {
      resilienceScore: score,
      resilienceLabel,
      confidence,
      oneLineSummary: oneLineSummaries[product.archetype as string] ?? 'Analisis berbasis data tren pasar.',
      outlook: outlook.map((o) => ({ ...o, direction: dirIcon(o.direction) as 'naik' | 'stabil' | 'turun' })),
      drivers,
      risks,
      capitalFit,
      starterSteps,
      dataLimitations,
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Stub for future Gemini integration
export class GeminiAnalysisProvider implements AnalysisProvider {
  async analyze(_input: AnalysisInput): Promise<AnalysisResult> {
    // TODO: Implement server-side Gemini AI analysis
    // - Call Gemini API with structured prompt
    // - Use JSON schema output
    // - Validate result with zod
    // - Timeout 25s, retries <= 2
    // - Never promise profits or investment advice
    throw new Error('GeminiAnalysisProvider not implemented — use MockAnalysisProvider');
  }
}
