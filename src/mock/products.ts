import type { Product } from '../api/types';

interface ProductSeed {
  slug: string;
  name: string;
  category: string;
  archetype: string;
  sources: string[];
  partial?: boolean;
  typicalCapitalMin: number;
  typicalCapitalMax: number;
}

const FULL_SOURCES = ['google_trends', 'marketplace', 'social_media', 'news_reports'];

export const PRODUCTS: ProductSeed[] = [
  { slug: 'kopi-susu-literan', name: 'Kopi susu literan', category: 'fnb', archetype: 'steady_growth', sources: FULL_SOURCES, typicalCapitalMin: 2_000_000, typicalCapitalMax: 8_000_000 },
  { slug: 'minuman-matcha', name: 'Minuman matcha', category: 'fnb', archetype: 'emerging', sources: FULL_SOURCES, typicalCapitalMin: 3_000_000, typicalCapitalMax: 15_000_000 },
  { slug: 'frozen-food-rumahan', name: 'Frozen food rumahan', category: 'fnb', archetype: 'steady_growth', sources: FULL_SOURCES, typicalCapitalMin: 1_000_000, typicalCapitalMax: 10_000_000 },
  { slug: 'camilan-sehat', name: 'Camilan sehat (keripik buah/sayur)', category: 'fnb', archetype: 'steady_growth', sources: ['google_trends', 'marketplace', 'social_media'], typicalCapitalMin: 1_000_000, typicalCapitalMax: 7_000_000 },
  { slug: 'boba-minuman-kekinian', name: 'Boba / minuman kekinian', category: 'fnb', archetype: 'viral_decline', sources: FULL_SOURCES, typicalCapitalMin: 5_000_000, typicalCapitalMax: 25_000_000 },
  { slug: 'thrift-preloved-fashion', name: 'Thrift / preloved fashion', category: 'fashion', archetype: 'steady_growth', sources: FULL_SOURCES, typicalCapitalMin: 500_000, typicalCapitalMax: 5_000_000 },
  { slug: 'hijab-busana-muslim', name: 'Hijab & busana muslim', category: 'fashion', archetype: 'seasonal', sources: FULL_SOURCES, typicalCapitalMin: 2_000_000, typicalCapitalMax: 12_000_000 },
  { slug: 'sepatu-lokal-sneakers', name: 'Sepatu lokal sneakers', category: 'fashion', archetype: 'steady_growth', sources: FULL_SOURCES, typicalCapitalMin: 5_000_000, typicalCapitalMax: 30_000_000 },
  { slug: 'kaos-custom-dtf', name: 'Kaos custom (DTF)', category: 'fashion', archetype: 'stable', sources: ['google_trends', 'marketplace', 'social_media'], typicalCapitalMin: 2_000_000, typicalCapitalMax: 10_000_000 },
  { slug: 'skincare-lokal', name: 'Skincare lokal', category: 'kecantikan', archetype: 'steady_growth', sources: FULL_SOURCES, typicalCapitalMin: 3_000_000, typicalCapitalMax: 20_000_000 },
  { slug: 'parfum-refill', name: 'Parfum refill', category: 'kecantikan', archetype: 'emerging', sources: ['google_trends', 'marketplace', 'news_reports'], typicalCapitalMin: 1_000_000, typicalCapitalMax: 8_000_000 },
  { slug: 'sheet-mask-impor', name: 'Sheet mask impor', category: 'kecantikan', archetype: 'declining', sources: FULL_SOURCES, typicalCapitalMin: 5_000_000, typicalCapitalMax: 25_000_000 },
  { slug: 'organizer-rumah-tangga', name: 'Organizer rumah tangga', category: 'rumah', archetype: 'stable', sources: FULL_SOURCES, typicalCapitalMin: 1_000_000, typicalCapitalMax: 10_000_000 },
  { slug: 'tanaman-hias', name: 'Tanaman hias', category: 'rumah', archetype: 'viral_decline', sources: FULL_SOURCES, typicalCapitalMin: 500_000, typicalCapitalMax: 5_000_000 },
  { slug: 'lilin-aromaterapi', name: 'Lilin aromaterapi', category: 'rumah', archetype: 'emerging', sources: ['google_trends', 'marketplace', 'social_media'], typicalCapitalMin: 500_000, typicalCapitalMax: 4_000_000 },
  { slug: 'case-hp-custom', name: 'Case HP custom', category: 'gadget', archetype: 'declining', sources: FULL_SOURCES, typicalCapitalMin: 500_000, typicalCapitalMax: 5_000_000 },
  { slug: 'aksesori-kabel-charger', name: 'Aksesori kabel & charger', category: 'gadget', archetype: 'stable', sources: ['google_trends', 'marketplace', 'news_reports'], typicalCapitalMin: 2_000_000, typicalCapitalMax: 15_000_000 },
  { slug: 'smartwatch-murah', name: 'Smartwatch murah', category: 'gadget', archetype: 'viral_decline', sources: ['google_trends', 'marketplace'], partial: true, typicalCapitalMin: 5_000_000, typicalCapitalMax: 30_000_000 },
  { slug: 'suplemen-herbal', name: 'Suplemen herbal', category: 'kesehatan', archetype: 'steady_growth', sources: FULL_SOURCES, typicalCapitalMin: 3_000_000, typicalCapitalMax: 20_000_000 },
  { slug: 'alat-olahraga-rumahan', name: 'Alat olahraga rumahan', category: 'kesehatan', archetype: 'seasonal', sources: FULL_SOURCES, typicalCapitalMin: 3_000_000, typicalCapitalMax: 20_000_000 },
  { slug: 'blind-box-koleksi-figur', name: 'Blind box / koleksi figur', category: 'hobi', archetype: 'viral_decline', sources: ['google_trends', 'social_media'], partial: true, typicalCapitalMin: 2_000_000, typicalCapitalMax: 15_000_000 },
  { slug: 'mainan-edukasi-anak', name: 'Mainan edukasi anak', category: 'hobi', archetype: 'steady_growth', sources: FULL_SOURCES, typicalCapitalMin: 2_000_000, typicalCapitalMax: 15_000_000 },
  { slug: 'makanan-kucing-premium', name: 'Makanan kucing premium', category: 'hewan', archetype: 'steady_growth', sources: FULL_SOURCES, typicalCapitalMin: 3_000_000, typicalCapitalMax: 20_000_000 },
  { slug: 'aksesori-hewan-peliharaan', name: 'Aksesori hewan peliharaan', category: 'hewan', archetype: 'stable', sources: ['google_trends', 'marketplace', 'social_media'], typicalCapitalMin: 1_000_000, typicalCapitalMax: 8_000_000 },
];

export function getProductSeeds(): Product[] {
  return PRODUCTS.map((p) => ({
    slug: p.slug,
    name: p.name,
    category: p.category,
    archetype: p.archetype,
    sources: p.sources,
    partial: p.partial ?? false,
    typicalCapitalMin: p.typicalCapitalMin,
    typicalCapitalMax: p.typicalCapitalMax,
  }));
}

export const TREND_SOURCE_MAP: Record<string, string> = {
  google_trends: 'Google Trends',
  marketplace: 'Marketplace',
  social_media: 'Media Sosial',
  news_reports: 'Berita & Laporan',
};
