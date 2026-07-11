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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../lib/api';
import { useSettings } from '../context/SettingsContext';
import type { AnalyticsSummary, AktivitasLog } from '../lib/types';

export default function LaporanScreen() {
  const { serverUrl } = useSettings();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [logs, setLogs] = useState<AktivitasLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const summaryData = await api.fetchSummary();
      setSummary(summaryData);

      const logsData = await api.fetchAktivitas(30);
      setLogs(logsData);
    } catch (e: any) {
      console.warn('Laporan fetch error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [serverUrl]);

  useEffect(() => {
    fetchData();
    // Refresh every 3 seconds for live scoreboards
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData, serverUrl]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Bersihkan Log Aktivitas',
      'Apakah Anda yakin ingin menghapus semua riwayat jawaban dan log aktivitas game?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Bersihkan',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.deleteAktivitas();
              fetchData();
              Alert.alert('Sukses', 'Log aktivitas berhasil dibersihkan.');
            } catch (e: any) {
              Alert.alert('Gagal', e.message);
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    return status.toLowerCase() === 'benar' ? '#22c55e' : '#ef4444';
  };

  const renderHeader = () => (
    <View>
      {/* Stats Cards Grid */}
      <View style={styles.statsGrid}>
        {/* Card 1 */}
        <View style={styles.statCard}>
          <Ionicons name="checkbox-outline" size={20} color="#10b981" />
          <Text style={styles.statVal}>{summary ? summary.totalJawaban : '0'}</Text>
          <Text style={styles.statLabel}>Total Jawaban</Text>
        </View>

        {/* Card 2 */}
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={20} color="#3b82f6" />
          <Text style={styles.statVal}>{summary ? summary.totalRemajaAktif : '0'}</Text>
          <Text style={styles.statLabel}>Remaja Aktif</Text>
        </View>

        {/* Card 3 */}
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={20} color="#f59e0b" />
          <Text style={styles.statVal}>
            {summary ? `${summary.rataWaktuJawab.toFixed(1)}s` : '0s'}
          </Text>
          <Text style={styles.statLabel}>Rata Respon</Text>
        </View>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.listHeader}>Log Aktivitas Game</Text>
        {logs.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearLogs}>
            <Ionicons name="trash-outline" size={14} color="#ef4444" />
            <Text style={styles.clearBtnText}>BERSIHKAN</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Laporan & Peringkat</Text>
        <Text style={styles.subtitle}>Rekap Skor dan Aktivitas Remaja</Text>
      </View>

      {loading && logs.length === 0 ? (
        <ActivityIndicator size="large" color="#1e3a8a" style={styles.loader} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Ionicons name="analytics-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyText}>Belum ada aktivitas terekam.</Text>
              <Text style={styles.emptyTextSub}>Log akan muncul otomatis ketika kelompok mulai menjawab pertanyaan.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isCorrect = item.status.toLowerCase() === 'benar';
            const formattedTime = new Date(item.timestamp).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <View style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View style={styles.row}>
                    <Ionicons name="person-outline" size={14} color="#64748b" />
                    <Text style={styles.logName}>{item.nama}</Text>
                  </View>
                  <Text style={styles.logTime}>{formattedTime}</Text>
                </View>

                <Text style={styles.logQuestion} numberOfLines={2}>
                  Jawaban: <Text style={styles.boldText}>{item.jawaban}</Text> (dalam {item.waktu}s)
                </Text>

                <View style={styles.logFooter}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(item.status) + '15' },
                    ]}
                  >
                    <Ionicons
                      name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                      size={14}
                      color={getStatusColor(item.status)}
                    />
                    <Text style={[styles.statusLabel, { color: getStatusColor(item.status) }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
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
  listContainer: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#fca5a5',
    borderWidth: 1,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 28,
    gap: 4,
  },
  clearBtnText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '700',
  },
  logCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 6,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  logTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  logQuestion: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 8,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    gap: 4,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: 'bold',
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
    marginTop: 10,
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
