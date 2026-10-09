const MONTHS_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

const MONTHS_ID_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function formatRupiah(amount: number): string {
  return 'Rp' + Math.round(amount).toLocaleString('id-ID');
}

export function formatRupiahShort(amount: number): string {
  if (amount >= 1_000_000) {
    const jt = amount / 1_000_000;
    return `Rp${jt % 1 === 0 ? jt.toFixed(0) : jt.toFixed(1)} jt`;
  }
  if (amount >= 1_000) {
    const rb = amount / 1_000;
    return `Rp${rb % 1 === 0 ? rb.toFixed(0) : rb.toFixed(1)} rb`;
  }
  return `Rp${amount}`;
}

export function formatDateId(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateIdFull(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_ID_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatPeriod(yyyymm: string): string {
  const [year, month] = yyyymm.split('-');
  const m = parseInt(month, 10) - 1;
  return `${MONTHS_ID[m]} ${year}`;
}

export function formatDateTimeId(iso: string): string {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm} WIB`;
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':');
}

export function toISODate(d: Date): string {
  return d.toISOString();
}

export function daysBetween(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24));
}
