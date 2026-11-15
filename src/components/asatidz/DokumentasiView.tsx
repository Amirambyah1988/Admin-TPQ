import React, { useState } from 'react';
import { useTPQ } from '../../context/TPQContext';
import { Camera, Plus, Trash2, Calendar, User, X, Check, Image as ImageIcon } from 'lucide-react';
import { DokumentasiKegiatan } from '../../types';
import { formatTanggalIndonesia } from '../../utils/exportExcel';

export const DokumentasiView: React.FC = () => {
  const { dokumentasiList, addDokumentasi, deleteDokumentasi, currentUser } = useTPQ();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<DokumentasiKegiatan | null>(null);

  // Form State
  const [judul, setJudul] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [kategori, setKategori] = useState('Kegiatan Belajar');
  const [deskripsi, setDeskripsi] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !fotoUrl.trim()) return;

    addDokumentasi({
      judul: judul.trim(),
      tanggal,
      kategori,
      deskripsi: deskripsi.trim(),
      fotoUrl: fotoUrl.trim(),
      dibuatOleh: currentUser?.nama || 'Dewan Asatidz',
    });

    setJudul('');
    setDeskripsi('');
    setFotoUrl('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Galeri Dokumentasi Foto Kegiatan TPQ</h2>
          <p className="text-xs text-slate-500">
            Foto kegiatan belajar, wisuda, perlombaan, dan rihlah (otomatis tampil pada portal santri)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Foto Kegiatan</span>
        </button>
      </div>

      {/* Grid of Photos */}
      {dokumentasiList.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border">
          Belum ada foto dokumentasi. Klik tombol di atas untuk menambahkan foto pertama!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {dokumentasiList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col group hover:shadow-md transition-all"
            >
              <div
                onClick={() => setSelectedPhoto(item)}
                className="relative h-48 overflow-hidden bg-slate-100 cursor-pointer"
              >
                <img
                  src={item.fotoUrl}
                  alt={item.judul}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                  {item.kategori}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3
                    onClick={() => setSelectedPhoto(item)}
                    className="font-bold text-sm text-slate-900 hover:text-emerald-700 cursor-pointer leading-snug line-clamp-2"
                  >
                    {item.judul}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.deskripsi}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{formatTanggalIndonesia(item.tanggal)}</span>
                  </div>

                  <button
                    onClick={() => deleteDokumentasi(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Hapus Dokumentasi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add Photo */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-700" />
                Upload Foto Kegiatan Baru
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Kegiatan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Manasik Haji Cilik / Wisuda Santri"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Kegiatan</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600 bg-white"
                  >
                    <option value="Kegiatan Belajar">Kegiatan Belajar</option>
                    <option value="Wisuda & Ujian">Wisuda & Ujian</option>
                    <option value="Perlombaan">Perlombaan</option>
                    <option value="Kegiatan Outdoor">Kegiatan Outdoor / Rihlah</option>
                    <option value="Khotmil Qur'an">Khotmil Qur'an</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Foto Dokumentasi</label>
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Tips: Masukkan URL foto kegiatan yang jernih dan beresolusi baik
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Singkat Kegiatan</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ceritakan momen seru dan pesan inspiratif kegiatan santri..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div className="pt-2 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 border rounded-lg font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800"
                >
                  Publikasikan Foto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Zoom Photo */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="relative max-h-[60vh] bg-black">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={selectedPhoto.fotoUrl}
                alt={selectedPhoto.judul}
                className="w-full h-full max-h-[60vh] object-contain mx-auto"
              />
            </div>
            <div className="p-5 space-y-2">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                {selectedPhoto.kategori}
              </span>
              <h3 className="font-bold text-base text-slate-900">{selectedPhoto.judul}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedPhoto.deskripsi}</p>
              <p className="text-[11px] text-slate-400 pt-2 border-t">
                {formatTanggalIndonesia(selectedPhoto.tanggal)} · Diunggah oleh: {selectedPhoto.dibuatOleh}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
