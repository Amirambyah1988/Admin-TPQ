import React, { useState } from 'react';
import { useTPQ } from '../../context/TPQContext';
import {
  GraduationCap,
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  X,
  Check,
  Phone,
  Calendar,
  MapPin,
  BookOpen,
  User,
  Shield,
} from 'lucide-react';
import { Asatidz } from '../../types';
import { exportToCSV, formatTanggalIndonesia } from '../../utils/exportExcel';

export const AsatidzView: React.FC = () => {
  const { asatidzList, addAsatidz, updateAsatidz, deleteAsatidz } = useTPQ();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail' | null>(null);
  const [selectedAsatidz, setSelectedAsatidz] = useState<Asatidz | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const initialForm: Omit<Asatidz, 'id'> = {
    nama: '',
    nik: '',
    username: '',
    password: '',
    tempatLahir: '',
    tanggalLahir: '',
    pendidikan: 'S1 Pendidikan Agama Islam',
    mengajar: 'Al-Qur\'an',
    alamat: '',
    tanggalMulaiTugas: new Date().toISOString().slice(0, 10),
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    noHp: '',
    statusAktif: true,
  };

  const [formData, setFormData] = useState<Omit<Asatidz, 'id'>>(initialForm);

  // Filtered List
  const filteredAsatidz = asatidzList.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.nama.toLowerCase().includes(q) ||
      a.nik.toLowerCase().includes(q) ||
      a.mengajar.toLowerCase().includes(q) ||
      a.alamat.toLowerCase().includes(q)
    );
  });

  // Export to Excel
  const handleExport = () => {
    const headers = [
      'No',
      'Nama Asatidz',
      'NIK',
      'Tempat Lahir',
      'Tanggal Lahir',
      'Pendidikan Terakhir',
      'Bidang Mengajar',
      'Alamat',
      'Tanggal Mulai Tugas',
      'No. HP',
      'Status',
    ];
    const rows = filteredAsatidz.map((a, idx) => [
      idx + 1,
      a.nama,
      a.nik,
      a.tempatLahir,
      a.tanggalLahir,
      a.pendidikan,
      a.mengajar,
      a.alamat,
      a.tanggalMulaiTugas,
      a.noHp,
      a.statusAktif ? 'Aktif' : 'Non-Aktif',
    ]);
    exportToCSV('Data_Asatidz_TPQ', headers, rows);
  };

  const handleOpenCreate = () => {
    setFormData(initialForm);
    setModalMode('create');
  };

  const handleOpenEdit = (asatidz: Asatidz) => {
    setSelectedAsatidz(asatidz);
    setFormData({
      nama: asatidz.nama,
      nik: asatidz.nik,
      username: asatidz.username || '',
      password: '',
      tempatLahir: asatidz.tempatLahir,
      tanggalLahir: asatidz.tanggalLahir,
      pendidikan: asatidz.pendidikan,
      mengajar: asatidz.mengajar,
      alamat: asatidz.alamat,
      tanggalMulaiTugas: asatidz.tanggalMulaiTugas,
      foto: asatidz.foto,
      noHp: asatidz.noHp,
      statusAktif: asatidz.statusAktif,
    });
    setModalMode('edit');
  };

  const handleOpenDetail = (asatidz: Asatidz) => {
    setSelectedAsatidz(asatidz);
    setModalMode('detail');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') {
      addAsatidz({
        ...formData,
        username: formData.username?.trim() || undefined,
        password: formData.password?.trim() || 'asatidz123',
      });
    } else if (modalMode === 'edit' && selectedAsatidz) {
      const payload: Partial<Asatidz> = {
        ...formData,
        username: formData.username?.trim() || undefined,
      };
      if (!formData.password?.trim()) {
        delete payload.password;
      } else {
        payload.password = formData.password.trim();
      }
      updateAsatidz(selectedAsatidz.id, payload);
    }
    setModalMode(null);
  };

  const handleDelete = (id: string) => {
    deleteAsatidz(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Manajemen Dewan Asatidz</h2>
          <p className="text-xs text-slate-500">
            Kelola data profil, kualifikasi mengajar, dan status pengajar TPQ
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            <span>Tambah Asatidz</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Cari asatidz berdasarkan nama, NIK, alamat, atau bidang mengajar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 focus:border-emerald-600 shadow-2xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
      </div>

      {/* Table & Cards Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredAsatidz.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Tidak ada data asatidz yang sesuai dengan pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Pengajar</th>
                  <th className="py-3 px-4">NIK</th>
                  <th className="py-3 px-4">Mengajar</th>
                  <th className="py-3 px-4 hidden md:table-cell">Pendidikan</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Mulai Tugas</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Kontak</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAsatidz.map((asatidz) => (
                  <tr key={asatidz.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={asatidz.foto}
                          alt={asatidz.nama}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80';
                          }}
                        />
                        <div>
                          <p className="font-bold text-slate-800 leading-snug">{asatidz.nama}</p>
                          <p className="text-[11px] text-slate-400">{asatidz.tempatLahir}, {asatidz.tanggalLahir}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{asatidz.nik}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-emerald-800">
                        {asatidz.mengajar}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-slate-600 truncate max-w-[180px]">
                      {asatidz.pendidikan}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-slate-500">
                      {formatTanggalIndonesia(asatidz.tanggalMulaiTugas)}
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell text-slate-600 font-mono">
                      {asatidz.noHp || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenDetail(asatidz)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Lihat Detail Asatidz"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(asatidz)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Data Asatidz"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(asatidz.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Asatidz"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800">Konfirmasi Hapus Asatidz</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus data pengajar ini? Data yang telah dihapus tidak dapat dipulihkan.
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
                Hapus Asatidz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-800 text-white">
              <h3 className="font-bold text-sm">
                {modalMode === 'create' ? 'Tambah Data Asatidz Baru' : 'Edit Data Asatidz'}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ustadz Ahmad, S.Pd.I"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIK (Nomor Induk Kependudukan)</label>
                  <input
                    type="text"
                    required
                    placeholder="16 digit NIK"
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <label className="block font-bold text-slate-700 mb-1">Pendidikan Terakhir</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: S1 PAI / Ma'had Aly / SMA"
                    value={formData.pendidikan}
                    onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mengajar</label>
                  <select
                    value={formData.mengajar}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mengajar: e.target.value as 'Iqro' | 'Al-Qur\'an' | 'Keduanya',
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600 bg-white"
                  >
                    <option value="Iqro">Iqro</option>
                    <option value="Al-Qur'an">Al-Qur'an</option>
                    <option value="Keduanya">Keduanya (Iqro & Al-Qur'an)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai Tugas</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalMulaiTugas}
                    onChange={(e) => setFormData({ ...formData, tanggalMulaiTugas: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={formData.noHp}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  required
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Foto Asatidz</label>
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
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80';
                    }}
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                  <Shield className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Kredensial Login Dewan Asatidz</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Username Login (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: ust.ahmad (atau gunakan NIK)"
                      value={formData.username || ''}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Login</label>
                    <input
                      type="password"
                      placeholder={
                        modalMode === 'edit'
                          ? 'Kosongkan jika tidak ingin mengubah'
                          : 'Default: asatidz123 jika dikosongkan'
                      }
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-emerald-600"
                    />
                  </div>
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
                  {modalMode === 'create' ? 'Simpan Data Asatidz' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Asatidz */}
      {modalMode === 'detail' && selectedAsatidz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="relative bg-emerald-800 p-6 text-white text-center">
              <button
                onClick={() => setModalMode(null)}
                className="absolute top-4 right-4 text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-20 h-20 rounded-2xl mx-auto overflow-hidden border-2 border-white/60 shadow-md mb-3 bg-white">
                <img
                  src={selectedAsatidz.foto}
                  alt={selectedAsatidz.nama}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-bold text-base">{selectedAsatidz.nama}</h3>
              <p className="text-xs text-emerald-200 mt-0.5">Pengajar {selectedAsatidz.mengajar}</p>
            </div>

            <div className="p-5 space-y-3 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Nomor Induk (NIK)</span>
                <span className="font-mono font-bold text-slate-800">{selectedAsatidz.nik}</span>
              </div>
              {selectedAsatidz.username && (
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Username Login</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedAsatidz.username}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Tempat, Tanggal Lahir</span>
                <span className="font-medium text-slate-800">
                  {selectedAsatidz.tempatLahir}, {selectedAsatidz.tanggalLahir}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Pendidikan Terakhir</span>
                <span className="font-medium text-slate-800">{selectedAsatidz.pendidikan}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Mulai Bertugas</span>
                <span className="font-medium text-slate-800">
                  {formatTanggalIndonesia(selectedAsatidz.tanggalMulaiTugas)}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">No. WhatsApp</span>
                <span className="font-mono font-bold text-emerald-700">{selectedAsatidz.noHp}</span>
              </div>
              <div className="py-1.5">
                <span className="text-slate-500 block mb-1">Alamat Domisili</span>
                <p className="font-medium text-slate-800 leading-relaxed">{selectedAsatidz.alamat}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
