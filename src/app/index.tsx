import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Switch,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../lib/api';
import { useSettings } from '../context/SettingsContext';
import type { KelompokData } from '../lib/types';

export default function DashboardScreen() {
  const { serverUrl } = useSettings();
  const [kelompokList, setKelompokList] = useState<KelompokData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPrefix, setNewPrefix] = useState('Kelompok');
  const [newCount, setNewCount] = useState('4');
  const [globalAlarm, setGlobalAlarm] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const data = await api.fetchKelompok();
      setKelompokList(data);
    } catch (e) {
      console.warn('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    // Real-time polling every 2.5 seconds
    const interval = setInterval(fetchState, 2500);
    return () => clearInterval(interval);
  }, [fetchState, serverUrl]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchState();
  };

  const handleCreateKelompok = async () => {
    const count = parseInt(newCount);
    if (isNaN(count) || count <= 0) {
      Alert.alert('Eror', 'Jumlah kelompok harus berupa angka valid.');
      return;
    }
    setLoading(true);
    try {
      await api.postKelompok({ jumlah: count, nama_prefix: newPrefix });
      fetchState();
      Alert.alert('Sukses', `Berhasil membuat ${count} kelompok baru.`);
    } catch (e: any) {
      Alert.alert('Gagal', e.message);
      setLoading(false);
    }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Hapus Semua Kelompok',
      'Apakah Anda yakin ingin menghapus semua kelompok dari database?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Semua',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.deleteAllKelompok();
              fetchState();
            } catch (e: any) {
              Alert.alert('Gagal', e.message);
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleResetGame = () => {
    Alert.alert(
      'Reset Game Total',
      'Ini akan menghapus seluruh data kelompok, posisi pion, dan riwayat jawaban. Mulai game baru?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset Sekarang',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.resetDatabase();
              fetchState();
              Alert.alert('Sukses', 'Database game berhasil di-reset!');
            } catch (e: any) {
              Alert.alert('Gagal', e.message);
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const toggleGlobalAlarm = async () => {
    const nextState = !globalAlarm;
    try {
      await api.postAlarmGlobal(nextState ? 'activate' : 'deactivate');
      setGlobalAlarm(nextState);
      Alert.alert('Info', nextState ? 'Alarm Global Dinyalakan' : 'Alarm Global Dimatikan');
    } catch (e: any) {
      Alert.alert('Gagal', e.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'playing':
        return '#22c55e'; // Green
      case 'connecting':
        return '#f59e0b'; // Amber
      case 'finished':
        return '#3b82f6'; // Blue
      default:
        return '#64748b'; // Slate
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Quick Action Top Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Sangkara Dashboard</Text>
          <Text style={styles.subtitle}>Server: {serverUrl}</Text>
        </View>
        <TouchableOpacity style={styles.resetBtn} onPress={handleResetGame}>
          <Ionicons name="refresh-circle-outline" size={24} color="#ef4444" />
          <Text style={styles.resetBtnText}>RESET</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Global Alarm Action Card */}
        <View style={[styles.card, globalAlarm && styles.alarmActiveCard]}>
          <View style={styles.alarmRow}>
            <View style={styles.alarmIconContainer}>
              <Ionicons
                name={globalAlarm ? 'alarm' : 'alarm-outline'}
                size={28}
                color={globalAlarm ? '#ffffff' : '#1e3a8a'}
              />
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.cardTitle, globalAlarm && styles.whiteText]}>
                Buzzer Alarm Global
              </Text>
              <Text style={[styles.description, globalAlarm && styles.whiteTextSecondary]}>
                Matikan atau bunyikan buzzer di seluruh alat kelompok secara langsung.
              </Text>
            </View>
            <Switch
              value={globalAlarm}
              onValueChange={toggleGlobalAlarm}
              trackColor={{ false: '#cbd5e1', true: '#fca5a5' }}
              thumbColor={globalAlarm ? '#ef4444' : '#f1f5f9'}
            />
          </View>
        </View>

        {/* Create Kelompok Accordion */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Inisialisasi Kelompok</Text>
          <View style={styles.rowForm}>
            <View style={styles.flex1}>
              <Text style={styles.inputLabel}>Prefix Nama</Text>
              <TextInput
                style={styles.formInput}
                value={newPrefix}
                onChangeText={setNewPrefix}
                placeholder="Kelompok"
              />
            </View>
            <View style={styles.width80}>
              <Text style={styles.inputLabel}>Jumlah</Text>
              <TextInput
                style={styles.formInput}
                value={newCount}
                onChangeText={setNewCount}
                keyboardType="numeric"
                placeholder="4"
              />
            </View>
          </View>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAll}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
              <Text style={styles.deleteBtnText}>KOSONGKAN</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateKelompok}>
              <Text style={styles.submitBtnText}>BUAT KELOMPOK</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Real-time Groups Monitoring List */}
        <Text style={styles.listHeader}>Daftar Kelompok Aktif ({kelompokList.length})</Text>

        {loading && kelompokList.length === 0 ? (
          <ActivityIndicator size="large" color="#1e3a8a" style={styles.loader} />
        ) : kelompokList.length === 0 ? (
          <View style={styles.emptyView}>
            <Ionicons name="people-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>Belum ada kelompok terdaftar.</Text>
            <Text style={styles.emptyTextSub}>Gunakan form di atas untuk membuat kelompok.</Text>
          </View>
        ) : (
          kelompokList.map((k) => (
            <View key={k.id} style={styles.groupCard}>
              <View style={styles.groupCardHeader}>
                <View style={styles.row}>
                  <Text style={styles.groupName}>{k.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(k.status) + '15' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(k.status) }]} />
                    <Text style={[styles.statusLabel, { color: getStatusColor(k.status) }]}>
                      {k.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.soalTersisa}>Soal Tersisa: {k.soalTersisa}</Text>
              </View>

              {/* Pion Positions Grid */}
              <Text style={styles.cardSubtitle}>Posisi Pion Kelompok:</Text>
              {k.pionPositions.length === 0 ? (
                <Text style={styles.noPionText}>Belum ada pion terhubung.</Text>
              ) : (
                <View style={styles.pionGrid}>
                  {k.pionPositions.map((p) => (
                    <View key={p.playerId} style={styles.pionBadge}>
                      <Ionicons name="location-sharp" size={14} color="#1e3a8a" />
                      <Text style={styles.pionText}>
                        Pion {p.playerId + 1} : <Text style={styles.pionPos}>Z{p.position}</Text>
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
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
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
    gap: 4,
  },
  resetBtnText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 12,
  },
  scrollContainer: {
    padding: 16,
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
  alarmActiveCard: {
    backgroundColor: '#ef4444',
  },
  alarmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alarmIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  width80: {
    width: 80,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  whiteText: {
    color: '#ffffff',
  },
  description: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  whiteTextSecondary: {
    color: '#fee2e2',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowForm: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
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
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#fca5a5',
    borderWidth: 1,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 36,
    gap: 4,
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 8,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  soalTersisa: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  noPionText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  pionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  pionText: {
    fontSize: 11,
    color: '#475569',
  },
  pionPos: {
    fontWeight: 'bold',
    color: '#1e3a8a',
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
});
