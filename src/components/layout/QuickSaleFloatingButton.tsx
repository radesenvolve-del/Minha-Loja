import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const QuickSaleFloatingButton: React.FC = () => {
  const { isFastPDVOpen, setIsFastPDVOpen, activeTab } = useApp();

  // Hide when PDV modal is already open or already on the dedicated PDV tab
  if (isFastPDVOpen || activeTab === 'pdv') return null;

  return (
    <button
      onClick={() => setIsFastPDVOpen(true)}
      className="hidden md:flex fixed bottom-6 right-6 z-40 btn-gold !py-3 !px-5 !text-xs !font-black !tracking-wider uppercase shadow-xl hover:scale-105 active:scale-95 group"
      aria-label="Abrir frente de caixa e venda rápida"
    >
      <ShoppingCart className="w-4 h-4 group-hover:rotate-6 transition-transform" strokeWidth={1.75} />
      <span>+ Venda PDV</span>
    </button>
  );
};
