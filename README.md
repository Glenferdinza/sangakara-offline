# Sangkara Mobile Dashboard

Aplikasi mobile berbasis Expo (React Native) yang digunakan untuk memantau permainan Sangkara, mengelola materi kuis, dan memicu alarm secara lokal/offline melalui smartphone.

## Persyaratan
1. Node.js (versi 18 ke atas) terpasang di komputer.
2. Smartphone Android atau iOS yang terhubung ke jaringan WiFi yang sama dengan server Raspberry Pi (**Sangkara-Net**).

## Cara Menjalankan

### Langkah 0: Download Proyek
Jalankan perintah clone berikut di terminal komputer Anda untuk mengunduh branch mobile ini:
```bash
git clone -b mobile-sangkara-offline https://github.com/Glenferdinza/sangakara-offline.git
cd sangakara-offline
```

### Langkah 1: Persiapan di Komputer
1. Buka terminal/command prompt di dalam folder ini.
2. Pasang library pendukung dengan menjalankan perintah:
   ```bash
   npm install
   ```
3. Mulai server Expo dengan menjalankan perintah:
   ```bash
   npx expo start
   ```
   Terminal akan menampilkan sebuah **QR Code**.

### Langkah 2: Menjalankan di Smartphone
1. Unduh dan pasang aplikasi **Expo Go** dari Google Play Store (Android) atau App Store (iOS).
2. Hubungkan koneksi WiFi smartphone Anda ke hotspot **Sangkara-Net**.
3. Buka aplikasi **Expo Go** di smartphone:
   - **Android:** Pilih menu "Scan QR Code" di aplikasi Expo Go lalu arahkan kamera ke QR Code di layar komputer Anda.
   - **iOS:** Buka aplikasi kamera bawaan iPhone, arahkan ke QR Code di layar komputer, lalu ketuk tautan untuk membuka via Expo Go.
4. Aplikasi Sangkara Mobile akan langsung dimuat secara instan di smartphone Anda.

## Konfigurasi Server
Setelah aplikasi terbuka di handphone:
1. Masuk ke menu/tab **Settings** di pojok kanan bawah.
2. Masukkan alamat IP server Raspberry Pi Anda (default: `http://10.42.0.1:4001`) pada kolom IP Server.
3. Ketuk simpan agar aplikasi terhubung ke database lokal server.
