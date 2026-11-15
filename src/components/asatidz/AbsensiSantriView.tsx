import React, { useState } from 'react';
import { useTPQ } from '../../context/TPQContext';
import {
  CalendarCheck2,
  Calendar,
  Download,
  CheckCircle2,
  Clock,
  Filter,
  Users,
  Search,
  Check,
} from 'lucide-react';
import { StatusAbsensi } from '../../types';
import { exportToCSV, formatTanggalIndonesia } from '../../utils/exportExcel';

export const AbsensiSantriView: React.FC = () => {
  const { santriList, absensiSantri, saveAbsensiSantri } = useTPQ();

  const [activeTab, setActiveTab] = useState<'harian' | 'rekap'>('harian');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [filterJilid, setFilterJilid] = useState('All');
  const [rekapPeriod, setRekapPeriod] = useState<'harian' | 'mingguan' | 'bulanan' | 'tahunan'>('bulanan');
  const [savedNotice, setSavedNotice] = useState(false);

  // Santri list filtered by jilid
  const filteredSantri = santriList.filter((s) => (filterJilid === 'All' ? true : s.jilid === filterJilid));

  // Attendance state for the selected date
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: StatusAbsensi; keterangan: string }>>(() => {
    const initial: Record<string, { status: StatusAbsensi; keterangan: string }> = {};
    santriList.forEach((s) => {
      const existing = absensiSantri.find((a) => a.santriId === s.id && a.tanggal === selectedDate);
      initial[s.id] = {
        status: existing ? existing.status : 'Hadir',
        keterangan: existing ? existing.keterangan || '' : '',
      };
    });
    return initial;
  });

  // Sync attendanceMap when selectedDate changes
  React.useEffect(() => {
    const updated: Record<string, { status: StatusAbsensi; keterangan: string }> = {};
    santriList.forEach((s) => {
      const existing = absensiSantri.find((a) => a.santriId === s.id && a.tanggal === selectedDate);
      updated[s.id] = {
        status: existing ? existing.status : 'Hadir',
        keterangan: existing ? existing.keterangan || '' : '',
      };
    });
    setAttendanceMap(updated);
  }, [selectedDate, absensiSantri, santriList]);

  const handleStatusChange = (santriId: string, status: StatusAbsensi) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [santriId]: {
        ...prev[santriId],
        status,
      },
    }));
  };

  const handleKeteranganChange = (santriId: string, keterangan: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [santriId]: {
        ...prev[santriId],
        keterangan,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    const updated = { ...attendanceMap };
    filteredSantri.forEach((s) => {
      updated[s.id] = { status: 'Hadir', keterangan: updated[s.id]?.keterangan || '' };
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = () => {
    const records = Object.entries(attendanceMap).map(([santriId, data]) => ({
      santriId,
      status: data.status,
      keterangan: data.keterangan,
    }));
    saveAbsensiSantri(selectedDate, records);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  // Export Rekap to Excel
  const handleExportRekap = () => {
    const headers = [
      'No',
      'Nama Santri',
      'NIK',
      'Jilid',
      'Total Hadir',
      'Total Sakit',
      'Total Izin',
      'Total Alpa',
      'Persentase Kehadiran (%)',
    ];

    const rows = santriList.map((s, idx) => {
      // Filter records according to rekapPeriod
      const records = absensiSantri.filter((a) => a.santriId === s.id);
      const hadir = records.filter((r) => r.status === 'Hadir').length;
      const sakit = records.filter((r) => r.status === 'Sakit').length;
      const izin = records.filter((r) => r.status === 'Izin').length;
      const alpa = records.filter((r) => r.status === 'Alpa').length;
      const total = records.length;
      const percent = total > 0 ? Math.round((hadir / total) * 100) : 100;

      return [idx + 1, s.nama, s.nik, s.jilid, hadir, sakit, izin, alpa, `${percent}%`];
    });

    exportToCSV(`Rekap_Absensi_Santri_${rekapPeriod.toUpperCase()}`, headers, rows);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Presensi / Absensi Santri</h2>
          <p className="text-xs text-slate-500">
            Form pencatatan kehadiran harian santri dan rekapitulasi periodik
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs for Input Harian vs Rekap */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('harian')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'harian' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              Input Presensi Harian
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
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Presensi santri tanggal {formatTanggalIndonesia(selectedDate)} berhasil disimpan!</span>
        </div>
      )}

      {activeTab === 'harian' ? (
        <div className="space-y-4">
          {/* Controls: Date Picker, Jilid Filter, Quick All Present */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Tanggal:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-emerald-600 bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Kelas / Jilid:</span>
                <select
                  value={filterJilid}
                  onChange={(e) => setFilterJilid(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-emerald-600 bg-white"
                >
                  <option value="All">Semua Jilid ({santriList.length})</option>
                  <option value="Al-Qur'an">Al-Qur'an</option>
                  <option value="Jilid 6">Jilid 6</option>
                  <option value="Jilid 5">Jilid 5</option>
                  <option value="Jilid 4">Jilid 4</option>
                  <option value="Jilid 3">Jilid 3</option>
                  <option value="Jilid 2">Jilid 2</option>
                  <option value="Jilid 1">Jilid 1</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
              >
                Tandai Semua Hadir
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Presensi</span>
              </button>
            </div>
          </div>

          {/* Santri Attendance List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Santri</th>
                    <th className="py-3 px-4">Jilid</th>
                    <th className="py-3 px-4">Status Kehadiran</th>
                    <th className="py-3 px-4">Keterangan / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSantri.map((santri) => {
                    const currentStatus = attendanceMap[santri.id]?.status || 'Hadir';
                    const currentKet = attendanceMap[santri.id]?.keterangan || '';
                    return (
                      <tr key={santri.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={santri.foto}
                              alt={santri.nama}
                              className="w-8 h-8 rounded-lg object-cover border"
                            />
                            <div>
                              <p className="font-bold text-slate-800">{santri.nama}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{santri.nik}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-700">{santri.jilid}</span>
                        </td>
                        <td className="py-3 px-4">
                          {/* Segmented status buttons */}
                          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 gap-0.5">
                            {(['Hadir', 'Sakit', 'Izin', 'Alpa'] as StatusAbsensi[]).map((st) => {
                              const isSelected = currentStatus === st;
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleStatusChange(santri.id, st)}
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
                            placeholder="Catatan (misal: flu demam, acara keluarga)"
                            value={currentKet}
                            onChange={(e) => handleKeteranganChange(santri.id, e.target.value)}
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
              Menampilkan kalkulasi kehadiran santri ({rekapPeriod})
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Santri</th>
                    <th className="py-3 px-4">Jilid</th>
                    <th className="py-3 px-4 text-center text-emerald-700">Hadir</th>
                    <th className="py-3 px-4 text-center text-amber-700">Sakit</th>
                    <th className="py-3 px-4 text-center text-blue-700">Izin</th>
                    <th className="py-3 px-4 text-center text-rose-700">Alpa</th>
                    <th className="py-3 px-4 text-center font-bold">Persentase (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {santriList.map((santri) => {
                    const records = absensiSantri.filter((a) => a.santriId === santri.id);
                    const hadir = records.filter((r) => r.status === 'Hadir').length;
                    const sakit = records.filter((r) => r.status === 'Sakit').length;
                    const izin = records.filter((r) => r.status === 'Izin').length;
                    const alpa = records.filter((r) => r.status === 'Alpa').length;
                    const total = records.length;
                    const percent = total > 0 ? Math.round((hadir / total) * 100) : 100;

                    return (
                      <tr key={santri.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{santri.nama}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{santri.nik}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{santri.jilid}</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-700">{hadir}</td>
                        <td className="py-3 px-4 text-center font-medium text-amber-600">{sakit}</td>
                        <td className="py-3 px-4 text-center font-medium text-blue-600">{izin}</td>
                        <td className="py-3 px-4 text-center font-medium text-rose-600">{alpa}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-bold font-mono px-2 py-0.5 rounded ${
                              percent >= 85 ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
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
