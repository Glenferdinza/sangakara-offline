import type { SavedMaterial } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;

  let res: Response;
  try {
      res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        cache: "no-store", // Selalu disable cache untuk dashboard real-time
        ...options,
    });
  } catch {
    throw new Error(
      `Server tidak dapat dihubungi (${path}). Periksa koneksi internet atau status server.`
    );
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`API Error ${res.status}: ${errorText}`);
  }

  const json = await res.json();

  // Server wraps responses in { success: true, data: ... }
  if (json && typeof json === "object" && "data" in json) {
    return json.data as T;
  }

  return json as T;
}

// ============================================================
// Analytics
// ============================================================

/**
 * GET /analytics/summary
 * Response: { total_jawaban_hari_ini, total_remaja_aktif, rata_waktu_jawab, total_materi_aktif }
 */
export async function fetchSummary() {
  const data = await fetchApi<{
    total_jawaban_hari_ini: number;
    total_remaja_aktif: number;
    rata_waktu_jawab: number;
    total_materi_aktif: number;
  }>("/analytics/summary");

  // Map snake_case dari server ke camelCase untuk frontend
  return {
    totalJawaban: data.total_jawaban_hari_ini ?? 0,
    totalRemajaAktif: data.total_remaja_aktif ?? 0,
    rataWaktuJawab: data.rata_waktu_jawab ?? 0,
    materiAktif: data.total_materi_aktif ?? 0,
  };
}

/**
 * GET /analytics/aktivitas?limit=N
 */
export async function fetchAktivitas(limit: number = 20) {
  return fetchApi<
    Array<{
      id: string;
      nama: string;
      jawaban: string;
      waktu: number;
      status: string;
      timestamp: string;
    }>
  >(`/analytics/aktivitas?limit=${limit}`);
}

/**
 * GET /analytics/riwayat
 */
export async function fetchRiwayat(dari?: string, sampai?: string) {
  const params = new URLSearchParams();
  if (dari) params.set("dari", dari);
  if (sampai) params.set("sampai", sampai);
  const query = params.toString();
  return fetchApi<
    Array<{
      tanggal: string;
      jumlah: number;
    }>
  >(`/analytics/riwayat${query ? `?${query}` : ""}`);
}

/**
 * GET /analytics/distribusi-jawaban
 * NOTE: This endpoint has a known SQL bug on the server (GROUP BY issue).
 */
export async function fetchDistribusiJawaban(materiId?: string) {
  const params = new URLSearchParams();
  if (materiId) params.set("materi_id", materiId);
  const query = params.toString();
  return fetchApi<
    Array<{
      soalId: string;
      soalText: string;
      distribusi: { A: number; B: number; C: number; D: number };
    }>
  >(`/analytics/distribusi-jawaban${query ? `?${query}` : ""}`);
}

/**
 * DELETE /analytics/aktivitas
 */
export async function deleteAktivitas() {
  return fetchApi<{ message: string }>("/analytics/aktivitas", {
    method: "DELETE",
  });
}

// ============================================================
// IoT - Materi
// ============================================================

/**
 * POST /iot/materi
 * Server expects: { id, judul_materi } (snake_case)
 */
