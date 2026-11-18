# Dokumentasi & Panduan Demo: Location-Based Services (LBS)
## Mobile Programming Week 10 (Sprint 08: "Build Location-Based App")

---

## 1. Ikhtisar Fitur: "Peluang Usaha Sekitar Saya"
Fitur **Peluang Usaha Sekitar Saya** (`app/(tabs)/nearby.tsx`) mengintegrasikan teknologi **Location-Based Services (LBS)** ke dalam ekosistem TrendPreneur. Fitur ini membantu calon wirausahawan menemukan zona sentra usaha terdekat (kampus, pasar tradisional, pusat perbelanjaan, ruang publik), membaca alamat nyata dari koordinat GPS (*Reverse Geocoding*), mendeteksi saat pengguna melintasi batas virtual sentra usaha (*Geofencing*), serta merekomendasikan produk yang sedang tren dan relevan di zona tersebut.

Aplikasi dirancang untuk berjalan mulus secara **Cross-Platform**:
- **Web**: Menggunakan pustaka peta ringan `Leaflet` + tile `OpenStreetMap` (tanpa ketergantungan API key berbayar).
- **Android & iOS**: Menggunakan `react-native-maps` untuk integrasi native pada Expo Go.

---

## 2. Arsitektur & Komponen Teknis

```
+-------------------------------------------------------------------------+
|                              NearbyScreen                               |
|                           (app/(tabs)/nearby.tsx)                       |
+-------------------------------------------------------------------------+
       |                           |                         |
       v                           v                         v
[Task 01: GPS Fix]         [Task 02: Peta SDK]     [Task 03: Intelligence]
expo-location              LocationMap (.web/.tsx) Reverse Geocode & Geofence
- requestForegroundAsync   - Leaflet (Web)         - Nominatim / Native API
- getCurrentPositionAsync  - RN Maps (Native)      - Haversine Distance
- Accuracy Classification  - Custom Markers        - Enter / Exit Events
                           - Accuracy Circles      - Trend Products Filter
                                   |
                                   v
             [Battery Optimization & Tracking Profiles]
             - Balanced (5s / 10m)
             - High Accuracy (2s / 3m)
             - Battery Saver (15s / 30m)
             - Distance-based Filtering (Received vs Processed)
```

### Struktur Modul:
1. `src/location/types.ts`: Kontrak data `LatLng`, `LocationFix`, `Zone`, `GeofenceEvent`, dan `TrackingProfile`.
2. `src/location/geo.ts`: Algoritma perhitungan jarak lingkaran besar (*Haversine Formula*), deteksi titik di dalam poligon/radius (*isInsideZone*), pencarian sentra terdekat (*nearestZone*), dan pengelompokan tingkat akurasi (*accuracyLevel*).
3. `src/mock/zones.ts`: Titik sentra usaha Malang (Kampus UMM, Alun-Alun Kota Malang, Pasar Besar, Malang Town Square).
4. `src/stores/location.ts`: Global state store (Zustand) untuk mengelola izin GPS, lokasi terkini, status geofencing, riwayat event, dan statistik efisiensi baterai.
5. `src/location/useCurrentLocation.ts`: Hook perizinan dan pembacaan GPS satu kali (*One-time GPS Fix*).
6. `src/location/useLocationTracking.ts`: Hook pelacakan berkelanjutan dengan kontrol efisiensi baterai (*watchPositionAsync*).
7. `src/location/useGeofence.ts`: Hook evaluasi geofence virtual yang memicu notifikasi Toast dan pencatatan riwayat event.
8. `src/location/reverseGeocode.ts` & `useReverseGeocode.ts`: Penerjemah koordinat geografis menjadi nama jalan dan kota.
9. `src/components/features/LocationMap.tsx` & `.web.tsx`: Komponen peta responsif multiplatform.

---

## 3. Checklist 7 Poin Penilaian Sprint 08

