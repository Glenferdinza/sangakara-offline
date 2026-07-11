import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../lib/api';
import { useSettings } from '../context/SettingsContext';

interface Material {
  id: string;
  judul_materi: string;
  jumlah_soal: number;
  tanggal_dibuat: string;
  total_waktu: number;
}

export default function KelolaMateriScreen() {
  const { serverUrl } = useSettings();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [kelompoks, setKelompoks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedMaterialId, setExpandedMaterialId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, any>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Quick Send States
  const [selectedMatId, setSelectedMatId] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<string>('ALL'); // 'ALL' or group ID string

  // Modal selector visibility states
  const [isMatModalVisible, setIsMatModalVisible] = useState(false);
  const [isTargetModalVisible, setIsTargetModalVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const mats = await api.fetchMateri();
      setMaterials(mats);
      
      const groups = await api.fetchKelompok();
      setKelompoks(groups);

      // Default selection if empty
      if (mats.length > 0 && !selectedMatId) {
        setSelectedMatId(mats[0].id);
      }
    } catch (e: any) {
      console.warn('Gagal memuat data:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [serverUrl, selectedMatId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const loadMaterialDetail = async (id: string) => {
    if (details[id]) return;
    try {
      const data = await api.fetchMateriDetail(id);
      setDetails((prev) => ({ ...prev, [id]: data }));
    } catch (e: any) {
      console.warn('Gagal memuat detail materi:', e.message);
    }
  };

  const handleExpand = (id: string) => {
    if (expandedMaterialId === id) {
      setExpandedMaterialId(null);
    } else {
      setExpandedMaterialId(id);
      loadMaterialDetail(id);
    }
  };

  const handlePublish = async (materialId: string, title: string, target: string) => {
    const isAll = target === 'ALL';
    const targetGroups = isAll ? [] : [parseInt(target, 10)];
    const targetName = isAll ? 'Semua Kelompok' : `Kelompok ${target}`;

    Alert.alert(
      'Kirim Soal',
      `Apakah Anda yakin ingin mengirim soal "${title}" ke ${targetName}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Kirim',
          onPress: async () => {
            setSendingId(materialId);
            try {
              await api.publishMateri(materialId, targetGroups);
              Alert.alert('Sukses', `Materi "${title}" berhasil dilepas ke ${targetName}!`);
            } catch (e: any) {
              Alert.alert('Gagal Mengirim', e.message);
            } finally {
              setSendingId(null);
            }
          },
        },
      ]
    );
  };

  const getSelectedMaterialTitle = () => {
    const found = materials.find((m) => m.id === selectedMatId);
    return found ? found.judul_materi : 'Pilih Materi...';
  };

  const getSelectedTargetTitle = () => {
    if (selectedTarget === 'ALL') return 'Semua Kelompok';
    const found = kelompoks.find((k) => String(k.id) === selectedTarget);
    return found ? found.name : `Kelompok ${selectedTarget}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Kirim Soal & Sesi</Text>
        <Text style={styles.subtitle}>Rilis Soal Studi Kasus ke Kelompok Secara Offline</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Quick Send Panel */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="send" size={18} color="#1e3a8a" />
            <Text style={styles.cardTitle}>Form Pelepasan Soal</Text>
          </View>

          {materials.length === 0 ? (
            <Text style={styles.noMateriWarning}>
              Belum ada materi terdaftar. Silakan buat materi di tab "Bank Soal" terlebih dahulu.
            </Text>
          ) : (
            <View>
              {/* Select Material Dropdown */}
              <Text style={styles.inputLabel}>Pilih Materi yang Ingin Dikirim</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setIsMatModalVisible(true)}
              >
                <View style={styles.row}>
                  <Ionicons name="book-outline" size={18} color="#1e3a8a" />
                  <Text style={styles.dropdownValueText} numberOfLines={1}>
                    {getSelectedMaterialTitle()}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </TouchableOpacity>

              {/* Select Target Dropdown */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Pilih Kelompok/Alat Sasaran</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setIsTargetModalVisible(true)}
              >
                <View style={styles.row}>
                  <Ionicons name="people-outline" size={18} color="#1e3a8a" />
                  <Text style={styles.dropdownValueText}>
                    {getSelectedTargetTitle()}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </TouchableOpacity>

              {/* Publish Button */}
              <TouchableOpacity
                style={styles.publishBtn}
                onPress={() => {
                  const mat = materials.find((m) => m.id === selectedMatId);
                  if (mat) {
                    handlePublish(mat.id, mat.judul_materi, selectedTarget);
                  } else {
                    Alert.alert('Peringatan', 'Pilih materi terlebih dahulu.');
                  }
                }}
              >
                <Ionicons name="paper-plane-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.publishBtnText}>KIRIM MATERI SEKARANG</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Materials List */}
        <Text style={styles.listHeader}>Daftar Pustaka Soal</Text>

        {loading && materials.length === 0 ? (
          <ActivityIndicator size="large" color="#1e3a8a" style={styles.loader} />
        ) : materials.length === 0 ? (
          <View style={styles.emptyView}>
            <Ionicons name="book-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>Materi kosong.</Text>
            <Text style={styles.emptyTextSub}>Buat materi dan input soal di tab 'Bank Soal' terlebih dahulu.</Text>
          </View>
        ) : (
          materials.map((m) => {
            const isExpanded = expandedMaterialId === m.id;
            const detail = details[m.id];
            const isSending = sendingId === m.id;

            return (
              <View key={m.id} style={styles.materialCard}>
                <TouchableOpacity style={styles.cardHeaderRow} onPress={() => handleExpand(m.id)}>
                  <View style={styles.flex1}>
                    <Text style={styles.materialTitle}>{m.judul_materi}</Text>
                    <Text style={styles.materialMeta}>
                      {m.jumlah_soal} Soal | Batas waktu total: {m.total_waktu} detik
                    </Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {detail ? (
                      <View>
                        {/* Quotes */}
                        {detail.quotes && detail.quotes.length > 0 && (
                          <View style={styles.quotesBox}>
                            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#475569" />
                            <Text style={styles.quoteText}>"{detail.quotes[0]}"</Text>
                          </View>
                        )}

                        {/* Questions preview */}
                        <Text style={styles.detailLabel}>Daftar Soal & Jawaban:</Text>
                        {detail.questions &&
                          detail.questions.map((q: any, idx: number) => (
                            <View key={q.id || idx} style={styles.questionItem}>
                              <Text style={styles.questionNum}>Soal {idx + 1}:</Text>
                              <Text style={styles.questionText}>{q.questionCase}</Text>
                              <View style={styles.correctAnswerRow}>
                                <Text style={styles.correctLabel}>Jawaban Benar: </Text>
                                <Text style={styles.correctVal}>{q.correctOption}</Text>
                              </View>
                            </View>
                          ))}
                      </View>
                    ) : (
                      <ActivityIndicator size="small" color="#1e3a8a" style={styles.detailLoader} />
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* MODAL 1: SELECT MATERIAL */}
      <Modal
        visible={isMatModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsMatModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Materi Soal</Text>
              <TouchableOpacity onPress={() => setIsMatModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={materials}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedMatId === item.id && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setSelectedMatId(item.id);
                    setIsMatModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedMatId === item.id && styles.modalItemTextActive,
                    ]}
                  >
                    {item.judul_materi}
                  </Text>
                  {selectedMatId === item.id && (
                    <Ionicons name="checkmark" size={18} color="#1e3a8a" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL 2: SELECT TARGET */}
      <Modal
        visible={isTargetModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsTargetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Kelompok Sasaran</Text>
              <TouchableOpacity onPress={() => setIsTargetModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {/* Option: Semua Kelompok */}
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  selectedTarget === 'ALL' && styles.modalItemActive,
                ]}
                onPress={() => {
                  setSelectedTarget('ALL');
                  setIsTargetModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    selectedTarget === 'ALL' && styles.modalItemTextActive,
                  ]}
                >
                  Semua Kelompok
                </Text>
                {selectedTarget === 'ALL' && (
                  <Ionicons name="checkmark" size={18} color="#1e3a8a" />
                )}
              </TouchableOpacity>

              {/* Option: Individual Kelompok */}
              {kelompoks.map((k) => (
                <TouchableOpacity
                  key={k.id}
                  style={[
                    styles.modalItem,
                    selectedTarget === String(k.id) && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setSelectedTarget(String(k.id));
                    setIsTargetModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedTarget === String(k.id) && styles.modalItemTextActive,
                    ]}
                  >
                    {k.name}
                  </Text>
                  {selectedTarget === String(k.id) && (
                    <Ionicons name="checkmark" size={18} color="#1e3a8a" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
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
  scrollContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  dropdownValueText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  publishBtn: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  publishBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  listHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  materialCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  flex1: {
    flex: 1,
  },
  materialTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  materialMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  expandedContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fafafa',
  },
  quotesBox: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  quoteText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  questionItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  questionNum: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  questionText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 6,
  },
  correctAnswerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  correctLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  correctVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  detailLoader: {
    marginVertical: 12,
  },
  loader: {
    marginVertical: 40,
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
  noMateriWarning: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 12,
    fontStyle: 'italic',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  modalItemActive: {
    backgroundColor: '#1e3a8a' + '10',
  },
  modalItemText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  modalItemTextActive: {
    color: '#1e3a8a',
    fontWeight: 'bold',
  },
});
