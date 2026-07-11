"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import type { SavedMaterial } from "@/lib/types";
import * as api from "@/lib/api";
import { toast } from "sonner";
import { useNotifications } from "./NotificationProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";

interface AppContextType {
  savedMaterials: SavedMaterial[];
  quotes: string[];
  handleSaveMaterial: (material: SavedMaterial) => void;
  handleAddQuote: (quote: string) => void;
  handleRemoveQuote: (index: number) => void;
  handleSendMaterial: (id: string) => void;
  handleDeleteMaterial: (id: string) => void;
  editingMaterialId: string | null;
  setEditingMaterialId: (id: string | null) => void;
  handleUpdateMaterial: (id: string, material: SavedMaterial) => void;
  confirmAction: (options: {
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
  }) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [savedMaterials, setSavedMaterials] = useState<SavedMaterial[]>([]);
  const [quotes, setQuotes] = useState<string[]>([]);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  // Load from backend on mount, fallback to localStorage
  useEffect(() => {
    // 1. Coba load dari localStorage dulu biar cepat tampil
    const stored = localStorage.getItem("sangkara_saved_materials");
    if (stored) {
      try {
        setSavedMaterials(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved materials", e);
      }
    }

    // 2. Fetch full data dari server untuk sinkronisasi antar device!
    api.fetchMateri().then(async (materiList) => {
      if (materiList && Array.isArray(materiList)) {
        // Ambil list ID materi dari server
        const materiIds = materiList.map((m: any) => m.id);
        
        // Ambil detail full untuk setiap materi
        const fullMaterials = await Promise.all(
          materiIds.map((id: string) => 
            api.fetchMateriDetail(id).catch(() => null)
          )
        );
        
        // Filter out yang gagal difetch
        const validMaterials = fullMaterials.filter(Boolean) as SavedMaterial[];

        // --- BACKGROUND AUTO-SYNC DRAFT KE SERVER ---
        const storedDraftsStr = localStorage.getItem("sangkara_saved_materials");
        if (storedDraftsStr) {
          try {
            const localMaterials = JSON.parse(storedDraftsStr) as SavedMaterial[];
            const drafts = localMaterials.filter(m => m.isDraft);
            if (drafts.length > 0) {
              console.log(`[Auto-Sync] Menemukan ${drafts.length} draf lokal. Mengunggah ke server...`);
              drafts.forEach((draft) => {
                api.postMateri({
                  id: draft.id,
                  judulMateri: draft.judulMateri,
                  jumlahSoal: draft.jumlahSoal,
                  totalWaktu: draft.totalWaktu,
                  questions: (draft.questions || []).map((q) => {
                    const qId = String(q.id);
                    const needsSanitization = !qId.includes(draft.id) && (!qId.includes('-') || qId.length < 6);
                    const finalId = needsSanitization ? `${draft.id}-q-${qId}` : qId;
                    
                    const validZoneIds = (draft.zona || []).map(z => z.id);
                    const defaultZoneId = validZoneIds.length > 0 ? validZoneIds[0] : "";
                    const isZonaValid = validZoneIds.includes(q.zonaId);
                    const finalZonaId = isZonaValid ? q.zonaId : defaultZoneId;

                    return {
                      ...q,
                      id: finalId,
                      zonaId: finalZonaId
                    };
                  }),
                  quotes: draft.quotes,
                  zona: draft.zona || [],
                  target_groups: []
                }).then(() => {
                  console.log(`[Auto-Sync] Sukses mengunggah draf: "${draft.judulMateri}"`);
                  setSavedMaterials((prev) => 
                    prev.map((m) => (m.id === draft.id ? { ...m, isDraft: false } : m))
                  );
                  addNotification({
                    type: "success",
                    title: "Sinkronisasi Otomatis",
                    message: `Draf "${draft.judulMateri}" berhasil diunggah ke server secara otomatis!`,
                  });
                }).catch((syncErr) => {
                  console.warn(`[Auto-Sync] Gagal mengunggah draf "${draft.judulMateri}":`, syncErr);
                });
              });
            }
          } catch (e) {
            console.error("Gagal mengurai draf lokal untuk auto-sync:", e);
          }
        }
        
        if (validMaterials.length > 0) {
          setSavedMaterials((prev) => {
            const mergedMap = new Map();
            // Masukkan data server dulu
            validMaterials.forEach(m => mergedMap.set(m.id, { ...m, isDraft: false }));
            // Timpa dengan data draft lokal (baik materi baru atau yang diedit) supaya tidak hilang
            prev.filter(m => m.isDraft).forEach(m => mergedMap.set(m.id, m));
            return Array.from(mergedMap.values());
          });
        }
      }
    }).catch(err => console.warn("Belum bisa fetch materi dari server", err));
  }, [addNotification]);

  // Save to localStorage whenever it changes
  useEffect(() => {
    if (savedMaterials.length > 0) {
      localStorage.setItem("sangkara_saved_materials", JSON.stringify(savedMaterials));
    } else {
      // Don't remove if it's just initial empty state, wait, actually if they delete all, it should be empty
      // To handle initial empty state vs deleted all, we can just save it.
      localStorage.setItem("sangkara_saved_materials", JSON.stringify(savedMaterials));
    }
  }, [savedMaterials]);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const confirmAction = useCallback(
    (options: Omit<typeof confirmState, "isOpen">) => {
      setConfirmState({ ...options, isOpen: true });
    },
    []
  );

  const closeConfirm = () => setConfirmState((prev) => ({ ...prev, isOpen: false }));
  
  const executeConfirm = () => {
    confirmState.onConfirm();
    closeConfirm();
  };

  const handleSaveMaterial = useCallback(
    (material: SavedMaterial) => {
      const newMaterial = { ...material, isDraft: true };
      setSavedMaterials((prev) => [...prev, newMaterial]);
      setQuotes([]);

      toast.success("Materi Tersimpan Secara Lokal", {
        description: `Materi "${material.judulMateri}" tersimpan di Kelola Materi. Klik Kirim untuk meneruskannya ke server.`,
      });
      addNotification({
        type: "success",
        title: "Materi Tersimpan Lokal",
        message: `"${material.judulMateri}" tersimpan di draft. Jangan lupa dikirim!`,
      });
    },
    [addNotification]
  );

  const handleUpdateMaterial = useCallback(
    (id: string, updatedMaterial: SavedMaterial) => {
      setSavedMaterials((prev) => 
        prev.map((m) => (m.id === id ? { ...updatedMaterial, id, isDraft: true } : m))
      );
      setEditingMaterialId(null);

      toast.success("Materi Diperbarui", {
        description: `Materi "${updatedMaterial.judulMateri}" diperbarui secara lokal.`,
      });
    },
    []
  );

  const handleAddQuote = useCallback((quote: string) => {
    setQuotes((prev) => [...prev, quote]);
  }, []);

  const handleRemoveQuote = useCallback((index: number) => {
    setQuotes((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const handleSendMaterial = useCallback(
    (id: string, targetGroups?: number[]) => {
      const material = savedMaterials.find((m) => m.id === id);
      if (material) {
        toast.loading("Mengirim materi ke perangkat...", { id: `send-${id}` });

        api
          .postMateri({
            id: material.id,
            judulMateri: material.judulMateri,
            jumlahSoal: material.jumlahSoal,
            totalWaktu: material.totalWaktu,
            questions: (material.questions || []).map((q) => {
              const qId = String(q.id);
              const needsSanitization = !qId.includes(material.id) && (!qId.includes('-') || qId.length < 6);
              const finalId = needsSanitization ? `${material.id}-q-${qId}` : qId;

              const validZoneIds = (material.zona || []).map(z => z.id);
              const defaultZoneId = validZoneIds.length > 0 ? validZoneIds[0] : "";
              const isZonaValid = validZoneIds.includes(q.zonaId);
              const finalZonaId = isZonaValid ? q.zonaId : defaultZoneId;

              return {
                ...q,
                id: finalId,
                zonaId: finalZonaId
              };
            }),
            quotes: material.quotes,
            zona: material.zona || [],
            target_groups: targetGroups || [],
          })
          .then(() => {
            // Kirim instruksi MQTT publish ke Jetson untuk disebarkan ke ESP32
            return api.publishMateri(id, targetGroups);
          })
          .then(() => {
            setSavedMaterials((prev) => 
              prev.map((m) => (m.id === id ? { ...m, isDraft: false } : m))
            );
            toast.success("Materi Terkirim", {
              id: `send-${id}`,
              description: `"${material.judulMateri}" berhasil dikirim ke remaja binaan!`,
            });
            addNotification({
              type: "success",
              title: "Materi Terkirim",
              message: `"${material.judulMateri}" (${material.jumlahSoal} soal) berhasil dikirim ke perangkat.`,
            });
          })
          .catch((err) => {
            console.warn("Gagal mengirim materi:", err);
            toast.error("Gagal Mengirim", {
              id: `send-${id}`,
              description: `Tidak dapat mengirim "${material.judulMateri}". Periksa koneksi server.`,
            });
            addNotification({
              type: "error",
              title: "Gagal Mengirim Materi",
              message: `Tidak dapat mengirim "${material.judulMateri}" ke perangkat. Periksa koneksi.`,
            });
          });
      }
    },
    [savedMaterials, addNotification]
  );

  const handleDeleteMaterial = useCallback(
    (id: string) => {
      confirmAction({
        title: "Konfirmasi Hapus",
        description: "Apakah Anda yakin ingin menghapus materi ini?",
        confirmText: "Ya, Hapus",
        onConfirm: () => {
          // Hapus dari state lokal dulu supaya UI terasa cepat
          setSavedMaterials((prev) => {
            const material = prev.find((m) => m.id === id);
            const filtered = prev.filter((m) => m.id !== id);

            if (material) {
              // Panggil API untuk hapus di server
              api.deleteMateri(id).catch((err) => {
                console.warn("Gagal menghapus materi dari server:", err);
                // Tidak perlu block UI kalau server gagal, karena ini bisa juga dipakai offline
              });

              toast.success("Materi Dihapus", {
                description: `"${material.judulMateri}" berhasil dihapus.`,
              });
              addNotification({
                type: "info",
                title: "Materi Dihapus",
                message: `"${material.judulMateri}" telah dihapus dari daftar.`,
              });
            }

            return filtered;
          });
        },
      });
    },
    [addNotification, confirmAction]
  );

  return (
    <AppContext.Provider
      value={{
        savedMaterials,
        quotes,
        handleSaveMaterial,
        handleAddQuote,
        handleRemoveQuote,
        handleSendMaterial,
        handleDeleteMaterial,
        editingMaterialId,
        setEditingMaterialId,
        handleUpdateMaterial,
        confirmAction,
      }}
    >
      {children}
      
      <AlertDialog open={confirmState.isOpen} onOpenChange={(open) => !open && closeConfirm()}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-lg sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">{confirmState.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              {confirmState.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:space-x-0">
            <AlertDialogCancel 
              onClick={closeConfirm}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-red-500 hover:text-white hover:border-red-600 transition-colors shadow-sm"
            >
              {confirmState.cancelText || "Batal"}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeConfirm}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-green-500 hover:text-white hover:border-green-600 transition-colors shadow-sm"
            >
              {confirmState.confirmText || "Konfirmasi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppContext.Provider>
  );
}