| No | Poin Penilaian | Implementasi di TrendPreneur | Lokasi Kode |
|:--:|---|---|---|
| **1** | **Mengakses GPS** | Meminta izin akses lokasi foreground secara santun lewat Sheet penjelasan, memeriksa status izin, serta menangani kondisi penolakan (*denied*) dan GPS mati. | `src/location/useCurrentLocation.ts` |
| **2** | **Membaca Koordinat** | Menampilkan Latitude & Longitude presisi 6 desimal, akurasi dalam meter (`±X m`), waktu perbaruan, dan Badge klasifikasi akurasi (Tinggi <=20 m, Sedang 21–100 m, Rendah >100 m). | `app/(tabs)/nearby.tsx` |
| **3** | **Menampilkan Peta** | Menampilkan peta interaktif yang memusatkan kamera otomatis ke posisi pengguna atau koordinat Kampus UMM, dilengkapi tombol "Pusatkan". | `src/components/features/LocationMap.*` |
| **4** | **Menampilkan Marker** | Menampilkan marker posisi pengguna dengan lingkaran radius akurasi GPS, serta marker dan radius geofence untuk setiap sentra usaha. | `src/components/features/LocationMap.*` |
| **5** | **Reverse Geocoding** | Menerjemahkan koordinat GPS menjadi nama jalan, kelurahan, dan kota (misalnya: *Jl. Raya Tlogomas, Lowokwaru, Kota Malang*) menggunakan integrasi native & OpenStreetMap Nominatim. | `src/location/reverseGeocode.ts` |
| **6** | **Menguji Geofencing** | Mendeteksi event masuk (*ENTER*) dan keluar (*EXIT*) batas virtual radius 300–500 meter, memicu umpan balik Toast, banner peluang usaha aktif, serta mencatat log event. | `src/location/useGeofence.ts` |
| **7** | **Optimasi Baterai** | Menyediakan 3 profil pelacakan (*Balanced*, *High Accuracy*, *Battery Saver*), filter pembaruan berbasis jarak (*distanceInterval*), mematikan listener saat tidak aktif, dan visualisasi rasio *Fix Diterima vs Diproses*. | `src/location/useLocationTracking.ts` & `src/stores/location.ts` |

---

## 4. Panduan Menjalankan Aplikasi

### Menjalankan di Web (Browser)
```bash
# Jalankan bundler Metro untuk web
npm run dev
# atau
npx expo start --web
```
Buka peramban di `http://localhost:8081` (atau port yang ditampilkan). Klik tab **Sekitar** pada bilah navigasi bawah.

### Menjalankan di Android / iOS (Expo Go)
```bash
npx expo start
```
Pindai QR code menggunakan aplikasi Expo Go pada perangkat fisik atau jalankan di simulator/emulator.

---

## 5. Skrip Demonstrasi Langkah-demi-Langkah (Untuk Ujian / Penilaian)

Gunakan skenario berikut saat mendemokan aplikasi kepada Dosen / Asisten Praktikum:

### Langkah 1: Meminta Izin & Mengakses GPS (Poin 1 & 2)
1. Buka tab **Sekitar** (ikon pin lokasi).
2. Tunjukkan kartu sambutan dengan tombol **"Aktifkan & Ambil Lokasi"**.
3. Klik tombol tersebut: Muncul Sheet penjelasan privasi dan tujuan izin lokasi di latar depan (*Foreground*).
4. Klik **"Lanjutkan & Berikan Izin"**:
   - Jika diizinkan: Kartu **"Lokasi Saya"** langsung menampilkan:
     - Latitude & Longitude (6 angka desimal).
     - Nilai presisi (misal: `±12 m`).
     - Badge tingkat akurasi (misal: **Akurasi Tinggi** berwarna hijau).
5. Klik teks **"Kenapa akurasi bervariasi?"** untuk menjelaskan faktor satelit, jaringan internet, gedung bertingkat, dan karakteristik browser web kepada penguji.

### Langkah 2: Peta & Marker Interaktif (Poin 3 & 4)
1. Tunjukkan komponen peta di bawah kartu lokasi.
2. Jelaskan elemen peta:
   - Marker biru berkedip: Titik posisi pengguna.
   - Lingkaran biru transparan di sekitar marker pengguna: Radius toleransi akurasi GPS.
   - Lingkaran berwarna dengan garis putus/solid: Batas area virtual (*Geofence*) untuk sentra usaha (Kampus UMM, Alun-Alun Malang, Pasar Besar, Malang Town Square).
