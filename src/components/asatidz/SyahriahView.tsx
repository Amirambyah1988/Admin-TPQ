import React, { useState } from 'react';
import { useTPQ } from '../../context/TPQContext';
import {
  DollarSign,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  Plus,
  Trash2,
  Edit,
  Eye,
  Check,
  X,
  FileSpreadsheet,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { PembayaranSyahriah, LaporanKeuangan } from '../../types';
import { exportToCSV, formatRupiah, formatTanggalIndonesia } from '../../utils/exportExcel';

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

export const SyahriahView: React.FC = () => {
  const {
    santriList,
    syahriahList,
    laporanKeuangan,
    tpqProfile,
    bayarSyahriah,
    verifikasiSyahriah,
    cancelSyahriah,
    addLaporanKeuangan,
    updateLaporanKeuangan,
    deleteLaporanKeuangan,
    currentUser,
  } = useTPQ();

  const [activeTab, setActiveTab] = useState<'pembayaran' | 'rekap-santri' | 'laporan-kas'>('pembayaran');

  // Form Pembayaran Syahriah
  const [selectedSantriId, setSelectedSantriId] = useState(santriList.length > 0 ? santriList[0].id : '');
  const [nominalPerBulan, setNominalPerBulan] = useState(50000);
  const [selectedBulanList, setSelectedBulanList] = useState<string[]>(['November 2026']);
  const [metodeBayar, setMetodeBayar] = useState<'Tunai' | 'Transfer Bank'>('Tunai');
  const [bankTujuan, setBankTujuan] = useState(tpqProfile.rekeningList[0]?.bank || 'BSI');
  const [catatanBayar, setCatatanBayar] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [showPaySuccess, setShowPaySuccess] = useState(false);

  // Cancellation modal
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Proof Modal
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  // Laporan Kas Form Modal
  const [showKasModal, setShowKasModal] = useState(false);
  const [editingKasId, setEditingKasId] = useState<string | null>(null);
  const [kasTanggal, setKasTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [kasUraian, setKasUraian] = useState('');
  const [kasJenis, setKasJenis] = useState<'Masuk' | 'Keluar'>('Masuk');
  const [kasNominal, setKasNominal] = useState(100000);
  const [kasKeterangan, setKasKeterangan] = useState('');

  // Selected month for Rekap Santri Lunas vs Belum Lunas
  const [filterMonth, setFilterMonth] = useState('November 2026');

  // Calculations
  const pendingList = syahriahList.filter((s) => s.status === 'Menunggu Konfirmasi');
  const totalNominalCalculated = nominalPerBulan * selectedBulanList.length;

  // Current balance
  const currentSaldo = laporanKeuangan.length > 0 ? laporanKeuangan[laporanKeuangan.length - 1].saldo : 0;

  // Month payment statistics
  const monthLunasList = syahriahList.filter(
    (s) => s.status === 'Lunas' && s.bulanList.includes(filterMonth)
  );
  const paidSantriIds = new Set(monthLunasList.map((s) => s.santriId));
  const santriSudahBayar = santriList.filter((s) => paidSantriIds.has(s.id));
  const santriBelumBayar = santriList.filter((s) => !paidSantriIds.has(s.id));
  const totalTerkumpulBulan = monthLunasList.reduce((acc, curr) => acc + curr.totalNominal, 0);

  // Toggle month selection
  const handleToggleMonth = (month: string) => {
    if (selectedBulanList.includes(month)) {
      if (selectedBulanList.length > 1) {
        setSelectedBulanList(selectedBulanList.filter((m) => m !== month));
      }
    } else {
      setSelectedBulanList([...selectedBulanList, month]);
    }
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantriId || selectedBulanList.length === 0) return;

    bayarSyahriah({
      santriId: selectedSantriId,
      bulanList: selectedBulanList,
      nominalPerBulan,
      totalNominal: totalNominalCalculated,
      tanggalBayar: payDate,
      metode: metodeBayar,
      bankTujuan: metodeBayar === 'Transfer Bank' ? bankTujuan : undefined,
      catatan: catatanBayar,
      status: 'Lunas',
      diverifikasiOleh: currentUser?.nama || 'Ustadz Kasir',
    });

    setShowPaySuccess(true);
    setCatatanBayar('');
    setTimeout(() => setShowPaySuccess(false), 3000);
  };

  const handleConfirmCancel = () => {
    if (!cancelTargetId) return;
    cancelSyahriah(cancelTargetId, cancelReason || 'Koreksi transaksi asatidz');
    setCancelTargetId(null);
    setCancelReason('');
  };

  // Export Syahriah Rekap to Excel
  const handleExportSyahriah = () => {
    const headers = [
      'No',
      'Tanggal Bayar',
      'Nama Santri',
      'NIK',
      'Bulan Dibayar',
      'Total Nominal',
      'Metode',
      'Status',
      'Catatan',
      'Diverifikasi Oleh',
    ];
    const rows = syahriahList.map((s, idx) => {
      const santri = santriList.find((st) => st.id === s.santriId);
      return [
        idx + 1,
        s.tanggalBayar,
        santri ? santri.nama : 'Santri',
        santri ? santri.nik : '-',
        s.bulanList.join(', '),
        s.totalNominal,
        s.metode,
        s.status,
        s.catatan || '-',
        s.diverifikasiOleh || '-',
      ];
    });
    exportToCSV('Data_Pembayaran_Syahriah_TPQ', headers, rows);
  };

  // Export Kas to Excel
  const handleExportKas = () => {
    const headers = ['No', 'Tanggal', 'Uraian Kas', 'Masuk (Debet)', 'Keluar (Kredit)', 'Saldo Kas', 'Keterangan'];
    const rows = laporanKeuangan.map((k) => [
      k.no,
      k.tanggal,
      k.uraian,
      k.jenis === 'Masuk' ? k.nominal : 0,
      k.jenis === 'Keluar' ? k.nominal : 0,
      k.saldo,
      k.keterangan || '-',
    ]);
    exportToCSV('Laporan_Keuangan_Kas_TPQ', headers, rows);
  };

  // Handle Kas Form
  const handleSaveKas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kasUraian.trim()) return;

    if (editingKasId) {
      updateLaporanKeuangan(editingKasId, {
        tanggal: kasTanggal,
        uraian: kasUraian,
        jenis: kasJenis,
        nominal: kasNominal,
        keterangan: kasKeterangan,
      });
    } else {
      addLaporanKeuangan({
        tanggal: kasTanggal,
        uraian: kasUraian,
        jenis: kasJenis,
        nominal: kasNominal,
        keterangan: kasKeterangan,
      });
    }

    setShowKasModal(false);
    setEditingKasId(null);
    setKasUraian('');
    setKasKeterangan('');
  };

  const handleOpenEditKas = (k: LaporanKeuangan) => {
    setEditingKasId(k.id);
    setKasTanggal(k.tanggal);
    setKasUraian(k.uraian);
    setKasJenis(k.jenis);
    setKasNominal(k.nominal);
    setKasKeterangan(k.keterangan || '');
    setShowKasModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Syahriah Bulanan & Kas Lembaga</h2>
          <p className="text-xs text-slate-500">
            Pencatatan iuran syahriah, verifikasi bukti transfer, dan laporan transparansi kas TPQ
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('pembayaran')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'pembayaran' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Input & Riwayat Syahriah
          </button>
          <button
            onClick={() => setActiveTab('rekap-santri')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'rekap-santri' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Status Santri ({filterMonth.split(' ')[0]})
          </button>
          <button
            onClick={() => setActiveTab('laporan-kas')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'laporan-kas' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Laporan Keuangan Kas
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Terkumpul Bulan Ini</span>
          <p className="text-xl font-extrabold text-emerald-800 mt-1 truncate">
            {formatRupiah(totalTerkumpulBulan)}
          </p>
          <span className="text-[10px] text-slate-400">Periode: {filterMonth}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Santri Lunas</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {santriSudahBayar.length} / {santriList.length}
          </p>
          <span className="text-[10px] text-emerald-700 font-semibold">
            {santriList.length > 0 ? Math.round((santriSudahBayar.length / santriList.length) * 100) : 0}% Tertib
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Santri Belum Bayar</span>
          <p className="text-xl font-extrabold text-rose-600 mt-1">{santriBelumBayar.length}</p>
          <span className="text-[10px] text-slate-400">Perlu diingatkan</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Saldo Kas TPQ</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1 truncate">{formatRupiah(currentSaldo)}</p>
          <span className="text-[10px] text-slate-400">Saldo riil lembaga</span>
        </div>
      </div>

      {/* Verification Queue (Bukti Transfer Pending) */}
      {pendingList.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700" />
            <h3 className="font-bold text-sm text-amber-900">
              Menunggu Verifikasi Bukti Transfer ({pendingList.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingList.map((item) => {
              const santri = santriList.find((s) => s.id === item.santriId);
              return (
                <div
                  key={item.id}
                  className="bg-white p-3.5 rounded-xl border border-amber-200/70 shadow-2xs space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">{santri?.nama || 'Santri'}</h4>
                      <p className="text-[11px] text-slate-500">
                        Bulan: <strong>{item.bulanList.join(', ')}</strong> · Total: <strong>{formatRupiah(item.totalNominal)}</strong>
                      </p>
                    </div>
                    {item.buktiTransferUrl && (
                      <button
                        onClick={() => setViewProofUrl(item.buktiTransferUrl!)}
                        className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[11px] font-bold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Bukti</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded border">
                    {item.catatan || 'Tanpa keterangan'}
                  </p>

                  <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => cancelSyahriah(item.id, 'Bukti transfer tidak valid')}
                      className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-lg text-xs"
                    >
                      Tolak
                    </button>
                    <button
                      type="button"
                      onClick={() => verifikasiSyahriah(item.id, 'Lunas', currentUser?.nama || 'Asatidz')}
                      className="px-3.5 py-1 bg-emerald-700 text-white hover:bg-emerald-800 font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Konfirmasi & Terima</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 1: Input Pembayaran & Riwayat Syahriah */}
      {activeTab === 'pembayaran' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Pembayaran */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800">Form Bayar Syahriah Santri</h3>
              <p className="text-xs text-slate-500">Bisa bayar langsung beberapa bulan sekaligus</p>
            </div>

            {showPaySuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Pembayaran syahriah berhasil dicatat dan masuk ke kas!</span>
              </div>
            )}

            <form onSubmit={handlePaySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Santri</label>
                <select
                  value={selectedSantriId}
                  onChange={(e) => setSelectedSantriId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600 bg-white font-medium"
                >
                  {santriList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.jilid})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Pembayaran</label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nominal per Bulan (Bisa Dirubah)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    min={10000}
                    step={5000}
                    required
                    value={nominalPerBulan}
                    onChange={(e) => setNominalPerBulan(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-emerald-600 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Multi-month selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">Pilih Bulan (Bisa Multi-Bulan):</label>
                  <span className="text-[11px] font-semibold text-emerald-800">
                    {selectedBulanList.length} Bulan Terpilih
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1.5 border rounded-lg bg-slate-50">
                  {MONTHS_LIST.map((month) => {
                    const isSelected = selectedBulanList.includes(month);
                    return (
                      <button
                        key={month}
                        type="button"
                        onClick={() => handleToggleMonth(month)}
                        className={`px-2 py-1.5 text-[11px] font-semibold rounded-md text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border'
                        }`}
                      >
                        <span className="truncate">{month}</span>
                        {isSelected && <Check className="w-3 h-3 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodeBayar('Tunai')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      metodeBayar === 'Tunai'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Tunai (Cash)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodeBayar('Transfer Bank')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      metodeBayar === 'Transfer Bank'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Transfer Bank
                  </button>
                </div>
              </div>

              {metodeBayar === 'Transfer Bank' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rekening Tujuan TPQ</label>
                  <select
                    value={bankTujuan}
                    onChange={(e) => setBankTujuan(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600 bg-white"
                  >
                    {tpqProfile.rekeningList.map((r) => (
                      <option key={r.id} value={`${r.bank} (${r.nomor})`}>
                        {r.bank} - {r.nomor} ({r.atasNama})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Titipan wali / lunas s.d Desember"
                  value={catatanBayar}
                  onChange={(e) => setCatatanBayar(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                />
              </div>

              {/* Total Summary Callout */}
              <div className="p-3 bg-emerald-800 text-white rounded-xl space-y-1">
                <span className="text-[11px] text-emerald-200">Total Nominal Pembayaran:</span>
                <p className="text-lg font-mono font-extrabold">{formatRupiah(totalNominalCalculated)}</p>
                <p className="text-[10px] text-emerald-200/90 truncate">
                  {selectedBulanList.join(', ')}
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Pembayaran Syahriah</span>
              </button>
            </form>
          </div>

          {/* Tabel Riwayat Pembayaran */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Riwayat Pembayaran Syahriah</h3>
                <p className="text-xs text-slate-500">Daftar transaksi syahriah santri yang tercatat</p>
              </div>

              <button
                onClick={handleExportSyahriah}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Tanggal</th>
                    <th className="py-3 px-3">Santri</th>
                    <th className="py-3 px-3">Bulan</th>
                    <th className="py-3 px-3 text-right">Nominal</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {syahriahList.map((item) => {
                    const santri = santriList.find((s) => s.id === item.santriId);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                          {formatTanggalIndonesia(item.tanggalBayar)}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-800">{santri?.nama || 'Santri'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{item.metode}</p>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {item.bulanList.join(', ')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(item.totalNominal)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'Lunas'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'Menunggu Konfirmasi'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {item.buktiTransferUrl && (
                              <button
                                onClick={() => setViewProofUrl(item.buktiTransferUrl!)}
                                className="p-1 text-slate-500 hover:text-amber-700"
                                title="Lihat Bukti"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {item.status !== 'Dibatalkan' && (
                              <button
                                onClick={() => {
                                  setCancelTargetId(item.id);
                                  setCancelReason('');
                                }}
                                className="px-2 py-0.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-[10px] font-bold rounded"
                                title="Batalkan Transaksi / Cancel"
                              >
                                Batal
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Rekap Santri Lunas vs Belum Lunas */}
      {activeTab === 'rekap-santri' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Pilih Bulan Rekap:</span>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-emerald-900 bg-white"
              >
                {MONTHS_LIST.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-800 font-bold">{santriSudahBayar.length} Lunas</span>
              <span className="text-slate-300">·</span>
              <span className="text-rose-600 font-bold">{santriBelumBayar.length} Belum Bayar</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sudah Lunas */}
            <div className="bg-white rounded-2xl border border-emerald-200/80 shadow-xs overflow-hidden">
              <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-200 flex items-center justify-between">
                <h4 className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Santri Sudah Membayar ({santriSudahBayar.length})
                </h4>
                <span className="text-[11px] font-semibold text-emerald-700">Bulan: {filterMonth}</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {santriSudahBayar.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Belum ada santri yang membayar pada bulan ini.
                  </div>
                ) : (
                  santriSudahBayar.map((santri) => (
                    <div key={santri.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div className="flex items-center gap-2.5">
                        <img src={santri.foto} alt={santri.nama} className="w-7 h-7 rounded-lg object-cover" />
                        <div>
                          <p className="font-bold text-slate-800">{santri.nama}</p>
                          <p className="text-[10px] text-slate-400">{santri.jilid} · Wali: {santri.namaWali}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                        Lunas
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Belum Bayar */}
            <div className="bg-white rounded-2xl border border-rose-200/80 shadow-xs overflow-hidden">
              <div className="bg-rose-50 px-4 py-3 border-b border-rose-200 flex items-center justify-between">
                <h4 className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Santri Belum Membayar ({santriBelumBayar.length})
                </h4>
                <span className="text-[11px] font-semibold text-rose-700">Perlu Diberitahu</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {santriBelumBayar.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Alhamdulillah seluruh santri sudah melunasi syahriah bulan ini!
                  </div>
                ) : (
                  santriBelumBayar.map((santri) => (
                    <div key={santri.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div className="flex items-center gap-2.5">
                        <img src={santri.foto} alt={santri.nama} className="w-7 h-7 rounded-lg object-cover" />
                        <div>
                          <p className="font-bold text-slate-800">{santri.nama}</p>
                          <p className="text-[10px] text-slate-400">{santri.jilid} · HP Wali: {santri.noHpWali}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                        Belum Bayar
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Laporan Keuangan Kas TPQ */}
      {activeTab === 'laporan-kas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Laporan Kas Keuangan TPQ Transparan</h3>
              <p className="text-xs text-slate-500">
                Tabel pembukuan keuangan lembaga (tampil di dashboard santri untuk keterbukaan)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportKas}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={() => {
                  setEditingKasId(null);
                  setKasUraian('');
                  setKasNominal(100000);
                  setKasKeterangan('');
                  setShowKasModal(true);
                }}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kas</span>
              </button>
            </div>
          </div>

          {/* Table Kas */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-3 text-center">No</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Uraian Transaksi</th>
                    <th className="py-3 px-4 text-right text-emerald-700">Masuk (Rp)</th>
                    <th className="py-3 px-4 text-right text-rose-700">Keluar (Rp)</th>
                    <th className="py-3 px-4 text-right font-bold">Saldo Akhir (Rp)</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {laporanKeuangan.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 text-center font-mono text-slate-500">{item.no}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {formatTanggalIndonesia(item.tanggal)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{item.uraian}</p>
                        {item.keterangan && (
                          <p className="text-[10px] text-slate-400">{item.keterangan}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        {item.jenis === 'Masuk' ? formatRupiah(item.nominal) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        {item.jenis === 'Keluar' ? formatRupiah(item.nominal) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                        {formatRupiah(item.saldo)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditKas(item)}
                            className="p-1 text-slate-500 hover:text-blue-700"
                            title="Edit Catatan Kas"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteLaporanKeuangan(item.id)}
                            className="p-1 text-slate-500 hover:text-rose-700"
                            title="Hapus Catatan Kas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Payment Confirmation Modal */}
      {cancelTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800">Batalkan Transaksi Syahriah</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin membatalkan transaksi ini? Status pembayaran akan berubah menjadi <strong>Dibatalkan</strong> dan saldo kas TPQ otomatis dikoreksi.
            </p>
            <input
              type="text"
              placeholder="Alasan pembatalan (misal: salah input nominal)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelTargetId(null)}
                className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-600"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-3.5 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
              >
                Konfirmasi Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Viewer Modal */}
      {viewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-4 max-w-md w-full space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-xs text-slate-800">Bukti Transfer Pembayaran</h4>
              <button onClick={() => setViewProofUrl(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto rounded-lg border">
              <img src={viewProofUrl} alt="Bukti Transfer" className="w-full object-contain" />
            </div>
            <button
              onClick={() => setViewProofUrl(null)}
              className="w-full py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
            >
              Tutup Preview
            </button>
          </div>
        </div>
      )}

      {/* Kas Form Modal (Tambah/Edit) */}
      {showKasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800">
                {editingKasId ? 'Edit Catatan Buku Kas' : 'Tambah Transaksi Kas Baru'}
              </h3>
              <button onClick={() => setShowKasModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKas} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Transaksi</label>
                <input
                  type="date"
                  required
                  value={kasTanggal}
                  onChange={(e) => setKasTanggal(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setKasJenis('Masuk')}
                    className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                      kasJenis === 'Masuk'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                    Kas Masuk (Penerimaan)
                  </button>
                  <button
                    type="button"
                    onClick={() => setKasJenis('Keluar')}
                    className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                      kasJenis === 'Keluar'
                        ? 'border-rose-600 bg-rose-50 text-rose-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                    Kas Keluar (Pengeluaran)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Uraian / Deskripsi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Infaq Hamba Allah / Bisyarah Asatidz"
                  value={kasUraian}
                  onChange={(e) => setKasUraian(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  required
                  value={kasNominal}
                  onChange={(e) => setKasNominal(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Bukti (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Nota kwitansi #012"
                  value={kasKeterangan}
                  onChange={(e) => setKasKeterangan(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div className="pt-2 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowKasModal(false)}
                  className="px-3.5 py-1.5 border rounded-lg font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800"
                >
                  Simpan Transaksi Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
