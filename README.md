# Sangkara Offline Dashboard

Dashboard Next.js untuk mengelola dan memantau permainan Sangkara secara lokal (offline).

## Persyaratan
1. Windows OS
2. Node.js (versi 18 ke atas)
3. Terhubung ke jaringan WiFi Raspberry Pi (Sangkara-Net)

## Cara Penggunaan
1. Unduh repositori ini dengan menjalankan perintah clone di terminal Anda:
   ```bash
   git clone https://github.com/Glenferdinza/sangakara-offline.git
   cd sangakara-offline
   ```
2. Hubungkan koneksi WiFi laptop ke hotspot **Sangkara-Net**.
3. Jalankan file **`Mulai_Dashboard_Sangkara.bat`** dengan cara klik ganda.
   - Pada pemakaian pertama, skrip akan otomatis menjalankan `npm install` terlebih dahulu untuk memasang library.
   - Pada pemakaian berikutnya, server lokal akan langsung aktif dan otomatis membuka alamat `http://localhost:3000` di browser.

## Konfigurasi IP Backend
Alamat API backend default diatur melalui file `.env` ke IP Raspberry Pi:
```env
NEXT_PUBLIC_API_URL=http://10.42.0.1:4001
```
Jika ingin mengubah alamat IP untuk keperluan testing lokal tanpa memengaruhi berkas utama, buat file baru bernama `.env.local` lalu isi dengan IP yang baru.
