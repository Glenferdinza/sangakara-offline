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

REM Cek ketersediaan Node.js
where node >nul 2>nul
if errorlevel 1 (
    color 0C
    echo =====================================================================
    echo ERROR: Node.js tidak ditemukan di komputer Anda!
    echo =====================================================================
    echo Silakan unduh dan pasang Node.js terlebih dahulu dari: https://nodejs.org/
    echo Setelah instalasi selesai, buka kembali file ini.
    echo.
    pause
    exit /b 1
)

REM Cek apakah folder node_modules ada. Jika tidak, jalankan npm install otomatis.
if not exist node_modules (
    echo [SETUP] Folder node_modules tidak ditemukan!
    echo [SETUP] Sedang memasang pustaka pendukung npm install...
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

REM Buka browser secara otomatis
start http://localhost:3000

REM Jalankan Next.js server menggunakan call agar kontrol tidak hilang
call npm run dev

echo.
echo Server terhenti.
pause
