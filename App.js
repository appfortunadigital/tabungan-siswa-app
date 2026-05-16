import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator,
  Alert, RefreshControl, SafeAreaView, StatusBar, FlatList, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============ KONFIGURASI ============
// 🔴🔴🔴 GANTI DENGAN URL APPS SCRIPT ANDA 🔴🔴🔴
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxJmNR2TNn43EVLxk8FfMDAxhBkOxMajHLcvh3QWP1miy9MJXDeec3fz-2P6__xMkbT/exec';

// Fungsi panggil Apps Script
async function callScript(action, params = {}) {
  try {
    const url = `${SCRIPT_URL}?action=${action}&data=${encodeURIComponent(JSON.stringify(params))}`;
    const response = await fetch(url);
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Fetch error:', error);
    return { success: false, message: error.message };
  }
}

// Format Rupiah
const formatRupiah = (num) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num || 0);
};

const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID').format(num || 0);
};

// ============ SCREEN LOGIN ============
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Harap isi username dan password');
      return;
    }
    
    setLoading(true);
    const result = await callScript('authenticateUser', { 
      username: username.trim(), 
      password: password.trim()
    });
    setLoading(false);

    if (result && result.success) {
      await AsyncStorage.setItem('userSession', JSON.stringify({
        username: result.username,
        role: result.role,
        studentId: result.studentId,
      }));
      onLogin(result.role, result);
    } else {
      Alert.alert('Login Gagal', result?.message || 'Username atau password salah');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#4CAF50' }}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 5 }}>
            <Text style={{ fontSize: 45 }}>🏦</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: 'white' }}>Tabungan Siswa</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 5 }}>KB, RA, MI MUSLIM</Text>
        </View>

        <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 5 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>Login Sistem</Text>

          <View style={{ marginBottom: 15 }}>
            <Text style={{ marginBottom: 5, color: '#666' }}>Username / ID Siswa</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#fff' }}
              placeholder="Masukkan username atau NIS"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ marginBottom: 5, color: '#666' }}>Password</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, backgroundColor: '#fff' }}>
              <TextInput
                style={{ flex: 1, padding: 12, fontSize: 16 }}
                placeholder="Masukkan password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
                <Text style={{ fontSize: 20 }}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={{ backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center' }}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Masuk ke Sistem</Text>}
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: 'center', marginTop: 30 }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Powered By AppFortunaDigital</Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>v1.0.0 @2026</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ SCREEN ADMIN DASHBOARD ============
function AdminDashboardScreen({ navigation, onLogout }) {
  const [stats, setStats] = useState({ totalSiswa: 0, totalSaldo: 0, totalTransaksi: 0, totalSetor: 0, totalTarik: 0, rataSaldo: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const statsData = await callScript('getStatistics', {});
    const transData = await callScript('getAllTransactions', {});
    if (statsData) setStats(statsData);
    if (transData && Array.isArray(transData)) setTransactions(transData.slice(0, 10));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 10, color: '#666' }}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Header */}
      <View style={{ backgroundColor: '#4CAF50', padding: 15, paddingTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4 }}>
        <View>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>🏦 Tabungan Siswa</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>KB, RA, MI MUSLIM</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8 }}>
          <Text style={{ color: 'white', fontSize: 14 }}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={{ padding: 15 }}>
          {/* Stat Cards */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <View style={{ width: '50%', padding: 5 }}>
              <TouchableOpacity onPress={() => navigation('StudentsList')} style={{ backgroundColor: 'white', borderRadius: 12, padding: 15, borderLeftWidth: 4, borderLeftColor: '#007bff', elevation: 2 }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#007bff' }}>{stats.totalSiswa || 0}</Text>
                <Text style={{ color: '#666', fontSize: 12 }}>Total Siswa</Text>
              </TouchableOpacity>
            </View>
            <View style={{ width: '50%', padding: 5 }}>
              <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 15, borderLeftWidth: 4, borderLeftColor: '#28a745', elevation: 2 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#28a745' }}>{formatRupiah(stats.totalSaldo)}</Text>
                <Text style={{ color: '#666', fontSize: 12 }}>Total Saldo</Text>
              </View>
            </View>
            <View style={{ width: '50%', padding: 5 }}>
              <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 15, borderLeftWidth: 4, borderLeftColor: '#ffc107', elevation: 2 }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#ffc107' }}>{stats.totalTransaksi || 0}</Text>
                <Text style={{ color: '#666', fontSize: 12 }}>Total Transaksi</Text>
              </View>
            </View>
            <View style={{ width: '50%', padding: 5 }}>
              <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 15, borderLeftWidth: 4, borderLeftColor: '#17a2b8', elevation: 2 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#17a2b8' }}>{formatRupiah(stats.rataSaldo)}</Text>
                <Text style={{ color: '#666', fontSize: 12 }}>Rata-rata Saldo</Text>
              </View>
            </View>
          </View>

          {/* Ringkasan Setor/Tarik */}
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <View style={{ flex: 1, backgroundColor: '#e8f5e9', borderRadius: 12, padding: 12, marginRight: 5 }}>
              <Text style={{ fontSize: 12, color: '#666' }}>Total Setoran</Text>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4CAF50' }}>{formatRupiah(stats.totalSetor)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#ffebee', borderRadius: 12, padding: 12, marginLeft: 5 }}>
              <Text style={{ fontSize: 12, color: '#666' }}>Total Penarikan</Text>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#f44336' }}>{formatRupiah(stats.totalTarik)}</Text>
            </View>
          </View>

          {/* Menu Cepat - 2 Baris x 2 Kolom */}
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 }}>📱 Menu Cepat</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <TouchableOpacity style={{ width: '25%', padding: 5 }} onPress={() => navigation('AddStudent')}>
              <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 15, alignItems: 'center', elevation: 2 }}>
                <Text style={{ fontSize: 32 }}>👤</Text>
                <Text style={{ fontSize: 11, textAlign: 'center', fontWeight: '500', marginTop: 5 }}>Tambah Siswa</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={{ width: '25%', padding: 5 }} onPress={() => navigation('Transaction')}>
              <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 15, alignItems: 'center', elevation: 2 }}>
                <Text style={{ fontSize: 32 }}>💰</Text>
                <Text style={{ fontSize: 11, textAlign: 'center', fontWeight: '500', marginTop: 5 }}>Transaksi</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={{ width: '25%', padding: 5 }} onPress={() => navigation('StudentsList')}>
              <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 15, alignItems: 'center', elevation: 2 }}>
                <Text style={{ fontSize: 32 }}>📋</Text>
                <Text style={{ fontSize: 11, textAlign: 'center', fontWeight: '500', marginTop: 5 }}>Data Siswa</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={{ width: '25%', padding: 5 }} onPress={() => navigation('Report')}>
              <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 15, alignItems: 'center', elevation: 2 }}>
                <Text style={{ fontSize: 32 }}>📊</Text>
                <Text style={{ fontSize: 11, textAlign: 'center', fontWeight: '500', marginTop: 5 }}>Laporan</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Transaksi Terbaru */}
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 }}>🕐 Transaksi Terbaru</Text>
          {transactions.length === 0 ? (
            <View style={{ alignItems: 'center', padding: 30, backgroundColor: 'white', borderRadius: 10 }}>
              <Text style={{ fontSize: 40 }}>📭</Text>
              <Text style={{ color: '#999', marginTop: 10 }}>Belum ada transaksi</Text>
            </View>
          ) : (
            transactions.map((t) => (
              <View key={t.id} style={{ backgroundColor: 'white', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{t.namaSiswa}</Text>
                    <Text style={{ fontSize: 11, color: '#666' }}>{t.kelas} • {t.idSiswa}</Text>
                  </View>
                  <View style={{ backgroundColor: t.jenis === 'SETOR' ? '#e8f5e9' : '#ffebee', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 }}>
                    <Text style={{ color: t.jenis === 'SETOR' ? '#4CAF50' : '#f44336', fontWeight: 'bold', fontSize: 11 }}>{t.jenis === 'SETOR' ? 'SETOR' : 'TARIK'}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={{ fontSize: 11, color: '#999' }}>{new Date(t.tanggal).toLocaleDateString('id-ID')}</Text>
                  <Text style={{ fontWeight: 'bold', color: t.jenis === 'SETOR' ? '#4CAF50' : '#f44336' }}>{formatRupiah(t.jumlah)}</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#666', marginTop: 5 }} numberOfLines={1}>{t.keterangan}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ SCREEN DATA SISWA ============
function StudentsListScreen({ navigation }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStudents(); }, []);

  const loadStudents = async () => {
    const data = await callScript('getAllStudents', {});
    if (data && Array.isArray(data)) setStudents(data);
    setLoading(false);
  };

  const filtered = students.filter(s =>
    s.nama?.toLowerCase().includes(search.toLowerCase()) ||
    s.nis?.toLowerCase().includes(search.toLowerCase()) ||
    s.kelas?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      <View style={{ backgroundColor: '#4CAF50', padding: 15, paddingTop: 40, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation('Dashboard')} style={{ marginRight: 15 }}>
          <Text style={{ color: 'white', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Data Siswa</Text>
      </View>
      
      <View style={{ padding: 15 }}>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: 'white' }}
          placeholder="🔍 Cari siswa..."
          value={search}
          onChangeText={setSearch}
        />
        <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>Total: {filtered.length} siswa</Text>
      </View>
      
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: 'white', marginHorizontal: 15, marginBottom: 8, borderRadius: 10, padding: 12, elevation: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.nama}</Text>
                <Text style={{ fontSize: 12, color: '#666' }}>NIS: {item.nis || '-'}</Text>
                <Text style={{ fontSize: 12, color: '#666' }}>Kelas: {item.kelas}</Text>
                <Text style={{ fontSize: 11, color: '#999', marginTop: 2 }}>ID: {item.id}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontWeight: 'bold', color: '#4CAF50', fontSize: 16 }}>{formatRupiah(item.saldo)}</Text>
                <Text style={{ fontSize: 10, color: '#999', marginTop: 4 }}>{item.telepon_siswa || 'No HP'}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 48 }}>📭</Text>
            <Text style={{ color: '#999', marginTop: 10 }}>Tidak ada data siswa</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

// ============ SCREEN TAMBAH SISWA ============
function AddStudentScreen({ navigation }) {
  const [form, setForm] = useState({
    nama: '', kelas: '', nis: '', nama_ortu: '', hubungan: '', telepon_ortu: '', saldo_awal: '0',
    tanggal_lahir: '', jenis_kelamin: '', alamat: '', nisn: '', email_siswa: '', telepon_siswa: '', email_ortu: '', pekerjaan_ortu: ''
  });
  const [loading, setLoading] = useState(false);
  const [kelasList, setKelasList] = useState([]);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => { loadKelas(); }, []);

  const loadKelas = async () => {
    const data = await callScript('getAllClasses', {});
    if (data && Array.isArray(data)) setKelasList(data);
  };

  const handleSubmit = async () => {
    if (!form.nama || !form.kelas || !form.nis || !form.nama_ortu || !form.hubungan || !form.telepon_ortu) {
      Alert.alert('Peringatan', 'Harap isi semua field yang wajib (*)');
      return;
    }
    
    setLoading(true);
    const result = await callScript('addNewStudent', form);
    setLoading(false);
    
    if (result && result.success) {
      Alert.alert('Sukses', result.message);
      navigation('Dashboard');
    } else {
      Alert.alert('Gagal', result?.message || 'Terjadi kesalahan');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      <View style={{ backgroundColor: '#4CAF50', padding: 15, paddingTop: 40, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation('Dashboard')} style={{ marginRight: 15 }}>
          <Text style={{ color: 'white', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Tambah Siswa Baru</Text>
      </View>
      
      <ScrollView style={{ padding: 15 }}>
        <Text style={{ fontWeight: 'bold', color: '#4CAF50', marginBottom: 5 }}>📝 Data Pribadi</Text>
        
        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Nama Lengkap *</Text>
        <TextInput style={styles.input} value={form.nama} onChangeText={(v) => setForm({ ...form, nama: v })} />

        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Tanggal Lahir</Text>
        <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={form.tanggal_lahir} onChangeText={(v) => setForm({ ...form, tanggal_lahir: v })} />

        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Jenis Kelamin</Text>
        <View style={{ flexDirection: 'row', marginVertical: 5 }}>
          {['L', 'P'].map((jk) => (
            <TouchableOpacity key={jk} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20, padding: 5 }} onPress={() => setForm({ ...form, jenis_kelamin: jk })}>
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#4CAF50', backgroundColor: form.jenis_kelamin === jk ? '#4CAF50' : 'white', marginRight: 8 }} />
              <Text>{jk === 'L' ? 'Laki-laki' : 'Perempuan'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Alamat</Text>
        <TextInput style={[styles.input, { height: 80 }]} multiline value={form.alamat} onChangeText={(v) => setForm({ ...form, alamat: v })} />

        <Text style={{ fontWeight: 'bold', color: '#4CAF50', marginTop: 15, marginBottom: 5 }}>🏫 Data Sekolah</Text>

        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Kelas *</Text>
        <View style={styles.pickerContainer}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
            {kelasList.map((k) => (
              <TouchableOpacity key={k.nama} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }} onPress={() => setForm({ ...form, kelas: k.nama })}>
                <Text style={{ color: form.kelas === k.nama ? '#4CAF50' : '#333', fontWeight: form.kelas === k.nama ? 'bold' : 'normal' }}>{k.nama}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>NIS *</Text>
        <TextInput style={styles.input} value={form.nis} onChangeText={(v) => setForm({ ...form, nis: v })} />

        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>NISN</Text>
        <TextInput style={styles.input} value={form.nisn} onChangeText={(v) => setForm({ ...form, nisn: v })} />

        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Email Siswa</Text>
        <TextInput style={styles.input} keyboardType="email-address" value={form.email_siswa} onChangeText={(v) => setForm({ ...form, email_siswa: v })} />

        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>No. HP Siswa</Text>
        <TextInput style={styles.input} keyboardType="phone-pad" value={form.telepon_siswa} onChangeText={(v) => setForm({ ...form, telepon_siswa: v })} />

        <TouchableOpacity onPress={() => setShowMore(!showMore)} style={{ marginTop: 10 }}>
          <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>{showMore ? '▲ Sembunyikan' : '▼ Data Orang Tua'}</Text>
        </TouchableOpacity>

        {showMore && (
          <View>
            <Text style={{ fontWeight: 'bold', color: '#4CAF50', marginTop: 15, marginBottom: 5 }}>👨‍👩‍👧 Data Orang Tua/Wali</Text>

            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Nama Orang Tua *</Text>
            <TextInput style={styles.input} value={form.nama_ortu} onChangeText={(v) => setForm({ ...form, nama_ortu: v })} />

            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Hubungan *</Text>
            <View style={{ flexDirection: 'row', marginVertical: 5 }}>
              {['Ayah', 'Ibu', 'Wali'].map((h) => (
                <TouchableOpacity key={h} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20, padding: 5 }} onPress={() => setForm({ ...form, hubungan: h })}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#4CAF50', backgroundColor: form.hubungan === h ? '#4CAF50' : 'white', marginRight: 8 }} />
                  <Text>{h}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>No. Telepon Orang Tua *</Text>
            <TextInput style={styles.input} keyboardType="phone-pad" value={form.telepon_ortu} onChangeText={(v) => setForm({ ...form, telepon_ortu: v })} />

            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Email Orang Tua</Text>
            <TextInput style={styles.input} keyboardType="email-address" value={form.email_ortu} onChangeText={(v) => setForm({ ...form, email_ortu: v })} />

            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Pekerjaan Orang Tua</Text>
            <TextInput style={styles.input} value={form.pekerjaan_ortu} onChangeText={(v) => setForm({ ...form, pekerjaan_ortu: v })} />
          </View>
        )}

        <Text style={{ fontWeight: 'bold', color: '#4CAF50', marginTop: 15, marginBottom: 5 }}>💰 Tabungan Awal</Text>

        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Saldo Awal</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={form.saldo_awal} onChangeText={(v) => setForm({ ...form, saldo_awal: v })} />

        <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 30 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: '#6c757d', padding: 15, borderRadius: 10, alignItems: 'center', marginRight: 10 }} onPress={() => navigation('Dashboard')}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Batal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center' }} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold' }}>Simpan</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ SCREEN TRANSAKSI ============
function TransactionScreen({ navigation }) {
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedNama, setSelectedNama] = useState('');
  const [jenis, setJenis] = useState('setor');
  const [jumlah, setJumlah] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSaldo, setSelectedSaldo] = useState(0);

  useEffect(() => { loadStudents(); }, []);

  const loadStudents = async () => {
    const data = await callScript('getAllStudents', {});
    if (data && Array.isArray(data)) setStudents(data);
  };

  const handleSubmit = async () => {
    if (!selectedId) { Alert.alert('Peringatan', 'Pilih siswa terlebih dahulu'); return; }
    const jumlahNum = parseInt(jumlah);
    if (!jumlahNum || jumlahNum < 1000) { Alert.alert('Peringatan', 'Jumlah minimal Rp 1.000'); return; }
    if (!keterangan.trim()) { Alert.alert('Peringatan', 'Isi keterangan transaksi'); return; }
    if (jenis === 'tarik' && jumlahNum > selectedSaldo) { Alert.alert('Peringatan', `Saldo tidak mencukupi. Saldo: ${formatRupiah(selectedSaldo)}`); return; }

    setLoading(true);
    const result = await callScript('processTransaction', { idSiswa: selectedId, jenis, jumlah: jumlahNum, keterangan });
    setLoading(false);

    if (result && result.success) {
      Alert.alert('Sukses', result.message);
      setJumlah('');
      setKeterangan('');
      setSelectedId('');
      setSelectedNama('');
      loadStudents();
    } else {
      Alert.alert('Gagal', result?.message || 'Terjadi kesalahan');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      <View style={{ backgroundColor: '#4CAF50', padding: 15, paddingTop: 40, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation('Dashboard')} style={{ marginRight: 15 }}>
          <Text style={{ color: 'white', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Transaksi Tabungan</Text>
      </View>
      
      <ScrollView style={{ padding: 15 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 15, padding: 20, elevation: 3 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Jenis Transaksi</Text>
          <View style={{ flexDirection: 'row', marginBottom: 15 }}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20, padding: 5 }} onPress={() => setJenis('setor')}>
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#4CAF50', backgroundColor: jenis === 'setor' ? '#4CAF50' : 'white', marginRight: 8 }} />
              <Text>Setoran</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 5 }} onPress={() => setJenis('tarik')}>
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#f44336', backgroundColor: jenis === 'tarik' ? '#f44336' : 'white', marginRight: 8 }} />
              <Text>Penarikan</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Pilih Siswa</Text>
          <View style={styles.pickerContainer}>
            <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
              {students.map((s) => (
                <TouchableOpacity key={s.id} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }} onPress={() => { 
                  setSelectedId(s.id); 
                  setSelectedNama(s.nama);
                  setSelectedSaldo(s.saldo);
                }}>
                  <Text style={{ color: selectedId === s.id ? '#4CAF50' : '#333', fontWeight: selectedId === s.id ? 'bold' : 'normal' }}>
                    {s.nama} - {s.kelas} (Saldo: {formatRupiah(s.saldo)})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {selectedId && (
            <View style={{ backgroundColor: '#e8f5e9', padding: 12, borderRadius: 8, marginVertical: 10 }}>
              <Text>Siswa: <Text style={{ fontWeight: 'bold' }}>{selectedNama}</Text></Text>
              <Text>Saldo saat ini: <Text style={{ fontWeight: 'bold', color: '#4CAF50' }}>{formatRupiah(selectedSaldo)}</Text></Text>
            </View>
          )}

          <Text style={{ fontWeight: 'bold', marginBottom: 10, marginTop: 10 }}>Jumlah (Rp)</Text>
          <TextInput style={styles.input} keyboardType="numeric" placeholder="Minimal Rp 1.000" value={jumlah} onChangeText={setJumlah} />

          <Text style={{ fontWeight: 'bold', marginBottom: 10, marginTop: 10 }}>Keterangan</Text>
          <TextInput style={[styles.input, { height: 80 }]} multiline placeholder="Contoh: Setoran tabungan mingguan" value={keterangan} onChangeText={setKeterangan} />

          <TouchableOpacity style={{ backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 }} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Proses Transaksi</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ SCREEN LAPORAN ============
function ReportScreen({ navigation }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(today);
  }, []);

  const loadReport = async () => {
    if (!startDate || !endDate) { Alert.alert('Peringatan', 'Pilih tanggal'); return; }
    setLoading(true);
    const data = await callScript('getReportData', { startDate, endDate });
    if (data && Array.isArray(data)) setTransactions(data);
    setLoading(false);
  };

  const totalSetor = transactions.filter(t => t.jenis === 'SETOR').reduce((a, b) => a + (b.jumlah || 0), 0);
  const totalTarik = transactions.filter(t => t.jenis === 'TARIK').reduce((a, b) => a + (b.jumlah || 0), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      <View style={{ backgroundColor: '#4CAF50', padding: 15, paddingTop: 40, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation('Dashboard')} style={{ marginRight: 15 }}>
          <Text style={{ color: 'white', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Laporan Transaksi</Text>
      </View>
      
      <View style={{ padding: 15, backgroundColor: 'white', elevation: 2 }}>
        <Text style={{ marginBottom: 5 }}>📅 Dari Tanggal</Text>
        <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} />
        <Text style={{ marginBottom: 5, marginTop: 10 }}>📅 Sampai Tanggal</Text>
        <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={endDate} onChangeText={setEndDate} />
        <TouchableOpacity style={{ backgroundColor: '#4CAF50', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 }} onPress={loadReport}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>📊 Generate Laporan</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#4CAF50" /></View>
      ) : transactions.length > 0 ? (
        <ScrollView>
          <View style={{ flexDirection: 'row', padding: 15, gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: '#e8f5e9', padding: 12, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#666' }}>Total Setoran</Text>
              <Text style={{ fontWeight: 'bold', color: '#4CAF50' }}>{formatRupiah(totalSetor)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#ffebee', padding: 12, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#666' }}>Total Penarikan</Text>
              <Text style={{ fontWeight: 'bold', color: '#f44336' }}>{formatRupiah(totalTarik)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#e3f2fd', padding: 12, borderRadius: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#666' }}>Saldo Bersih</Text>
              <Text style={{ fontWeight: 'bold', color: '#2196F3' }}>{formatRupiah(totalSetor - totalTarik)}</Text>
            </View>
          </View>
          
          <View style={{ paddingHorizontal: 15, paddingBottom: 30 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Total {transactions.length} transaksi</Text>
            {transactions.map((t, i) => (
              <View key={i} style={{ backgroundColor: 'white', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontWeight: 'bold' }}>{t.namaSiswa}</Text>
                    <Text style={{ fontSize: 11, color: '#666' }}>{t.kelas}</Text>
                  </View>
                  <View style={{ backgroundColor: t.jenis === 'SETOR' ? '#e8f5e9' : '#ffebee', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 }}>
                    <Text style={{ color: t.jenis === 'SETOR' ? '#4CAF50' : '#f44336', fontWeight: 'bold', fontSize: 11 }}>{t.jenis === 'SETOR' ? 'SETOR' : 'TARIK'}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={{ fontSize: 11, color: '#999' }}>{new Date(t.tanggal).toLocaleDateString('id-ID')}</Text>
                  <Text style={{ fontWeight: 'bold', color: t.jenis === 'SETOR' ? '#4CAF50' : '#f44336' }}>{formatRupiah(t.jumlah)}</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#666', marginTop: 5 }}>{t.keterangan}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : !loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 48 }}>📭</Text>
          <Text style={{ color: '#999', marginTop: 10 }}>Belum ada data</Text>
          <Text style={{ color: '#ccc', fontSize: 12, marginTop: 5 }}>Pilih tanggal dan klik Generate</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// ============ SCREEN STUDENT DASHBOARD ============
function StudentDashboardScreen({ route, onLogout }) {
  const [data, setData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const studentId = route?.params?.studentId;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const dashboard = await callScript('getStudentDashboardData', { studentId });
    const trans = await callScript('getStudentTransactions', { studentId });
    if (dashboard) setData(dashboard);
    if (trans && Array.isArray(trans)) setTransactions(trans);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 10, color: '#666' }}>Memuat data...</Text>
      </View>
    );
  }

  if (!data || !data.success) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <Text style={{ fontSize: 48 }}>⚠️</Text>
        <Text style={{ color: '#666', marginTop: 10 }}>Data tidak ditemukan</Text>
        <TouchableOpacity onPress={onLogout} style={{ marginTop: 20, backgroundColor: '#4CAF50', padding: 12, borderRadius: 10 }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Kembali ke Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      <View style={{ backgroundColor: '#4CAF50', padding: 15, paddingTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>🏦 Tabungan Siswa</Text>
        <TouchableOpacity onPress={onLogout} style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8 }}>
          <Text style={{ color: 'white', fontSize: 14 }}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={{ alignItems: 'center', padding: 20, backgroundColor: 'white' }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#e8f5e9', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 40 }}>👨‍🎓</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: 'bold' }}>{data?.student?.nama}</Text>
          <Text style={{ color: '#666', marginTop: 5 }}>Kelas: {data?.student?.kelas} | NIS: {data?.student?.nis}</Text>
        </View>

        <View style={{ margin: 15, backgroundColor: '#4CAF50', borderRadius: 15, padding: 20, alignItems: 'center', elevation: 4 }}>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>💵 SALDO TABUNGAN</Text>
          <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold', marginTop: 5 }}>{formatRupiah(data?.saldo)}</Text>
        </View>

        <View style={{ flexDirection: 'row', paddingHorizontal: 15 }}>
          <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 12, alignItems: 'center', marginHorizontal: 5, elevation: 2 }}>
            <Text style={{ fontSize: 24 }}>📥</Text>
            <Text style={{ fontWeight: 'bold', marginTop: 5 }}>{formatRupiah(data?.statistics?.totalSetor)}</Text>
            <Text style={{ fontSize: 11, color: '#666' }}>Total Setoran</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 12, alignItems: 'center', marginHorizontal: 5, elevation: 2 }}>
            <Text style={{ fontSize: 24 }}>📤</Text>
            <Text style={{ fontWeight: 'bold', marginTop: 5 }}>{formatRupiah(data?.statistics?.totalTarik)}</Text>
            <Text style={{ fontSize: 11, color: '#666' }}>Total Penarikan</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 12, alignItems: 'center', marginHorizontal: 5, elevation: 2 }}>
            <Text style={{ fontSize: 24 }}>📋</Text>
            <Text style={{ fontWeight: 'bold', marginTop: 5 }}>{data?.statistics?.totalTransaksi || 0}</Text>
            <Text style={{ fontSize: 11, color: '#666' }}>Total Transaksi</Text>
          </View>
        </View>

        <View style={{ padding: 15 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>📜 Riwayat Transaksi</Text>
          {transactions.length === 0 ? (
            <View style={{ alignItems: 'center', padding: 30, backgroundColor: 'white', borderRadius: 10 }}>
              <Text style={{ fontSize: 40 }}>📭</Text>
              <Text style={{ color: '#999', marginTop: 10 }}>Belum ada transaksi</Text>
            </View>
          ) : (
            transactions.slice(0, 20).map((t, i) => (
              <View key={i} style={{ backgroundColor: 'white', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontWeight: 'bold' }}>{new Date(t.tanggal).toLocaleDateString('id-ID')}</Text>
                    <Text style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{t.keterangan || '-'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={{ backgroundColor: t.jenis === 'SETOR' ? '#e8f5e9' : '#ffebee', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, marginBottom: 4 }}>
                      <Text style={{ color: t.jenis === 'SETOR' ? '#4CAF50' : '#f44336', fontWeight: 'bold', fontSize: 11 }}>{t.jenis === 'SETOR' ? 'SETOR' : 'TARIK'}</Text>
                    </View>
                    <Text style={{ fontWeight: 'bold', color: t.jenis === 'SETOR' ? '#4CAF50' : '#f44336' }}>{formatRupiah(t.jumlah)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ STYLES ==========
const styles = {
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginTop: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: 'white',
    overflow: 'hidden',
    marginTop: 5,
  },
};

// ============ MAIN APP ============
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('Dashboard');

  useEffect(() => { checkSession(); }, []);

  const checkSession = async () => {
    const session = await AsyncStorage.getItem('userSession');
    if (session) {
      const s = JSON.parse(session);
      setIsLoggedIn(true);
      setUserRole(s.role);
      setUserData(s);
    }
  };

  const handleLogin = (role, data) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setUserData(data);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userSession');
    setIsLoggedIn(false);
    setUserRole(null);
    setUserData(null);
    setCurrentScreen('Dashboard');
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (userRole === 'siswa') {
    return <StudentDashboardScreen route={{ params: { studentId: userData?.studentId } }} onLogout={handleLogout} />;
  }

  // Admin/Guru Navigation
  const screens = {
    Dashboard: () => <AdminDashboardScreen navigation={setCurrentScreen} onLogout={handleLogout} />,
    StudentsList: () => <StudentsListScreen navigation={setCurrentScreen} />,
    AddStudent: () => <AddStudentScreen navigation={setCurrentScreen} />,
    Transaction: () => <TransactionScreen navigation={setCurrentScreen} />,
    Report: () => <ReportScreen navigation={setCurrentScreen} />,
  };

  const ScreenComponent = screens[currentScreen] || screens.Dashboard;
  return <ScreenComponent />;
}