export type Role = 'asatidz' | 'santri';

export interface RekeningBank {
  id: string;
  bank: string;
  nomor: string;
  atasNama: string;
  qrCodeUrl?: string;
}

export interface TPQProfile {
  nama: string;
  logo: string;
  alamat: string;
  tahunBerdiri: string;
  badanHukum: string;
  noSkKemenag: string;
  telepon: string;
  email: string;
  rekeningList: RekeningBank[];
}

export interface User {
  id: string;
  role: Role;
  nama: string;
  username: string;
  email?: string;
  foto?: string;
  santriId?: string;
  asatidzId?: string;
}

export interface Asatidz {
  id: string;
  nama: string;
  nik: string;
  username?: string;
  password?: string;
  tempatLahir: string;
  tanggalLahir: string;
  pendidikan: string;
  mengajar: 'Iqro' | 'Al-Qur\'an' | 'Keduanya';
  alamat: string;
  tanggalMulaiTugas: string;
  foto: string;
  noHp: string;
  statusAktif: boolean;
}

export interface Santri {
  id: string;
  nama: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  terdaftarTanggal: string;
  foto: string;
  namaWali: string;
  noHpWali: string;
  jilid: string; // 'Jilid 1' | 'Jilid 2' | 'Jilid 3' | 'Jilid 4' | 'Jilid 5' | 'Jilid 6' | 'Al-Qur\'an'
  username: string; // ${nik}@tpq.com
  password: string;
  jenisKelamin: 'L' | 'P';
}

export type StatusAbsensi = 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';

export interface AbsensiSantri {
  id: string;
  tanggal: string; // YYYY-MM-DD
  santriId: string;
  status: StatusAbsensi;
  keterangan?: string;
}

export interface AbsensiAsatidz {
  id: string;
  tanggal: string; // YYYY-MM-DD
  asatidzId: string;
  jamMasuk: string;
  status: StatusAbsensi;
  keterangan?: string;
}

export interface SuratJuz30 {
  nomor: number;
  nama: string;
  arti: string;
  ayatCount: number;
}

export type KategoriHafalan = 'surat' | 'doa' | 'hadist' | 'shalat' | 'custom';

export interface HafalanMasterItem {
  id: string;
  kategori: KategoriHafalan;
  judul: string;
  deskripsi?: string;
  arabic?: string;
}

export interface SantriHafalanStatus {
  id: string;
  santriId: string;
  hafalanId: string;
  lancar: boolean;
  tanggalLancar?: string;
  catatan?: string;
}

export interface LogProgressHarian {
  id: string;
  santriId: string;
  tanggal: string;
  jenisBacaan: 'Iqro' | 'Al-Qur\'an';
  jilidAtauSurat: string;
  halamanAyat: string;
  lancar: boolean;
  catatanGuru: string;
  asatidzNama?: string;
}

export type StatusSyahriah = 'Lunas' | 'Menunggu Konfirmasi' | 'Dibatalkan';

export interface PembayaranSyahriah {
  id: string;
  santriId: string;
  bulanList: string[]; // e.g. ["November 2026", "Desember 2026"]
  nominalPerBulan: number;
  totalNominal: number;
  tanggalBayar: string;
  metode: 'Transfer Bank' | 'Tunai';
  bankTujuan?: string;
  buktiTransferUrl?: string;
  status: StatusSyahriah;
  catatan?: string;
  diverifikasiOleh?: string;
}

export interface LaporanKeuangan {
  id: string;
  no: number;
  tanggal: string;
  uraian: string;
  jenis: 'Masuk' | 'Keluar';
  nominal: number;
  saldo: number;
  keterangan?: string;
}

export interface DokumentasiKegiatan {
  id: string;
  judul: string;
  tanggal: string;
  kategori: string;
  deskripsi: string;
  fotoUrl: string;
  dibuatOleh: string;
}
