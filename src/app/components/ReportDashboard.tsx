"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2, Trash2 } from "lucide-react";
import * as api from "@/lib/api";
import { Button } from "./ui/button";
import { useApp } from "../providers/AppProvider";
import { toast } from "sonner";

export function ReportDashboard() {
  const { confirmAction } = useApp();
  const [isLoading, setIsLoading] = useState(true);

  // Stats cards - dari /analytics/summary
  const [summary, setSummary] = useState({
    totalJawaban: 0,
    totalRemajaAktif: 0,
    rataWaktuJawab: 0,
    materiAktif: 0,
  });

  // Line chart - dari /analytics/riwayat
  const [riwayatData, setRiwayatData] = useState<
    { tanggal: string; jumlah: number }[]
  >([]);

  // Bar chart - dari /analytics/distribusi-jawaban
  const [distribusiData, setDistribusiData] = useState<
    { soal: string; benar: number; salah: number }[]
  >([]);

  // Activity log - dari /analytics/aktivitas
  const [aktivitasLog, setAktivitasLog] = useState<
    { waktu: string; aksi: string; status: string }[]
  >([]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      // Fetch summary
      try {
        const data = await api.fetchSummary();
        setSummary({
          totalJawaban: data.totalJawaban ?? 0,
          totalRemajaAktif: data.totalRemajaAktif ?? 0,
          rataWaktuJawab: data.rataWaktuJawab ?? 0,
          materiAktif: data.materiAktif ?? 0,
        });
      } catch (err) {
        console.warn("Gagal fetch summary:", err);
      }

      // Fetch aktivitas
      try {
        const data = await api.fetchAktivitas(20);
        if (data && data.length > 0) {
          setAktivitasLog(
            data.map((item) => ({
              waktu: new Date(item.timestamp).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              aksi: `${item.nama} menjawab "${item.jawaban}"`,
              status: item.status || "jawaban",
            }))
          );
        }
      } catch (err) {
        console.warn("Gagal fetch aktivitas:", err);
      }

      // Fetch riwayat
      try {
        const data = await api.fetchRiwayat();
        if (data && data.length > 0) {
          setRiwayatData(data);
        }
      } catch (err) {
        console.warn("Gagal fetch riwayat:", err);
      }

      // Fetch distribusi jawaban
      try {
        const data = await api.fetchDistribusiJawaban();
        if (data && data.length > 0) {
          setDistribusiData(
            data.map((item) => ({
              soal: item.soalText || item.soalId,
              benar: item.distribusi.A,
              salah:
                item.distribusi.B +
                item.distribusi.C +
                item.distribusi.D,
            }))
          );
        }
      } catch (err) {
        console.warn("Gagal fetch distribusi jawaban:", err);
      }

      setIsLoading(false);
    }

    loadData();
  }, []);

  const handleClearLogs = () => {
    confirmAction({
      title: "Hapus Semua Log Aktivitas?",
      description: "Yakin mau membersihkan semua log aktivitas? Data akan dihapus secara permanen.",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      destructive: true,
      onConfirm: async () => {
        try {
          await api.deleteAktivitas();
          setAktivitasLog([]);
          toast.success("Log aktivitas berhasil dibersihkan!");
        } catch (e) {
          toast.error(`Gagal menghapus log: ${(e as Error).message}`);
        }
      }
    });
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-[#1E3A5F] mb-2">
          Laporan & Analytics
        </h2>
        <p className="text-sm text-gray-600">
          Data real-time dari server SANGKARA
        </p>
      </div>

      {/* Stats Cards - Data dari API /analytics/summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-2">Total Jawaban</p>
            {isLoading ? (
              <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
            ) : (
              <>
                <p className="text-2xl font-bold text-[#1E3A5F]">
                  {summary.totalJawaban}
                </p>
                <p className="text-xs text-gray-500 mt-1">respons hari ini</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-2">Remaja Aktif</p>
            {isLoading ? (
              <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
            ) : (
              <>
                <p className="text-2xl font-bold text-[#1E3A5F]">
                  {summary.totalRemajaAktif}
                </p>
                <p className="text-xs text-gray-500 mt-1">yang menjawab</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-2">Rata-rata Waktu Jawab</p>
            {isLoading ? (
              <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
            ) : (
              <>
                <p className="text-2xl font-bold text-[#27AE60]">
                  {summary.rataWaktuJawab}s
                </p>
                <p className="text-xs text-gray-500 mt-1">per soal</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-2">Materi Aktif</p>
            {isLoading ? (
              <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
            ) : (
              <>
                <p className="text-2xl font-bold text-[#1E3A5F]">
                  {summary.materiAktif}
                </p>
                <p className="text-xs text-gray-500 mt-1">sedang berjalan</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Line Chart - Riwayat Jawaban Harian */}
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="bg-[#1E3A5F] text-white p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">
              Riwayat Jawaban Harian
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 p-3 sm:p-4">
            {riwayatData.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
                {isLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  "Belum ada data riwayat"
                )}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={riwayatData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="tanggal"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                  />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line
                    key="line-jawaban"
                    type="monotone"
                    dataKey="jumlah"
                    stroke="#27AE60"
                    strokeWidth={2}
                    name="Jumlah Jawaban"
                    dot={{ fill: "#27AE60" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart - Distribusi Jawaban */}
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="bg-[#1E3A5F] text-white p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">
              Distribusi Jawaban per Soal
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 p-3 sm:p-4">
            {distribusiData.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
                {isLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  "Belum ada data distribusi"
                )}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={distribusiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="soal"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                  />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    key="bar-benar"
                    dataKey="benar"
                    fill="#27AE60"
                    name="Jawaban Benar"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    key="bar-salah"
                    dataKey="salah"
                    fill="#F5A623"
                    name="Jawaban Salah"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Log - dari API /analytics/aktivitas */}
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="bg-[#1E3A5F] text-white p-3 sm:p-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm sm:text-base">
            Log Aktivitas Terbaru
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-white border-white/20 bg-white/10 hover:bg-white/20 hover:text-white"
            onClick={handleClearLogs}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Hapus Log
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0 max-h-[320px] overflow-y-auto px-3 sm:px-4 py-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
              </div>
            ) : aktivitasLog.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">
                  Belum ada aktivitas tercatat
                </p>
              </div>
            ) : (
              aktivitasLog.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between py-2 border-b border-gray-200 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{log.aksi}</p>
                    <p className="text-xs text-gray-500">
                      Status: {log.status}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 ml-3 flex-shrink-0">
                    {log.waktu}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
