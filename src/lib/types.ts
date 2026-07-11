export interface Zona {
  id: string;
  nama: string;
  warna: string;
  rangeStart: number;
  rangeEnd: number;
}

export interface Question {
  id: string;
  questionCase: string;
  options: string[];
  timeLimit: number;
  zonaId: string;
  correctOption?: string;
  type?: "none" | "priority" | "near_end";
  category?: "informatif" | "kasus";
  targetPion?: number; // Target Kelompok (1 s.d. 4)
  studiKasusId?: string;
  studiKasusText?: string;
}

export interface SavedMaterial {
  id: string;
  judulMateri: string;
  jumlahSoal: number;
  tanggalDibuat: string;
  totalWaktu: number;
  questions: Question[];
  quotes: string[];
  zona: Zona[];
  isDraft?: boolean;
}

export interface PionPosition {
  playerId: number;
  position: number;
  status?: string; // 'idle' | 'reading' | 'answering'
}

export interface KelompokData {
  id: number;
  name: string;
  isActive: boolean;
  status: "idle" | "connecting" | "playing" | "finished";
  pionPositions: PionPosition[];
  soalTersisa: number;
}

export interface AnalyticsSummary {
  totalJawaban: number;
  totalRemajaAktif: number;
  rataWaktuJawab: number;
  materiAktif: number;
}

export interface AktivitasLog {
  id: string;
  nama: string;
  jawaban: string;
  waktu: number;
  status: string;
  timestamp: string;
}

export interface RiwayatData {
  tanggal: string;
  jumlah: number;
}

export interface DistribusiJawaban {
  soalId: string;
  soalText: string;
  distribusi: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
}

export interface KelompokPayload {
  jumlah: number;
  nama_prefix: string;
}

export interface MateriPayload {
  judulMateri: string;
  jumlahSoal: number;
  totalWaktu: number;
  questions: Question[];
  quotes: string[];
  zona: Zona[];
  target_groups?: number[];
}

export interface AlarmPayload {
  action: "activate" | "deactivate";
  duration_ms?: number;
}
