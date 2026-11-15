import React, { useState } from 'react';
import { useTPQ } from '../../context/TPQContext';
import {
  CreditCard,
  CalendarCheck2,
  Sparkles,
  DollarSign,
  Camera,
  Star,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Printer,
  Copy,
  Check,
  Upload,
  AlertCircle,
  Eye,
  Info,
  Calendar,
  Heart,
  ScrollText,
} from 'lucide-react';
import { DigitalSantriCard } from '../DigitalSantriCard';
import { formatRupiah, formatTanggalIndonesia } from '../../utils/exportExcel';

const MONTHS_LIST = [
  'Januari 2026',
  'Februari 2026',
  'Maret 2026',
  'April 2026',
  'Mei 2026',
  'Juni 2026',
  'Juli 2026',
  'Agustus 2026',
  'September 2026',
  'Oktober 2026',
  'November 2026',
  'Desember 2026',
];

export const SantriDashboard: React.FC = () => {
  const {
    currentUser,
    santriList,
    santriPublicList,
    tpqProfile,
    absensiSantri,
    santriHafalanStatus,
    hafalanMaster,
    progressLogs,
    syahriahList,
    laporanKeuangan,
    dokumentasiList,
    bayarSyahriah,
  } = useTPQ();

  // Guard against non-santri sessions
  const activeSantri = santriList.find((s) => s.id === currentUser?.santriId) || santriList[0];

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'kartu' | 'absensi' | 'progress' | 'syahriah' | 'dokumentasi'>('progress');

  // Copy rekening feedback
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);

  // Upload proof form state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [payMonth, setPayMonth] = useState('November 2026');
  const [payNominal, setPayNominal] = useState(50000);
  const [payBank, setPayBank] = useState(tpqProfile.rekeningList[0]?.bank || 'BSI');
  const [payProofUrl, setPayProofUrl] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [uploadSuccessNotice, setUploadSuccessNotice] = useState(false);

  // Selected photo for lightbox
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  if (!currentUser || currentUser.role !== 'santri' || !activeSantri) {
    return null;
  }

  // Handle Copy Bank Account
  const handleCopy = (bankId: string, nomor: string) => {
    navigator.clipboard.writeText(nomor);
    setCopiedBankId(bankId);
    setTimeout(() => setCopiedBankId(null), 2000);
  };

  // Santri Attendance records
  const santriAttendance = absensiSantri.filter((a) => a.santriId === activeSantri.id);
  const totalHadir = santriAttendance.filter((a) => a.status === 'Hadir').length;
  const totalSakit = santriAttendance.filter((a) => a.status === 'Sakit').length;
  const totalIzin = santriAttendance.filter((a) => a.status === 'Izin').length;
  const totalAlpa = santriAttendance.filter((a) => a.status === 'Alpa').length;
  const percentAttendance = santriAttendance.length > 0 ? Math.round((totalHadir / santriAttendance.length) * 100) : 100;

  // Santri Completed (LANCAR ONLY) Hafalan List
  // As requested: "progress harian (menampilkan data yang sudah hafal/lancar saja, agar halaman tidak penuh dan enak dilihat)"
  const completedHafalanIds = new Set(
    santriHafalanStatus.filter((h) => h.santriId === activeSantri.id && h.lancar).map((h) => h.hafalanId)
  );

  const completedHafalanItems = hafalanMaster.filter((h) => completedHafalanIds.has(h.id));
  const completedSurahs = completedHafalanItems.filter((h) => h.kategori === 'surat');
  const completedDoas = completedHafalanItems.filter((h) => h.kategori === 'doa');
  const completedHadits = completedHafalanItems.filter((h) => h.kategori === 'hadist');
  const completedShalat = completedHafalanItems.filter((h) => h.kategori === 'shalat');

  // Last successful reading log
  const santriLogs = progressLogs.filter((l) => l.santriId === activeSantri.id);
  const latestLog = santriLogs.length > 0 ? santriLogs[0] : null;

  // Syahriah payments for this santri
  const myPayments = syahriahList.filter((s) => s.santriId === activeSantri.id);

  // Month payment transparency status (November 2026 by default)
  const currentMonthKey = 'November 2026';
  const monthLunasList = syahriahList.filter(
    (s) => s.status === 'Lunas' && s.bulanList.includes(currentMonthKey)
  );
  const paidSantriIds = new Set(monthLunasList.map((s) => s.santriId));
  const isMePaidThisMonth = paidSantriIds.has(activeSantri.id);

  // Handle Upload Transfer Proof by Santri/Wali
  const handleUploadProofSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payProofUrl.trim()) return;

    bayarSyahriah({
      santriId: activeSantri.id,
      bulanList: [payMonth],
      nominalPerBulan: payNominal,
      totalNominal: payNominal,
      tanggalBayar: new Date().toISOString().slice(0, 10),
      metode: 'Transfer Bank',
      bankTujuan: payBank,
      buktiTransferUrl: payProofUrl.trim(),
      status: 'Menunggu Konfirmasi',
      catatan: payNotes || `Transfer via ${payBank} untuk ${payMonth}`,
    });

    setUploadSuccessNotice(true);
    setShowUploadModal(false);
    setPayProofUrl('');
    setPayNotes('');
    setTimeout(() => setUploadSuccessNotice(false), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-12 text-slate-800">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-md bg-white shrink-0">
                <img
                  src={activeSantri.foto}
                  alt={activeSantri.nama}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 bg-emerald-900/60 px-2.5 py-0.5 rounded-full">
                  Portal Santri & Wali
                </span>
                <h1 className="text-lg sm:text-xl font-extrabold mt-1 tracking-tight leading-tight">
                  {activeSantri.nama}
                </h1>
                <p className="text-xs text-emerald-100/90 mt-0.5">
                  NISN: <span className="font-mono">{activeSantri.nik}</span> · Jenjang:{' '}
                  <strong className="text-white">{activeSantri.jilid}</strong>
                </p>
              </div>
            </div>

            {/* Quick Badges / Action */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('kartu')}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 backdrop-blur-xs flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <CreditCard className="w-4 h-4 text-amber-300" />
                <span>Kartu Digital (KTA)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Santri */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {[
              { id: 'progress', label: 'Prestasi & Hafalan', icon: Sparkles },
              { id: 'absensi', label: 'Presensi Kehadiran', icon: CalendarCheck2 },
              { id: 'syahriah', label: 'Pembayaran Syahriah', icon: DollarSign },
              { id: 'kartu', label: 'Kartu Santri (KTA)', icon: CreditCard },
              { id: 'dokumentasi', label: 'Dokumentasi TPQ', icon: Camera },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {uploadSuccessNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Bukti Pembayaran Berhasil Diunggah!</p>
              <p className="text-[11px] text-emerald-700">
                Pemberitahuan telah terkirim ke Dewan Asatidz untuk verifikasi. Terima kasih atas partisipasi Anda.
              </p>
            </div>
          </div>
        )}

        {/* ===================== TAB 1: PRESTASI & HAFALAN (LANCAR SAJA) ===================== */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* Last Reading Overview */}
            {latestLog && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-xs">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                      Capaian Terakhir Santri
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {latestLog.jenisBacaan}: {latestLog.jilidAtauSurat} ({latestLog.halamanAyat})
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 italic">
                      "{latestLog.catatanGuru || 'Bacaan tartil dan lancar.'}"
                    </p>
                  </div>
                </div>

                <div className="text-right self-end sm:self-center shrink-0">
                  <span className="text-[11px] text-slate-400 block">Tanggal Nilai</span>
                  <span className="text-xs font-bold text-emerald-800">
                    {formatTanggalIndonesia(latestLog.tanggal)}
                  </span>
                </div>
              </div>
            )}

            {/* Summary Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Surat Juz 30 Lancar</span>
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                <p className="text-2xl font-extrabold text-emerald-800 mt-2">{completedSurahs.length}</p>
                <span className="text-[10px] text-slate-400">Dari 37 Surat Juz 30</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Doa Harian Lancar</span>
                  <Heart className="w-4 h-4 text-rose-500" />
                </div>
                <p className="text-2xl font-extrabold text-emerald-800 mt-2">{completedDoas.length}</p>
                <span className="text-[10px] text-slate-400">Doa Praktis Sehari-hari</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Hadits Shahih Lancar</span>
                  <ScrollText className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-2xl font-extrabold text-emerald-800 mt-2">{completedHadits.length}</p>
                <span className="text-[10px] text-slate-400">Pendidikan Karakter</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Bacaan Shalat Lancar</span>
                  <Award className="w-4 h-4 text-purple-500" />
                </div>
                <p className="text-2xl font-extrabold text-emerald-800 mt-2">{completedShalat.length}</p>
                <span className="text-[10px] text-slate-400">Rukun Qauli Shalat</span>
              </div>
            </div>

            {/* Clean Section of Completed Surat Juz 30 */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Daftar Hafalan Surat Juz 30 yang Sudah Lancar (Lulus Setoran)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Menampilkan surat-surat Al-Qur'an yang telah dikuasai dengan tartil dan lancar
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {completedSurahs.length} Surat Mumtaz
                </span>
              </div>

              {completedSurahs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Santri sedang dalam proses setoran hafalan Juz 30. Semangat terus belajar!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {completedSurahs.map((surat) => (
                    <div
                      key={surat.id}
                      className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-2xs">
                          ✓
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">{surat.judul}</h4>
                          <p className="text-[10px] text-slate-500">{surat.deskripsi}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                        Lancar
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Doas & Hadits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Doa Harian */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <h3 className="font-bold text-xs text-slate-800 flex items-center gap-2 border-b pb-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Doa Harian yang Sudah Hafal & Lancar
                </h3>
                {completedDoas.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">Belum ada doa yang berstatus lancar.</p>
                ) : (
                  <div className="space-y-2">
                    {completedDoas.map((d) => (
                      <div key={d.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{d.judul}</p>
                          <p className="text-[10px] text-slate-500">{d.deskripsi}</p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Lancar
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hadits Pilihan */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <h3 className="font-bold text-xs text-slate-800 flex items-center gap-2 border-b pb-2">
                  <ScrollText className="w-4 h-4 text-blue-500" />
                  Hadits & Bacaan Shalat yang Sudah Lancar
                </h3>
                {[...completedHadits, ...completedShalat].length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">Belum ada hadits/shalat yang berstatus lancar.</p>
                ) : (
                  <div className="space-y-2">
                    {[...completedHadits, ...completedShalat].map((item) => (
                      <div key={item.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{item.judul}</p>
                          <p className="text-[10px] text-slate-500">{item.deskripsi}</p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Lancar
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: ABSENSI SANTRI ===================== */}
        {activeTab === 'absensi' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Rekapitulasi Kehadiran Santri</h3>
                  <p className="text-xs text-slate-500">Catatan presensi harian di TPQ {tpqProfile.nama}</p>
                </div>
                <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs">
                  Persentase Kehadiran: {percentAttendance}%
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-slate-500 text-[10px] block font-bold">Hadir</span>
                  <span className="text-lg font-extrabold text-emerald-800">{totalHadir}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-slate-500 text-[10px] block font-bold">Sakit</span>
                  <span className="text-lg font-extrabold text-amber-800">{totalSakit}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-slate-500 text-[10px] block font-bold">Izin</span>
                  <span className="text-lg font-extrabold text-blue-800">{totalIzin}</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-slate-500 text-[10px] block font-bold">Alpa</span>
                  <span className="text-lg font-extrabold text-rose-800">{totalAlpa}</span>
                </div>
              </div>

              {/* History Table */}
              <div className="pt-2">
                <h4 className="font-bold text-xs text-slate-700 mb-2">Riwayat Presensi Terakhir:</h4>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {santriAttendance.map((rec) => (
                    <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{formatTanggalIndonesia(rec.tanggal)}</span>
                        {rec.keterangan && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{rec.keterangan}</p>
                        )}
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          rec.status === 'Hadir'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'Sakit'
                            ? 'bg-amber-100 text-amber-800'
                            : rec.status === 'Izin'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: PEMBAYARAN SYAHRIAH & TRANSPARANSI ===================== */}
        {activeTab === 'syahriah' && (
          <div className="space-y-6">
            {/* Status Iuran Bulan Ini & Tombol Upload */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Status Syahriah ({currentMonthKey}):</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                      isMePaidThisMonth
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {isMePaidThisMonth ? 'Lunas' : 'Belum Terbayar'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Iuran bulanan membantu operasional belajar mengajar santri dan bisyarah dewan asatidz.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Bukti Transfer Bank</span>
              </button>
            </div>

            {/* Rekening Bank Resmi TPQ (As explicitly required) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  Rekening Resmi Pembayaran Transfer Bank & QRIS
                </h3>
                <p className="text-xs text-slate-500">
                  Silakan lakukan transfer ke salah satu rekening resmi di bawah ini kemudian unggah buktinya
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {tpqProfile.rekeningList.map((rek) => (
                  <div
                    key={rek.id}
                    className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-2 relative group hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-900">{rek.bank}</span>
                      <button
                        onClick={() => handleCopy(rek.id, rek.nomor)}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border flex items-center gap-1 shadow-2xs transition-colors"
                        title="Salin Nomor Rekening"
                      >
                        {copiedBankId === rek.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="font-mono text-sm font-extrabold text-slate-900 tracking-wider">
                      {rek.nomor}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tight">
                      A.N. {rek.atasNama}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Transparansi Ketertiban: Siapa Santri yang Sudah & Belum Bayar Bulan Ini (As required) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    Transparansi Ketertiban Syahriah Santri ({currentMonthKey})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Memotivasi seluruh wali santri agar tertib dan tepat waktu dalam membayar syahriah
                  </p>
                </div>
                <div className="text-xs font-bold text-emerald-800">
                  {santriPublicList.filter((s) => s.paidMonths.includes(currentMonthKey) || paidSantriIds.has(s.id)).length} / {santriPublicList.length} Santri Tertib
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {santriPublicList.map((s) => {
                  const isPaid = s.paidMonths.includes(currentMonthKey) || paidSantriIds.has(s.id);
                  return (
                    <div
                      key={s.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        isPaid
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-slate-50 border-slate-200 opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={s.foto || 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=120&q=80'}
                          alt={s.nama}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-bold text-slate-800">{s.nama}</p>
                          <p className="text-[10px] text-slate-400">{s.jilid}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPaid ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isPaid ? 'Lunas' : 'Belum Bayar'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Riwayat Pembayaran Saya */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-2">
                Riwayat Pembayaran Syahriah Saya
              </h3>
              {myPayments.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Belum ada riwayat pembayaran yang tercatat.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {myPayments.map((pay) => (
                    <div key={pay.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{pay.bulanList.join(', ')}</p>
                        <p className="text-[10px] text-slate-400">
                          {formatTanggalIndonesia(pay.tanggalBayar)} · {pay.metode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-slate-900">{formatRupiah(pay.totalNominal)}</p>
                        <span
                          className={`text-[10px] font-bold ${
                            pay.status === 'Lunas'
                              ? 'text-emerald-700'
                              : pay.status === 'Menunggu Konfirmasi'
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {pay.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Laporan Keuangan Transparan TPQ (As required) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    Laporan Transparansi Kas Keuangan TPQ
                  </h3>
                  <p className="text-xs text-slate-500">Keterbukaan alokasi dana umat dan operasional TPQ</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Saldo Kas Saat Ini:</span>
                  <span className="font-mono font-extrabold text-sm text-emerald-800">
                    {formatRupiah(laporanKeuangan.length > 0 ? laporanKeuangan[laporanKeuangan.length - 1].saldo : 0)}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Uraian Transaksi</th>
                      <th className="py-2.5 px-3 text-right">Masuk</th>
                      <th className="py-2.5 px-3 text-right">Keluar</th>
                      <th className="py-2.5 px-3 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {laporanKeuangan.slice(-6).map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                          {formatTanggalIndonesia(item.tanggal)}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800">{item.uraian}</td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700">
                          {item.jenis === 'Masuk' ? formatRupiah(item.nominal) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-rose-600">
                          {item.jenis === 'Keluar' ? formatRupiah(item.nominal) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(item.saldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: KARTU SANTRI DIGITAL ===================== */}
        {activeTab === 'kartu' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center space-y-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Kartu Tanda Anggota (KTA) Digital Santri
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Identitas resmi santri {tpqProfile.nama} yang dapat dicetak atau disimpan di HP
                </p>
              </div>

              <div className="py-2">
                <DigitalSantriCard santri={activeSantri} tpq={tpqProfile} />
              </div>

              <div className="flex items-center gap-3 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan Kartu PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 5: DOKUMENTASI TPQ ===================== */}
        {activeTab === 'dokumentasi' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <h3 className="font-bold text-sm text-slate-800">
                Dokumentasi Kegiatan Santri & TPQ
              </h3>
              <p className="text-xs text-slate-500">
                Koleksi foto kegiatan belajar, wisuda tahfidz, manasik haji, dan rihlah kebersamaan
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {dokumentasiList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setPreviewPhoto(item.fotoUrl)}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden cursor-pointer group hover:shadow-md transition-all"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={item.fotoUrl}
                      alt={item.judul}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-slate-900/70 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                      {item.kategori}
                    </span>
                  </div>
                  <div className="p-4 space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                      {item.judul}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.deskripsi}
                    </p>
                    <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                      {formatTanggalIndonesia(item.tanggal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal Upload Bukti Transfer */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-700" />
                Upload Bukti Pembayaran Syahriah
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadProofSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Bulan Syahriah</label>
                <select
                  value={payMonth}
                  onChange={(e) => setPayMonth(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-medium focus:outline-emerald-600 bg-white"
                >
                  {MONTHS_LIST.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal yang Ditransfer (Rp)</label>
                <input
                  type="number"
                  min={10000}
                  step={5000}
                  required
                  value={payNominal}
                  onChange={(e) => setPayNominal(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl font-mono font-bold focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ditransfer ke Rekening TPQ</label>
                <select
                  value={payBank}
                  onChange={(e) => setPayBank(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-emerald-600 bg-white"
                >
                  {tpqProfile.rekeningList.map((r) => (
                    <option key={r.id} value={`${r.bank} (${r.nomor})`}>
                      {r.bank} - {r.nomor}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL / Link Foto Bukti Transfer</label>
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/... atau link foto struk"
                  value={payProofUrl}
                  onChange={(e) => setPayProofUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-emerald-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Bisa menggunakan tautan foto resi m-banking atau foto struk ATM
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Dari rekening Ayah / BSI Mobile"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-emerald-600"
                />
              </div>

              <div className="pt-2 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 shadow-xs"
                >
                  Kirim Bukti Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox photo */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-pointer"
        >
          <img src={previewPhoto} alt="Zoom" className="max-w-2xl max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
        </div>
      )}
    </div>
  );
};