3. Geser peta ke lokasi lain, lalu klik tombol mengambang **"Pusatkan"**: Peta akan secara mulus kembali berpusat pada posisi pengguna.

### Langkah 3: Reverse Geocoding (Poin 5)
1. Tunjukkan panel **Alamat Terdeteksi (Reverse Geocoding)** pada kartu lokasi.
2. Tunjukkan hasil nama jalan dan kota yang terbaca otomatis dari koordinat GPS (misal: *Jl. Raya Tlogomas, Lowokwaru, Kota Malang*).
3. Klik tombol **"Perbarui Lokasi"**: Tunjukkan indikator pemuatan dan alamat yang diperbarui.

### Langkah 4: Uji Coba Geofencing Virtual (Poin 6)
*Untuk kemudahan pengujian di dalam ruangan/kelas, gunakan panel **Simulasi Lokasi (Demo Praktikum)**:*
1. Klik chip **"📍 Kampus UMM"**:
   - Lokasi berpindah seketika ke `(-7.9666, 112.6326)`.
   - Muncul notifikasi Toast: *"Kamu berada di zona Kampus UMM. Peluang usaha aktif!"*.
   - Banner hijau toska (*Accent*) aktif muncul di layar, mengonfirmasi keberadaan di dalam zona.
   - Tampil daftar **Produk Tren yang Sangat Cocok di Zona Ini** (Kopi susu literan, Minuman matcha, Thrift fashion, Kaos custom DTF, Aksesori charger).
   - Klik salah satu produk untuk membuktikan navigasi ke halaman detail produk tetap berfungsi dengan baik.
2. Klik chip **"📍 Alun-Alun Kota Malang"**:
   - Terdeteksi event keluar dari zona UMM dan event masuk ke zona Alun-Alun.
   - Toast mengabarkan perubahan zona.
   - Rekomendasi produk berganti menjadi produk camilan santai, hijab busana muslim, dan boba kekinian.
3. Klik chip **"🚫 Keluar Zona (Exit)"**:
   - Posisi berpindah ke luar seluruh batas radius sentra usaha.
   - Muncul Toast: *"Kamu keluar dari zona ..."*.
   - Kartu berganti status menjadi **"Di Luar Batas Zona Geofence"**, lengkap dengan kalkulasi jarak ke sentra terdekat (misal: *Zona terdekat: Kampus UMM (1.2 km)*).
4. Tunjukkan tabel **Riwayat Event Geofencing**:
   - Setiap perpindahan tercatat rapi dengan label `ENTER` (hijau) atau `EXIT` (kuning) beserta catatan waktu (*timestamp*).

### Langkah 5: Penjelasan Optimasi Daya Baterai (Poin 7)
1. Tunjukkan bagian **Optimasi Daya Baterai (Tracking Profiles)**:
2. Jelaskan 5 prinsip efisiensi baterai yang diterapkan:
   - **Konfigurasi Interval Waktu**: Tidak melakukan polling GPS setiap milidetik, melainkan diatur sesuai profil.
   - **Filter Jarak (Distance Filter)**: Koordinat baru hanya diproses jika pengguna berpindah sejauh batas minimal (3m, 10m, atau 30m).
   - **Pemilihan Tingkat Akurasi**: Menggunakan `Balanced` (triangulasi + WiFi/seluler) secara default alih-alih memaksa `High` (chipset satelit GPS terus bekerja).
   - **Foreground Subscription Only**: Tidak meminta izin background location yang boros baterai dan dilarang kebijakan privasi.
   - **Hentikan Subscription**: Ketika pelacakan dimatikan atau layar ditinggalkan, subscription `watchPositionAsync` langsung di-remove.
3. Tunjukkan statistik **Fix Diterima** vs **Fix Diproses**:
   - Buktikan bahwa angka *Fix Diproses* lebih efisien daripada *Fix Diterima* karena adanya penyaringan filter jarak (*distance-based updates*).

---

## 6. Verifikasi Kesesuaian Matriks Akses
Fitur **Peluang Sekitar (LBS & Peta)** terbuka untuk semua pengguna termasuk akun **Tamu (Guest)** tanpa login, karena perizinan lokasi adalah hak akses perangkat keras fisik (*Device Permission*), bukan pembatasan akun backend. Matriks pada `README.md` telah disesuaikan.
