import React, { useState } from 'react';
import { useTPQ } from '../../context/TPQContext';
import {
  Home,
  GraduationCap,
  Users,
  CalendarCheck2,
  CalendarDays,
  Sparkles,
  DollarSign,
  LogOut,
  Camera,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { HomeView } from './HomeView';
import { AsatidzView } from './AsatidzView';
import { SantriView } from './SantriView';
import { AbsensiSantriView } from './AbsensiSantriView';
import { AbsensiAsatidzView } from './AbsensiAsatidzView';
import { LogProgressView } from './LogProgressView';
import { SyahriahView } from './SyahriahView';
import { DokumentasiView } from './DokumentasiView';

export const AsatidzDashboard: React.FC = () => {
  const { currentUser, logout, syahriahList } = useTPQ();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  if (!currentUser || currentUser.role !== 'asatidz') {
    return null;
  }

  const pendingPaymentsCount = syahriahList.filter((s) => s.status === 'Menunggu Konfirmasi').length;

  // The 8 navigation buttons specified by user
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'asatidz', label: 'Asatidz', icon: GraduationCap },
    { id: 'santri', label: 'Santri', icon: Users },
    { id: 'absen-santri', label: 'Absen Santri', icon: CalendarCheck2 },
    { id: 'absen-asatidz', label: 'Absen Asatidz', icon: CalendarDays },
    { id: 'log-progress', label: 'Log Progress', icon: Sparkles },
    { id: 'syahriah', label: 'Syahriah', icon: DollarSign, badge: pendingPaymentsCount },
    { id: 'logout', label: 'Keluar', icon: LogOut, isLogout: true },
  ];

  const handleNavClick = (id: string, isLogout?: boolean) => {
    if (isLogout) {
      logout();
    } else {
      setActiveTab(id);
      setMoreMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 md:pb-8">
      {/* Secondary Sub-Navbar for Desktop View */}
      <div className="bg-white border-b border-slate-200/80 hidden md:block sticky top-16 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between overflow-x-auto py-2">
            <div className="flex items-center gap-1">
              {navItems
                .filter((item) => !item.isLogout)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`relative px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {Boolean(item.badge && item.badge > 0) && (
                        <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

              {/* Extra button for Dokumentasi Kegiatan */}
              <button
                onClick={() => handleNavClick('dokumentasi')}
                className={`relative px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === 'dokumentasi'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Dokumentasi Foto</span>
              </button>
            </div>

            <button
              onClick={logout}
              className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {activeTab === 'home' && <HomeView onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'asatidz' && <AsatidzView />}
        {activeTab === 'santri' && <SantriView />}
        {activeTab === 'absen-santri' && <AbsensiSantriView />}
        {activeTab === 'absen-asatidz' && <AbsensiAsatidzView />}
        {activeTab === 'log-progress' && <LogProgressView />}
        {activeTab === 'syahriah' && <SyahriahView />}
        {activeTab === 'dokumentasi' && <DokumentasiView />}
      </main>

      {/* Mobile-Friendly Bottom Navigation (8 Tombol Navigasi Bawah) */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-1 z-40 md:hidden shadow-lg">
        <div className="grid grid-cols-8 gap-0.5 max-w-lg mx-auto items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.isLogout)}
                className={`relative flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-all ${
                  item.isLogout
                    ? 'text-rose-600 hover:bg-rose-50'
                    : isActive
                    ? 'text-emerald-800 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title={item.label}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[8px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[8px] truncate max-w-full tracking-tighter mt-0.5 leading-none">
                  {item.label}
                </span>
                {isActive && !item.isLogout && (
                  <span className="w-1 h-1 rounded-full bg-emerald-700 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
