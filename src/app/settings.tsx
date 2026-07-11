import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';

export default function SettingsScreen() {
  const { serverUrl, setServerUrl, logout } = useSettings();
  const [ipInput, setIpInput] = useState(serverUrl);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!ipInput.trim()) {
      Alert.alert('Eror', 'Alamat server tidak boleh kosong.');
      return;
    }
    
    // Add default protocol if missing
    let url = ipInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }

    setSaving(true);
    try {
      await setServerUrl(url);
      setIpInput(url);
      Alert.alert('Sukses', 'Alamat server berhasil diperbarui!');
    } catch (e) {
      Alert.alert('Eror', 'Gagal menyimpan konfigurasi.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi',
      'Apakah Anda yakin ingin keluar dari akun admin?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Pengaturan</Text>
          <Text style={styles.subtitle}>Konfigurasi Server & Sesi Pamong</Text>
        </View>

        {/* Server IP Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="server-outline" size={22} color="#1e3a8a" />
            <Text style={styles.cardTitle}>Server API Offline</Text>
          </View>
          <Text style={styles.description}>
            Masukkan alamat IP Raspberry Pi 4 atau server lokal Anda. Contoh: http://10.42.0.1:4001
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={ipInput}
              onChangeText={setIpInput}
              placeholder="http://10.42.0.1:4001"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.buttonText}>
              {saving ? 'Menyimpan...' : 'SIMPAN CONFIG'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={24} color="#1e3a8a" />
            <Text style={styles.cardTitle}>Informasi Akun</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>Pamong Game (Admin)</Text>
          </View>
          <View style={[styles.row, styles.noBorder]}>
            <Text style={styles.label}>Username</Text>
            <Text style={styles.value}>sangkaraadmin</Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>KELUAR AKUN</Text>
          </TouchableOpacity>
        </View>

        {/* System Info */}
        <Text style={styles.version}>Sangkara Mobile v1.0.0 (Offline Native Mode)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
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
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  inputContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  input: {
    height: 44,
    fontSize: 14,
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#1e3a8a',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  noBorder: {
    borderBottomWidth: 0,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#64748b',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 10,
    height: 44,
    gap: 8,
    backgroundColor: '#fef2f2',
    marginTop: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  version: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 20,
  },
});
