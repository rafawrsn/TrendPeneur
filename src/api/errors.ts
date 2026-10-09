export const ERROR_CODES = {
  VALIDATION_ERROR: 'Data tidak valid. Periksa kembali input kamu.',
  UNAUTHENTICATED: 'Kamu belum masuk. Silakan masuk terlebih dahulu.',
  TOKEN_EXPIRED: 'Sesi kamu telah berakhir. Silakan masuk lagi.',
  FORBIDDEN: 'Kamu tidak memiliki akses untuk aksi ini.',
  ACCOUNT_SUSPENDED: 'Akun kamu telah dinonaktifkan. Hubungi dukungan.',
  PREMIUM_REQUIRED: 'Fitur ini hanya untuk pengguna Premium.',
  NOT_FOUND: 'Data tidak ditemukan.',
  CONFLICT: 'Terjadi konflik data. Coba lagi.',
  INVALID_STATE_TRANSITION: 'Aksi tidak dapat dilakukan pada status saat ini.',
  ALREADY_DECIDED: 'Permintaan ini sudah diproses sebelumnya.',
  PAYMENT_ALREADY_ACTIVE: 'Kamu sudah memiliki permintaan pembayaran aktif.',
  FILE_TOO_LARGE: 'Ukuran file terlalu besar (maks 5 MB).',
  UNSUPPORTED_MEDIA: 'Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.',
  PROOF_DUPLICATE: 'Bukti ini sudah pernah dipakai.',
  CAPITAL_REQUIRED: 'Isi modal dulu agar rekomendasi sesuai.',
  PRODUCT_RESTRICTED: 'Produk ini tidak tersedia untuk analisis.',
  ACCOUNT_LOCKED: 'Akun dikunci sementara 15 menit karena terlalu banyak percobaan gagal.',
  RATE_LIMITED: 'Terlalu banyak permintaan. Coba lagi nanti.',
  QUOTA_EXCEEDED: 'Kuota analisis hari ini sudah habis. Kuota direset besok.',
  INTERNAL_ERROR: 'Terjadi kesalahan. Coba lagi nanti.',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export class ApiError extends Error {
  code: ErrorCode;
  details?: unknown;
  status?: number;

  constructor(code: ErrorCode, message?: string, details?: unknown, status?: number) {
    super(message ?? ERROR_CODES[code] ?? code);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.status = status;
  }

  get indonesianMessage(): string {
    return ERROR_CODES[this.code] ?? this.message;
  }
}

export function mapErrorCode(code: string): ErrorCode {
  if (code in ERROR_CODES) return code as ErrorCode;
  return 'INTERNAL_ERROR';
}
