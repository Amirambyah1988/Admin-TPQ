import React, { useState } from 'react';
import { useTPQ } from '../../context/TPQContext';
import {
  Users,
  Plus,
  Search,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Eye,
  Edit,
  Trash2,
  X,
  CreditCard,
  Printer,
  KeyRound,
  ShieldCheck,
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Check,
} from 'lucide-react';
import { Santri } from '../../types';
import { exportToCSV, formatTanggalIndonesia } from '../../utils/exportExcel';
import { DigitalSantriCard } from '../DigitalSantriCard';

export const SantriView: React.FC = () => {
  const { santriList, addSantri, importSantriBatch, updateSantri, deleteSantri, tpqProfile, santriHafalanStatus } = useTPQ();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterJilid, setFilterJilid] = useState('All');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail' | 'card' | 'import' | null>(null);
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Form State
  const initialForm: Omit<Santri, 'id' | 'username'> & { username?: string } = {
    nama: '',
    nik: '',
    tempatLahir: 'Semarang',
    tanggalLahir: '2018-05-10',
    alamat: '',
    terdaftarTanggal: new Date().toISOString().slice(0, 10),
    foto: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=300&q=80',
    namaWali: '',
    noHpWali: '',
    jilid: 'Jilid 1',
    password: 'santri123',
    jenisKelamin: 'L',
  };

  const [formData, setFormData] = useState(initialForm);

  // Filtered Santri List
  const filteredSantri = santriList.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      s.nama.toLowerCase().includes(q) ||
      s.nik.toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q) ||
      s.namaWali.toLowerCase().includes(q) ||
      s.alamat.toLowerCase().includes(q);
    const matchJilid = filterJilid === 'All' || s.jilid === filterJilid;
    return matchQuery && matchJilid;
  });

  // Import State
  const [importTab, setImportTab] = useState<'file' | 'paste'>('file');
  const [importRawText, setImportRawText] = useState('');
  const [parsedImportList, setParsedImportList] = useState<
    Array<Omit<Santri, 'id' | 'username'> & { username?: string; isValid: boolean; errorMsg?: string }>
  >([]);
  const [importFileError, setImportFileError] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    const headers = [
      'Nama Santri',
      'NIK',
      'Jenis Kelamin (L/P)',
      'Tempat Lahir',
      'Tanggal Lahir (YYYY-MM-DD)',
      'Jilid',
      'Nama Wali',
      'No HP Wali',
      'Alamat',
      'Password',
    ];
    const sampleRows = [
      [
        'Muhammad Ilham Pratama',
        '3301012300010008',
        'L',
        'Semarang',
        '2018-03-12',
        'Jilid 2',
        'Hadi Pratama',
        '081234567890',
        'Jl. Cangkiran RT 02 RW 01',
        'santri123',
      ],
      [
        'Siti Nur Azizah',
        '3301016700020009',
        'P',
        'Semarang',
        '2019-07-20',
        'Jilid 1',
        'Ahmad Fauzan',
        '085712345678',
        'Jl. Mijen Permai No. 15',
        'santri123',
      ],
      [
        'Dzaky Ahmad Al-Fatih',
        '3301011500030010',
        'L',
        'Kendal',
        '2018-11-05',
        'Jilid 3',
        'Rudi Hartono',
        '081399887766',
        'Dusun Tambangan RT 03',
        'santri123',
      ],
    ];
    exportToCSV('Template_Import_Santri_TPQ', headers, sampleRows);
  };

  const parseCSVContent = (text: string) => {
    setImportFileError(null);
    if (!text.trim()) {
      setParsedImportList([]);
      return;
    }

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setParsedImportList([]);
      return;
    }

    // Check if first line is a header
    const firstLine = lines[0].toLowerCase();
    const hasHeader =
      firstLine.includes('nama') ||
      firstLine.includes('nik') ||
      firstLine.includes('santri') ||
      firstLine.includes('jilid');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const parsed: Array<
      Omit<Santri, 'id' | 'username'> & { username?: string; isValid: boolean; errorMsg?: string }
    > = [];

    dataLines.forEach((line, index) => {
      // Split by semicolon, comma, or tab
      let delimiter = ';';
      if (line.includes(';') && !line.includes('\t')) {
        delimiter = ';';
      } else if (line.includes('\t')) {
        delimiter = '\t';
      } else if (line.includes(',')) {
        delimiter = ',';
      }

      // Handle quotes
      const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*)"|([^"${delimiter}]*))`, 'g');
      const cells: string[] = [];
      let match;
      while ((match = regex.exec(line)) !== null) {
        cells.push((match[1] !== undefined ? match[1] : match[2] || '').trim());
      }

      if (cells.length < 2) return;

      const nama = cells[0] || '';
      const nik = cells[1] ? cells[1].replace(/[^0-9]/g, '') : `3301${Date.now().toString().slice(-8)}${index}`;
      const rawJK = (cells[2] || 'L').toUpperCase();
      const jenisKelamin: 'L' | 'P' = rawJK.startsWith('P') ? 'P' : 'L';
      const tempatLahir = cells[3] || 'Semarang';
      const tanggalLahir = cells[4] || '2018-01-01';
      const rawJilid = cells[5] || 'Jilid 1';
      const jilid = rawJilid.toLowerCase().includes('qur') ? "Al-Qur'an" : rawJilid;
      const namaWali = cells[6] || `Wali ${nama}`;
      const noHpWali = cells[7] || '-';
      const alamat = cells[8] || 'Sekitar TPQ';
      const password = cells[9] || 'santri123';

      const isValid = Boolean(nama.trim() && nik.trim());
      const errorMsg = !nama.trim()
        ? 'Nama santri kosong'
        : !nik.trim()
        ? 'NIK kosong'
        : undefined;

      parsed.push({
        nama,
        nik,
        jenisKelamin,
        tempatLahir,
        tanggalLahir,
        jilid,
        namaWali,
        noHpWali,
        alamat,
        terdaftarTanggal: new Date().toISOString().slice(0, 10),
        foto: '',
        password,
        isValid,
        errorMsg,
      });
    });

    if (parsed.length === 0) {
      setImportFileError('Tidak ditemukan baris data santri yang valid.');
    }

    setParsedImportList(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportRawText(text);
      parseCSVContent(text);
    };
    reader.readAsText(file);
  };

  const handleLoadPresetSample = () => {
    const sampleCSV = `Muhammad Ilham Pratama;3301012300010008;L;Semarang;2018-03-12;Jilid 2;Hadi Pratama;081234567890;Jl. Cangkiran RT 02 RW 01;santri123
