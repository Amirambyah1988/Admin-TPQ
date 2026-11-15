import React from 'react';
import { Santri, TPQProfile } from '../types';
import { QrCode, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

interface DigitalSantriCardProps {
  santri: Santri;
  tpq: TPQProfile;
  className?: string;
}

export const DigitalSantriCard: React.FC<DigitalSantriCardProps> = ({ santri, tpq, className = '' }) => {
  return (
    <div
      className={`printable-card relative w-full max-w-[390px] h-[230px] rounded-2xl overflow-hidden shadow-xl border border-emerald-600/30 text-white flex flex-col justify-between p-4 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 ${className}`}
      style={{
        backgroundImage: `radial-gradient(circle at 100% 0%, rgba(245, 158, 11, 0.15) 0%, transparent 45%), radial-gradient(circle at 0% 100%, rgba(16, 185, 129, 0.2) 0%, transparent 50%)`,
      }}
    >
      {/* Background Decorative Islamic Arch pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-5 border-4 border-dashed border-amber-300 m-1.5 rounded-xl" />

      {/* Header Card */}
      <div className="relative flex items-center justify-between border-b border-emerald-700/80 pb-2 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white p-0.5 overflow-hidden shadow-xs border border-amber-400 shrink-0">
            <img
              src={tpq.logo}
              alt="Logo"
              className="w-full h-full object-cover rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=100&q=80';
              }}
            />
          </div>
          <div className="leading-tight">
            <h4 className="font-extrabold text-[12px] tracking-tight text-white uppercase drop-shadow-xs">
              {tpq.nama}
            </h4>
            <p className="text-[9px] text-amber-300 font-medium">
              KARTU TANDA ANGGOTA SANTRI (KTA)
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[8px] uppercase tracking-wider text-emerald-200/90 block">
            No. SK Kemenag
          </span>
          <span className="text-[9px] font-mono text-emerald-100 font-semibold truncate max-w-[120px] block">
            {tpq.noSkKemenag ? tpq.noSkKemenag.split('/')[0] : 'KD.11.33'}
          </span>
        </div>
      </div>

      {/* Body Card */}
      <div className="relative flex items-center gap-3.5 my-auto z-10">
        {/* Photo with Gold Frame */}
        <div className="relative w-[78px] h-[96px] rounded-xl overflow-hidden border-2 border-amber-400 shadow-md shrink-0 bg-white">
          <img
            src={santri.foto}
            alt={santri.nama}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=150&q=80';
            }}
          />
          <div className="absolute bottom-0 inset-x-0 bg-emerald-950/90 py-0.5 text-center text-[8px] font-bold text-amber-300">
            {santri.jenisKelamin === 'L' ? 'IKHWAN' : 'AKHWAT'}
          </div>
        </div>

        {/* Biodata */}
        <div className="flex-1 min-w-0 space-y-1 text-[11px]">
          <div>
            <p className="font-bold text-sm text-white truncate leading-tight tracking-tight drop-shadow-xs">
              {santri.nama}
            </p>
            <p className="font-mono text-[10px] text-amber-300 font-semibold">
              NISN/NIK: {santri.nik}
            </p>
          </div>

          <div className="space-y-0.5 text-[10px] text-emerald-100/90">
            <div className="flex items-center gap-1">
              <span className="text-emerald-300/80 w-12 shrink-0">Jenjang</span>
              <span className="font-bold text-white">: {santri.jilid}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-emerald-300/80 w-12 shrink-0">TTL</span>
              <span className="truncate">: {santri.tempatLahir}, {santri.tanggalLahir}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-emerald-300/80 w-12 shrink-0">Akun</span>
              <span className="font-mono text-[9px] text-emerald-200 truncate">: {santri.username}</span>
            </div>
          </div>
        </div>

        {/* QR Code Validation */}
        <div className="w-[66px] h-[66px] bg-white p-1 rounded-xl shadow-xs border border-amber-300/60 flex flex-col items-center justify-center shrink-0">
          <QrCode className="w-12 h-12 text-slate-900" />
          <span className="text-[7px] text-slate-600 font-mono font-bold leading-none mt-0.5">TERVERIFIKASI</span>
        </div>
      </div>

      {/* Footer Card */}
      <div className="relative border-t border-emerald-700/80 pt-1.5 flex items-center justify-between text-[9px] text-emerald-200/90 z-10">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-amber-400" />
          <span>Berlaku Selama Menjadi Santri Aktif</span>
        </div>
        <div className="font-semibold text-amber-300">
          Semarang, Jawa Tengah
        </div>
      </div>
    </div>
  );
};
