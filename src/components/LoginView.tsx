import React, { useState } from 'react';
import { useTPQ } from '../context/TPQContext';
import {
  BookOpen,
  Lock,
  User,
  Eye,
  EyeOff,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Users,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { tpqProfile, login, loginWithGoogle, loginDemo, registerAccount, resetPasswordRequest } = useTPQ();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'santri' | 'asatidz'>('santri');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Register state (strictly Santri / Orang Tua only)
  const [regNama, setRegNama] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotFeedback, setForgotFeedback] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setStatusMessage({
        type: 'error',
        text: role === 'asatidz' ? 'Mohon masukkan NIK atau Username Asatidz.' : 'Mohon masukkan username atau NIK santri.',
      });
      return;
    }
    if (!password.trim()) {
      setStatusMessage({ type: 'error', text: 'Kata sandi wajib diisi.' });
      return;
    }

    const res = login(identifier, password, role);
    if (!res.success) {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setStatusMessage(null);
    const res = await loginWithGoogle(role);
    setGoogleLoading(false);
    if (!res.success) {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNama.trim() || !regUsername.trim() || !regPassword.trim()) {
      setStatusMessage({ type: 'error', text: 'Lengkapi semua isian form pendaftaran.' });
      return;
    }

    const res = registerAccount({
      nama: regNama,
      username: regUsername,
      email: regEmail,
      password: regPassword,
      role: 'santri',
    });

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotInput.trim()) return;
    const res = resetPasswordRequest(forgotInput);
    setForgotFeedback(res.message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-emerald-800 to-slate-900 flex flex-col justify-between text-slate-800">
      {/* Top Banner & TPQ Profile summary (Read-only on Login Page) */}
      <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-md border border-emerald-500/30 overflow-hidden shrink-0">
            <img
              src={tpqProfile.logo}
              alt={tpqProfile.nama}
              className="w-full h-full object-cover rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=120&q=80';
              }}
            />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base sm:text-lg leading-tight tracking-tight">
              {tpqProfile.nama}
            </h1>
            <p className="text-emerald-200 text-xs flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate max-w-xs sm:max-w-md">{tpqProfile.alamat}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 p-6 text-white text-center relative">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs mb-3 border border-white/20 text-amber-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Sistem Informasi TPQ</h2>
            <p className="text-xs text-emerald-100/90 mt-1">
              Portal Terpadu Asatidz & Santri · Berbasis Web Mobile-Friendly
            </p>
            <div className="mt-3 text-[11px] text-emerald-200 font-medium">
              SK Kemenag: {tpqProfile.noSkKemenag}
            </div>
          </div>

          {/* Quick Demo Selector - Santri / Wali Portal Only */}
          <div className="bg-amber-50/80 border-b border-amber-200/60 p-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Pratinjau Portal Wali & Santri:
              </span>
            </div>
            <button
              type="button"
              onClick={() => loginDemo('santri')}
              className="w-full px-3 py-2 bg-white hover:bg-amber-50 border border-amber-600/30 rounded-xl text-xs font-semibold text-amber-900 flex items-center justify-center gap-1.5 shadow-2xs transition-all hover:scale-[1.01]"
            >
              <Users className="w-4 h-4 text-amber-600" />
              Demo Portal Santri (1-Klik)
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 p-1">
            <button
              onClick={() => {
                setActiveTab('login');
                setStatusMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Masuk (Login)
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setStatusMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Daftar Santri
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {statusMessage && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 border ${
                  statusMessage.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {statusMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {activeTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Role-Scoped Login Switcher */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Masuk Sebagai</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRole('santri');
                        setStatusMessage(null);
                      }}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                        role === 'santri'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-2xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Santri / Orang Tua
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRole('asatidz');
                        setStatusMessage(null);
                      }}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                        role === 'asatidz'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-2xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      Dewan Asatidz
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {role === 'asatidz' ? 'NIK / Username Asatidz' : 'Username / NIK Akun Santri'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder={
                        role === 'asatidz'
                          ? 'Masukkan NIK atau Username Asatidz'
                          : 'Contoh: 3301012345670001@tpq.com atau NIK'
                      }
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-emerald-600 transition-colors"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {role === 'asatidz'
                      ? '* Khusus akun Dewan Asatidz terverifikasi. Akun santri tidak dapat mengakses panel Asatidz.'
                      : '* Santri masuk menggunakan NIK berakhiran @tpq.com atau NIK terdaftar.'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">Kata Sandi (Password)</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      Lupa Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Masukkan kata sandi akun"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-emerald-600 transition-colors"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:shadow-lg"
                >
                  <span>{role === 'asatidz' ? 'Masuk Dashboard Asatidz' : 'Masuk Portal Santri'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium">atau</span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>

                <button
                  type="button"
                  disabled={googleLoading}
                  onClick={handleGoogleLogin}
                  className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>
                    {googleLoading
                      ? 'Menghubungkan ke Firebase...'
                      : role === 'asatidz'
                      ? 'Masuk Asatidz dengan Google'
                      : 'Masuk Santri dengan Google'}
                  </span>
                </button>

                <div className="pt-2 text-center">
                  <p className="text-[11px] text-slate-500">
                    Santri baru belum memiliki akun?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      Daftar Akun Santri
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-900">
                  <p className="font-bold">Pendaftaran Mandiri Akun Santri / Wali</p>
                  <p className="text-emerald-700 mt-0.5">
                    Pendaftaran ini hanya untuk portal Santri & Orang Tua. Akun Dewan Asatidz hanya didaftarkan oleh pengelola TPQ dari dalam sistem.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Santri</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Rayyan"
                    value={regNama}
                    onChange={(e) => setRegNama(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIK Santri (16 Digit)</label>
                  <input
                    type="text"
                    required
                    placeholder="3301xxxxxxxxxxxx"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-emerald-600"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Username otomatis: <strong>{regUsername ? `${regUsername}@tpq.com` : 'NIK@tpq.com'}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Aktif Orang Tua / Wali</label>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi (Password)</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-emerald-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Daftarkan Akun Santri & Masuk</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="p-4 text-center text-xs text-emerald-200/80">
        <p>© {new Date().getFullYear()} {tpqProfile.nama} · {tpqProfile.badanHukum}</p>
        <p className="text-[11px] text-emerald-300/60 mt-0.5">
          Taman Pendidikan Al-Qur'an Berbasis Pembinaan Akhlak & Tahfidzul Qur'an
        </p>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-700" />
                Bantuan Lupa Kata Sandi
              </h3>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotFeedback(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {forgotFeedback ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs border border-emerald-200">
                  {forgotFeedback}
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-700">Kontak Sekretariat Asatidz:</p>
                  <p>Telepon: {tpqProfile.telepon}</p>
                  <p>Email: {tpqProfile.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <p className="text-xs text-slate-600">
                  Masukkan NIK atau Username akun Anda untuk mengajukan reset kata sandi melalui Sekretariat Asatidz:
                </p>
                <input
                  type="text"
                  required
                  placeholder="NIK atau Username"
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 border text-xs rounded-xl text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-xl"
                  >
                    Kirim Permintaan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
