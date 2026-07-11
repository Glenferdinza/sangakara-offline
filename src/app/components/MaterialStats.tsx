"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { SavedMaterial } from "@/lib/types";

interface MaterialStatsProps {
  materials: SavedMaterial[];
}

export function MaterialStats({ materials }: MaterialStatsProps) {
  const totalMaterials = materials.length;
  const totalQuestions = materials.reduce((sum, m) => sum + m.jumlahSoal, 0);
  const totalQuotes = materials.reduce((sum, m) => sum + (m.quotes?.length || 0), 0);
  const totalTime = materials.reduce((sum, m) => sum + m.totalWaktu, 0);

  const formatWaktu = (detik: number) => {
    const menit = Math.floor(detik / 60);
    return `${menit} menit`;
  };

  return (
    <Card className="border-gray-200 shadow-md">
      <CardHeader className="bg-[#1E3A5F] text-white p-2.5 sm:p-3">
        <CardTitle className="text-xs sm:text-sm">Ringkasan Data</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        {materials.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500">Belum ada materi tersimpan</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between py-1.5 border-b border-gray-200">
              <span className="text-xs text-gray-600">Materi Tersimpan</span>
              <span className="text-sm font-semibold text-[#1E3A5F]">{totalMaterials}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-gray-200">
              <span className="text-xs text-gray-600">Total Soal</span>
              <span className="text-sm font-semibold text-[#1E3A5F]">{totalQuestions}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-gray-200">
              <span className="text-xs text-gray-600">Total Quotes</span>
              <span className="text-sm font-semibold text-[#F5A623]">{totalQuotes}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-600">Waktu Pengerjaan</span>
              <span className="text-sm font-semibold text-[#1E3A5F]">
                {totalTime === 0 ? "-" : formatWaktu(totalTime)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
