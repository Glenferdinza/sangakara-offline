"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#1E3A5F] text-white border-t border-gray-300 mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* About Section */}
          <div>
            <h3 className="font-semibold text-sm mb-3">SANGKARA</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Sistem Manajemen Pembinaan Karakter Remaja Binaan untuk mengembangkan karakter positif melalui metode pembelajaran interaktif.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Menu Utama</h3>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <Link href="/dashboard" className="hover:text-[#F5A623] transition">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/bank-soal" className="hover:text-[#F5A623] transition">
                  Bank Soal
                </Link>
              </li>
              <li>
                <Link href="/kelola-materi" className="hover:text-[#F5A623] transition">
                  Kelola Materi
                </Link>
              </li>
              <li>
                <Link href="/laporan" className="hover:text-[#F5A623] transition">
                  Laporan
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Informasi</h3>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>Lomba Inovasi Digital Mahasiswa</li>
              <li>Tahun 2026</li>
              <li className="pt-2">
                <span className="text-[#F5A623] font-medium">LIDM</span> - Inovasi untuk Indonesia
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-400">
            <p>&copy; 2026 SANGKARA. Dikembangkan untuk Kompetisi LIDM.</p>
            <p>Version 1.0</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
