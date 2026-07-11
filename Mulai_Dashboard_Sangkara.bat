@echo off
title Sangkara Dashboard Starter
color 0A
cls
echo =====================================================================
echo                 SANGKARA OFFLINE DASHBOARD STARTER
echo =====================================================================
echo.
echo  * PENTING: Pastikan laptop Anda sudah terhubung ke WiFi: Sangkara-Net
echo.

:: Cek apakah folder node_modules ada. Jika tidak, jalankan npm install otomatis.
if not exist node_modules (
    echo [SETUP] Folder node_modules tidak ditemukan!
    echo [SETUP] Sedang memasang pustaka pendukung (npm install)...
    echo.
    call npm install
    echo.
    echo [SETUP] Pemasangan pustaka selesai!
    echo.
)

echo  * Menjalankan server lokal Next.js di laptop Anda...
echo  * Membuka web browser ke http://localhost:3000 secara otomatis...
echo ---------------------------------------------------------------------
echo.

:: Buka browser secara otomatis
start http://localhost:3000

:: Jalankan Next.js server
npm run dev

pause