Siti Nur Azizah;3301016700020009;P;Semarang;2019-07-20;Jilid 1;Ahmad Fauzan;085712345678;Jl. Mijen Permai No. 15;santri123
Dzaky Ahmad Al-Fatih;3301011500030010;L;Kendal;2018-11-05;Jilid 3;Rudi Hartono;081399887766;Dusun Tambangan RT 03;santri123
Zahra Kamila Khairunnisa;3301015800040011;P;Semarang;2017-09-14;Jilid 4;Gunawan Wibisono;081288776655;Jl. Anggrek No. 04;santri123
Fathan Robbani;3301010900050012;L;Semarang;2019-02-18;Jilid 1;Tri Wibowo;089611223344;Perumahan Cangkiran Asri;santri123`;
    setImportRawText(sampleCSV);
    parseCSVContent(sampleCSV);
  };

  const handleExecuteImport = () => {
    const validRows = parsedImportList.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setImportFileError('Tidak ada data valid yang bisa diimpor.');
      return;
    }

    const count = importSantriBatch(validRows);
    setImportSuccessMsg(`Alhamdulillah! Berhasil mengimpor ${count} data santri baru secara massal. Akun login NIK@tpq.com otomatis aktif.`);
    setModalMode(null);
    setParsedImportList([]);
    setImportRawText('');
    setTimeout(() => setImportSuccessMsg(null), 5000);
  };

  // Export to Excel
  const handleExport = () => {
    const headers = [
      'No',
      'Nama Santri',
      'NIK',
      'Jenis Kelamin',
      'Tempat Lahir',
      'Tanggal Lahir',
      'Jilid / Jenjang',
      'Akun Login (Username)',
      'Password Akun',
      'Nama Wali',
      'No. HP Wali',
      'Alamat',
      'Tanggal Terdaftar',
    ];
    const rows = filteredSantri.map((s, idx) => [
      idx + 1,
      s.nama,
      s.nik,
      s.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      s.tempatLahir,
      s.tanggalLahir,
      s.jilid,
      s.username,
      s.password,
      s.namaWali,
      s.noHpWali,
      s.alamat,
      s.terdaftarTanggal,
    ]);
    exportToCSV('Data_Santri_TPQ', headers, rows);
  };

  const handleOpenCreate = () => {
    setFormData(initialForm);
    setModalMode('create');
  };

  const handleOpenEdit = (santri: Santri) => {
    setSelectedSantri(santri);
    setFormData({
      nama: santri.nama,
      nik: santri.nik,
      tempatLahir: santri.tempatLahir,
      tanggalLahir: santri.tanggalLahir,
      alamat: santri.alamat,
      terdaftarTanggal: santri.terdaftarTanggal,
      foto: santri.foto,
      namaWali: santri.namaWali,
      noHpWali: santri.noHpWali,
      jilid: santri.jilid,
      password: santri.password,
      jenisKelamin: santri.jenisKelamin,
      username: santri.username,
    });
    setModalMode('edit');
  };

  const handleOpenDetail = (santri: Santri) => {
    setSelectedSantri(santri);
    setModalMode('detail');
  };

  const handleOpenCard = (santri: Santri) => {
    setSelectedSantri(santri);
    setModalMode('card');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') {
      addSantri(formData);
    } else if (modalMode === 'edit' && selectedSantri) {
      updateSantri(selectedSantri.id, formData);
    }
    setModalMode(null);
  };

  const handleDelete = (id: string) => {
    deleteSantri(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Manajemen Santri TPQ</h2>
          <p className="text-xs text-slate-500">
            Pendaftaran santri, akun login otomatis (NIK@tpq.com), kartu digital, dan data wali
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setModalMode('import');
              setParsedImportList([]);
              setImportRawText('');
              setImportFileError(null);
            }}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
            title="Import Data Santri dari File Excel / CSV"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-700" />
            <span>Import Data Santri</span>
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Santri Baru</span>
          </button>
        </div>
      </div>

      {importSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2.5 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{importSuccessMsg}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari nama santri, NIK, akun login, nama wali, atau alamat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 shadow-2xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={filterJilid}
          onChange={(e) => setFilterJilid(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-emerald-600 shadow-2xs"
        >
          <option value="All">Semua Jilid / Kelas ({santriList.length})</option>
          <option value="Al-Qur'an">Al-Qur'an</option>
          <option value="Jilid 6">Iqro Jilid 6</option>
          <option value="Jilid 5">Iqro Jilid 5</option>
          <option value="Jilid 4">Iqro Jilid 4</option>
          <option value="Jilid 3">Iqro Jilid 3</option>
          <option value="Jilid 2">Iqro Jilid 2</option>
          <option value="Jilid 1">Iqro Jilid 1</option>
        </select>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredSantri.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Tidak ada data santri yang cocok dengan kriteria pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Santri</th>
                  <th className="py-3 px-4">Jilid</th>
                  <th className="py-3 px-4">Akun Login Santri</th>
                  <th className="py-3 px-4 hidden md:table-cell">Wali Santri</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Terdaftar</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSantri.map((santri) => {
                  const hafalanCount = santriHafalanStatus.filter((h) => h.santriId === santri.id && h.lancar).length;
                  return (
                    <tr key={santri.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={santri.foto}
                            alt={santri.nama}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=120&q=80';
                            }}
                          />
                          <div>
                            <p className="font-bold text-slate-800 leading-snug">{santri.nama}</p>
                            <p className="text-[11px] text-slate-400">
                              NIK: <span className="font-mono">{santri.nik}</span> · {santri.jenisKelamin === 'L' ? 'Ikhwan' : 'Akhwat'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-emerald-800">
                          {santri.jilid}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] text-slate-700">
                          <div className="font-bold text-emerald-900">{santri.username}</div>
                          <div className="text-slate-400 text-[10px]">Pass: {santri.password}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <p className="font-medium text-slate-700">{santri.namaWali}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{santri.noHpWali}</p>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-slate-500">
                        {formatTanggalIndonesia(santri.terdaftarTanggal)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenCard(santri)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Kartu Santri Digital"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDetail(santri)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Detail Santri"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(santri)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Data Santri"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(santri.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Santri"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800">Hapus Data Santri</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus data santri ini beserta riwayat akunnya? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 border border-slate-300 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700"
              >
                Hapus Santri
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-800 text-white">
              <h3 className="font-bold text-sm">
                {modalMode === 'create' ? 'Pendaftaran Santri Baru TPQ' : 'Edit Data Santri'}
              </h3>
              <button onClick={() => setModalMode(null)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Santri</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama santri"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIK Santri (16 Digit)</label>
                  <input
                    type="text"
                    required
                    placeholder="3301xxxxxxxxxxxx"
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                  />
                </div>
              </div>

              {/* Login Account Preview Banner */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                  Kredensial Login Dashboard Santri:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-500">Username / ID Login:</span>
                    <p className="font-mono font-bold text-emerald-800">
                      {formData.nik ? `${formData.nik.trim()}@tpq.com` : 'NIK@tpq.com'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Kata Sandi Default:</span>
                    <input
                      type="text"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-2 py-1 border rounded bg-white font-mono text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600 bg-white"
                  >
                    <option value="L">Laki-laki (Ikhwan)</option>
                    <option value="P">Perempuan (Akhwat)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    required
                    value={formData.tempatLahir}
                    onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalLahir}
                    onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jilid / Tingkatan Kelas</label>
                  <select
                    value={formData.jilid}
                    onChange={(e) => setFormData({ ...formData, jilid: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600 bg-white"
                  >
                    <option value="Jilid 1">Iqro Jilid 1</option>
                    <option value="Jilid 2">Iqro Jilid 2</option>
                    <option value="Jilid 3">Iqro Jilid 3</option>
                    <option value="Jilid 4">Iqro Jilid 4</option>
                    <option value="Jilid 5">Iqro Jilid 5</option>
                    <option value="Jilid 6">Iqro Jilid 6</option>
                    <option value="Al-Qur'an">Al-Qur'an (Tahsin & Tahfidz)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Terdaftar</label>
                  <input
                    type="date"
                    required
                    value={formData.terdaftarTanggal}
                    onChange={(e) => setFormData({ ...formData, terdaftarTanggal: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Orang Tua / Wali</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama ayah / ibu / wali"
                    value={formData.namaWali}
                    onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP Wali</label>
                  <input
                    type="text"
                    required
                    placeholder="0812-xxxx-xxxx"
                    value={formData.noHpWali}
                    onChange={(e) => setFormData({ ...formData, noHpWali: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Tempat Tinggal</label>
                <textarea
                  rows={2}
                  required
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Foto Santri</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={formData.foto}
                    onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-emerald-600"
                    placeholder="https://..."
                  />
                  <img
                    src={formData.foto}
                    alt="Preview"
                    className="w-10 h-10 rounded-lg object-cover border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=120&q=80';
                    }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-3.5 py-2 border rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 text-white rounded-lg font-bold hover:bg-emerald-800"
                >
                  {modalMode === 'create' ? 'Simpan Santri Baru' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {modalMode === 'detail' && selectedSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="relative bg-emerald-800 p-6 text-white text-center">
              <button onClick={() => setModalMode(null)} className="absolute top-4 right-4 text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <div className="w-20 h-20 rounded-2xl mx-auto overflow-hidden border-2 border-white/60 shadow-md mb-3 bg-white">
                <img src={selectedSantri.foto} alt={selectedSantri.nama} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-base">{selectedSantri.nama}</h3>
              <p className="text-xs text-emerald-200 mt-0.5">{selectedSantri.jilid} · {selectedSantri.jenisKelamin === 'L' ? 'Ikhwan' : 'Akhwat'}</p>
            </div>

            <div className="p-5 space-y-3 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Akun Login Santri</span>
                <span className="font-mono font-bold text-emerald-800">{selectedSantri.username}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Kata Sandi</span>
                <span className="font-mono font-bold text-slate-700">{selectedSantri.password}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">NIK Santri</span>
                <span className="font-mono text-slate-800">{selectedSantri.nik}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Tempat, Tanggal Lahir</span>
                <span className="font-medium text-slate-800">
                  {selectedSantri.tempatLahir}, {selectedSantri.tanggalLahir}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Nama Orang Tua / Wali</span>
                <span className="font-medium text-slate-800">{selectedSantri.namaWali}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">No. WhatsApp Wali</span>
                <span className="font-mono font-bold text-emerald-700">{selectedSantri.noHpWali}</span>
              </div>
              <div className="py-1.5">
                <span className="text-slate-500 block mb-1">Alamat Santri</span>
                <p className="font-medium text-slate-800 leading-relaxed">{selectedSantri.alamat}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
              <button
                type="button"
                onClick={() => setModalMode('card')}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Lihat Kartu Digital</span>
              </button>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kartu Santri Digital Modal */}
      {modalMode === 'card' && selectedSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 no-print">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Kartu Tanda Anggota (KTA) Santri Digital</h3>
                <p className="text-[11px] text-slate-500">Identitas resmi santri {tpqProfile.nama}</p>
              </div>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center">
              <DigitalSantriCard santri={selectedSantri} tpq={tpqProfile} />
            </div>

            <div className="pt-2 border-t flex justify-between items-center no-print">
              <span className="text-[11px] text-slate-500">Gunakan tombol cetak untuk print KTA kartu PVC / kertas</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Kartu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-3.5 py-2 border rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Data Santri Modal */}
      {modalMode === 'import' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-800 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center text-emerald-200">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">Import Data Santri Massal</h3>
                  <p className="text-xs text-emerald-200/90">
                    Unggah daftar santri sekaligus lewat file Excel/CSV tanpa harus mengetik satu per satu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
              {/* Step 1: Download Template */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-700" />
                    Belum punya format file import?
                  </h4>
                  <p className="text-[11px] text-emerald-800/80 mt-0.5">
                    Unduh template CSV/Excel yang sudah disesuaikan dengan kolom data sistem TPQ.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template Excel</span>
                </button>
              </div>

              {/* Step 2: Upload or Paste Tabs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setImportTab('file')}
                      className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                        importTab === 'file' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Unggah File (.csv)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportTab('paste')}
                      className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                        importTab === 'paste' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Tempel Teks (Paste)
                    </button>
                  </div>

                  {/* 1-Click Preset Demo Button */}
                  <button
                    type="button"
                    onClick={handleLoadPresetSample}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Muat Contoh 5 Santri Sekaligus</span>
                  </button>
                </div>

                {importTab === 'file' ? (
                  <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center space-y-3 bg-slate-50/50 hover:bg-emerald-50/20 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 text-emerald-700 mx-auto flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Pilih file CSV / Excel santri Anda</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Mendukung pemisah titik koma (;), koma (,), atau tab dari Excel
                      </p>
                    </div>
                    <label className="inline-block px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl cursor-pointer shadow-xs transition-colors">
                      <span>Cari File di Komputer / HP</span>
                      <input
                        type="file"
                        accept=".csv,.txt,.tsv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <textarea
                      rows={5}
                      placeholder={`Format: Nama;NIK;JK;Tempat;TanggalLahir;Jilid;Wali;HP;Alamat\nContoh:\nMuhammad Ilham Pratama;3301012300010008;L;Semarang;2018-03-12;Jilid 2;Hadi Pratama;081234567890;Cangkiran`}
                      value={importRawText}
                      onChange={(e) => {
                        setImportRawText(e.target.value);
                        parseCSVContent(e.target.value);
                      }}
                      className="w-full p-3 font-mono text-[11px] border border-slate-300 rounded-2xl focus:outline-emerald-600 bg-white"
                    />
                    <p className="text-[10px] text-slate-400">
                      * Anda dapat menyalin langsung baris tabel dari spreadsheet Microsoft Excel / Google Sheets lalu tempel di atas.
                    </p>
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {importFileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{importFileError}</span>
                </div>
              )}

              {/* Step 3: Pratinjau & Validasi Data */}
              {parsedImportList.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800">
                        Pratinjau Data Santri Siap Diimpor
                      </span>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-extrabold text-[10px]">
                        {parsedImportList.filter((r) => r.isValid).length} Valid
                      </span>
                      {parsedImportList.some((r) => !r.isValid) && (
                        <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full font-extrabold text-[10px]">
                          {parsedImportList.filter((r) => !r.isValid).length} Tidak Valid
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Akun login santri otomatis: NIK@tpq.com
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase sticky top-0 border-b border-slate-200 text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">No</th>
                          <th className="py-2.5 px-3">Nama Santri</th>
                          <th className="py-2.5 px-3">NIK</th>
                          <th className="py-2.5 px-2">JK</th>
                          <th className="py-2.5 px-3">Jilid</th>
                          <th className="py-2.5 px-3">Wali & HP</th>
                          <th className="py-2.5 px-3">Akun Login Otomatis</th>
                          <th className="py-2.5 px-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedImportList.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50/60 ${!row.isValid ? 'bg-rose-50/50' : ''}`}
                          >
                            <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-3 font-bold text-slate-800">{row.nama}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{row.nik}</td>
                            <td className="py-2 px-2 font-bold">{row.jenisKelamin}</td>
                            <td className="py-2 px-3 text-emerald-800 font-semibold">{row.jilid}</td>
                            <td className="py-2 px-3 text-slate-600">
                              <div>{row.namaWali}</div>
                              <div className="text-[9px] text-slate-400 font-mono">{row.noHpWali}</div>
                            </td>
                            <td className="py-2 px-3 font-mono text-emerald-900 font-bold">
                              {row.nik}@tpq.com
                            </td>
                            <td className="py-2 px-2 text-center">
                              {row.isValid ? (
                                <span className="text-emerald-600 font-bold text-[10px]">✓ Siap</span>
                              ) : (
                                <span className="text-rose-600 font-bold text-[10px]" title={row.errorMsg}>
                                  ✕ {row.errorMsg}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Data yang diimpor akan langsung memiliki akun login dan kartu digital resmi.
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={parsedImportList.filter((r) => r.isValid).length === 0}
                  onClick={handleExecuteImport}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    Impor {parsedImportList.filter((r) => r.isValid).length} Santri Sekarang
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
