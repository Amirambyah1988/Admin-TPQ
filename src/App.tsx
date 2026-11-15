import React from 'react';
import { TPQProvider, useTPQ } from './context/TPQContext';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { AsatidzDashboard } from './components/asatidz/AsatidzDashboard';
import { SantriDashboard } from './components/santri/SantriDashboard';

const MainApp: React.FC = () => {
  const { currentUser } = useTPQ();

  if (!currentUser) {
    return <LoginView />;
  }

  if (currentUser.role !== 'asatidz' && currentUser.role !== 'santri') {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="flex-1">
        {currentUser.role === 'asatidz' ? <AsatidzDashboard /> : <SantriDashboard />}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <TPQProvider>
      <MainApp />
    </TPQProvider>
  );
}
