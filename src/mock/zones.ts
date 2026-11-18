// [REQUIREMENT: Task 03 - Geofence Zones Mock Data]
// PERHATIAN: Koordinat berlabel approximate harus diverifikasi manual di peta.
import type { Zone } from '../location/types';

export const ZONES: Zone[] = [
  {
    id: 'umm-campus',
    name: 'Kampus UMM',
    type: 'campus',
    center: {
      latitude: -7.9666,
      longitude: 112.6326,
    },
    radiusMeters: 500,
    productSlugs: [
      'kopi-susu-literan',
      'minuman-matcha',
      'thrift-preloved-fashion',
      'kaos-custom-dtf',
      'aksesori-kabel-charger',
    ],
    rationale:
      'Kawasan kampus dengan dominasi mahasiswa dan generasi muda; sangat prospektif untuk F&B kekinian, fashion hemat, dan pernak-pernik gadget.',
    approximate: false,
  },
  {
    id: 'alun-alun-malang',
    name: 'Alun-Alun Kota Malang',
    type: 'public_space',
    center: {
      latitude: -7.9819,
      longitude: 112.6306,
    },
    radiusMeters: 400,
    productSlugs: [
      'camilan-sehat',
      'hijab-busana-muslim',
      'boba-minuman-kekinian',
    ],
    rationale:
      'Pusat berkumpul keluarga dan wisatawan publik; cocok untuk camilan santai, hijab busana keluarga, dan minuman manis.',
    approximate: true, // koordinat berlabel approximate harus diverifikasi manual di peta
  },
  {
    id: 'pasar-besar-malang',
    name: 'Pasar Besar Malang',
    type: 'market',
    center: {
      latitude: -7.9767,
      longitude: 112.635,
    },
    radiusMeters: 350,
    productSlugs: [
      'frozen-food-rumahan',
      'organizer-rumah-tangga',
      'hijab-busana-muslim',
    ],
    rationale:
      'Sentra perputaran barang tradisional dan grosir; sangat ideal untuk produk beku siap masak dan organizer rumah tangga.',
    approximate: true, // koordinat berlabel approximate harus diverifikasi manual di peta
  },
  {
    id: 'malang-town-square',
    name: 'Malang Town Square',
    type: 'mall',
    center: {
      latitude: -7.9603,
      longitude: 112.6173,
    },
    radiusMeters: 300,
    productSlugs: [
      'skincare-lokal',
      'parfum-refill',
      'sepatu-lokal-sneakers',
    ],
    rationale:
      'Sentra gaya hidup modern dan belanja anak muda Malang; sangat pas untuk produk kecantikan, wewangian, dan sneakers lokal.',
    approximate: true, // koordinat berlabel approximate harus diverifikasi manual di peta
  },
];

export const DEFAULT_MAP_CENTER = {
  latitude: -7.9666,
  longitude: 112.6326,
};
