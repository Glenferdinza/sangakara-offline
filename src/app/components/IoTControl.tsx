"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertTriangle, Wifi, Radio, RotateCcw } from "lucide-react";
import { Badge } from "./ui/badge";
import { useApp } from "../providers/AppProvider";
import { toast } from "sonner";

export function IoTControl() {
  const { confirmAction } = useApp();

  return (
    <Card className="border-gray-200 shadow-md">
      <CardHeader className="bg-[#1E3A5F] text-white p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm sm:text-base md:text-lg">Kontrol IoT Kelas</CardTitle>
          <Badge variant="outline" className="bg-green-500/20 text-white border-green-300 text-[10px] px-1.5 py-0.5">
            <Wifi className="w-2.5 h-2.5 mr-0.5" />
            MQTT
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 sm:pt-5 p-3 sm:p-4 md:p-6">
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 text-center mt-4">
            <p className="text-xs sm:text-sm text-gray-700 mb-3">
              Reset Data Permainan (Kelompok & Pion)
            </p>
            <Button
              onClick={() => {
                confirmAction({
                  title: "Reset Database Permainan?",
                  description: "YAKIN mau reset semua data Kelompok dan Posisi Pion ke awal? Aksi ini tidak bisa dibatalkan!",
                  confirmText: "Ya, Reset",
                  cancelText: "Batal",
                  destructive: true,
                  onConfirm: async () => {
                    try {
                      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
                      const res = await fetch(`${baseUrl}/iot/reset-db`, { method: "POST" });
                      if (res.ok) toast.success("Database berhasil di-reset ke pengaturan awal!");
                      else toast.error("Gagal mereset! Pastikan API Jetson sudah di-update.");
                    } catch(e) {
                      toast.error("Error: " + (e as Error).message);
                    }
                  }
                });
              }}
              className="w-full py-3 sm:py-4 text-xs sm:text-sm md:text-base font-bold bg-red-600 hover:bg-red-700 text-white shadow-md transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              RESET DATABASE PERMAINAN
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center mt-4">
            <div className="p-2 sm:p-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Broker</p>
              <p className="text-xs sm:text-sm font-bold text-[#1E3A5F]">HiveMQ</p>
            </div>
            <div className="p-2 sm:p-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Topic</p>
              <p className="text-[10px] sm:text-xs font-bold text-[#1E3A5F] truncate">sangkara/alarm</p>
            </div>
            <div className="p-2 sm:p-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Status</p>
              <p className="text-xs sm:text-sm font-bold text-[#27AE60]">Online</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
