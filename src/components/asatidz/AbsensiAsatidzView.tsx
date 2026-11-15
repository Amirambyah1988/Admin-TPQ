import React, { useState } from 'react';
import { useTPQ } from '../../context/TPQContext';
import {
  CalendarCheck2,
  Calendar,
  Download,
  Clock,
  CheckCircle2,
  Check,
  GraduationCap,
} from 'lucide-react';
import { StatusAbsensi } from '../../types';
import { exportToCSV, formatTanggalIndonesia } from '../../utils/exportExcel';

export const AbsensiAsatidzView: React.FC = () => {
  const { asatidzList, absensiAsatidz, saveAbsensiAsatidz } = useTPQ();

  const [activeTab, setActiveTab] = useState<'harian' | 'rekap'>('harian');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [rekapPeriod, setRekapPeriod] = useState<'harian' | 'mingguan' | 'bulanan' | 'tahunan'>('bulanan');
  const [savedNotice, setSavedNotice] = useState(false);

  // Attendance state for the selected date
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { jamMasuk: string; status: StatusAbsensi; keterangan: string }>
  >(() => {
    const initial: Record<string, { jamMasuk: string; status: StatusAbsensi; keterangan: string }> = {};
    asatidzList.forEach((a) => {
      const existing = absensiAsatidz.find((item) => item.asatidzId === a.id && item.tanggal === selectedDate);
      initial[a.id] = {
        jamMasuk: existing ? existing.jamMasuk : '15:30',
        status: existing ? existing.status : 'Hadir',
        keterangan: existing ? existing.keterangan || '' : '',
      };
    });
    return initial;
  });

  React.useEffect(() => {
    const updated: Record<string, { jamMasuk: string; status: StatusAbsensi; keterangan: string }> = {};
    asatidzList.forEach((a) => {
      const existing = absensiAsatidz.find((item) => item.asatidzId === a.id && item.tanggal === selectedDate);
      updated[a.id] = {
        jamMasuk: existing ? existing.jamMasuk : '15:30',
        status: existing ? existing.status : 'Hadir',
        keterangan: existing ? existing.keterangan || '' : '',
      };
    });
    setAttendanceMap(updated);
  }, [selectedDate, absensiAsatidz, asatidzList]);

  const handleFieldChange = (
    asatidzId: string,
    field: 'jamMasuk' | 'status' | 'keterangan',
    value: string
  ) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [asatidzId]: {
        ...prev[asatidzId],
        [field]: value,
      },
    }));
  };

  const handleSaveAttendance = () => {
    const records = Object.entries(attendanceMap).map(([asatidzId, data]) => ({
      asatidzId,
      jamMasuk: data.jamMasuk,
      status: data.status,
      keterangan: data.keterangan,
    }));
    saveAbsensiAsatidz(selectedDate, records);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  // Export Rekap to Excel
  const handleExportRekap = () => {
    const headers = [
      'No',
      'Nama Asatidz',
      'NIK',
      'Bidang Mengajar',
      'Total Hadir',
      'Total Sakit',
      'Total Izin',
      'Total Alpa',
      'Persentase Kehadiran (%)',
    ];

    const rows = asatidzList.map((a, idx) => {
      const records = absensiAsatidz.filter((item) => item.asatidzId === a.id);
      const hadir = records.filter((r) => r.status === 'Hadir').length;
      const sakit = records.filter((r) => r.status === 'Sakit').length;
      const izin = records.filter((r) => r.status === 'Izin').length;
      const alpa = records.filter((r) => r.status === 'Alpa').length;
      const total = records.length;
      const percent = total > 0 ? Math.round((hadir / total) * 100) : 100;

      return [idx + 1, a.nama, a.nik, a.mengajar, hadir, sakit, izin, alpa, `${percent}%`];
    });

    exportToCSV(`Rekap_Absensi_Asatidz_${rekapPeriod.toUpperCase()}`, headers, rows);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Presensi / Absensi Asatidz</h2>
          <p className="text-xs text-slate-500">
            Form pencatatan kehadiran & jam masuk dewan asatidz serta rekapitulasi tugas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('harian')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'harian' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              Presensi Harian
            </button>
            <button
              onClick={() => setActiveTab('rekap')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'rekap' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              Rekapitulasi
            </button>
          </div>

          {activeTab === 'rekap' && (
            <button
              onClick={handleExportRekap}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          )}
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Presensi asatidz tanggal {formatTanggalIndonesia(selectedDate)} berhasil disimpan!</span>
        </div>
      )}

      {activeTab === 'harian' ? (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Tanggal Mengajar:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-emerald-600 bg-white"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveAttendance}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Presensi Asatidz</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Nama Asatidz</th>
                    <th className="py-3 px-4">Jam Masuk</th>
                    <th className="py-3 px-4">Status Kehadiran</th>
                    <th className="py-3 px-4">Catatan Tugas / Materi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {asatidzList.map((asatidz) => {
                    const current = attendanceMap[asatidz.id] || { jamMasuk: '15:30', status: 'Hadir', keterangan: '' };
                    return (
                      <tr key={asatidz.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={asatidz.foto}
                              alt={asatidz.nama}
                              className="w-8 h-8 rounded-lg object-cover border"
                            />
                            <div>
                              <p className="font-bold text-slate-800">{asatidz.nama}</p>
                              <p className="text-[10px] text-slate-400">Pengajar {asatidz.mengajar}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="relative w-28">
                            <input
                              type="time"
                              value={current.jamMasuk}
                              onChange={(e) => handleFieldChange(asatidz.id, 'jamMasuk', e.target.value)}
                              className="w-full px-2 py-1 pl-6 border border-slate-200 rounded-lg text-xs font-mono"
                            />
                            <Clock className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 gap-0.5">
                            {(['Hadir', 'Sakit', 'Izin', 'Alpa'] as StatusAbsensi[]).map((st) => {
                              const isSelected = current.status === st;
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleFieldChange(asatidz.id, 'status', st)}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                                    isSelected
                                      ? st === 'Hadir'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : st === 'Sakit'
                                        ? 'bg-amber-500 text-white shadow-xs'
                                        : st === 'Izin'
                                        ? 'bg-blue-500 text-white shadow-xs'
                                        : 'bg-rose-500 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {st}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Materi yang diajarkan / keterangan"
                            value={current.keterangan}
                            onChange={(e) => handleFieldChange(asatidz.id, 'keterangan', e.target.value)}
                            className="w-full max-w-xs px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:outline-emerald-600"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Rekapitulasi View */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Pilih Periode Rekap:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                {(['harian', 'mingguan', 'bulanan', 'tahunan'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setRekapPeriod(period)}
                    className={`px-3 py-1 text-xs font-bold capitalize rounded-lg transition-all ${
                      rekapPeriod === period
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Menampilkan rekapitulasi kehadiran dewan asatidz ({rekapPeriod})
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Nama Asatidz</th>
                    <th className="py-3 px-4">Bidang</th>
                    <th className="py-3 px-4 text-center text-emerald-700">Hadir</th>
                    <th className="py-3 px-4 text-center text-amber-700">Sakit</th>
                    <th className="py-3 px-4 text-center text-blue-700">Izin</th>
                    <th className="py-3 px-4 text-center text-rose-700">Alpa</th>
                    <th className="py-3 px-4 text-center font-bold">Persentase (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {asatidzList.map((asatidz) => {
                    const records = absensiAsatidz.filter((a) => a.asatidzId === asatidz.id);
                    const hadir = records.filter((r) => r.status === 'Hadir').length;
                    const sakit = records.filter((r) => r.status === 'Sakit').length;
                    const izin = records.filter((r) => r.status === 'Izin').length;
                    const alpa = records.filter((r) => r.status === 'Alpa').length;
                    const total = records.length;
                    const percent = total > 0 ? Math.round((hadir / total) * 100) : 100;

                    return (
                      <tr key={asatidz.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{asatidz.nama}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{asatidz.nik}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{asatidz.mengajar}</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-700">{hadir}</td>
                        <td className="py-3 px-4 text-center font-medium text-amber-600">{sakit}</td>
                        <td className="py-3 px-4 text-center font-medium text-blue-600">{izin}</td>
                        <td className="py-3 px-4 text-center font-medium text-rose-600">{alpa}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-bold font-mono px-2 py-0.5 rounded ${
                              percent >= 90 ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                            }`}
                          >
                            {percent}%
                          </span>
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
    </div>
  );
};
