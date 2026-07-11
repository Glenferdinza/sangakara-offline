import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SavedMaterial, KelompokData, AnalyticsSummary, AktivitasLog, RiwayatData, DistribusiJawaban } from './types';

async function getApiBase(): Promise<string> {
  try {
    const savedUrl = await AsyncStorage.getItem('@sangkara_server_url');
    return savedUrl || 'http://10.42.0.1:4001';
  } catch {
    return 'http://10.42.0.1:4001';
  }
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const apiBase = await getApiBase();
  const url = `${apiBase}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
  } catch (err) {
    throw new Error(
      `Server tidak dapat dihubungi (${path}). Periksa koneksi WiFi atau status server.`
    );
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`API Error ${res.status}: ${errorText}`);
  }

  const json = await res.json();

  if (json && typeof json === 'object' && 'data' in json) {
    return json.data as T;
  }

  return json as T;
}

// ============================================================
// Analytics
// ============================================================

export async function fetchSummary() {
  const data = await fetchApi<{
    total_jawaban_hari_ini: number;
    total_remaja_aktif: number;
    rata_waktu_jawab: number;
    total_materi_aktif: number;
  }>('/analytics/summary');

  return {
    totalJawaban: data.total_jawaban_hari_ini ?? 0,
    totalRemajaAktif: data.total_remaja_aktif ?? 0,
    rataWaktuJawab: data.rata_waktu_jawab ?? 0,
    materiAktif: data.total_materi_aktif ?? 0,
  };
}

export async function fetchAktivitas(limit: number = 20) {
  return fetchApi<AktivitasLog[]>(`/analytics/aktivitas?limit=${limit}`);
}

export async function fetchRiwayat(dari?: string, sampai?: string) {
  const params = new URLSearchParams();
  if (dari) params.set('dari', dari);
  if (sampai) params.set('sampai', sampai);
  const query = params.toString();
  return fetchApi<RiwayatData[]>(`/analytics/riwayat${query ? `?${query}` : ''}`);
}

export async function fetchDistribusiJawaban(materiId?: string) {
  const params = new URLSearchParams();
  if (materiId) params.set('materi_id', materiId);
  const query = params.toString();
  return fetchApi<DistribusiJawaban[]>(`/analytics/distribusi-jawaban${query ? `?${query}` : ''}`);
}

export async function deleteAktivitas() {
  return fetchApi<{ message: string }>('/analytics/aktivitas', {
    method: 'DELETE',
  });
}

// ============================================================
// IoT - Materi
// ============================================================

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
  const payload = {
    id: data.id,
    judulMateri: data.judulMateri,
    jumlahSoal: data.jumlahSoal,
    totalWaktu: data.totalWaktu,
    tanggalDibuat: data.tanggalDibuat || new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    questions: data.questions.map((q) => {
      const optionsText = q.options && q.options.length > 0
        ? ` | A.${q.options[0]} B.${q.options[1]} C.${q.options[2]} D.${q.options[3]}`
        : '';
      return {
        ...q,
        questionCase: q.questionCase + optionsText
      };
    }),
    quotes: data.quotes,
    zona: data.zona || [],
    target_groups: data.target_groups || [],
  };

  return fetchApi<{ success: boolean; message: string }>('/iot/materi', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function publishMateri(id: string, targetGroups?: number[]) {
  return fetchApi<{ success: boolean; message: string }>(`/iot/materi/${id}/publish`, {
    method: 'POST',
    body: JSON.stringify({ target_groups: targetGroups }),
  });
}

export async function fetchMateri() {
  return fetchApi<
    Array<{
      id: string;
      judul_materi: string;
      jumlah_soal: number;
      tanggal_dibuat: string;
      total_waktu: number;
    }>
  >('/iot/materi');
}

export async function fetchMateriDetail(id: string) {
  return fetchApi<SavedMaterial>(`/iot/materi/${id}`);
}

export async function deleteMateri(id: string) {
  return fetchApi<{ message: string }>(`/iot/materi/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// IoT - Kelompok
// ============================================================

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
  >('/iot/kelompok', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchKelompok() {
  const kelompokList = await fetchApi<
    Array<{
      id: number;
      nama: string;
      is_active: boolean;
      status: string;
      soal_tersisa: number;
    }>
  >(`/iot/kelompok?t=${Date.now()}`);

  // Fetch pion positions for each kelompok
  const fullKelompokData = await Promise.all(
    kelompokList.map(async (k) => {
      try {
        const positions = await fetchPosisiKelompok(k.id);
        return {
          id: k.id,
          name: k.nama,
          isActive: k.is_active,
          status: k.status as any,
          pionPositions: positions.map((p) => ({
            playerId: p.player_id,
            position: p.position,
          })),
          soalTersisa: k.soal_tersisa,
        } as KelompokData;
      } catch {
        return {
          id: k.id,
          name: k.nama,
          isActive: k.is_active,
          status: k.status as any,
          pionPositions: [],
          soalTersisa: k.soal_tersisa,
        } as KelompokData;
      }
    })
  );

  return fullKelompokData;
}

export async function updateKelompok(
  id: number,
  data: { nama?: string }
) {
  return fetchApi<{ message: string }>(`/iot/kelompok/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteKelompok(id: number) {
  return fetchApi<{ message: string }>(`/iot/kelompok/${id}`, {
    method: 'DELETE',
  });
}

export async function deleteAllKelompok() {
  return fetchApi<{ message: string }>('/iot/delete-all-kelompok', {
    method: 'DELETE',
  });
}

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

export async function postAlarmGlobal(action: 'activate' | 'deactivate') {
  return fetchApi<{ message: string }>('/iot/alarm/global', {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

export async function postAlarmKelompok(
  id: number,
  action: 'activate' | 'deactivate'
) {
  return fetchApi<{ message: string }>(`/iot/alarm/kelompok/${id}`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

export async function resetDatabase() {
  return fetchApi<{ success: boolean; message: string }>('/iot/reset-db', {
    method: 'POST',
  });
}
