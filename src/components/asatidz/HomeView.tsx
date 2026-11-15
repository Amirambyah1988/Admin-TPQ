import React from 'react';
import { useTPQ } from '../../context/TPQContext';
import {
  Users,
  GraduationCap,
  CalendarCheck2,
  DollarSign,
  TrendingUp,
  Award,
  BookOpen,
  ArrowRight,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { formatRupiah, formatTanggalIndonesia } from '../../utils/exportExcel';

interface HomeViewProps {
  onNavigate: (tabId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const {
    santriList,
    asatidzList,
    absensiSantri,
    absensiAsatidz,
    syahriahList,
    laporanKeuangan,
    santriHafalanStatus,
    verifikasiSyahriah,
  } = useTPQ();

  const todayStr = new Date().toISOString().slice(0, 10);

  // Santri attendance today
  const santriAbsenToday = absensiSantri.filter((a) => a.tanggal === todayStr);
  const santriHadirCount = santriAbsenToday.filter((a) => a.status === 'Hadir').length;
  const santriAbsenPercent = santriList.length > 0 ? Math.round((santriHadirCount / santriList.length) * 100) : 0;

  // Asatidz attendance today
  const asatidzAbsenToday = absensiAsatidz.filter((a) => a.tanggal === todayStr);
  const asatidzHadirCount = asatidzAbsenToday.filter((a) => a.status === 'Hadir').length;

  // Current month syahriah stats
  const currentMonthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());
  const syahriahThisMonth = syahriahList.filter(
    (s) => s.status === 'Lunas' && s.bulanList.some((b) => b.includes(currentMonthName.split(' ')[0]))
  );
  const totalSyahriahBulanIni = syahriahThisMonth.reduce((acc, curr) => acc + curr.totalNominal, 0);

  // Pending verification payments
  const pendingPayments = syahriahList.filter((s) => s.status === 'Menunggu Konfirmasi');

  // Total Hafalan lancar count
  const totalHafalanLancar = santriHafalanStatus.filter((h) => h.lancar).length;

  // Latest balance from cash flow
  const currentSaldo = laporanKeuangan.length > 0 ? laporanKeuangan[laporanKeuangan.length - 1].saldo : 0;

  // Distribution by Jilid
  const jilidDistribution: Record<string, number> = {};
  santriList.forEach((s) => {
    jilidDistribution[s.jilid] = (jilidDistribution[s.jilid] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Pending Notification Banner */}
      {pendingPayments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-sm">
                Ada {pendingPayments.length} Pembayaran Syahriah Menunggu Verifikasi
              </h3>
              <p className="text-xs text-amber-700">
                Santri / Wali telah mengunggah bukti transfer bank. Mohon segera dicek.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('syahriah')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 self-end sm:self-auto shrink-0"
          >
            <span>Verifikasi Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary KPI Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Santri */}
        <div
          onClick={() => onNavigate('santri')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Santri</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{santriList.length}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-700 font-semibold">{santriHadirCount} santri</span>
            <span>hadir hari ini</span>
          </div>
        </div>

        {/* Total Asatidz */}
        <div
          onClick={() => onNavigate('asatidz')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Dewan Asatidz</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{asatidzList.length}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span className="text-teal-700 font-semibold">{asatidzHadirCount} ustadz</span>
            <span>bertugas hari ini</span>
          </div>
        </div>

        {/* Kehadiran Santri */}
        <div
          onClick={() => onNavigate('absen-santri')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Presensi Santri</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{santriAbsenPercent}%</p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span>{santriHadirCount} dari {santriList.length} santri</span>
          </div>
        </div>

        {/* Syahriah & Kas */}
        <div
          onClick={() => onNavigate('syahriah')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Saldo Kas Lembaga</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-emerald-800 mt-2 truncate">
            {formatRupiah(currentSaldo)}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span>Syahriah bln ini: </span>
            <span className="font-semibold text-slate-700">{formatRupiah(totalSyahriahBulanIni)}</span>
          </div>
        </div>
      </div>

      {/* Visual Charts & Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribusi Jilid Santri */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Distribusi Jenjang / Jilid</h3>
              <p className="text-xs text-slate-500">Komposisi jilid santri aktif saat ini</p>
            </div>
            <BookOpen className="w-4 h-4 text-emerald-700" />
          </div>

          <div className="space-y-2.5 pt-2">
            {['Al-Qur\'an', 'Jilid 5', 'Jilid 4', 'Jilid 3', 'Jilid 2', 'Jilid 1'].map((jilid) => {
              const count = jilidDistribution[jilid] || 0;
              const percent = santriList.length > 0 ? Math.round((count / santriList.length) * 100) : 0;
              return (
                <div key={jilid} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>{jilid}</span>
                    <span className="text-slate-500 font-semibold">{count} Santri ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        jilid === 'Al-Qur\'an'
                          ? 'bg-emerald-600'
                          : jilid.includes('5') || jilid.includes('4')
                          ? 'bg-teal-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kehadiran & Aktivitas Terkini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Statistik Kehadiran 5 Hari Terakhir</h3>
              <p className="text-xs text-slate-500">Tren absensi santri TPQ pekan berjalan</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600" /> Hadir
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-400" /> Izin/Sakit
              </span>
            </div>
          </div>

          {/* Simple custom clean bar chart */}
          <div className="grid grid-cols-5 gap-2 pt-4 items-end h-44 border-b border-slate-100 pb-2">
            {[
              { day: 'Senin', date: '01 Nov', hadir: 7, total: 7 },
              { day: 'Selasa', date: '02 Nov', hadir: 6, total: 7 },
              { day: 'Rabu', date: '03 Nov', hadir: 6, total: 7 },
              { day: 'Kamis', date: '04 Nov', hadir: 7, total: 7 },
              { day: 'Jumat', date: '05 Nov (Hari ini)', hadir: santriHadirCount || 5, total: santriList.length || 7 },
            ].map((col, idx) => {
              const hadirPercent = Math.round((col.hadir / col.total) * 100);
              return (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-bold text-emerald-800">{hadirPercent}%</span>
                  <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end h-32">
                    <div
                      className="bg-emerald-600 rounded-t-lg transition-all duration-300 hover:bg-emerald-700"
                      style={{ height: `${hadirPercent}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-semibold text-slate-700">{col.day}</p>
                    <p className="text-[9px] text-slate-400">{col.date}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Action Shortcuts */}
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-600 block mb-2">Aksi Cepat Hari Ini:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => onNavigate('absen-santri')}
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-700" />
                Presensi Santri
              </button>
              <button
                onClick={() => onNavigate('log-progress')}
                className="p-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                Catat Progres
              </button>
              <button
                onClick={() => onNavigate('syahriah')}
                className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <DollarSign className="w-3.5 h-3.5 text-amber-700" />
                Input Syahriah
              </button>
              <button
                onClick={() => onNavigate('santri')}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-slate-600" />
                Tambah Santri
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
