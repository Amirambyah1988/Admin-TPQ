import React, { useState } from 'react';
import { useTPQ } from '../context/TPQContext';
import {
  Building2,
  LogOut,
  User as UserIcon,
  X,
  Plus,
  Trash2,
  Check,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileCheck,
  Cloud,
} from 'lucide-react';
import { TPQProfile, RekeningBank } from '../types';

interface ProfileTPQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileTPQModal: React.FC<ProfileTPQModalProps> = ({ isOpen, onClose }) => {
  const { tpqProfile, updateTPQProfile } = useTPQ();
  const [formData, setFormData] = useState<TPQProfile>({ ...tpqProfile });
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleBankChange = (index: number, field: keyof RekeningBank, value: string) => {
    const updated = [...formData.rekeningList];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, rekeningList: updated });
  };

  const handleAddBank = () => {
    const newBank: RekeningBank = {
      id: `rek-${Date.now()}`,
      bank: 'Bank Syariah Indonesia (BSI)',
      nomor: '',
      atasNama: formData.nama.toUpperCase(),
    };
    setFormData({ ...formData, rekeningList: [...formData.rekeningList, newBank] });
  };

  const handleRemoveBank = (index: number) => {
    const updated = formData.rekeningList.filter((_, i) => i !== index);
    setFormData({ ...formData, rekeningList: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTPQProfile(formData);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center text-emerald-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Pengaturan Profil TPQ</h2>
              <p className="text-xs text-emerald-200/90">Identitas lembaga, badan hukum & rekening bank</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl flex items-center gap-2 border border-emerald-200">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Profil TPQ berhasil diperbarui!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama TPQ / Lembaga</label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Berdiri</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.tahunBerdiri}
                  onChange={(e) => setFormData({ ...formData, tahunBerdiri: e.target.value })}
                  className="w-full px-3 py-2 pl-9 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Badan Hukum / Yayasan</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.badanHukum}
                  onChange={(e) => setFormData({ ...formData, badanHukum: e.target.value })}
                  className="w-full px-3 py-2 pl-9 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white"
                />
                <FileCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">No. SK Kemenag / Izin Operasional</label>
              <input
                type="text"
                value={formData.noSkKemenag}
                onChange={(e) => setFormData({ ...formData, noSkKemenag: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap TPQ</label>
            <div className="relative">
              <textarea
                rows={2}
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                className="w-full px-3 py-2 pl-9 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white text-xs leading-relaxed"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">No. Kontak / Telepon</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.telepon}
                  onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                  className="w-full px-3 py-2 pl-9 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Resmi</label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 pl-9 border border-slate-300 rounded-lg focus:outline-emerald-600 bg-white"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">URL Logo Lembaga</label>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 text-xs bg-white"
                placeholder="https://..."
              />
              <img
                src={formData.logo}
                alt="Logo preview"
                className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-slate-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=120&q=80';
                }}
              />
            </div>
          </div>

          {/* Rekening Bank Section */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <h3 className="font-semibold text-xs text-slate-800">
                  Daftar Rekening Bank & QRIS (Tampil di Dashboard Santri)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddBank}
                className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Rekening
              </button>
            </div>

            <div className="space-y-3">
              {formData.rekeningList.map((rek, idx) => (
                <div key={rek.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Rekening #{idx + 1}</span>
                    {formData.rekeningList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBank(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                        title="Hapus Rekening"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Nama Bank / E-Wallet / QRIS"
                      value={rek.bank}
                      onChange={(e) => handleBankChange(idx, 'bank', e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Nomor Rekening / NMID"
                      value={rek.nomor}
                      onChange={(e) => handleBankChange(idx, 'nomor', e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Atas Nama Pemilik Rekening"
                      value={rek.atasNama}
                      onChange={(e) => handleBankChange(idx, 'atasNama', e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium text-xs transition-colors shadow-xs"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Header: React.FC = () => {
  const { tpqProfile, currentUser, firebaseUser, loginWithGoogle, logout } = useTPQ();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Lembaga Info */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-emerald-200/80 shadow-xs shrink-0 bg-emerald-50">
              <img
                src={tpqProfile.logo}
                alt={tpqProfile.nama}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=120&q=80';
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate">
                  {tpqProfile.nama}
                </span>
                <span className="text-emerald-700 text-xs font-semibold hidden md:inline">
                  · TPQ Digital
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md">
                {tpqProfile.badanHukum} · Est. {tpqProfile.tahunBerdiri}
              </p>
            </div>
          </div>

          {/* Action buttons & User info */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser && (
              <>
                {currentUser.role === 'asatidz' && !firebaseUser && (
                  <button
                    onClick={() => void loginWithGoogle('asatidz')}
                    className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg flex items-center gap-1.5 border border-amber-200/80 transition-colors"
                    title="Hubungkan akun Google untuk sinkronisasi Firestore"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Hubungkan Firebase</span>
                  </button>
                )}

                {currentUser.role === 'asatidz' && (
                  <button
                    onClick={() => setProfileModalOpen(true)}
                    className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1.5 border border-emerald-200/60 transition-colors"
                    title="Pengaturan Profil TPQ"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Profil Lembaga</span>
                  </button>
                )}

                {/* User avatar & role */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-300 bg-emerald-100 shrink-0">
                    {currentUser.foto ? (
                      <img src={currentUser.foto} alt={currentUser.nama} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-emerald-700">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="hidden lg:block text-left text-xs leading-tight">
                    <p className="font-bold text-slate-800 truncate max-w-[140px]">{currentUser.nama}</p>
                    <p className="text-[10px] uppercase font-semibold text-emerald-700 tracking-wider">
                      {currentUser.role === 'asatidz' ? 'Dewan Asatidz' : 'Santri'}
                    </p>
                  </div>

                  <button
                    onClick={logout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                    title="Keluar / Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {currentUser?.role === 'asatidz' && (
        <ProfileTPQModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      )}
    </>
  );
};