export async function postMateri(data: {
  id: string;
  judulMateri: string;
  jumlahSoal: number;
  totalWaktu: number;
  questions: Array<{
    id: string;
    questionCase: string;
    options: string[];
    timeLimit: number;
    zonaId?: string;
    correctOption?: string;
  }>;
  quotes: string[];
  zona?: Array<{
    id: string;
    nama: string;
    warna: string;
    rangeStart: number;
    rangeEnd: number;
  }>;
  tanggalDibuat?: string;
  target_groups?: number[];
}) {
  // Kirim data mentah (camelCase) karena iot.js sekarang mengharapkan format ini
  const payload = {
    id: data.id,
    judulMateri: data.judulMateri,
    jumlahSoal: data.jumlahSoal,
    totalWaktu: data.totalWaktu,
    tanggalDibuat: data.tanggalDibuat || new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    // Gabungkan ABCD langsung ke soal agar terbaca di ESP32
    questions: data.questions.map((q) => {
      const optionsText = q.options && q.options.length > 0
        ? ` | A.${q.options[0]} B.${q.options[1]} C.${q.options[2]} D.${q.options[3]}`
        : "";
      return {
        ...q,
        questionCase: q.questionCase + optionsText
      };
    }),
    quotes: data.quotes,
    zona: data.zona || [],
    target_groups: data.target_groups || [],
  };

  return fetchApi<{ success: boolean; message: string }>("/iot/materi", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * POST /iot/materi/:id/publish
 * Minta Jetson untuk meneruskan materi yang sudah ada di database ke ESP32
 */
export async function publishMateri(id: string, targetGroups?: number[]) {
  return fetchApi<{ success: boolean; message: string }>(`/iot/materi/${id}/publish`, {
    method: "POST",
    body: JSON.stringify({ target_groups: targetGroups }),
  });
}

/**
 * GET /iot/materi
 */
export async function fetchMateri() {
  return fetchApi<
    Array<{
      id: string;
      judul_materi: string;
      jumlah_soal: number;
      tanggal_dibuat: string;
      total_waktu: number;
    }>
  >("/iot/materi");
}

/**
 * GET /iot/materi/:id
 * Ambil detail materi secara penuh (dengan questions, zona, quotes)
 */
export async function fetchMateriDetail(id: string) {
  return fetchApi<SavedMaterial>(`/iot/materi/${id}`);
}

/**
 * DELETE /iot/materi/:id
 */
export async function deleteMateri(id: string) {
  return fetchApi<{ message: string }>(`/iot/materi/${id}`, {
    method: "DELETE",
  });
}

// ============================================================
// IoT - Kelompok
// ============================================================

/**
 * POST /iot/kelompok
 * Server expects: { jumlah, nama_prefix }
 */
export async function postKelompok(data: {
  jumlah: number;
  nama_prefix: string;
}) {
  return fetchApi<
    Array<{
      id: number;
      nama: string;
      is_active: boolean;
      status: string;
      soal_tersisa: number;
    }>
  >("/iot/kelompok", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * GET /iot/kelompok
 */
export async function fetchKelompok() {
  return fetchApi<
    Array<{
      id: number;
      nama: string;
      is_active: boolean;
      status: string;
      soal_tersisa: number;
    }>
  >(`/iot/kelompok?t=${Date.now()}`);
}

/**
 * PUT /iot/kelompok/:id
 */
export async function updateKelompok(
  id: number,
  data: { nama?: string }
) {
  return fetchApi<{ message: string }>(`/iot/kelompok/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * DELETE /iot/kelompok/:id
 */
export async function deleteKelompok(id: number) {
  return fetchApi<{ message: string }>(`/iot/kelompok/${id}`, {
    method: "DELETE",
  });
}

/**
 * DELETE /iot/kelompok
 * Menghapus semua kelompok
 */
export async function deleteAllKelompok() {
  return fetchApi<{ message: string }>("/iot/delete-all-kelompok", {
    method: "DELETE",
  });
}

/**
 * GET /iot/kelompok/:id/posisi
 */
export async function fetchPosisiKelompok(id: number) {
  return fetchApi<
    Array<{
      player_id: number;
      position: number;
    }>
  >(`/iot/kelompok/${id}/posisi?t=${Date.now()}`);
}

// ============================================================
// IoT - Alarm
// ============================================================

/**
 * POST /iot/alarm/global
 */
export async function postAlarmGlobal(action: "activate" | "deactivate") {
  return fetchApi<{ message: string }>("/iot/alarm/global", {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

/**
 * POST /iot/alarm/kelompok/:id
 */
export async function postAlarmKelompok(
  id: number,
  action: "activate" | "deactivate"
) {
  return fetchApi<{ message: string }>(`/iot/alarm/kelompok/${id}`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}
