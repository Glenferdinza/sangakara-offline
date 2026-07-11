"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AlertTriangle, Plus, Power, Edit2, Check, X, Trash2, Trophy, Medal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "./ui/badge";
import * as api from "@/lib/api";
import { toast } from "sonner";
import { useNotifications } from "../providers/NotificationProvider";
import { useApp } from "../providers/AppProvider";
import { IoTControl } from "./IoTControl";
import type { Zona, PionPosition, KelompokData } from "@/lib/types";

const PION_COLORS = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6"];
const PION_LABELS = ["K1", "K2", "K3", "K4"];

export function GameDashboard() {
  const [jumlahKelompok, setJumlahKelompok] = useState(0);
  const [inputKelompok, setInputKelompok] = useState("");
  const [activeTab, setActiveTab] = useState<string>("global");
  const [globalAlarmActive, setGlobalAlarmActive] = useState<boolean>(false);
  const [kelompokAlarmState, setKelompokAlarmState] = useState<Record<number, boolean>>({});
  const [kelompokData, setKelompokData] = useState<KelompokData[]>([]);
  const [editingKelompok, setEditingKelompok] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [leaderboardSource, setLeaderboardSource] = useState<string>("global");
  const { addNotification } = useNotifications();
  const { savedMaterials, confirmAction } = useApp();

  // Ambil zona dari materi terbaru yang ada zona-nya
  const activeZona: Zona[] = savedMaterials
    .filter((m) => m.zona && m.zona.length > 0)
    .flatMap((m) => m.zona)
    .length > 0
    ? savedMaterials.filter((m) => m.zona && m.zona.length > 0).slice(-1)[0].zona
    : [];

  const getZonaForCell = useCallback((cellNum: number): Zona | undefined => {
    return activeZona.find((z) => cellNum >= z.rangeStart && cellNum <= z.rangeEnd);
  }, [activeZona]);

  // Ambil data kelompok dari server dan sinkronkan dengan state lokal
  const fetchKelompokFromServer = useCallback(() => {
    api.fetchKelompok()
      .then((data) => {
        if (data && Array.isArray(data)) {
          setKelompokData((prev) => {
            const merged = data.map((d) => {
              const existing = prev.find(p => p.id === d.id);
              if (existing) {
                // Update nama saja, biarkan status aktif & posisi tetap
                return { ...existing, name: d.nama };
              }
              // Jika ada kelompok baru dari device lain, otomatis aktif
              return {
                id: d.id,
                name: d.nama,
                isActive: true,
                status: "playing",
                pionPositions: Array.from({ length: 4 }, (_, j) => ({
                  playerId: j + 1,
                  position: 1,
                  status: "idle",
                })),
              } as KelompokData;
            });
            return merged;
          });
          setJumlahKelompok(data.length);
        }
      })
      .catch((err) => console.warn("Gagal fetch kelompok:", err));
  }, []);

  useEffect(() => {
    fetchKelompokFromServer();
    // Sinkronisasi data kelompok (tambah/hapus) dari device lain tiap 10 detik
    // Interval 10s sangat ringan dan tidak membebani server Jetson
    const syncInterval = setInterval(fetchKelompokFromServer, 10000);
    return () => clearInterval(syncInterval);
  }, [fetchKelompokFromServer]);

  // Polling posisi pion setiap 3 detik untuk kelompok yang aktif
  useEffect(() => {
    const connectedKelompoks = kelompokData.filter((k) => k.isActive && k.status === "playing");
    if (connectedKelompoks.length === 0) return;

    const interval = setInterval(() => {
      connectedKelompoks.forEach((kelompok) => {
        api.fetchPosisiKelompok(kelompok.id)
          .then((posisiData) => {
            if (posisiData && posisiData.length > 0) {
              setKelompokData((prev) =>
                prev.map((k) => {
                  if (k.id !== kelompok.id) return k;
                  return {
                    ...k,
                    pionPositions: posisiData.map((p) => ({
                      playerId: p.player_id,
                      position: p.position,
                    })),
                  };
                })
              );
            }
          })
          .catch(() => {
            // Silent fail - jangan spam error
          });
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [kelompokData]);

  // Auto-switch leaderboard source if there is only 1 group device
  useEffect(() => {
    if (kelompokData.length === 1 && leaderboardSource === "global") {
      setLeaderboardSource(`kelompok-${kelompokData[0].id}`);
    }
  }, [kelompokData, leaderboardSource]);

  const handleAddKelompok = () => {
    const nextId = kelompokData.length > 0
      ? Math.max(...kelompokData.map(k => k.id)) + 1
      : 1;

    const newKelompok: KelompokData = {
      id: nextId,
      name: `Papan ${nextId}`,
      isActive: true,
      status: "playing",
      pionPositions: Array.from({ length: 4 }, (_, j) => ({
        playerId: j + 1,
        position: 1,
        status: "idle",
      })),
      soalTersisa: 0,
    };

    setKelompokData((prev) => [...prev, newKelompok]);
    setJumlahKelompok((prev) => prev + 1);

    // Kirim ke API
    api
      .postKelompok({ jumlah: 1, nama_prefix: "Papan" })
      .then(() => {
        toast.success("Papan Ditambahkan", {
          description: `Papan ${nextId} berhasil ditambahkan ke server.`,
        });
        addNotification({
          type: "success",
          title: "Papan Ditambahkan",
          message: `Papan ${nextId} berhasil didaftarkan ke server.`,
        });
        fetchKelompokFromServer();
      })
      .catch((err) => {
        console.warn("Gagal membuat papan di server:", err);
        toast.error("Gagal Menambahkan", {
          description: `Server tidak merespon saat menambahkan papan ${nextId}.`,
        });
        fetchKelompokFromServer(); // Rollback optimistic update
      });
  };

  const handleStartEdit = (kelompokId: number) => {
    const kelompok = kelompokData.find((k) => k.id === kelompokId);
    if (kelompok) {
      setEditingKelompok(kelompokId);
      setEditName(kelompok.name);
    }
  };

  const handleSaveEdit = () => {
    if (editingKelompok && editName.trim()) {
      setKelompokData((prev) =>
        prev.map((k) =>
          k.id === editingKelompok ? { ...k, name: editName.trim() } : k
        )
      );

      // Update di API
      api
        .updateKelompok(editingKelompok, { nama: editName.trim() })
        .then(() => {
          toast.success("Nama Diperbarui", {
            description: `Kelompok berhasil diubah menjadi "${editName.trim()}".`,
          });
        })
        .catch((err) => {
          console.warn("Gagal update kelompok:", err);
          toast.warning("Nama Diperbarui Lokal", {
            description: "Nama diubah secara lokal. Server tidak merespon.",
          });
        });

      setEditingKelompok(null);
      setEditName("");
    }
  };

  const handleCancelEdit = () => {
    setEditingKelompok(null);
    setEditName("");
  };

  const handleDeleteKelompok = (kelompokId: number) => {
    const kelompok = kelompokData.find((k) => k.id === kelompokId);
    if (!kelompok) return;

    confirmAction({
      title: "Hapus Papan",
      description: `Apakah Anda yakin ingin menghapus ${kelompok.name.replace(/Kelompok/g, "Papan")}? Data tidak dapat dikembalikan.`,
      confirmText: "Ya, Hapus",
      destructive: true,
      onConfirm: () => {
        setKelompokData((prev) => prev.filter((k) => k.id !== kelompokId));
        setJumlahKelompok((prev) => prev - 1);

        // Hapus di API
        api
          .deleteKelompok(kelompokId)
          .then(() => {
            toast.success("Papan Dihapus", {
              description: `${kelompok.name.replace(/Kelompok/g, "Papan")} berhasil dihapus.`,
            });
            addNotification({
              type: "info",
              title: "Papan Dihapus",
              message: `${kelompok.name.replace(/Kelompok/g, "Papan")} berhasil dihapus dari sistem.`,
            });
            fetchKelompokFromServer();
          })
          .catch((err) => {
            console.warn("Gagal hapus kelompok:", err);
            toast.error("Gagal Menghapus", {
              description: `Tidak dapat menghapus ${kelompok.name.replace(/Kelompok/g, "Papan")} dari server.`,
            });
            fetchKelompokFromServer(); // Rollback optimistic update
          });

        // Switch ke tab global kalau tab yang dihapus sedang aktif
        if (activeTab === `kelompok-${kelompokId}`) {
          setActiveTab("global");
        }
      },
    });
  };

  const handleDeleteAllKelompok = () => {
    confirmAction({
      title: "Hapus SEMUA Papan",
      description: `PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA papan (${jumlahKelompok} papan)? Data akan hilang permanen.`,
      confirmText: "Hapus Semua",
      destructive: true,
      onConfirm: () => {
        setKelompokData([]);
        setJumlahKelompok(0);
        setInputKelompok("");
        setActiveTab("global");

        api.deleteAllKelompok()
          .then(() => {
            toast.success("Semua Papan Dihapus", {
              description: "Semua papan berhasil dihapus dari server.",
            });
            fetchKelompokFromServer();
          })
          .catch((err) => {
            console.warn("Gagal hapus semua kelompok:", err);
            toast.error("Gagal Menghapus", {
              description: "Tidak dapat menghapus papan dari server.",
            });
            fetchKelompokFromServer(); // Rollback optimistic update
          });
      },
    });
  };

  const toggleKelompokActive = (kelompokId: number) => {
    const kelompok = kelompokData.find((k) => k.id === kelompokId);
    if (!kelompok) return;

    // Kalau sudah aktif, langsung matikan
    if (kelompok.isActive) {
      setKelompokData((prev) =>
        prev.map((k) =>
          k.id === kelompokId
            ? { ...k, isActive: false, status: "idle" }
            : k
        )
      );
      toast.info("Monitoring Dimatikan", {
        description: `${kelompok.name} monitoring dinonaktifkan.`,
      });
      return;
    }

    // Kalau belum aktif, cek koneksi ke device dulu via API
    setKelompokData((prev) =>
      prev.map((k) =>
        k.id === kelompokId ? { ...k, status: "connecting" as KelompokData["status"] } : k
      )
    );

    toast.loading(`Menghubungkan ke perangkat ${kelompok.name.replace(/Kelompok/g, "Papan")}...`, {
      id: `connect-${kelompokId}`,
    });

    api
      .fetchPosisiKelompok(kelompokId)
      .then((posisiData) => {
        if (posisiData && posisiData.length > 0) {
          // Ada data posisi dari ESP32 - device benar-benar aktif
          setKelompokData((prev) =>
            prev.map((k) => {
              if (k.id !== kelompokId) return k;
              return {
                ...k,
                isActive: true,
                status: "playing" as KelompokData["status"],
                pionPositions: posisiData.map((p) => ({
                  playerId: p.player_id,
                  position: p.position,
                })),
              };
            })
          );
          toast.success("Perangkat Terhubung", {
            id: `connect-${kelompokId}`,
            description: `${kelompok.name.replace(/Kelompok/g, "Papan")} berhasil terhubung. ${posisiData.length} pemain terdeteksi.`,
          });
          addNotification({
            type: "success",
            title: "Perangkat Terhubung",
            message: `${kelompok.name.replace(/Kelompok/g, "Papan")} berhasil terhubung dan monitoring aktif.`,
          });
        } else {
          // API berhasil tapi tidak ada data posisi - ESP32 belum kirim data
          setKelompokData((prev) =>
            prev.map((k) =>
              k.id === kelompokId
                ? { ...k, isActive: false, status: "idle" }
                : k
            )
          );
          toast.warning("Perangkat Belum Aktif", {
            id: `connect-${kelompokId}`,
            description: `${kelompok.name.replace(/Kelompok/g, "Papan")} terdaftar di server, tapi belum ada perangkat ESP32 yang mengirim data. Pastikan alat sudah menyala.`,
          });
          addNotification({
            type: "warning",
            title: "Perangkat Belum Aktif",
            message: `${kelompok.name.replace(/Kelompok/g, "Papan")} belum terdeteksi perangkatnya. Nyalakan ESP32 lalu coba lagi.`,
          });
        }
      })
      .catch((err) => {
        console.warn("Gagal menghubungkan perangkat:", err);
        setKelompokData((prev) =>
          prev.map((k) =>
            k.id === kelompokId
              ? { ...k, isActive: false, status: "idle" }
              : k
          )
        );
        toast.error("Gagal Terhubung", {
          id: `connect-${kelompokId}`,
          description: `Tidak dapat menghubungkan ${kelompok.name}. Perangkat mungkin tidak aktif.`,
        });
        addNotification({
          type: "error",
          title: "Gagal Terhubung",
          message: `${kelompok.name} tidak dapat terhubung ke perangkat. Pastikan device menyala.`,
        });
      });
  };

  const handleKelompokAlarm = (kelompokId: number) => {
    const kelompok = kelompokData.find((k) => k.id === kelompokId);
    const isCurrentlyActive = kelompokAlarmState[kelompokId] || false;
    const action = isCurrentlyActive ? "deactivate" : "activate";

    api
      .postAlarmKelompok(kelompokId, action)
      .then(() => {
        setKelompokAlarmState((prev) => ({ ...prev, [kelompokId]: !isCurrentlyActive }));
        if (!isCurrentlyActive) {
          toast.success("Alarm Aktif", {
            description: `Alarm untuk ${kelompok?.name || `Kelompok ${kelompokId}`} berhasil diaktifkan!`,
          });
          addNotification({
            type: "success",
            title: "Alarm Aktif",
            message: `Alarm untuk ${kelompok?.name || `Kelompok ${kelompokId}`} berhasil diaktifkan.`,
          });
        } else {
          toast.info("Alarm Nonaktif", {
            description: `Alarm untuk ${kelompok?.name || `Kelompok ${kelompokId}`} telah dinonaktifkan.`,
          });
          addNotification({
            type: "info",
            title: "Alarm Nonaktif",
            message: `Alarm untuk ${kelompok?.name || `Kelompok ${kelompokId}`} telah dinonaktifkan.`,
          });
        }
      })
      .catch((err) => {
        console.warn("Gagal mengubah alarm kelompok:", err);
        toast.error("Gagal Mengubah Alarm", {
          description: `Tidak dapat mengaktifkan alarm untuk ${kelompok?.name || `Kelompok ${kelompokId}`}. Periksa koneksi.`,
        });
        addNotification({
          type: "error",
          title: "Gagal Mengaktifkan Alarm",
          message: `Koneksi ke server gagal saat mengaktifkan alarm ${kelompok?.name || `Kelompok ${kelompokId}`}.`,
        });
      });
  };

  // Cek apakah ada minimal 1 kelompok yang terhubung ke ESP32
  const hasAnyConnected = kelompokData.some((k) => k.isActive && k.status === "playing");

  const handleGlobalAlarm = () => {
    if (!hasAnyConnected) {
      toast.warning("Tidak Ada Perangkat Aktif", {
        description: "Hubungkan minimal 1 kelompok ke perangkat ESP32 terlebih dahulu sebelum mengaktifkan alarm.",
      });
      return;
    }
    const newState = !globalAlarmActive;
    setGlobalAlarmActive(newState);

    api
      .postAlarmGlobal(newState ? "activate" : "deactivate")
      .then(() => {
        if (newState) {
          toast.success("Alarm Global Aktif", {
            description: "Alarm global untuk SEMUA kelompok berhasil diaktifkan!",
          });
          addNotification({
            type: "success",
            title: "Alarm Global Aktif",
            message: "Alarm global untuk semua kelompok berhasil diaktifkan.",
          });
        } else {
          toast.info("Alarm Global Nonaktif", {
            description: "Alarm global telah dinonaktifkan.",
          });
          addNotification({
            type: "info",
            title: "Alarm Global Nonaktif",
            message: "Alarm global telah dinonaktifkan.",
          });
        }
      })
      .catch((err) => {
        console.warn("Gagal mengatur alarm global:", err);
        toast.error("Gagal Mengatur Alarm", {
          description: "Tidak dapat mengubah status alarm global. Periksa koneksi server.",
        });
        addNotification({
          type: "error",
          title: "Gagal Mengatur Alarm Global",
          message: "Server tidak merespon saat mengubah status alarm global.",
        });
      });
  };

  // Render board ular tangga dengan warna zona
  const renderBoard = (kelompokId: number) => {
    const kelompok = kelompokData.find((k) => k.id === kelompokId);
    if (!kelompok) return null;

    const rows = [];
    for (let row = 4; row >= 0; row--) {
      const cells = [];
      const isReversed = row % 2 === 1;
      const start = row * 10 + 1;

      for (let i = 0; i < 10; i++) {
        const cellNum = isReversed ? start + (9 - i) : start + i;
        const zona = getZonaForCell(cellNum);

        // Check which pions are on this cell
        const pionsOnCell = kelompok.pionPositions.filter(
          (p) => p.position === cellNum
        );

          const hasCaseStudy = zona && savedMaterials.some((m) =>
            m.questions.some((q) => q.zonaId === zona.id && q.category === 'kasus')
          );

          cells.push(
            <div
              key={cellNum}
              className={`relative aspect-square rounded-lg flex items-center justify-center transition-colors ${zona
                  ? "border border-white/30"
                  : "border border-dashed border-[#C4B5A0]/50"
                }`}
              style={{
                backgroundColor: zona ? zona.warna + "30" : "#F7F3EE",
                borderColor: zona ? zona.warna + "60" : undefined,
              }}
              title={zona ? `${zona.nama} (${zona.rangeStart}-${zona.rangeEnd})` : `Petak ${cellNum}`}
            >
              {/* Cell number */}
              <span
                className="absolute top-0.5 left-1 text-[10px] font-bold"
                style={{ color: zona ? zona.warna : "#A69580" }}
              >
                {cellNum}
              </span>

              {/* Case study indicator badge */}
              {hasCaseStudy && (
                <span
                  className="absolute bottom-0.5 right-1 text-[8px] bg-indigo-100 text-indigo-800 px-1 rounded-sm font-semibold select-none cursor-help scale-75 sm:scale-100"
                  title="Zona ini berisi Studi Kasus Kelompok"
                >
                  Kasus
                </span>
              )}

              {/* Pions on this cell */}
              {pionsOnCell.length > 0 && (
                <div className="flex flex-wrap gap-0.5 items-center justify-center">
                  {pionsOnCell.map((pion) => (
                    <div
                      key={pion.playerId}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-xs font-bold shadow-md text-white`}
                      style={{ backgroundColor: PION_COLORS[pion.playerId - 1] }}
                    >
                      {PION_LABELS[pion.playerId - 1]}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
      }

      rows.push(
        <div key={row} className="grid grid-cols-10 gap-0.5 sm:gap-1">
          {cells}
        </div>
      );
    }

    return (
      <div className="space-y-2 max-w-[1150px] mx-auto">
        <div className="space-y-0.5 sm:space-y-1">{rows}</div>
        {/* Legenda Zona */}
        {activeZona.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t border-gray-200">
            {activeZona.map((z) => (
              <div key={z.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                <div
                  className="w-3 h-3 rounded-full shadow-inner"
                  style={{ backgroundColor: z.warna }}
                />
                <span className="font-medium">{z.nama}</span>
                <span className="text-gray-400">({z.rangeStart}-{z.rangeEnd})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Leaderboard Calculation
  const getLeaderboardData = () => {
    if (leaderboardSource === "global") {
      return [...kelompokData]
        .map((k) => {
          const maxPosition =
            k.pionPositions && k.pionPositions.length > 0
              ? Math.max(...k.pionPositions.map((p) => p.position))
              : 1;
          return {
            id: k.id,
            name: k.name.replace(/Kelompok/g, "Papan"),
            maxPosition,
            type: "device" as const,
          };
        })
        .sort((a, b) => b.maxPosition - a.maxPosition);
    } else {
      const kelompokId = parseInt(leaderboardSource.split("-")[1], 10);
      const target = kelompokData.find((k) => k.id === kelompokId);
      if (!target) return [];

      return [...target.pionPositions]
        .map((p) => ({
          id: p.playerId,
          name: `Kelompok ${p.playerId}`,
          maxPosition: p.position,
          type: "pion" as const,
        }))
        .sort((a, b) => b.maxPosition - a.maxPosition);
    }
  };

  const leaderboard = getLeaderboardData();

  return (
    <div className="w-full space-y-4">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-[#1E3A5F] mb-2">
          Dashboard Monitoring Game
        </h2>
        <p className="text-sm text-gray-600">
          Kontrol dan monitoring permainan ular tangga untuk semua papan
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab("global")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${activeTab === "global"
              ? "bg-[#1E3A5F] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          Kontrol Global
        </button>

        {kelompokData.map((kelompok) => (
          <div key={kelompok.id} className="relative flex items-center">
            {editingKelompok === kelompok.id ? (
              <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-t-lg px-2 py-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-7 w-32 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                />
                <button
                  onClick={handleSaveEdit}
                  className="p-1 hover:bg-green-100 rounded"
                >
                  <Check className="w-4 h-4 text-green-600" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab(`kelompok-${kelompok.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setActiveTab(`kelompok-${kelompok.id}`);
                  }
                }}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap cursor-pointer select-none ${activeTab === `kelompok-${kelompok.id}`
                    ? "bg-[#1E3A5F] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                <span>{kelompok.name.replace(/Kelompok/g, "Papan")}</span>

                {/* Edit & Delete - hanya tampil di tab aktif */}
                {activeTab === `kelompok-${kelompok.id}` && (
                  <div className="flex items-center gap-0.5 ml-1">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(kelompok.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          handleStartEdit(kelompok.id);
                        }
                      }}
                      className="p-1 hover:bg-white/20 rounded transition"
                      title="Edit nama"
                    >
                      <Edit2 className="w-3 h-3" />
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteKelompok(kelompok.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          handleDeleteKelompok(kelompok.id);
                        }
                      }}
                      className="p-1 hover:bg-red-500 hover:text-white rounded transition-colors"
                      title="Hapus papan"
                    >
                      <Trash2 className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "global" && (
        <div className="space-y-4">
          {/* Setup Alat */}
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="bg-[#1E3A5F] text-white p-3 sm:p-4">
              <CardTitle className="text-sm sm:text-base">Setup Papan</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="text-gray-700 w-full sm:w-auto">
                  <p className="text-sm sm:text-base font-bold mb-0.5">Manajemen Papan</p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Total: {jumlahKelompok} papan terdaftar. Setiap papan akan otomatis terdiri dari 4 Pion Kelompok.
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <Button
                    onClick={handleAddKelompok}
                    className="flex-1 sm:flex-none bg-[#F5A623] hover:bg-[#E69500] text-white whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Papan
                  </Button>

                  <Button
                    onClick={handleGlobalAlarm}
                    disabled={!hasAnyConnected}
                    className={`flex-1 sm:flex-none font-bold whitespace-nowrap transition-all text-white ${
                      !hasAnyConnected
                        ? "bg-gray-300 cursor-not-allowed text-gray-500"
                        : globalAlarmActive
                          ? "bg-red-600 hover:bg-red-700 animate-pulse shadow-md"
                          : "bg-orange-500 hover:bg-orange-600 shadow-md"
                    }`}
                  >
                    {globalAlarmActive ? "Matikan Alarm Global" : "Alarm Global"}
                  </Button>

                  {jumlahKelompok > 0 && (
                    <Button
                      onClick={handleDeleteAllKelompok}
                      variant="outline"
                      className="bg-gray-100 border-gray-200 text-gray-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors px-3"
                      title="Hapus Semua Papan"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Live Leaderboard */}
          {/* Live Leaderboard */}
          {leaderboard.length > 0 && (
            <Card className="border-gray-200 shadow-md">
              <CardHeader className="bg-[#1E3A5F] text-white p-3 sm:p-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm sm:text-base font-bold">
                  Live Leaderboard
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-medium text-green-100 uppercase tracking-wider">Live</span>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sumber Peringkat:</span>
                  <select
                    value={leaderboardSource}
                    onChange={(e) => setLeaderboardSource(e.target.value)}
                    className="w-full sm:w-auto bg-white text-gray-800 text-xs rounded border border-gray-300 px-2.5 py-1.5 outline-none cursor-pointer focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] font-semibold text-ellipsis overflow-hidden"
                  >
                    <option value="global">Perbandingan Semua Papan (Global)</option>
                    {kelompokData.map((k) => (
                      <option key={k.id} value={`kelompok-${k.id}`}>
                        Pion di Papan: {k.name.replace(/Kelompok/g, "Papan")}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {leaderboard.map((item, index) => {
                      const isFirst = index === 0;
                      const isSecond = index === 1;
                      const isThird = index === 2;

                      return (
                        <motion.div
                          key={`${item.type}-${item.id}`}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                          className={`flex items-center justify-between p-3 rounded-lg border ${isFirst ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shadow-inner ${isFirst
                                  ? "bg-amber-400 text-white"
                                  : isSecond
                                    ? "bg-gray-300 text-gray-700"
                                    : isThird
                                      ? "bg-orange-300 text-orange-800"
                                      : "bg-gray-100 text-gray-500"
                                }`}
                            >
                              #{index + 1}
                            </div>
                            <div>
                              <h3
                                className={`font-bold text-sm sm:text-base ${isFirst ? "text-amber-900" : "text-gray-800"
                                  }`}
                              >
                                {item.name}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {item.type === "pion"
                                  ? `Pion ${PION_LABELS[item.id - 1]}: Petak ${item.maxPosition}`
                                  : `Posisi Terjauh: Petak ${item.maxPosition}`
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span
                              className={`text-2xl sm:text-3xl font-black italic tracking-tighter ${isFirst
                                  ? "text-amber-500"
                                  : isSecond
                                    ? "text-gray-400"
                                    : isThird
                                      ? "text-orange-400"
                                      : "text-gray-300"
                                  }`}
                            >
                              {item.maxPosition}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Right Column - Status Kelompok & Kontrol IoT */}
          <div className="space-y-4">
            <IoTControl />

            <Card className="border-gray-200 shadow-md">
              <CardHeader className="bg-[#1E3A5F] text-white p-3 sm:p-4">
                <CardTitle className="text-sm sm:text-base">Status Semua Papan</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {kelompokData.map((kelompok) => (
                    <div
                      key={kelompok.id}
                      className="border border-gray-200 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-800">
                          {kelompok.name.replace(/Kelompok/g, "Papan")}
                        </h4>
                        <Badge
                          variant={kelompok.isActive ? "default" : "secondary"}
                          className={
                            kelompok.status === "connecting"
                              ? "bg-yellow-400"
                              : kelompok.isActive
                                ? "bg-green-500"
                                : "bg-gray-400"
                          }
                        >
                          {kelompok.status === "connecting"
                            ? "Connecting..."
                            : kelompok.isActive
                              ? "Terhubung"
                              : "Offline"}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        Status: {kelompok.status === "idle" && "Belum Mulai"}
                        {kelompok.status === "connecting" && "Menghubungkan..."}
                        {kelompok.status === "playing" && "Sedang Bermain"}
                        {kelompok.status === "finished" && "Selesai"}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab per Kelompok */}
      {kelompokData.map((kelompok) => {
        if (activeTab !== `kelompok-${kelompok.id}`) return null;
        const isAlarmActive = kelompokAlarmState[kelompok.id] || false;

        return (
          <div key={kelompok.id} className="space-y-4">
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Card className="border-gray-200 shadow-sm col-span-1">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-600">Status Monitoring</p>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">
                      ESP32 {kelompok.name.replace(/Kelompok/g, "Papan")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleKelompokActive(kelompok.id)}
                      disabled={kelompok.status === "connecting"}
                      className={`p-2.5 rounded-lg transition ${kelompok.status === "connecting"
                          ? "bg-yellow-400 cursor-wait"
                          : kelompok.isActive
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-gray-400 hover:bg-gray-500"
                        }`}
                    >
                      <Power
                        className={`w-5 h-5 text-white ${kelompok.status === "connecting" ? "animate-spin" : ""
                          }`}
                      />
                    </button>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-800">
                        {kelompok.status === "connecting"
                          ? "Menghubungkan..."
                          : kelompok.isActive
                            ? "Terhubung"
                            : "Tidak Terhubung"}
                      </span>
                      {kelompok.status === "connecting" && (
                        <span className="text-[10px] text-yellow-600">
                          Mengecek koneksi {kelompok.name.replace(/Kelompok/g, "Papan")} via server...
                        </span>
                      )}
                      {kelompok.isActive && (
                        <span className="text-[10px] text-green-600">
                          {kelompok.name.replace(/Kelompok/g, "Papan")} merespon - data tersinkronisasi
                        </span>
                      )}
                      {!kelompok.isActive && kelompok.status === "idle" && (
                        <span className="text-[10px] text-gray-400">
                          Klik untuk cek koneksi ESP32 {kelompok.name.replace(/Kelompok/g, "Papan")}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm col-span-1">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-600 mb-2">Status Permainan</p>
                  <p className="text-lg font-bold text-[#1E3A5F]">
                    {kelompok.status === "idle" && "Belum Mulai"}
                    {kelompok.status === "connecting" && "Menghubungkan..."}
                    {kelompok.status === "playing" && "Sedang Bermain"}
                    {kelompok.status === "finished" && "Selesai"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm col-span-1 md:col-span-2">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-600 mb-2">Aktivitas Kelompok (Pion)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {kelompok.pionPositions.map((p) => {
                      const label = PION_LABELS[p.playerId - 1];
                      const color = PION_COLORS[p.playerId - 1];
                      const status = p.status || "idle";
                      return (
                        <div key={p.playerId} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: color }}
                          >
                            {label}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-gray-700">Klp {p.playerId}</span>
                            <span className={`text-[10px] truncate ${status === "reading" ? "text-amber-600 font-semibold animate-pulse" : status === "answering" ? "text-green-600 font-semibold" : "text-gray-500"}`}>
                              {status === "reading" ? "Membaca..." : status === "answering" ? "Menjawab..." : "Diam/Roll"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Papan Ular Tangga */}
            <Card className="border-gray-200 shadow-md">
              <CardHeader className="bg-[#1E3A5F] text-white p-3 sm:p-4">
                <CardTitle className="text-sm sm:text-base">
                  Papan Permainan - {kelompok.name.replace(/Kelompok/g, "Papan")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {renderBoard(kelompok.id)}

                {/* Legend */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Legenda Pion:</p>
                  <div className="flex flex-wrap gap-3">
                    {PION_COLORS.map((color, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {PION_LABELS[idx]}
                        </div>
                        <span className="text-xs text-gray-600">Kelompok {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alarm Control per Kelompok */}
            <Card className="border-gray-200 shadow-md">
              <CardHeader className="bg-[#1E3A5F] text-white p-3 sm:p-4">
                <CardTitle className="text-sm sm:text-base">
                  Kontrol Alarm - {kelompok.name.replace(/Kelompok/g, "Papan")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {!kelompok.isActive && (
                  <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-700">
                      Perangkat belum terhubung. Klik tombol hubungkan di atas terlebih dahulu.
                    </p>
                  </div>
                )}
                <Button
                  onClick={() => handleKelompokAlarm(kelompok.id)}
                  className={`w-full h-auto py-3 sm:py-4 text-xs sm:text-sm md:text-base font-bold flex items-center justify-center flex-wrap gap-2 text-center transition-all text-white shadow-md ${isAlarmActive
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-orange-500 hover:bg-orange-600"
                    }`}
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  {isAlarmActive
                    ? `Nonaktifkan Alarm ${kelompok.name.replace(/Kelompok/g, "Papan")}`
                    : `Aktifkan Alarm ${kelompok.name.replace(/Kelompok/g, "Papan")}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
