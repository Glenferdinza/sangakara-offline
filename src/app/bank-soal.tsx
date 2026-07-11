import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../lib/api';
import { useSettings } from '../context/SettingsContext';

interface LocalZona {
  id: string;
  nama: string;
  warna: string;
  rangeStart: number;
  rangeEnd: number;
}

interface LocalQuestion {
  id: string;
  questionCase: string;
  options: string[];
  timeLimit: number;
  zonaId: string;
  correctOption: string;
  type: 'none' | 'priority' | 'near_end';
  category: 'informatif' | 'kasus';
  targetPion?: number;
  studiKasusId?: string;
  studiKasusText?: string;
}

const PRESET_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#14b8a6', // teal
];

export default function BankSoalScreen() {
  const { serverUrl } = useSettings();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);

  // Form states
  const [judulMateri, setJudulMateri] = useState('');
  const [timePerQuestion, setTimePerQuestion] = useState('60');
  
  // Navigation step in Form: 'zona' or 'soal'
  const [formStep, setFormStep] = useState<'zona' | 'soal'>('zona');

  // Zones list state
  const [zonaList, setZonaList] = useState<LocalZona[]>([]);
  const [newZonaName, setNewZonaName] = useState('');
  const [newZonaStart, setNewZonaStart] = useState('1');
  const [newZonaEnd, setNewZonaEnd] = useState('10');
  const [newZonaColor, setNewZonaColor] = useState(PRESET_COLORS[0]);

  // Questions list state
  const [questions, setQuestions] = useState<LocalQuestion[]>([
    {
      id: '1',
      questionCase: '',
      options: ['', '', '', ''],
      timeLimit: 60,
      zonaId: '',
      correctOption: 'A',
      type: 'none',
      category: 'informatif',
      targetPion: 1,
      studiKasusId: '',
      studiKasusText: '',
    },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.fetchMateri();
      setMaterials(data);
    } catch (e: any) {
      console.warn('Gagal memuat materi:', e.message);
    } finally {
      setLoading(false);
    }
  }, [serverUrl]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleOpenForm = () => {
    setEditingMaterialId(null);
    setJudulMateri('');
    setTimePerQuestion('60');
    setFormStep('zona');
    setZonaList([]);
    setNewZonaName('');
    setNewZonaStart('1');
    setNewZonaEnd('10');
    setNewZonaColor(PRESET_COLORS[0]);
    setQuestions([
      {
        id: '1',
        questionCase: '',
        options: ['', '', '', ''],
        timeLimit: 60,
        zonaId: '',
        correctOption: 'A',
        type: 'none',
        category: 'informatif',
        targetPion: 1,
        studiKasusId: '',
        studiKasusText: '',
      },
    ]);
    setCurrentIndex(0);
    setIsFormOpen(true);
  };

  const handleEditMaterial = async (id: string) => {
    setLoading(true);
    try {
      const detail = await api.fetchMateriDetail(id);
      setEditingMaterialId(id);
      setJudulMateri(detail.judulMateri);
      setTimePerQuestion(String(detail.totalWaktu / (detail.questions?.length || 1) || 60));
      setZonaList(detail.zona || []);
      
      const mappedQuestions: LocalQuestion[] = (detail.questions || []).map((q: any, idx: number) => {
        // Strip the A. B. C. D. suffixes from questionCase if appended in DB
        let cleanQuestion = q.questionCase;
        const optionMarkerIndex = cleanQuestion.indexOf(' | A.');
        if (optionMarkerIndex !== -1) {
          cleanQuestion = cleanQuestion.substring(0, optionMarkerIndex);
        }
        
        const cleanOptions = q.options && q.options.length === 4 
          ? q.options 
          : ['', '', '', ''];

        return {
          id: String(idx + 1),
          questionCase: cleanQuestion,
          options: cleanOptions,
          timeLimit: q.timeLimit || 60,
          zonaId: q.zonaId || '',
          correctOption: q.correctOption || 'A',
          type: q.type || 'none',
          category: q.category || 'informatif',
          targetPion: q.targetPion || 1,
          studiKasusId: q.studiKasusId || '',
          studiKasusText: q.studiKasusText || '',
        };
      });

      setQuestions(mappedQuestions.length > 0 ? mappedQuestions : [
        {
          id: '1',
          questionCase: '',
          options: ['', '', '', ''],
          timeLimit: 60,
          zonaId: '',
          correctOption: 'A',
          type: 'none',
          category: 'informatif',
          targetPion: 1,
          studiKasusId: '',
          studiKasusText: '',
        }
      ]);
      
      setCurrentIndex(0);
      setFormStep('zona');
      setIsFormOpen(true);
    } catch (e: any) {
      Alert.alert('Gagal Memuat Detail', e.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Zona Actions
  // ============================================================
  const handleAddZona = () => {
    if (!newZonaName.trim()) {
      Alert.alert('Peringatan', 'Nama zona harus diisi!');
      return;
    }
    const start = parseInt(newZonaStart);
    const end = parseInt(newZonaEnd);

    if (isNaN(start) || isNaN(end) || start < 1 || end > 50 || start > end) {
      Alert.alert('Peringatan', 'Range harus bernilai 1-50 dan nilai awal <= akhir.');
      return;
    }

    // Check overlap
    const overlap = zonaList.some(
      (z) => start <= z.rangeEnd && end >= z.rangeStart
    );
    if (overlap) {
      Alert.alert('Peringatan', 'Range petak ini bertabrakan dengan zona yang sudah ada.');
      return;
    }

    const newZona: LocalZona = {
      id: 'z_' + Date.now(),
      nama: newZonaName.trim(),
      warna: newZonaColor,
      rangeStart: start,
      rangeEnd: end,
    };

    setZonaList([...zonaList, newZona]);
    setNewZonaName('');
    // Auto suggest next range
    const nextStart = end + 1;
    setNewZonaStart(String(Math.min(nextStart, 50)));
    setNewZonaEnd(String(Math.min(nextStart + 9, 50)));
    // Pick next color preset
    const nextColor = PRESET_COLORS[(zonaList.length + 1) % PRESET_COLORS.length];
    setNewZonaColor(nextColor);
  };

  const handleRemoveZona = (id: string) => {
    setZonaList(zonaList.filter((z) => z.id !== id));
    // Clear references in questions
    setQuestions(
      questions.map((q) => (q.zonaId === id ? { ...q, zonaId: '' } : q))
    );
  };

  // ============================================================
  // Question Actions
  // ============================================================
  const handleAddQuestion = () => {
    const newId = String(questions.length + 1);
    setQuestions([
      ...questions,
      {
        id: newId,
        questionCase: '',
        options: ['', '', '', ''],
        timeLimit: parseInt(timePerQuestion) || 60,
        zonaId: zonaList.length > 0 ? zonaList[0].id : '',
        correctOption: 'A',
        type: 'none',
        category: 'informatif',
        targetPion: 1,
        studiKasusId: '',
        studiKasusText: '',
      },
    ]);
    setCurrentIndex(questions.length);
  };

  const handleRemoveQuestion = () => {
    if (questions.length <= 1) {
      Alert.alert('Info', 'Minimal harus ada 1 soal dalam materi.');
      return;
    }
    const updated = [...questions];
    updated.splice(currentIndex, 1);
    const reindexed = updated.map((q, idx) => ({
      ...q,
      id: String(idx + 1),
    }));
    setQuestions(reindexed);
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const updateQuestionField = (field: keyof LocalQuestion, value: any) => {
    const updated = [...questions];
    updated[currentIndex] = {
      ...updated[currentIndex],
      [field]: value,
    };
    setQuestions(updated);
  };

  const updateOptionText = (optionIndex: number, text: string) => {
    const updated = [...questions];
    const updatedOptions = [...updated[currentIndex].options];
    updatedOptions[optionIndex] = text;
    updated[currentIndex].options = updatedOptions;
    setQuestions(updated);
  };

  const tryNavigateToQuestions = () => {
    if (zonaList.length === 0) {
      Alert.alert(
        'Akses Ditolak',
        'Anda wajib menambahkan minimal 1 Zona Peta terlebih dahulu sebelum mengisi pertanyaan!'
      );
      return;
    }
    setFormStep('soal');
  };

  // ============================================================
  // Save Action
  // ============================================================
  const handleSaveMaterial = async () => {
    if (!judulMateri.trim()) {
      Alert.alert('Eror', 'Judul materi harus diisi.');
      return;
    }
    if (zonaList.length === 0) {
      Alert.alert('Eror', 'Anda harus membuat minimal 1 Zona Peta.');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionCase.trim()) {
        Alert.alert('Eror', `Teks soal nomor ${i + 1} tidak boleh kosong.`);
        return;
      }
      for (let o = 0; o < 4; o++) {
        if (!q.options[o].trim()) {
          Alert.alert('Eror', `Opsi ${String.fromCharCode(65 + o)} soal nomor ${i + 1} tidak boleh kosong.`);
          return;
        }
      }
      if (!q.zonaId) {
        Alert.alert('Eror', `Harap tentukan Zona Peta untuk soal nomor ${i + 1}.`);
        return;
      }
      if (q.category === 'kasus') {
        if (!q.studiKasusText?.trim()) {
          Alert.alert('Eror', `Narasi studi kasus untuk soal nomor ${i + 1} tidak boleh kosong.`);
          return;
        }
      }
    }

    setLoading(true);
    const materialId = editingMaterialId || `mat-${Date.now()}`;
    try {
      // Map local structures into API schema
      const payloadQuestions = questions.map((q) => {
        const isCaseStudy = q.category === 'kasus';
        const caseStudyId = isCaseStudy ? (q.studiKasusId || `casestudy_${Date.now()}_${q.id}`) : undefined;
        
        return {
          id: `${materialId}-q-${q.id}`,
          questionCase: q.questionCase.trim(),
          options: q.options.map((o) => o.trim()),
          timeLimit: q.timeLimit,
          zonaId: q.zonaId,
          correctOption: q.correctOption,
          type: q.type,
          category: q.category,
          targetPion: isCaseStudy ? q.targetPion : undefined,
          studiKasusId: caseStudyId,
          studiKasusText: isCaseStudy ? q.studiKasusText?.trim() : undefined,
        };
      });

      await api.postMateri({
        id: materialId,
        judulMateri: judulMateri.trim(),
        jumlahSoal: questions.length,
        totalWaktu: questions.length * (parseInt(timePerQuestion) || 60),
        questions: payloadQuestions as any,
        quotes: ['Sangkara Indonesia Emas 2045', 'Belajar bersungguh-sungguh membangun bangsa.'],
        zona: zonaList,
      });

      Alert.alert('Sukses', 'Materi berhasil disimpan dan diunggah ke server!');
      setIsFormOpen(false);
      setEditingMaterialId(null);
      fetchMaterials();
    } catch (e: any) {
      Alert.alert('Gagal Menyimpan', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = (id: string, name: string) => {
    Alert.alert(
      'Hapus Materi',
      `Apakah Anda yakin ingin menghapus materi "${name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.deleteMateri(id);
              fetchMaterials();
              Alert.alert('Sukses', 'Materi berhasil dihapus.');
            } catch (e: any) {
              Alert.alert('Gagal', e.message);
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const activeQuestion = questions[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Bank Soal & Studi Kasus</Text>
          <Text style={styles.subtitle}>Kelola Materi & Pertanyaan Offline</Text>
        </View>
        {!isFormOpen && (
          <TouchableOpacity style={styles.addBtn} onPress={handleOpenForm}>
            <Ionicons name="add-circle" size={20} color="#ffffff" />
            <Text style={styles.addBtnText}>BARU</Text>
          </TouchableOpacity>
        )}
      </View>

      {isFormOpen ? (
        // Form View
        <View style={styles.flex1}>
          {/* Back Header */}
          <View style={styles.formHeader}>
            <TouchableOpacity style={styles.backButtonHeader} onPress={() => setIsFormOpen(false)}>
              <Ionicons name="arrow-back" size={20} color="#1e3a8a" />
              <Text style={styles.backButtonHeaderText}>Kembali ke Daftar Materi</Text>
            </TouchableOpacity>
          </View>

          {/* Segment Selector */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[styles.segmentBtn, formStep === 'zona' && styles.segmentBtnActive]}
              onPress={() => setFormStep('zona')}
            >
              <Ionicons name="map-outline" size={16} color={formStep === 'zona' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.segmentText, formStep === 'zona' && styles.segmentTextActive]}>
                1. ZONA PETA ({zonaList.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                formStep === 'soal' && styles.segmentBtnActive,
                zonaList.length === 0 && styles.segmentBtnDisabled,
              ]}
              onPress={tryNavigateToQuestions}
            >
              <Ionicons name="help-circle-outline" size={18} color={formStep === 'soal' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.segmentText, formStep === 'soal' && styles.segmentTextActive]}>
                2. PERTANYAAN ({questions.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
            {formStep === 'zona' ? (
              // STEP 1: ZONE CONFIGURATION
              <View>
                <View style={styles.card}>
                  <Text style={styles.inputLabel}>Judul Materi</Text>
                  <TextInput
                    style={styles.input}
                    value={judulMateri}
                    onChangeText={setJudulMateri}
                    placeholder="Contoh: Modul Kewarganegaraan & Pancasila"
                    placeholderTextColor="#94a3b8"
                  />
                  <Text style={styles.inputLabel}>Batas Waktu Per Soal (Detik)</Text>
                  <TextInput
                    style={[styles.input, { marginBottom: 0 }]}
                    value={timePerQuestion}
                    onChangeText={setTimePerQuestion}
                    keyboardType="numeric"
                    placeholder="60"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Added Zones List */}
                <Text style={styles.cardSectionTitle}>Daftar Zona Terdaftar</Text>
                {zonaList.length === 0 ? (
                  <Text style={styles.emptyZonesHint}>Belum ada zona dibuat. Tambahkan zona di bawah ini.</Text>
                ) : (
                  zonaList.map((z) => (
                    <View key={z.id} style={styles.zonaItemRow}>
                      <View style={styles.row}>
                        <View style={[styles.colorIndicator, { backgroundColor: z.warna }]} />
                        <View style={{ marginLeft: 8 }}>
                          <Text style={styles.zonaItemName}>{z.nama}</Text>
                          <Text style={styles.zonaItemRange}>Rentang Petak: {z.rangeStart} s/d {z.rangeEnd}</Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveZona(z.id)}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}

                {/* Form to Add Zone */}
                <View style={[styles.card, { marginTop: 16 }]}>
                  <Text style={styles.cardSectionTitle}>Tambah Zona Baru</Text>

                  <Text style={styles.inputLabel}>Nama Zona</Text>
                  <TextInput
                    style={styles.input}
                    value={newZonaName}
                    onChangeText={setNewZonaName}
                    placeholder="Contoh: Zona Merah / Zona Aman"
                    placeholderTextColor="#94a3b8"
                  />

                  <View style={styles.rowForm}>
                    <View style={styles.flex1}>
                      <Text style={styles.inputLabel}>Mulai Petak</Text>
                      <TextInput
                        style={styles.formInput}
                        value={newZonaStart}
                        onChangeText={setNewZonaStart}
                        keyboardType="numeric"
                        placeholder="1"
                      />
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.inputLabel}>Sampai Petak</Text>
                      <TextInput
                        style={styles.formInput}
                        value={newZonaEnd}
                        onChangeText={setNewZonaEnd}
                        keyboardType="numeric"
                        placeholder="10"
                      />
                    </View>
                  </View>

                  {/* Preset Color Selection */}
                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Warna Zona</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
                    {PRESET_COLORS.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: c },
                          newZonaColor === c && styles.colorCircleActive,
                        ]}
                        onPress={() => setNewZonaColor(c)}
                      />
                    ))}
                  </ScrollView>

                  <TouchableOpacity style={styles.addZonaBtn} onPress={handleAddZona}>
                    <Ionicons name="add" size={18} color="#ffffff" />
                    <Text style={styles.addZonaBtnText}>TAMBAH ZONA KE LIST</Text>
                  </TouchableOpacity>
                </View>

                {/* Continue button */}
                <TouchableOpacity style={styles.continueBtn} onPress={tryNavigateToQuestions}>
                  <Text style={styles.continueBtnText}>LANJUT KE PERTANYAAN</Text>
                  <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ) : (
              // STEP 2: QUESTION BANK MANAGEMENT
              <View>
                <View style={styles.card}>
                  <View style={styles.questionFormHeader}>
                    <Text style={styles.questionTitle}>
                      Soal {currentIndex + 1} dari {questions.length}
                    </Text>
                    <View style={styles.row}>
                      <TouchableOpacity style={styles.iconBtn} onPress={handleRemoveQuestion}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconBtn} onPress={handleAddQuestion}>
                        <Ionicons name="add-outline" size={18} color="#1e3a8a" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Category selector */}
                  <Text style={styles.inputLabel}>Kategori Soal</Text>
                  <View style={styles.radioGroupRow}>
                    <TouchableOpacity
                      style={[styles.selectorRadio, activeQuestion.category === 'informatif' && styles.selectorRadioActive]}
                      onPress={() => updateQuestionField('category', 'informatif')}
                    >
                      <Text style={[styles.radioLabelText, activeQuestion.category === 'informatif' && styles.radioLabelTextActive]}>
                        Informatif (Kuis Biasa)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.selectorRadio, activeQuestion.category === 'kasus' && styles.selectorRadioActive]}
                      onPress={() => updateQuestionField('category', 'kasus')}
                    >
                      <Text style={[styles.radioLabelText, activeQuestion.category === 'kasus' && styles.radioLabelTextActive]}>
                        Studi Kasus Kelompok
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Case Study Fields */}
                  {activeQuestion.category === 'kasus' && (
                    <View style={styles.caseStudyBox}>
                      <Text style={styles.inputLabel}>Teks Narasi Studi Kasus</Text>
                      <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: '#ffffff' }]}
                        value={activeQuestion.studiKasusText || ''}
                        onChangeText={(text) => updateQuestionField('studiKasusText', text)}
                        placeholder="Tuliskan narasi cerita/masalah panjang untuk kelompok..."
                        placeholderTextColor="#94a3b8"
                        multiline
                      />

                      <Text style={styles.inputLabel}>Sasaran Target Pion Kelompok</Text>
                      <View style={styles.pionSelectorGrid}>
                        {[1, 2, 3, 4].map((pNum) => (
                          <TouchableOpacity
                            key={pNum}
                            style={[
                              styles.pionSelectorBtn,
                              activeQuestion.targetPion === pNum && styles.pionSelectorBtnActive,
                            ]}
                            onPress={() => updateQuestionField('targetPion', pNum)}
                          >
                            <Text style={[
                              styles.pionSelectorText,
                              activeQuestion.targetPion === pNum && styles.whiteText,
                            ]}>
                              Pion {pNum}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Type selector */}
                  <Text style={styles.inputLabel}>Tipe Pertanyaan</Text>
                  <View style={styles.typeSelectorRow}>
                    {['none', 'priority', 'near_end'].map((typeVal) => (
                      <TouchableOpacity
                        key={typeVal}
                        style={[
                          styles.typeSelectorBadge,
                          activeQuestion.type === typeVal && styles.typeSelectorBadgeActive,
                        ]}
                        onPress={() => updateQuestionField('type', typeVal)}
                      >
                        <Text
                          style={[
                            styles.typeSelectorText,
                            activeQuestion.type === typeVal && styles.whiteText,
                          ]}
                        >
                          {typeVal === 'none' ? 'Biasa (None)' : typeVal === 'priority' ? 'Prioritas' : 'Hampir Finish'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Question Text */}
                  <Text style={styles.inputLabel}>Kasus Soal / Pertanyaan</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={activeQuestion.questionCase}
                    onChangeText={(text) => updateQuestionField('questionCase', text)}
                    placeholder="Tuliskan pertanyaan di sini..."
                    placeholderTextColor="#94a3b8"
                    multiline
                  />

                  {/* Options */}
                  <Text style={styles.inputLabel}>Pilihan Jawaban & Kunci</Text>
                  {['A', 'B', 'C', 'D'].map((opt, idx) => (
                    <View key={opt} style={styles.optionRow}>
                      <TouchableOpacity
                        style={[
                          styles.radioBtn,
                          (activeQuestion.correctOption || 'A').includes(opt) && styles.radioBtnActive,
                        ]}
                        onPress={() => {
                          let current = activeQuestion.correctOption || 'A';
                          const isChecked = current.includes(opt);
                          if (isChecked) {
                            const updated = current.replace(opt, '');
                            if (updated.length > 0) {
                              updateQuestionField('correctOption', updated);
                            }
                          } else {
                            const updated = Array.from(new Set([...current.split(''), opt]))
                              .sort()
                              .join('');
                            updateQuestionField('correctOption', updated);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.radioBtnText,
                            (activeQuestion.correctOption || 'A').includes(opt) && styles.radioBtnTextActive,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.optionInput}
                        value={activeQuestion.options[idx]}
                        onChangeText={(text) => updateOptionText(idx, text)}
                        placeholder={`Jawaban Opsi ${opt}`}
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  ))}

                  {/* Zone Linker */}
                  <Text style={styles.inputLabel}>Tautkan ke Zona Peta</Text>
                  {zonaList.length === 0 ? (
                    <Text style={styles.errorText}>Kembali ke langkah 1 untuk menambahkan zona terlebih dahulu.</Text>
                  ) : (
                    <View style={styles.zonaGrid}>
                      {zonaList.map((z) => (
                        <TouchableOpacity
                          key={z.id}
                          style={[
                            styles.zonaBadge,
                            activeQuestion.zonaId === z.id && {
                              backgroundColor: z.warna,
                              borderColor: z.warna,
                            },
                          ]}
                          onPress={() => updateQuestionField('zonaId', z.id)}
                        >
                          <Text
                            style={[
                              styles.zonaBadgeText,
                              activeQuestion.zonaId === z.id && styles.whiteText,
                            ]}
                          >
                            {z.nama} ({z.rangeStart}-{z.rangeEnd})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Question Navigation */}
                  <View style={styles.formNavRow}>
                    <TouchableOpacity
                      style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
                      onPress={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                      disabled={currentIndex === 0}
                    >
                      <Ionicons name="arrow-back" size={16} color="#ffffff" />
                      <Text style={styles.navBtnText}>Sebelumnya</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.navBtn,
                        currentIndex === questions.length - 1 && styles.navBtnDisabled,
                      ]}
                      onPress={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                      disabled={currentIndex === questions.length - 1}
                    >
                      <Text style={styles.navBtnText}>Berikutnya</Text>
                      <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Save button */}
                <TouchableOpacity style={styles.saveSubmitBtn} onPress={handleSaveMaterial}>
                  <Ionicons name="save-outline" size={20} color="#ffffff" />
                  <Text style={styles.saveSubmitBtnText}>
                    {editingMaterialId ? 'UPDATE & UNGGAH MATERI' : 'SIMPAN & UNGGAH MATERI'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        // List View
        <FlatList
          data={materials}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchMaterials}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Ionicons name="document-text-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyText}>Belum ada materi terdaftar.</Text>
              <Text style={styles.emptyTextSub}>Buat materi pertama Anda dengan tombol 'BARU' di pojok kanan atas.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.materialCard}>
              <View style={styles.materialHeader}>
                <View style={styles.flex1}>
                  <Text style={styles.materialTitle}>{item.judul_materi}</Text>
                  <Text style={styles.materialMeta}>
                    Dibuat: {item.tanggal_dibuat} | {item.jumlah_soal} Soal | Waktu: {item.total_waktu}s
                  </Text>
                </View>
                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.editMaterialBtn}
                    onPress={() => handleEditMaterial(item.id)}
                  >
                    <Ionicons name="create-outline" size={18} color="#1e3a8a" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteMaterialBtn}
                    onPress={() => handleDeleteMaterial(item.id, item.judul_materi)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  listContainer: {
    padding: 16,
  },
  formContainer: {
    padding: 16,
  },
  formHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButtonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backButtonHeaderText: {
    fontSize: 14,
    color: '#1e3a8a',
    fontWeight: 'bold',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    height: 40,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 16,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  questionFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  iconBtn: {
    padding: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  radioBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioBtnActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  radioBtnText: {
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 13,
  },
  radioBtnTextActive: {
    color: '#ffffff',
  },
  optionInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#1e293b',
  },
  zonaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 20,
  },
  zonaBadge: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  zonaBadgeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  whiteText: {
    color: '#ffffff',
  },
  formNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 36,
    gap: 4,
  },
  navBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  navBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  saveSubmitBtn: {
    flexDirection: 'row',
    backgroundColor: '#22c55e',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  saveSubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  materialCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  materialTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  materialMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  editMaterialBtn: {
    padding: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderColor: '#bfdbfe',
    borderWidth: 1,
  },
  deleteMaterialBtn: {
    padding: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderColor: '#fca5a5',
    borderWidth: 1,
  },
  emptyView: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginTop: 12,
  },
  emptyTextSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#1e3a8a',
  },
  segmentBtnDisabled: {
    opacity: 0.5,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  zonaItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  zonaItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  zonaItemRange: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  rowForm: {
    flexDirection: 'row',
    gap: 12,
  },
  formInput: {
    height: 40,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1e293b',
  },
  colorRow: {
    marginVertical: 10,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleActive: {
    borderColor: '#0f172a',
    transform: [{ scale: 1.1 }],
  },
  addZonaBtn: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  addZonaBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyZonesHint: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  continueBtn: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    marginBottom: 40,
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  radioGroupRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  selectorRadio: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorRadioActive: {
    backgroundColor: '#1e3a8a' + '15',
    borderColor: '#1e3a8a',
  },
  radioLabelText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  radioLabelTextActive: {
    color: '#1e3a8a',
    fontWeight: 'bold',
  },
  caseStudyBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  pionSelectorGrid: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  pionSelectorBtn: {
    flex: 1,
    height: 36,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pionSelectorBtnActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  pionSelectorText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  typeSelectorBadge: {
    flex: 1,
    height: 36,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeSelectorBadgeActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  typeSelectorText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 16,
  },
});
