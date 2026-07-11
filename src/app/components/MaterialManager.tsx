"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import * as api from "@/lib/api";
import { Button } from "./ui/button";
import {
  Send,
  Trash2,
  BookOpen,
  Clock,
  ChevronDown,
  ChevronUp,
  Quote,
  CheckCircle2,
  XCircle,
  RotateCcw,
  MoreVertical,
  Edit,
} from "lucide-react";
import type { SavedMaterial } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useApp } from "../providers/AppProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface MaterialManagerProps {
  materials: SavedMaterial[];
  onSendMaterial: (id: string, targetGroups?: number[]) => void;
  onDeleteMaterial: (id: string) => void;
}

// Track status pengiriman per materi
type SendStatus = "idle" | "sending" | "sent" | "failed";

export function MaterialManager({
  materials,
  onSendMaterial,
  onDeleteMaterial,
}: MaterialManagerProps) {
  const router = useRouter();
  const { setEditingMaterialId, confirmAction } = useApp();
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);
  const [sendStatuses, setSendStatuses] = useState<Record<string, SendStatus>>({});
  
  // State for targeting
  const [kelompoks, setKelompoks] = useState<any[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [quickSendTarget, setQuickSendTarget] = useState<string>("ALL");
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);

  useEffect(() => {
    api.fetchKelompok().then(data => {
      if (data && Array.isArray(data)) setKelompoks(data);
    }).catch(err => console.warn("Gagal mengambil data kelompok:", err));
  }, []);

  const formatWaktu = (detik: number) => {
    const menit = Math.floor(detik / 60);
    const sisaDetik = detik % 60;
    return `${menit}:${sisaDetik.toString().padStart(2, "0")}`;
  };

  const toggleExpand = (id: string) => {
    setExpandedMaterial(expandedMaterial === id ? null : id);
  };

  const handleEdit = (id: string) => {
    setEditingMaterialId(id);
    router.push('/bank-soal');
  };

  const handleQuickSend = () => {
    if (!selectedMaterialId || kelompoks.length === 0) return;
    const material = materials.find((m) => m.id === selectedMaterialId);
    if (!material) return;

    const isAll = quickSendTarget === "ALL";
    const targetGroupId = isAll ? null : parseInt(quickSendTarget, 10);
    
    confirmAction({
      title: "Konfirmasi Pengiriman",
      description: `Apakah Anda yakin ingin mengirim materi "${material.judulMateri}" ke ${isAll ? "Semua Papan" : `Papan ${targetGroupId}`}?`,
      confirmText: "Ya, Kirim",
      onConfirm: () => {
        setSendStatuses((prev) => ({ ...prev, [material.id]: "sending" }));
        onSendMaterial(material.id, isAll ? [] : [targetGroupId!]);
        
        // Simulate status (karena onSendMaterial async via AppProvider)
        setTimeout(() => {
          setSendStatuses((prev) => ({ ...prev, [material.id]: "sent" }));
        }, 2000);
      }
    });
  };

  const getStatus = (id: string): SendStatus => {
    return sendStatuses[id] || "idle";
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-[#1E3A5F] mb-2">
          Kelola Materi Soal
        </h2>
        <p className="text-sm text-gray-600">
          Daftar materi yang telah disimpan. Kirim materi ke remaja binaan atau kelola materi yang ada.
        </p>
      </div>

      {materials.length === 0 ? (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              Belum ada materi yang tersimpan. Buat materi di halaman Bank Soal.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Panel Pengiriman Cepat (Quick Send Panel) */}
          <Card className="border-gray-200 shadow-md mb-6">
            <CardHeader className="bg-[#1E3A5F] text-white p-4">
              <CardTitle className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Panel Pengiriman Cepat (Quick Send)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4">
                {/* Dropdown 1: Pilih Materi */}
                <div className="flex-1 space-y-2 relative">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider font-bold">
                    Pilih Materi / Container Soal
                  </label>
                  
                  {/* Trigger Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMaterialDropdownOpen(!isMaterialDropdownOpen);
                      setIsTargetDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between text-sm h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] bg-white text-gray-700 font-medium transition cursor-pointer"
                  >
                    <span className="truncate">
                      {selectedMaterialId
                        ? materials.find((m) => m.id === selectedMaterialId)?.judulMateri
                        : "-- Pilih Materi Soal --"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isMaterialDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Backdrop to close dropdown on click outside */}
                  {isMaterialDropdownOpen && (
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsMaterialDropdownOpen(false)}
                    />
                  )}

                  {/* Custom Scrollable Options List */}
                  {isMaterialDropdownOpen && (
                    <div className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg py-1">
                      <div
                        onClick={() => {
                          setSelectedMaterialId("");
                          setIsMaterialDropdownOpen(false);
                        }}
                        className={`px-3 py-2 text-sm text-gray-500 cursor-pointer hover:bg-blue-50/50 transition-colors ${
                          selectedMaterialId === "" ? "bg-blue-50/30 text-[#1E3A5F] font-semibold" : ""
                        }`}
                      >
                        -- Pilih Materi Soal --
                      </div>
                      {materials.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedMaterialId(m.id);
                            setIsMaterialDropdownOpen(false);
                          }}
                          className={`px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-blue-50/50 transition-colors flex items-center justify-between gap-2 ${
                            selectedMaterialId === m.id ? "bg-blue-50/30 text-[#1E3A5F] font-semibold" : ""
                          }`}
                        >
                          <span className="truncate">{m.judulMateri}</span>
                          <span className="text-[10px] text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                            {m.jumlahSoal} Soal
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dropdown 2: Pilih Target Perangkat */}
                <div className="w-full md:w-72 space-y-2 relative">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider font-bold">
                    Target Papan Permainan
                  </label>

                  {/* Trigger Button */}
                  <button
                    type="button"
                    disabled={!selectedMaterialId || getStatus(selectedMaterialId) === "sending" || kelompoks.length === 0}
                    onClick={() => {
                      setIsTargetDropdownOpen(!isTargetDropdownOpen);
                      setIsMaterialDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between text-sm h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] bg-white text-gray-700 font-medium transition cursor-pointer disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <span className="truncate">
                      {kelompoks.length === 0
                        ? "-- Tidak Ada Papan Terdaftar --"
                        : quickSendTarget === "ALL"
                          ? "Kirim ke: Semua Papan"
                          : `Kirim ke: Papan ${quickSendTarget} (${
                              (kelompoks.find((k) => k.id.toString() === quickSendTarget)?.nama || "").replace(/Kelompok/g, "Papan")
                            })`}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isTargetDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Backdrop to close dropdown on click outside */}
                  {isTargetDropdownOpen && (
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsTargetDropdownOpen(false)}
                    />
                  )}

                  {/* Custom Scrollable Options List */}
                  {isTargetDropdownOpen && (
                    <div className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg py-1">
                      <div
                        onClick={() => {
                          setQuickSendTarget("ALL");
                          setIsTargetDropdownOpen(false);
                        }}
                        className={`px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-blue-50/50 transition-colors ${
                          quickSendTarget === "ALL" ? "bg-blue-50/30 text-[#1E3A5F] font-semibold" : ""
                        }`}
                      >
                        Kirim ke: Semua Papan
                      </div>
                      {kelompoks.map((k) => (
                        <div
                          key={k.id}
                          onClick={() => {
                            setQuickSendTarget(k.id.toString());
                            setIsTargetDropdownOpen(false);
                          }}
                          className={`px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-blue-50/50 transition-colors ${
                            quickSendTarget === k.id.toString() ? "bg-blue-50/30 text-[#1E3A5F] font-semibold" : ""
                          }`}
                        >
                          Kirim ke: Papan {k.id} ({k.nama.replace(/Kelompok/g, "Papan")})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Button: Kirim */}
                <Button
                  onClick={handleQuickSend}
                  disabled={!selectedMaterialId || getStatus(selectedMaterialId) === "sending" || kelompoks.length === 0}
                  className={`h-10 px-6 font-bold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                    !selectedMaterialId || kelompoks.length === 0
                      ? "bg-gray-300 hover:bg-gray-300 cursor-not-allowed text-gray-500"
                      : getStatus(selectedMaterialId) === "sending"
                        ? "bg-yellow-500 hover:bg-yellow-500 cursor-wait animate-pulse"
                        : getStatus(selectedMaterialId) === "sent"
                          ? "bg-[#1E3A5F] hover:bg-[#2C4F75] shadow-sm hover:shadow"
                          : "bg-[#27AE60] hover:bg-[#229954] shadow-sm hover:shadow-md"
                  }`}
                >
                  {getStatus(selectedMaterialId) === "sending" ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : getStatus(selectedMaterialId) === "sent" ? (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Kirim Ulang
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Kirim Soal
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {materials.map((material) => {
            const isExpanded = expandedMaterial === material.id;
            const status = getStatus(material.id);

            return (
              <Card key={material.id} className="border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="bg-[#1E3A5F] text-white p-4">
                  <CardTitle className="text-base flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <BookOpen className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate">{material.judulMateri}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* Status badge */}
                      {status === "sent" && (
                        <span className="flex items-center gap-1 text-[10px] bg-green-500/20 text-green-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Terkirim
                        </span>
                      )}
                      {status === "sending" && (
                        <span className="flex items-center gap-1 text-[10px] bg-yellow-500/20 text-yellow-200 px-2 py-0.5 rounded-full animate-pulse">
                          Mengirim...
                        </span>
                      )}
                      <button
                        onClick={() => toggleExpand(material.id)}
                        className="p-1 hover:bg-white/10 rounded transition flex-shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Jumlah Soal</span>
                      <span className="font-semibold text-[#1E3A5F]">
                        {material.jumlahSoal} soal
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Quote className="w-3.5 h-3.5" />
                        Quotes
                      </span>
                      <span className="font-semibold text-[#F5A623]">
                        {material.quotes?.length || 0} quote
                      </span>
                    </div>
                    {/* Zona info */}
                    {material.zona && material.zona.length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Zona</span>
                        <div className="flex items-center gap-1">
                          {material.zona.map((z) => (
                            <div
                              key={z.id}
                              className="w-4 h-4 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: z.warna }}
                              title={`${z.nama} (${z.rangeStart}-${z.rangeEnd})`}
                            />
                          ))}
                          <span className="text-xs text-gray-500 ml-1">
                            {material.zona.length} zona
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Total Waktu
                      </span>
                      <span className="font-semibold text-[#1E3A5F]">
                        {formatWaktu(material.totalWaktu)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Dibuat</span>
                      <span className="text-gray-500 text-xs">
                        {material.tanggalDibuat}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="pt-3 border-t border-gray-200 space-y-3">
                      {/* Daftar Zona */}
                      {material.zona && material.zona.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">Zona Papan:</p>
                          <div className="flex flex-wrap gap-2">
                            {material.zona.map((z) => (
                              <div
                                key={z.id}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-full border border-gray-200 text-xs"
                              >
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: z.warna }}
                                />
                                <span className="text-gray-700">{z.nama}</span>
                                <span className="text-gray-400">({z.rangeStart}-{z.rangeEnd})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Daftar Soal */}
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Daftar Soal:</p>
                        {material.questions.map((q, idx) => {
                          const zona = material.zona?.find((z) => z.id === q.zonaId);
                          return (
                            <div key={q.id} className="p-2.5 bg-gray-50 rounded border border-gray-200">
                              <div className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-5 h-5 bg-[#1E3A5F] text-white rounded-full flex items-center justify-center text-xs font-semibold">
                                  {idx + 1}
                                </span>
                                <p className="text-xs text-gray-700 line-clamp-2 flex-1">
                                  {q.questionCase || "Belum ada kasus"}
                                  {q.type && q.type !== "none" && (
                                    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-800">
                                      {q.type === "priority" ? "Priority" : "Near End"}
                                    </span>
                                  )}
                                </p>
                                {zona && (
                                  <div
                                    className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5"
                                    style={{ backgroundColor: zona.warna }}
                                    title={zona.nama}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Daftar Quotes */}
                      {material.quotes && material.quotes.length > 0 && (
                        <div className="max-h-48 overflow-y-auto space-y-2">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Daftar Quotes:</p>
                          {material.quotes.map((quote, idx) => (
                            <div key={idx} className="p-2.5 bg-amber-50 rounded border border-amber-200">
                              <div className="flex items-start gap-2">
                                <Quote className="w-4 h-4 text-[#F5A623] mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-gray-700 italic flex-1">&quot;{quote}&quot;</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200 flex gap-2">
                    <Button
                      onClick={() => handleEdit(material.id)}
                      className="flex-1 bg-[#1E3A5F] hover:bg-[#2C4F75] text-white font-semibold text-xs sm:text-sm h-9 rounded flex items-center justify-center gap-1.5 shadow-sm border border-[#1E3A5F] transition-all"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Materi
                    </Button>
                    <Button
                      onClick={() => onDeleteMaterial(material.id)}
                      variant="outline"
                      className="flex-1 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 font-semibold text-xs sm:text-sm h-9 rounded flex items-center justify-center gap-1.5 border border-red-200 hover:border-red-300 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hapus Materi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </>
    )}
    </div>
  );
}
