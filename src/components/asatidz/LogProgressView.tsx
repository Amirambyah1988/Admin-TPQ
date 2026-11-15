import React, { useState } from 'react';
import { useTPQ } from '../../context/TPQContext';
import {
  Sparkles,
  BookOpen,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  Star,
  Award,
  Check,
  X,
  HelpCircle,
  FileText,
  User,
  Heart,
  ScrollText,
} from 'lucide-react';
import { SURAT_JUZ_30 } from '../../data/initialData';
import { LogProgressHarian, HafalanMasterItem } from '../../types';
import { formatTanggalIndonesia } from '../../utils/exportExcel';

export const LogProgressView: React.FC = () => {
  const {
    santriList,
    hafalanMaster,
    santriHafalanStatus,
    progressLogs,
    addProgressLog,
    updateProgressLog,
    deleteProgressLog,
    toggleHafalanStatus,
    addCustomHafalan,
    currentUser,
  } = useTPQ();

  // Selected santri for progress evaluation
  const [selectedSantriId, setSelectedSantriId] = useState<string>(
    santriList.length > 0 ? santriList[0].id : ''
  );
  const [santriSearch, setSantriSearch] = useState('');

  // Active section tab
  const [activeTab, setActiveTab] = useState<'input-harian' | 'surat' | 'doa' | 'hadist' | 'shalat'>('input-harian');

  // Input form state for daily progress
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [jenisBacaan, setJenisBacaan] = useState<'Iqro' | 'Al-Qur\'an'>('Iqro');
  const [jilidAtauSurat, setJilidAtauSurat] = useState('');
  const [halamanAyat, setHalamanAyat] = useState('');
  const [isLancar, setIsLancar] = useState(true);
  const [catatanGuru, setCatatanGuru] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Custom hafalan modal
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customJudul, setCustomJudul] = useState('');
  const [customKategori, setCustomKategori] = useState<HafalanMasterItem['kategori']>('doa');
  const [customDeskripsi, setCustomDeskripsi] = useState('');
  const [customArabic, setCustomArabic] = useState('');

  // Search within surahs
  const [suratSearch, setSuratSearch] = useState('');

  const selectedSantri = santriList.find((s) => s.id === selectedSantriId) || santriList[0];

  // Logs for this selected santri
  const santriLogs = progressLogs.filter((l) => l.santriId === selectedSantri?.id);

  // Handle saving daily log
  const handleSaveDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) return;

    if (editingLogId) {
      updateProgressLog(editingLogId, {
        jenisBacaan,
        jilidAtauSurat,
        halamanAyat,
        lancar: isLancar,
        catatanGuru,
        tanggal: logDate,
      });
      setSaveSuccessNotice('Catatan progres harian berhasil diperbarui!');
      setEditingLogId(null);
    } else {
      addProgressLog({
        santriId: selectedSantri.id,
        tanggal: logDate,
        jenisBacaan,
        jilidAtauSurat,
        halamanAyat,
        lancar: isLancar,
        catatanGuru,
        asatidzNama: currentUser?.nama || 'Dewan Asatidz',
      });
      setSaveSuccessNotice(`Progres santri ${selectedSantri.nama} berhasil dicatat!`);
    }

    // Reset fields
    setJilidAtauSurat('');
    setHalamanAyat('');
    setCatatanGuru('');
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  const handleEditClick = (log: LogProgressHarian) => {
    setEditingLogId(log.id);
    setJenisBacaan(log.jenisBacaan);
    setJilidAtauSurat(log.jilidAtauSurat);
    setHalamanAyat(log.halamanAyat);
    setIsLancar(log.lancar);
    setCatatanGuru(log.catatanGuru);
    setLogDate(log.tanggal);
    setActiveTab('input-harian');
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setJilidAtauSurat('');
    setHalamanAyat('');
    setCatatanGuru('');
  };

  // Handle Add Custom Hafalan
  const handleSaveCustomHafalan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customJudul.trim()) return;
    addCustomHafalan({
      judul: customJudul.trim(),
      kategori: customKategori,
      deskripsi: customDeskripsi.trim(),
      arabic: customArabic.trim(),
    });
    setCustomJudul('');
    setCustomDeskripsi('');
    setCustomArabic('');
    setShowAddCustomModal(false);
  };

  // Filtered santri options for selector
  const searchedSantriList = santriList.filter((s) => {
    const q = santriSearch.toLowerCase();
    return s.nama.toLowerCase().includes(q) || s.nik.includes(q) || s.jilid.toLowerCase().includes(q);
  });

  // Calculate completed hafalan for selected santri
  const getHafalanStatus = (hafalanId: string): { lancar: boolean; catatan?: string; tanggalLancar?: string } => {
    if (!selectedSantri) return { lancar: false };
    const found = santriHafalanStatus.find((h) => h.santriId === selectedSantri.id && h.hafalanId === hafalanId);
    return found || { lancar: false };
  };

  // Surahs Juz 30 filtered
  const filteredSuratList = SURAT_JUZ_30.filter((s) => {
    const q = suratSearch.toLowerCase();
    return s.nama.toLowerCase().includes(q) || String(s.nomor).includes(q) || s.arti.toLowerCase().includes(q);
  });

  // Completed count stats for selected santri
  const totalSuratLancar = SURAT_JUZ_30.filter((s) => getHafalanStatus(`surat-${s.nomor}`).lancar).length;
  const doaItems = hafalanMaster.filter((h) => h.kategori === 'doa');
  const hadistItems = hafalanMaster.filter((h) => h.kategori === 'hadist');
  const shalatItems = hafalanMaster.filter((h) => h.kategori === 'shalat');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Log Progres & Hafalan Santri</h2>
          <p className="text-xs text-slate-500">
            Penilaian harian Iqro/Al-Qur'an, hafalan 37 Surat Juz 30 (An-Nas s/d An-Naba), Doa, Hadits & Shalat
          </p>
        </div>

        <button
          onClick={() => setShowAddCustomModal(true)}
          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Hafalan Baru</span>
        </button>
      </div>

      {/* Santri Selector Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-slate-800">Pilih Santri yang Dinilai:</span>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Cari nama santri..."
                value={santriSearch}
                onChange={(e) => setSantriSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 bg-slate-50/50"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <select
              value={selectedSantriId}
              onChange={(e) => setSelectedSantriId(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-600 bg-white"
            >
              {searchedSantriList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} ({s.jilid})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedSantri && (
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={selectedSantri.foto}
                alt={selectedSantri.nama}
                className="w-10 h-10 rounded-xl object-cover border border-emerald-200 shadow-2xs"
              />
              <div>
                <p className="font-extrabold text-slate-900 text-sm leading-snug">{selectedSantri.nama}</p>
                <p className="text-[11px] text-slate-500">
                  Jenjang: <strong className="text-emerald-800">{selectedSantri.jilid}</strong> · NIK: {selectedSantri.nik} · Akun: {selectedSantri.username}
                </p>
              </div>
            </div>

            {/* Quick Hafalan Stats Pills */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 shadow-2xs">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                Hafalan Surat: <strong>{totalSuratLancar}/37</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {saveSuccessNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-1 text-xs">
        <button
          onClick={() => setActiveTab('input-harian')}
          className={`px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'input-harian'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Catat Progres Harian</span>
        </button>
        <button
          onClick={() => setActiveTab('surat')}
          className={`px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'surat'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hafalan Juz 30 (37 Surat)</span>
        </button>
        <button
          onClick={() => setActiveTab('doa')}
          className={`px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'doa'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Doa Harian</span>
        </button>
        <button
          onClick={() => setActiveTab('hadist')}
          className={`px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'hadist'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ScrollText className="w-3.5 h-3.5" />
          <span>Hadits Pilihan</span>
        </button>
        <button
          onClick={() => setActiveTab('shalat')}
          className={`px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'shalat'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Bacaan Shalat</span>
        </button>
      </div>

      {/* Tab 1: Form Input Progres Harian & Timeline */}
      {activeTab === 'input-harian' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800">
                {editingLogId ? 'Edit Catatan Progres' : 'Form Penilaian Hari Ini'}
              </h3>
              {editingLogId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSaveDailyLog} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Bimbingan</label>
                <input
                  type="date"
                  required
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Bacaan</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setJenisBacaan('Iqro')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      jenisBacaan === 'Iqro'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Iqro
                  </button>
                  <button
                    type="button"
                    onClick={() => setJenisBacaan('Al-Qur\'an')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      jenisBacaan === 'Al-Qur\'an'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Al-Qur'an
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {jenisBacaan === 'Iqro' ? 'Jilid Berapa' : 'Surat Apa'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={jenisBacaan === 'Iqro' ? 'Contoh: Iqro Jilid 4' : 'Contoh: Surat Al-Baqarah'}
                  value={jilidAtauSurat}
                  onChange={(e) => setJilidAtauSurat(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {jenisBacaan === 'Iqro' ? 'Halaman Berapa' : 'Ayat / Halaman Berapa'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={jenisBacaan === 'Iqro' ? 'Halaman 15' : 'Ayat 1-25 / Hal. 3'}
                  value={halamanAyat}
                  onChange={(e) => setHalamanAyat(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kualitas Bacaan</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLancar(true)}
                    className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                      isLancar
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Lancar (Naik)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLancar(false)}
                    className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                      !isLancar
                        ? 'border-amber-600 bg-amber-500 text-white shadow-xs'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Belum Lancar (Ulang)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Asatidz / Evaluasi</label>
                <textarea
                  rows={3}
                  placeholder="Catatan makharijul huruf, tajwid, dengung, kelancaran..."
                  value={catatanGuru}
                  onChange={(e) => setCatatanGuru(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingLogId ? 'Simpan Perubahan Progres' : 'Simpan Progres Santri'}</span>
              </button>
            </form>
          </div>

          {/* Timeline of Logs for this student */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Riwayat Progres Belajar: {selectedSantri?.nama}
                </h3>
                <p className="text-xs text-slate-500">Catatan perkembangan bacaan santri per sesi</p>
              </div>
              <span className="text-xs font-bold text-slate-600">Total: {santriLogs.length} Catatan</span>
            </div>

            {santriLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Belum ada riwayat catatan harian untuk santri ini. Silakan input pada form sebelah kiri.
              </div>
            ) : (
              <div className="space-y-3">
                {santriLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-800">
                          {log.jenisBacaan}
                        </span>
                        <span className="font-bold text-xs text-slate-900">{log.jilidAtauSurat}</span>
                        <span className="text-slate-500 text-xs">· {log.halamanAyat}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.lancar
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {log.lancar ? 'Lancar' : 'Belum Lancar'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => handleEditClick(log)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                          title="Edit Catatan"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteProgressLog(log.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Hapus Catatan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {log.catatanGuru && (
                      <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                        "{log.catatanGuru}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>{formatTanggalIndonesia(log.tanggal)}</span>
                      <span>Oleh: {log.asatidzNama || 'Asatidz'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Hafalan Juz 30 (37 Surat) */}
      {activeTab === 'surat' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Hafalan Surat Juz 30 (An-Nas s/d An-Naba): {selectedSantri?.nama}
              </h3>
              <p className="text-xs text-slate-500">
                Klik tombol "Lancar" untuk menandai kelancaran setoran santri.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Cari surat / nomor..."
                value={suratSearch}
                onChange={(e) => setSuratSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredSuratList.map((surat) => {
              const status = getHafalanStatus(`surat-${surat.nomor}`);
              const isLancarState = status.lancar;

              return (
                <div
                  key={surat.nomor}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isLancarState
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center">
                        {surat.nomor}
                      </span>
                      {isLancarState && (
                        <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-md flex items-center gap-1 shadow-2xs">
                          <Check className="w-3 h-3" />
                          Lancar
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-800 leading-snug">
                        Surat {surat.nama}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {surat.arti} · {surat.ayatCount} Ayat
                      </p>
                    </div>

                    {status.catatan && (
                      <p className="text-[10px] text-emerald-800 italic pt-1">{status.catatan}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {status.tanggalLancar ? formatTanggalIndonesia(status.tanggalLancar) : 'Belum Lulus'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        toggleHafalanStatus(
                          selectedSantri.id,
                          `surat-${surat.nomor}`,
                          !isLancarState,
                          isLancarState ? '' : 'Mumtaz'
                        )
                      }
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        isLancarState
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-2xs'
                      }`}
                    >
                      {isLancarState ? 'Batalkan' : 'Tandai Lancar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Doa Harian */}
      {activeTab === 'doa' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Hafalan Doa Harian: {selectedSantri?.nama}
              </h3>
              <p className="text-xs text-slate-500">Daftar doa harian yang wajib dihafalkan santri</p>
            </div>
            <button
              onClick={() => {
                setCustomKategori('doa');
                setShowAddCustomModal(true);
              }}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1 border border-emerald-200"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Doa
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {doaItems.map((doa) => {
              const status = getHafalanStatus(doa.id);
              const isLancarState = status.lancar;
              return (
                <div
                  key={doa.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isLancarState ? 'bg-emerald-50/70 border-emerald-300' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-800">{doa.judul}</h4>
                      {isLancarState ? (
                        <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-md">
                          Lancar
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Belum Lancar</span>
                      )}
                    </div>
                    {doa.arabic && (
                      <p className="font-arabic text-sm text-slate-800 text-right leading-loose py-1">
                        {doa.arabic}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500">{doa.deskripsi}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {status.tanggalLancar ? `Lulus: ${formatTanggalIndonesia(status.tanggalLancar)}` : '-'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        toggleHafalanStatus(selectedSantri.id, doa.id, !isLancarState)
                      }
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        isLancarState
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-700 text-white hover:bg-emerald-800'
                      }`}
                    >
                      {isLancarState ? 'Batalkan' : 'Tandai Lancar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Hadits Pilihan */}
      {activeTab === 'hadist' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Hafalan Hadits Pilihan: {selectedSantri?.nama}
              </h3>
              <p className="text-xs text-slate-500">Hadits-hadits shahih pendidikan karakter anak muslim</p>
            </div>
            <button
              onClick={() => {
                setCustomKategori('hadist');
                setShowAddCustomModal(true);
              }}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1 border border-emerald-200"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Hadits
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hadistItems.map((hadist) => {
              const status = getHafalanStatus(hadist.id);
              const isLancarState = status.lancar;
              return (
                <div
                  key={hadist.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isLancarState ? 'bg-emerald-50/70 border-emerald-300' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-800">{hadist.judul}</h4>
                      {isLancarState ? (
                        <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-md">
                          Lancar
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Belum Lancar</span>
                      )}
                    </div>
                    {hadist.arabic && (
                      <p className="font-arabic text-sm text-slate-800 text-right leading-loose py-1">
                        {hadist.arabic}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500">{hadist.deskripsi}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {status.tanggalLancar ? `Lulus: ${formatTanggalIndonesia(status.tanggalLancar)}` : '-'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        toggleHafalanStatus(selectedSantri.id, hadist.id, !isLancarState)
                      }
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        isLancarState
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-700 text-white hover:bg-emerald-800'
                      }`}
                    >
                      {isLancarState ? 'Batalkan' : 'Tandai Lancar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: Bacaan Shalat */}
      {activeTab === 'shalat' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Hafalan Bacaan Shalat: {selectedSantri?.nama}
              </h3>
              <p className="text-xs text-slate-500">Bacaan rukun qauli dan doa praktis shalat fardhu</p>
            </div>
            <button
              onClick={() => {
                setCustomKategori('shalat');
                setShowAddCustomModal(true);
              }}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1 border border-emerald-200"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Bacaan Shalat
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {shalatItems.map((shalat) => {
              const status = getHafalanStatus(shalat.id);
              const isLancarState = status.lancar;
              return (
                <div
                  key={shalat.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isLancarState ? 'bg-emerald-50/70 border-emerald-300' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-800">{shalat.judul}</h4>
                      {isLancarState ? (
                        <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-md">
                          Lancar
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Belum Lancar</span>
                      )}
                    </div>
                    {shalat.arabic && (
                      <p className="font-arabic text-sm text-slate-800 text-right leading-loose py-1">
                        {shalat.arabic}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500">{shalat.deskripsi}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {status.tanggalLancar ? `Lulus: ${formatTanggalIndonesia(status.tanggalLancar)}` : '-'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        toggleHafalanStatus(selectedSantri.id, shalat.id, !isLancarState)
                      }
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        isLancarState
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-700 text-white hover:bg-emerald-800'
                      }`}
                    >
                      {isLancarState ? 'Batalkan' : 'Tandai Lancar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Tambah Hafalan Custom */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-700" />
                Tambah Target Hafalan Baru
              </h3>
              <button onClick={() => setShowAddCustomModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomHafalan} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Hafalan</label>
                <select
                  value={customKategori}
                  onChange={(e) => setCustomKategori(e.target.value as HafalanMasterItem['kategori'])}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600 bg-white"
                >
                  <option value="doa">Doa Harian</option>
                  <option value="hadist">Hadits Pilihan</option>
                  <option value="shalat">Bacaan Shalat</option>
                  <option value="custom">Hafalan Lainnya / Adab</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul / Nama Hafalan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Doa Masuk Pasar / Hadits Kasih Sayang"
                  value={customJudul}
                  onChange={(e) => setCustomJudul(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Teks Arab (Opsional)</label>
                <input
                  type="text"
                  placeholder="Teks arab..."
                  value={customArabic}
                  onChange={(e) => setCustomArabic(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600 font-arabic text-sm text-right"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Arti / Keterangan Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Artinya atau tujuan pembelajaran..."
                  value={customDeskripsi}
                  onChange={(e) => setCustomDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-3.5 py-1.5 border rounded-lg font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800"
                >
                  Simpan Hafalan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
