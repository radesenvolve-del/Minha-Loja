import React from 'react';
import { WifiOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = useApp();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-xs border border-amber-500 animate-pulse">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Modo Offline — Todos os dados e vendas continuam salvos no seu aparelho.</span>
    </div>
  );
};
