"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import {
  Save,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Timer,
  Edit3,
  Lock,
  Palette,
  ArrowRight,
  ArrowLeft,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================
// Interfaces
// ============================================================

import { useApp } from "@/app/providers/AppProvider";
import type { Zona, Question, SavedMaterial } from "@/lib/types";
import { useEffect } from "react";

export type { Zona, Question, SavedMaterial };

interface QuestionBankManagerProps {
  onSaveMaterial: (material: SavedMaterial) => void;
  quotes: string[];
  onZonaChange?: (zonaList: Zona[]) => void;
}

// Warna preset yang bisa dipilih admin
const PRESET_COLORS = [
  "#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
  "#14B8A6", "#E11D48", "#7C3AED", "#0EA5E9", "#D97706",
];

const TOTAL_PETAK = 50;

// ============================================================
// Component
// ============================================================

export function QuestionBankManager({ onSaveMaterial, quotes, onZonaChange }: QuestionBankManagerProps) {
  const { confirmAction, editingMaterialId, setEditingMaterialId, savedMaterials, handleUpdateMaterial } = useApp();
  // Step: "zona" atau "soal"
  const [currentStep, setCurrentStep] = useState<"zona" | "soal">("zona");

  // Zona state
  const [zonaList, setZonaList] = useState<Zona[]>([]);
  const [zonaInput, setZonaInput] = useState({
    nama: "",
    warna: PRESET_COLORS[0],
    rangeStart: 1,
    rangeEnd: 10,
  });

  // Soal state
  const [judulMateri, setJudulMateri] = useState("");
  const [isJudulLocked, setIsJudulLocked] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      questionCase: "",
      options: ["", "", "", ""],
      timeLimit: 60,
      zonaId: "",
      correctOption: "A",
      type: "none",
      category: "informatif",
      targetPion: 1,
      studiKasusId: "",
      studiKasusText: "",
    },
  ]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isTypeUnlocked, setIsTypeUnlocked] = useState(false);
  const [isTargetUnlocked, setIsTargetUnlocked] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  // Reset lock states on question navigation
  useEffect(() => {
    setIsTypeUnlocked(false);
    setIsTargetUnlocked(false);
  }, [currentQuestionIndex]);

  // Sync zonaList to parent (QuotesManager) whenever it changes
  useEffect(() => {
    onZonaChange?.(zonaList);
  }, [zonaList, onZonaChange]);

  // Save to LocalStorage anytime material changes
  useEffect(() => {
    if (editingMaterialId) {
      const materialToEdit = savedMaterials.find((m) => m.id === editingMaterialId);
      if (materialToEdit) {
        setJudulMateri(materialToEdit.judulMateri);
        setIsJudulLocked(true);
        
        const loadedQuestions = (materialToEdit.questions || []).map((q: any) => ({
          ...q,
          category: q.category || "informatif",
          targetPion: q.targetPion || 1,
          studiKasusId: q.studiKasusId || "",
          studiKasusText: q.studiKasusText || "",
        }));
        setQuestions(loadedQuestions);
        setZonaList(materialToEdit.zona || []);
        setCurrentQuestionIndex(0);
        setCurrentStep("zona");
      }
    } else {
      // Coba load draft jika tidak sedang mengedit
      const draftStr = localStorage.getItem("materi_draft");
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          const now = Date.now();
          // Cek apakah draft belum kedaluwarsa (5 menit = 300.000 ms)
          if (now - draft.timestamp < 5 * 60 * 1000) {
            setJudulMateri(draft.judulMateri);
            setIsJudulLocked(draft.isJudulLocked);
            
            const loadedQuestions = (draft.questions || []).map((q: any) => ({
              ...q,
              category: q.category || "informatif",
              targetPion: q.targetPion || 1,
              studiKasusId: q.studiKasusId || "",
              studiKasusText: q.studiKasusText || "",
            }));
            setQuestions(loadedQuestions);
      
            if (draft.zona && draft.zona.length > 0) {
              onZonaChange?.(draft.zona);
            }
            setZonaList(draft.zonaList);
            setCurrentQuestionIndex(draft.currentQuestionIndex);
            setCurrentStep(draft.currentStep);
            // Tambahkan flag untuk mencegah overwrite sesaat
          } else {
            localStorage.removeItem("materi_draft"); // Hapus jika sudah lebih dari 5 menit
          }
        } catch (e) {
          console.error("Gagal load draft:", e);
        }
      }
    }
  }, [editingMaterialId, savedMaterials]);

  // Save draft secara berkala tiap kali state berubah
  useEffect(() => {
    if (editingMaterialId) return; // Jangan save draft lokal kalau sedang mengedit materi utama

    const draftData = {
      timestamp: Date.now(),
      judulMateri,
      isJudulLocked,
      questions,
      zonaList,
      currentQuestionIndex,
      currentStep,
    };
    localStorage.setItem("materi_draft", JSON.stringify(draftData));
  }, [
    judulMateri,
    isJudulLocked,
    questions,
    zonaList,
    currentQuestionIndex,
    currentStep,
    editingMaterialId,
  ]);

  // ============================================================
  // Zona Helpers
  // ============================================================

  const getUsedRanges = (): Array<[number, number]> => {
    return zonaList.map((z) => [z.rangeStart, z.rangeEnd]);
  };

  const isRangeOverlap = (start: number, end: number, excludeId?: string): boolean => {
    return zonaList.some((z) => {
      if (excludeId && z.id === excludeId) return false;
      return start <= z.rangeEnd && end >= z.rangeStart;
    });
  };

  const getUncoveredRanges = (): string[] => {
    const covered = new Set<number>();
    zonaList.forEach((z) => {
      for (let i = z.rangeStart; i <= z.rangeEnd; i++) covered.add(i);
    });
    const gaps: string[] = [];
    let gapStart = -1;
    for (let i = 1; i <= TOTAL_PETAK; i++) {
      if (!covered.has(i)) {
        if (gapStart === -1) gapStart = i;
      } else {
        if (gapStart !== -1) {
          gaps.push(gapStart === i - 1 ? `${gapStart}` : `${gapStart}-${i - 1}`);
          gapStart = -1;
        }
      }
    }
    if (gapStart !== -1) {
      gaps.push(gapStart === TOTAL_PETAK ? `${gapStart}` : `${gapStart}-${TOTAL_PETAK}`);
    }
    return gaps;
  };

  const isAllCovered = (): boolean => {
    return getUncoveredRanges().length === 0;
  };

  const addZona = () => {
    const { nama, warna, rangeStart, rangeEnd } = zonaInput;

    if (!nama.trim()) {
      toast.warning("Nama zona harus diisi!");
      return;
    }
    if (rangeStart < 1 || rangeEnd > TOTAL_PETAK || rangeStart > rangeEnd) {
      toast.warning(`Range harus antara 1-${TOTAL_PETAK} dan start <= end`);
      return;
    }
    if (isRangeOverlap(rangeStart, rangeEnd)) {
      toast.warning("Range overlap dengan zona yang sudah ada!");
      return;
    }

    const newZona: Zona = {
      id: "zona_" + Date.now(),
      nama: nama.trim(),
      warna,
      rangeStart,
      rangeEnd,
    };

    setZonaList([...zonaList, newZona]);
    // Auto-suggest next range
    const nextStart = rangeEnd + 1;
    const nextColor = PRESET_COLORS[(zonaList.length + 1) % PRESET_COLORS.length];
    setZonaInput({
      nama: "",
      warna: nextColor,
      rangeStart: Math.min(nextStart, TOTAL_PETAK),
      rangeEnd: Math.min(nextStart + 9, TOTAL_PETAK),
    });

    toast.success(`Zona "${nama}" (${rangeStart}-${rangeEnd}) ditambahkan!`);
  };

  const removeZona = (id: string) => {
    const deletedZona = zonaList.find((z) => z.id === id);
    setZonaList(zonaList.filter((z) => z.id !== id));
    // Hapus zonaId dari soal yang pakai zona ini
    setQuestions((prev) =>
      prev.map((q) => (q.zonaId === id ? { ...q, zonaId: "" } : q))
    );
    
    if (deletedZona) {
      setZonaInput((prev) => ({
        ...prev,
        rangeStart: deletedZona.rangeStart,
        rangeEnd: deletedZona.rangeEnd,
      }));
    }
  };

  const getZonaForCell = (cellNum: number): Zona | undefined => {
    return zonaList.find((z) => cellNum >= z.rangeStart && cellNum <= z.rangeEnd);
  };

  // ============================================================
  // Soal Helpers
  // ============================================================

  const updateCurrentQuestion = (updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[currentQuestionIndex] = {
      ...newQuestions[currentQuestionIndex],
      ...updates,
    };
    setQuestions(newQuestions);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    updateCurrentQuestion({ options: newOptions });
  };

  const addNewQuestion = () => {
    if (!judulMateri.trim()) {
      toast.warning("Judul Materi Kosong", {
        description: "Harap isi Judul Materi terlebih dahulu sebelum menambah soal baru!",
      });
      return;
    }

    if (!isJudulLocked) {
      setIsJudulLocked(true);
    }

    const newQuestion: Question = {
      id: Date.now().toString(),
      questionCase: "",
      options: ["", "", "", ""],
      timeLimit: 60,
      zonaId: zonaList.length > 0 ? zonaList[0].id : "",
      correctOption: "A",
      type: "none",
      category: "informatif",
      targetPion: 1,
      studiKasusId: "",
      studiKasusText: "",
    };
    setQuestions([...questions, newQuestion]);
    setCurrentQuestionIndex(questions.length);
  };

  const handleEditJudul = () => {
    if (questions.length > 1) {
      confirmAction({
        title: "Ubah Judul Materi",
        description: "Mengubah judul materi akan mempengaruhi semua soal dalam topik ini. Lanjutkan?",
        confirmText: "Lanjutkan",
        onConfirm: () => {
          setIsJudulLocked(false);
        },
      });
    } else {
      setIsJudulLocked(false);
    }
  };

  const deleteCurrentQuestion = () => {
    if (questions.length === 1) {
      toast.warning("Tidak Dapat Menghapus", {
        description: "Minimal harus ada 1 soal!",
      });
      return;
    }
    const newQuestions = questions.filter((_, idx) => idx !== currentQuestionIndex);
    setQuestions(newQuestions);
    setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
  };

  const isFormValid = () => {
    if (!judulMateri.trim()) return false;
    if (questions.length < 2) return false;
    if (zonaList.length === 0) return false;
    // Semua soal harus punya zona
    if (questions.some((q) => !q.zonaId)) return false;
    return true;
  };

  const saveAllQuestions = () => {
    if (!judulMateri.trim()) {
      toast.warning("Judul Materi Kosong", {
        description: "Isi judul materi terlebih dahulu!",
      });
      return;
    }

    confirmAction({
      title: "Simpan Materi",
      description: `Apakah Anda yakin ingin menyimpan materi "${judulMateri}" dengan ${questions.length} soal, ${zonaList.length} zona, dan ${quotes.length} quote?`,
      confirmText: "Simpan",
      onConfirm: () => {
        const totalWaktu = questions.reduce((sum, q) => sum + q.timeLimit, 0);

        const savedMaterial: SavedMaterial = {
          id: editingMaterialId || Date.now().toString(),
          judulMateri: judulMateri.trim(),
          jumlahSoal: questions.length,
          tanggalDibuat: new Date().toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          totalWaktu: totalWaktu,
          questions: [...questions],
          quotes: [...quotes],
          zona: [...zonaList],
        };

        if (editingMaterialId) {
          handleUpdateMaterial(editingMaterialId, savedMaterial);
        } else {
          onSaveMaterial(savedMaterial);
        }

        // Hapus draft setelah berhasil disimpan
        localStorage.removeItem("materi_draft");

        // Reset form
        setJudulMateri("");
        setIsJudulLocked(false);
        setQuestions([
          {
            id: Date.now().toString(),
            questionCase: "",
            options: ["", "", "", ""],
            timeLimit: 60,
            zonaId: "",
            correctOption: "A",
            type: "none",
            category: "informatif",
            targetPion: 1,
            studiKasusId: "",
            studiKasusText: "",
          },
        ]);
        setCurrentQuestionIndex(0);
        setZonaList([]);
        setCurrentStep("zona");

        toast.success("Materi Tersimpan", {
          description: `Materi "${savedMaterial.judulMateri}" dengan ${savedMaterial.jumlahSoal} soal dan ${savedMaterial.zona.length} zona berhasil disimpan!`,
        });
      }
    });
  };

  // ============================================================
  // Step Navigation
  // ============================================================

  const goToSoalStep = () => {
    if (zonaList.length === 0) {
      toast.warning("Buat minimal 1 zona terlebih dahulu!");
      return;
    }
    if (!isAllCovered()) {
      const gaps = getUncoveredRanges();
      toast.warning("Ada petak yang belum tercover zona", {
        description: `Petak berikut belum punya zona: ${gaps.join(", ")}. Semua petak 1-${TOTAL_PETAK} harus tercover.`,
      });
      return;
    }
    // Set default zona untuk soal pertama
    if (questions[0] && !questions[0].zonaId && zonaList.length > 0) {
      const updated = [...questions];
      updated[0] = { ...updated[0], zonaId: zonaList[0].id };
      setQuestions(updated);
    }
    setCurrentStep("soal");
  };

  const goBackToZona = () => {
    setCurrentStep("zona");
  };

  // ============================================================
  // RENDER: Step 1 - Setup Zona
  // ============================================================

  const renderZonaStep = () => (
    <div className="space-y-3 sm:space-y-4">
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="bg-[#1E3A5F] text-white p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base md:text-lg">
            Setup Zona Papan Permainan
          </CardTitle>
          <p className="text-xs text-white/70 mt-1">
            Bagi papan {TOTAL_PETAK} petak menjadi zona-zona berwarna. Setiap zona akan punya soal tersendiri.
          </p>
        </CardHeader>
        <CardContent className="pt-3 p-3 sm:p-4 md:p-6 space-y-4">

          {/* Input Zona Baru */}
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <Label className="text-[#2D3748] font-semibold text-sm">Tambah Zona Baru</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Nama Zona</Label>
                <Input
                  placeholder="contoh: Zona Mudah"
                  value={zonaInput.nama}
                  onChange={(e) => setZonaInput({ ...zonaInput, nama: e.target.value })}
                  className="h-9 text-sm border-gray-300"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Warna</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setZonaInput({ ...zonaInput, warna: c })}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        zonaInput.warna === c
                          ? "border-[#1E3A5F] scale-110 shadow-md"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: c }}
                      type="button"
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Petak Awal</Label>
                <Input
                  type="number"
                  min={1}
                  max={TOTAL_PETAK}
                  value={zonaInput.rangeStart === 0 ? "" : zonaInput.rangeStart}
                  placeholder="0"
                  disabled={isAllCovered()}
                  onChange={(e) =>
                    setZonaInput({ ...zonaInput, rangeStart: e.target.value ? parseInt(e.target.value) : 0 })
                  }
                  className={`h-9 text-sm border-gray-300 ${isAllCovered() ? "bg-gray-100 cursor-not-allowed opacity-70" : ""}`}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Petak Akhir</Label>
                <Input
                  type="number"
                  min={1}
                  max={TOTAL_PETAK}
                  value={zonaInput.rangeEnd === 0 ? "" : zonaInput.rangeEnd}
                  placeholder="0"
                  disabled={isAllCovered()}
                  onChange={(e) =>
                    setZonaInput({ ...zonaInput, rangeEnd: e.target.value ? parseInt(e.target.value) : 0 })
                  }
                  className={`h-9 text-sm border-gray-300 ${isAllCovered() ? "bg-gray-100 cursor-not-allowed opacity-70" : ""}`}
                />
              </div>
            </div>
            <Button
              onClick={addZona}
              disabled={isAllCovered()}
              className={`w-full h-9 text-sm font-semibold transition-all ${
                isAllCovered()
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-70"
                  : "bg-[#F5A623] hover:bg-[#E69500] text-white"
              }`}
              type="button"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {isAllCovered() ? "Zona Sudah Penuh (50 Petak)" : "Tambah Zona"}
            </Button>
          </div>

          {/* Daftar Zona */}
          {zonaList.length > 0 && (
            <div className="space-y-2">
              <Label className="text-[#2D3748] font-semibold text-sm">
                Zona Terdaftar ({zonaList.length})
              </Label>
              {zonaList.map((zona) => (
                <div
                  key={zona.id}
                  className="flex items-center gap-3 p-2.5 bg-white border border-gray-200 rounded-lg"
                >
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 shadow-inner"
                    style={{ backgroundColor: zona.warna }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{zona.nama}</p>
                    <p className="text-xs text-gray-500">
                      Petak {zona.rangeStart} - {zona.rangeEnd} ({zona.rangeEnd - zona.rangeStart + 1} petak)
                    </p>
                  </div>
                  <button
                    onClick={() => removeZona(zona.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    type="button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Coverage Status */}
          <div className={`p-3 rounded-lg text-sm ${
            zonaList.length === 0
              ? "bg-gray-50 text-gray-500"
              : isAllCovered()
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}>
            {zonaList.length === 0 ? (
              <p>Belum ada zona. Tambahkan zona untuk membagi papan permainan.</p>
            ) : isAllCovered() ? (
              <p>Semua {TOTAL_PETAK} petak sudah tercover zona. Siap lanjut ke buat soal!</p>
            ) : (
              <p>
                Petak yang belum tercover: <strong>{getUncoveredRanges().join(", ")}</strong>.
                Semua petak 1-{TOTAL_PETAK} harus punya zona.
              </p>
            )}
          </div>

          {/* Preview Papan Mini */}
          {zonaList.length > 0 && (
            <div className="space-y-2">
              <Label className="text-[#2D3748] font-semibold text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#F5A623]" />
                Preview Papan
              </Label>
              <div className="space-y-0.5">
                {[4, 3, 2, 1, 0].map((row) => {
                  const isReversed = row % 2 === 1;
                  return (
                    <div key={row} className="grid grid-cols-10 gap-0.5">
                      {Array.from({ length: 10 }, (_, i) => {
                        const cellNum = isReversed
                          ? row * 10 + (10 - i)
                          : row * 10 + i + 1;
                        const zona = getZonaForCell(cellNum);
                        return (
                          <div
                            key={cellNum}
                            className={`aspect-square rounded text-[8px] sm:text-[10px] font-bold flex items-center justify-center ${
                              zona
                                ? "border border-white/30"
                                : "border border-dashed border-[#C4B5A0]"
                            }`}
                            style={{
                              backgroundColor: zona ? zona.warna : "#F0EBE3",
                              color: zona ? "#fff" : "#A69580",
                            }}
                            title={zona ? `${zona.nama} (${zona.rangeStart}-${zona.rangeEnd})` : `Petak ${cellNum} - belum ada zona`}
                          >
                            {cellNum}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              {/* Legenda */}
              <div className="flex flex-wrap gap-2 mt-2">
                {zonaList.map((z) => (
                  <div key={z.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: z.warna }}
                    />
                    <span>{z.nama} ({z.rangeStart}-{z.rangeEnd})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lanjut ke Buat Soal */}
      <Button
        onClick={goToSoalStep}
        disabled={zonaList.length === 0}
        className="w-full bg-[#1E3A5F] hover:bg-[#2C4F75] text-white py-4 sm:py-5 text-sm sm:text-base font-semibold shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Lanjut ke Buat Soal
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );

  // ============================================================
  // RENDER: Step 2 - Buat Soal
  // ============================================================

  const renderSoalStep = () => {
    const firstIndexWithCaseStudy = questions.findIndex(q => q.category === "kasus" && q.studiKasusId === currentQuestion.studiKasusId);
    const isSecondaryCaseStudy = currentQuestion.category === "kasus" && 
      currentQuestion.studiKasusId !== "" && 
      firstIndexWithCaseStudy !== -1 && 
      firstIndexWithCaseStudy !== currentQuestionIndex;

    return (
      <div className="space-y-3 sm:space-y-4">
      {/* Back button */}
      <Button
        onClick={goBackToZona}
        variant="outline"
        className="text-sm text-[#1E3A5F] border-[#1E3A5F]/30 hover:bg-[#1E3A5F]/5"
        type="button"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Kembali ke Setup Zona
      </Button>

      {/* Question Bank Form */}
      <Card className="border-gray-200 shadow-md">
        <CardHeader className="bg-[#1E3A5F] text-white p-3 sm:p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm sm:text-base md:text-lg">
                Buat Soal - Soal {currentQuestionIndex + 1}/{questions.length}
              </CardTitle>
              <Button
                onClick={deleteCurrentQuestion}
                size="sm"
                className="bg-gray-500 hover:bg-gray-600 text-white h-8 w-8 p-0 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Judul Materi (contoh: Pembelajaran Kejujuran dalam Kehidupan)"
                  value={judulMateri}
                  onChange={(e) => setJudulMateri(e.target.value)}
                  disabled={isJudulLocked}
                  className={`bg-white/10 border-white/20 text-white placeholder:text-white/60 h-9 text-sm pr-8 ${
                    isJudulLocked
                      ? "cursor-not-allowed opacity-70"
                      : "focus:bg-white/20"
                  }`}
                />
                {isJudulLocked && (
                  <Lock className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                )}
              </div>
              {isJudulLocked && (
                <Button
                  onClick={handleEditJudul}
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white h-9 px-3"
                  type="button"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2 p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">

          {/* Zona Dropdown */}
          <div className="space-y-1.5">
            <Label className="text-[#2D3748] font-medium text-xs sm:text-sm flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#F5A623]" />
              Zona Soal
            </Label>
            <div className="flex flex-wrap gap-2">
              {zonaList.map((z) => {
                const isSelected = currentQuestion.zonaId === z.id;
                return (
                  <button
                    key={z.id}
                    onClick={() => updateCurrentQuestion({ zonaId: z.id })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-sm transition-all ${
                      isSelected
                        ? "border-[#1E3A5F] bg-[#1E3A5F]/5 font-semibold shadow-sm"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    type="button"
                  >
                    <div
                      className="w-4 h-4 rounded-full shadow-inner"
                      style={{ backgroundColor: z.warna }}
                    />
                    <span className="text-gray-700">{z.nama}</span>
                    <span className="text-[10px] text-gray-400">({z.rangeStart}-{z.rangeEnd})</span>
                  </button>
                );
              })}
            </div>
            {!currentQuestion.zonaId && (
              <p className="text-xs text-red-500">Pilih zona untuk soal ini</p>
            )}
          </div>

          {/* Question Case */}
          <div className="space-y-1.5">
            <Label htmlFor="case" className="text-[#2D3748] font-medium text-xs sm:text-sm">
              Pertanyaan / Kasus Soal (Tampil di Alat ESP32 & Layar)
            </Label>
            <Textarea
              id="case"
              placeholder="Tuliskan pertanyaan kuis / soal di sini..."
              value={currentQuestion.questionCase}
              onChange={(e) =>
                updateCurrentQuestion({ questionCase: e.target.value })
              }
              rows={3}
              className="border-gray-300 focus:border-[#F5A623] focus:ring-[#F5A623]/20 resize-none text-sm"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              *Tuliskan pertanyaan pilihan ganda pendek di sini (misal: &quot;Budi terlanjur diajak mencoba ganja. Apa tindakan pertama yang harus ia lakukan?&quot;). Teks ini akan langsung muncul di layar OLED alat ESP32.
            </p>
          </div>

          {/* Toggle/Pilihan Studi Kasus */}
          <div className="p-3 bg-[#1E3A5F]/5 border border-[#1E3A5F]/15 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="link-case"
                type="checkbox"
                checked={currentQuestion.category === "kasus"}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  updateCurrentQuestion({
                    category: isChecked ? "kasus" : "informatif",
                    studiKasusId: isChecked ? (currentQuestion.studiKasusId || "studi_kasus_" + Date.now()) : "",
                    studiKasusText: isChecked ? (currentQuestion.studiKasusText || "") : "",
                    targetPion: isChecked ? (currentQuestion.targetPion || 1) : undefined
                  });
                }}
                className="w-4 h-4 rounded text-[#1E3A5F] focus:ring-[#1E3A5F]/20 cursor-pointer"
              />
              <Label htmlFor="link-case" className="text-[#1E3A5F] font-semibold text-xs sm:text-sm cursor-pointer select-none">
                Hubungkan dengan Studi Kasus Khusus Kelompok
              </Label>
            </div>

            {currentQuestion.category === "kasus" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3 pt-1 overflow-hidden"
              >
                {/* Dropdown Reuse Case Study */}
                {(() => {
                  const existingCaseStudies = questions
                    .filter((q, idx) => q.category === 'kasus' && q.studiKasusId && q.studiKasusText && idx !== currentQuestionIndex)
                    .reduce((acc: Array<{ id: string; text: string; targetPion: number; type: any }>, cur) => {
                      // Filter duplikasi berdasarkan ID maupun teks cerita (agar jika isi ceritanya sama persis, hanya muncul sekali di dropdown)
                      const isDuplicate = acc.some(x => x.id === cur.studiKasusId || x.text.trim() === cur.studiKasusText?.trim());
                      if (!isDuplicate) {
                        acc.push({
                          id: cur.studiKasusId!,
                          text: cur.studiKasusText!,
                          targetPion: cur.targetPion || 1,
                          type: cur.type || "none"
                        });
                      }
                      return acc;
                    }, []);

                  const firstIndexWithCaseStudy = questions.findIndex(q => q.category === "kasus" && q.studiKasusId === currentQuestion.studiKasusId);
                  const isSecondaryCaseStudy = currentQuestion.category === "kasus" && 
                    currentQuestion.studiKasusId !== "" && 
                    firstIndexWithCaseStudy !== -1 && 
                    firstIndexWithCaseStudy !== currentQuestionIndex;

                  return (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600 font-medium">Gunakan Studi Kasus yang Sudah Ada</Label>
                        <select
                          className="flex h-9 w-full rounded border border-gray-300 bg-white px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
                          value={currentQuestion.studiKasusId || "NEW"}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "NEW") {
                              updateCurrentQuestion({
                                studiKasusId: "studi_kasus_" + Date.now(),
                                studiKasusText: "",
                                targetPion: 1,
                                type: "none"
                              });
                            } else {
                              const found = existingCaseStudies.find(x => x.id === val);
                              if (found) {
                                updateCurrentQuestion({
                                  studiKasusId: found.id,
                                  studiKasusText: found.text,
                                  targetPion: found.targetPion,
                                  type: found.type // Sync type!
                                });
                              }
                            }
                          }}
                        >
                          <option value="NEW">-- Buat Studi Kasus Baru --</option>
                          {existingCaseStudies.map(cs => (
                            <option key={cs.id} value={cs.id}>
                              {cs.text.substring(0, 40)}... (Kelompok {cs.targetPion})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Target Kelompok (Pion) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-gray-600 font-medium">Target Kelompok (Pion)</Label>
                          {isSecondaryCaseStudy && !isTargetUnlocked && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsTargetUnlocked(true);
                                toast.info("Target Kelompok dibuka", {
                                  description: "Perubahan target akan otomatis disinkronkan ke seluruh soal kuis yang menggunakan studi kasus ini."
                                });
                              }}
                              className="flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 transition-colors"
                              title="Klik untuk membuka kunci target kelompok"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Buka Kunci</span>
                            </button>
                          )}
                          {isSecondaryCaseStudy && isTargetUnlocked && (
                            <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                              Terbuka & Sinkron
                            </span>
                          )}
                        </div>
                        <select
                          value={currentQuestion.targetPion || 1}
                          disabled={isSecondaryCaseStudy && !isTargetUnlocked}
                          onChange={(e) => {
                            const pionId = parseInt(e.target.value);
                            const cId = currentQuestion.studiKasusId;
                            if (cId) {
                              setQuestions(prev => prev.map(q => q.studiKasusId === cId ? { ...q, targetPion: pionId } : q));
                            } else {
                              updateCurrentQuestion({ targetPion: pionId });
                            }
                          }}
                          className="flex h-9 w-full rounded border border-gray-300 bg-white px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A5F] disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                          <option value={1}>Kelompok 1 (Pion 1)</option>
                          <option value={2}>Kelompok 2 (Pion 2)</option>
                          <option value={3}>Kelompok 3 (Pion 3)</option>
                          <option value={4}>Kelompok 4 (Pion 4)</option>
                        </select>
                      </div>
                    </>
                  );
                })()}

                {/* Narasi Cerita Kasus */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600 font-medium">Narasi Studi Kasus Panjang (Cerita Latar Belakang Kelompok)</Label>
                  <Textarea
                    placeholder="Tuliskan cerita latar belakang kasus panjang untuk dibaca kelompok..."
                    value={currentQuestion.studiKasusText || ""}
                    onChange={(e) => {
                      const textVal = e.target.value;
                      const cId = currentQuestion.studiKasusId;
                      if (cId) {
                        setQuestions(prev => prev.map(q => q.studiKasusId === cId ? { ...q, studiKasusText: textVal } : q));
                      } else {
                        updateCurrentQuestion({ studiKasusText: textVal });
                      }
                    }}
                    rows={4}
                    className="border-gray-300 focus:border-[#F5A623] focus:ring-[#F5A623]/20 resize-none text-xs"
                  />
                  <p className="text-[10px] text-gray-500 italic">
                    *Teks cerita ini adalah narasi panjang (misal: cerita detail kasus Budi) yang dibaca bersama di layar utama. Teks ini hanya akan muncul sekali saat kelompok mendarat pertama kali di rentetan soal ini.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Time Limit */}
          <div className="space-y-1.5">
            <Label htmlFor="timeLimit" className="text-[#2D3748] font-medium text-xs sm:text-sm flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-[#F5A623]" />
              Batas Waktu (detik)
            </Label>
            <Input
              id="timeLimit"
              type="number"
              min="10"
              max="600"
              value={currentQuestion.timeLimit === 0 ? "" : currentQuestion.timeLimit}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  updateCurrentQuestion({ timeLimit: 0 });
                } else {
                  const numValue = parseInt(value);
                  if (!isNaN(numValue)) {
                    updateCurrentQuestion({ timeLimit: numValue });
                  }
                }
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value === "" || parseInt(value) < 10) {
                  updateCurrentQuestion({ timeLimit: 60 });
                } else if (parseInt(value) > 600) {
                  updateCurrentQuestion({ timeLimit: 600 });
                }
              }}
              className="border-gray-300 focus:border-[#F5A623] focus:ring-[#F5A623]/20 h-9 text-sm"
              placeholder="60"
            />
            <p className="text-[10px] text-gray-500">
              {currentQuestion.timeLimit === 0 ? "Belum diatur" : `${Math.floor(currentQuestion.timeLimit / 60)}:${(currentQuestion.timeLimit % 60).toString().padStart(2, '0')} menit`}
            </p>
          </div>

          {/* Multiple Choice Options */}
          <div className="space-y-2">
            <Label className="text-[#2D3748] font-medium text-xs sm:text-sm">
              Opsi Jawaban
            </Label>
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <span className="flex items-center justify-center w-7 h-9 bg-[#1E3A5F] text-white rounded font-medium text-sm flex-shrink-0">
                  {String.fromCharCode(65 + index)}
                </span>
                <Input
                  placeholder={`Opsi ${String.fromCharCode(65 + index)}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="border-gray-300 focus:border-[#F5A623] focus:ring-[#F5A623]/20 h-9 text-sm"
                />
              </div>
            ))}
          </div>

          {/* Correct Answer Selection */}
          <div className="space-y-2">
            <Label className="text-[#2D3748] font-medium text-xs sm:text-sm">
              Kunci Jawaban Benar (Bisa Pilih Lebih Dari Satu)
            </Label>
            <div className="flex gap-4 items-center">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const isChecked = (currentQuestion.correctOption || "A").includes(opt);
                return (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[#4A5568]">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        let current = currentQuestion.correctOption || "A";
                        if (isChecked) {
                          const updated = current.replace(opt, "");
                          if (updated.length > 0) {
                            updateCurrentQuestion({ correctOption: updated });
                          }
                        } else {
                          const updated = Array.from(new Set([...current.split(""), opt]))
                            .sort()
                            .join("");
                          updateCurrentQuestion({ correctOption: updated });
                        }
                      }}
                      className="rounded border-gray-300 text-[#F5A623] focus:ring-[#F5A623]"
                    />
                    Opsi {opt}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Question Type Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[#2D3748] font-medium text-xs sm:text-sm">
                Tipe Soal (Prioritas Kemunculan)
              </Label>
              {isSecondaryCaseStudy && !isTypeUnlocked && (
                <button
                  type="button"
                  onClick={() => {
                    setIsTypeUnlocked(true);
                    toast.info("Tipe Soal dibuka", {
                      description: "Perubahan tipe akan otomatis disinkronkan ke seluruh soal kuis yang menggunakan studi kasus ini."
                    });
                  }}
                  className="flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 transition-colors"
                  title="Klik untuk membuka kunci tipe soal"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Buka Kunci</span>
                </button>
              )}
              {isSecondaryCaseStudy && isTypeUnlocked && (
                <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                  Terbuka & Sinkron
                </span>
              )}
            </div>
            <select
              value={currentQuestion.type || "none"}
              disabled={isSecondaryCaseStudy && !isTypeUnlocked}
              onChange={(e) => {
                const newType = e.target.value as any;
                const cId = currentQuestion.studiKasusId;
                if (currentQuestion.category === "kasus" && cId) {
                  setQuestions(prev => prev.map(q => q.studiKasusId === cId ? { ...q, type: newType } : q));
                } else {
                  updateCurrentQuestion({ type: newType });
                }
              }}
              className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F5A623] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="none">Normal (Acak / Default)</option>
              <option value="priority">Priority (Pertama kali Pion Roll Dadu)</option>
              <option value="near_end">Near End (Utamakan saat pion mendekati akhir zona)</option>
            </select>
          </div>

          {/* Navigation Buttons */}
          {questions.length > 1 && (
            <div className="flex gap-2 pt-1">
              <Button
                onClick={() =>
                  setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
                }
                disabled={currentQuestionIndex === 0}
                className="flex-1 bg-[#1E3A5F] hover:bg-[#2C4F75] text-white disabled:bg-gray-300 disabled:text-gray-500 h-9 text-xs sm:text-sm"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Soal Sebelumnya</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              <Button
                onClick={() =>
                  setCurrentQuestionIndex(
                    Math.min(questions.length - 1, currentQuestionIndex + 1)
                  )
                }
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex-1 bg-[#1E3A5F] hover:bg-[#2C4F75] text-white disabled:bg-gray-300 disabled:text-gray-500 h-9 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Soal Berikutnya</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Add New Question Button */}
          <Button
            onClick={addNewQuestion}
            className="w-full bg-[#F5A623] hover:bg-[#E69500] text-white shadow-sm h-9 text-xs sm:text-sm font-semibold"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
            Tambah Soal Baru
          </Button>
        </CardContent>
      </Card>

      {/* Save All Questions Button */}
      <Button
        onClick={saveAllQuestions}
        disabled={!isFormValid()}
        className="w-full bg-[#27AE60] hover:bg-[#229954] text-white py-4 sm:py-5 text-sm sm:text-base md:text-lg font-semibold shadow-md disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Simpan Materi ({questions.length} Soal, {zonaList.length} Zona)
      </Button>
    </div>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================

  return (
    <div className="space-y-4">
      {editingMaterialId && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#1E3A5F] p-3 sm:p-4 rounded-xl border border-[#1E3A5F]/20 shadow-md">
          <div>
            <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-0.5">Sedang Mengedit Materi</p>
            <p className="text-sm font-semibold text-white">{judulMateri || "Materi Belum Berjudul"}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-none w-full sm:w-auto font-medium"
            onClick={() => {
              confirmAction({
                title: "Batalkan Edit Materi?",
                description: "Yakin ingin membatalkan edit? Perubahan yang belum disimpan akan hilang.",
                confirmText: "Ya, Batalkan",
                cancelText: "Kembali",
                destructive: true,
                onConfirm: () => {
                  setEditingMaterialId(null);
                  localStorage.removeItem("materi_draft");
                  window.location.href = "/kelola-materi";
                }
              });
            }}
          >
            Batal Edit & Kembali
          </Button>
        </div>
      )}
      {currentStep === "zona" ? renderZonaStep() : renderSoalStep()}
    </div>
  );
}
