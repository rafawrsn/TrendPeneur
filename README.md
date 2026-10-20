# TrendPreneur Mobile App

TrendPreneur adalah aplikasi mobile (React Native / Expo + Expo Router + TypeScript) yang membantu calon pengusaha menemukan produk tren, melihat riwayat dan proyeksi grafik tren tahunan, serta mendapatkan analisis ketahanan produk 5–10 tahun ke depan berbasis AI yang disesuaikan dengan modal usaha.

---

## Memulai Cepat (Quick Start)

### 1. Prasyarat
- Node.js >= 18
- npm atau yarn

### 2. Instalasi
```bash
npm install
```

### 3. Menjalankan Aplikasi (Mode Mock Default)
Secara default, aplikasi berjalan dalam **Mock Mode** (`EXPO_PUBLIC_USE_MOCK="true"`), sehingga aplikasi dapat berjalan end-to-end tanpa memerlukan backend aktif:
```bash
npm run dev
```

### 4. Pengecekan Tipe TypeScript
```bash
npm run typecheck
```

---

## Konfigurasi Lingkungan (`.env.example`)

Salin `.env.example` menjadi `.env`:
```env
# Mode Mock: "true" untuk simulasi lokal mandiri, "false" untuk menghubungkan ke backend
EXPO_PUBLIC_USE_MOCK=true

# Alamat API Backend (digunakan saat EXPO_PUBLIC_USE_MOCK=false)
EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1

# Kunci simulasi admin untuk verifikasi pembayaran pada mode dev
EXPO_PUBLIC_DEV_ADMIN_KEY=dev-admin-secret-key
```

---

## Matriks Hak Akses (Access Matrix)

| Peran | Beranda & Cari Produk | Grafik Tren & Detail | Modal & Profil | Paywall & Pembayaran | Notifikasi | AI Analyst (Baru & Riwayat) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Guest (Tamu)** | ✅ | ✅ | ❌ (ke Login) | ❌ (ke Login) | ❌ (ke Login) | ❌ (ke Login) |
| **Free User** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (ke Paywall) |
| **Premium** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Kuota 5/hari) |
| **Expired Premium** | ✅ | ✅ | ✅ | ✅ | ✅ | Riwayat ✅ / Baru ❌ (Perpanjang) |

---

## Akun Demo Bawaan (Mock Mode)

| Tipe Akun | Email | Password | Status |
|---|---|---|---|
| **Free User** | `free@trendpreneur.id` | `Demo12345` | Belum berlangganan |
| **Premium User** | `premium@trendpreneur.id` | `Demo12345` | Langganan aktif 30 hari |
| **Registrasi Baru** | Email apa saja | Bebas (min. 8 karakter) | Kode OTP: `123456` |

---

## Nilai Placeholder (TBD / To Be Determined)

Komponen berikut berstatus **placeholder / demo** dan perlu disesuaikan sebelum produksi:
1. **Harga & Durasi Paket Langganan**: Rp49.000 / 30 hari (`src/config/plan.ts`).
2. **Kuota AI Harian**: 5 analisis per hari (`src/config/plan.ts`).
3. **Preset Modal (Capital Bands)**: Rentang modal mikro hingga menengah (`src/config/constants.ts`).
4. **Dokumen Hukum**: Syarat & Ketentuan, Kebijakan Privasi, dan Disclaimer (`app/legal/[doc].tsx`) berstatus draf yang perlu ditinjau oleh konsultan hukum.
5. **QRIS**: Gambar dan string QRIS adalah placeholder simulasi; digantikan dengan dynamic QRIS gateway (misal Midtrans/Xendit/manual static QRIS) pada fase backend.

---

## Alur Pembayaran & Simulasi Admin (Dev Mode)

1. Masuk sebagai pengguna Free atau daftar baru (OTP: `123456`).
2. Buka menu **Upgrade ke Premium** atau tab **AI Analyst**.
3. Sistem membuat permintaan pembayaran QRIS dengan kode unik (100–999).
4. Unggah screenshot bukti pembayaran (format JPG, PNG, WEBP <= 5 MB).
5. Pada layar **Status Pembayaran**, panel **Simulasi Admin (hanya demo)** akan muncul:
   - Klik **Tolak**: Pilih alasan penolakan -> status menjadi ditolak -> tombol **Unggah Ulang Bukti** aktif (maks. 3 kali).
   - Klik **Setujui**: Status disetujui -> akun menjadi Premium aktif -> notifikasi konfirmasi dikirim.

---

## Contoh Alur API Backend (Fase #2 / Server Reference)

Ketika backend Node.js/Express (`/server`) diaktifkan, alur interaksi API menggunakan kontrak endpoint berikut:

### 1. Registrasi Akun
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Budi Santoso","email":"budi@example.com","password":"Password123"}'
```

### 2. Verifikasi Email / OTP
```bash
curl -X POST http://localhost:4000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"budi@example.com","code":"123456"}'
```

### 3. Masuk (Login)
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"budi@example.com","password":"Password123"}'
```

### 4. Buat Permintaan Pembayaran
```bash
curl -X POST http://localhost:4000/api/v1/payments \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"planCode":"PREMIUM_MONTHLY"}'
```

### 5. Unggah Bukti Transfer
```bash
curl -X POST http://localhost:4000/api/v1/payments/<PAYMENT_ID>/proof \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -F "file=@/path/to/proof.jpg" \
  -F "note=Transfer via BCA"
```

### 6. Simulasi Persetujuan Admin (Dev Mode)
```bash
curl -X POST http://localhost:4000/api/v1/dev-admin/payments/<PAYMENT_ID>/approve \
  -H "x-dev-admin-key: dev-admin-secret-key"
```

### 7. Buat Analisis AI Produk
```bash
curl -X POST http://localhost:4000/api/v1/analyses \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"productSlug":"kopi-susu-literan"}'
```

### 8. Polling Hasil Analisis
```bash
curl -X GET http://localhost:4000/api/v1/analyses/<ANALYSIS_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```
