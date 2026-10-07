import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Clock,
  Menu,
  Plus,
  CreditCard,
  QrCode,
  Boxes,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMenu }) => {
  const { activeTab, setActiveTab, setIsFastPDVOpen, orders } = useApp();

  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'novo' || o.status === 'aguardando_pagamento'
  ).length;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FBF9F5]/95 dark:bg-[#171412]/95 backdrop-blur-md border-t border-[#E8DFC8] dark:border-[#3A302A] px-2 py-1.5 flex items-center justify-around shadow-lg select-none"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      aria-label="Navegação inferior mobile"
    >
      {/* 1. Início */}
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 min-w-[50px] min-h-[48px] rounded-xl transition-all active:scale-95 cursor-pointer relative ${
          activeTab === 'dashboard'
            ? 'text-[#9D7320] dark:text-[#E6BE65] font-bold'
            : 'text-[#7A6C5D] dark:text-[#A89A89] hover:text-[#2C241E] dark:hover:text-[#F3EDE6]'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" strokeWidth={1.75} />
        <span className="text-[10px] mt-0.5 tracking-tight">Início</span>
        {activeTab === 'dashboard' && (
          <span className="absolute bottom-0 w-3 h-0.5 rounded-full bg-[#C99F3B]" />
        )}
      </button>

      {/* 2. Produtos */}
      <button
        onClick={() => setActiveTab('products')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 min-w-[50px] min-h-[48px] rounded-xl transition-all active:scale-95 cursor-pointer relative ${
          activeTab === 'products'
            ? 'text-[#9D7320] dark:text-[#E6BE65] font-bold'
            : 'text-[#7A6C5D] dark:text-[#A89A89] hover:text-[#2C241E] dark:hover:text-[#F3EDE6]'
        }`}
      >
        <Package className="w-5 h-5" strokeWidth={1.75} />
        <span className="text-[10px] mt-0.5 tracking-tight">Produtos</span>
        {activeTab === 'products' && (
          <span className="absolute bottom-0 w-3 h-0.5 rounded-full bg-[#C99F3B]" />
        )}
      </button>

      {/* 3. CENTER HIGHLIGHT: + VENDER (PDV Rápido em Ouro Nobre) */}
      <button
        onClick={() => setIsFastPDVOpen(true)}
        className="flex flex-col items-center justify-center -mt-6 group cursor-pointer focus:outline-hidden"
        aria-label="Abrir frente de caixa e registrar venda rápida"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-[#FDF4DC] via-[#D8B059] to-[#AF8323] text-[#1A1306] flex items-center justify-center shadow-lg shadow-[#AF8323]/30 group-active:scale-95 transition-transform ring-4 ring-[#FBF9F5] dark:ring-[#171412] border border-[#C99F3B]">
          <Plus className="w-7 h-7 stroke-[2.75]" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-[#9D7320] dark:text-[#E6BE65] mt-1">
          + Vender
        </span>
      </button>

      {/* 4. Pedidos */}
      <button
        onClick={() => setActiveTab('orders')}
        className={`relative flex flex-col items-center justify-center py-1 px-2.5 min-w-[50px] min-h-[48px] rounded-xl transition-all active:scale-95 cursor-pointer ${
          activeTab === 'orders'
            ? 'text-[#9D7320] dark:text-[#E6BE65] font-bold'
            : 'text-[#7A6C5D] dark:text-[#A89A89] hover:text-[#2C241E] dark:hover:text-[#F3EDE6]'
        }`}
      >
        <div className="relative">
          <Clock className="w-5 h-5" strokeWidth={1.75} />
          {pendingOrdersCount > 0 && (
            <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-[#D8B059] to-[#AF8323] text-[#1A1306] text-[9px] font-extrabold flex items-center justify-center shadow-xs">
              {pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">Pedidos</span>
        {activeTab === 'orders' && (
          <span className="absolute bottom-0 w-3 h-0.5 rounded-full bg-[#C99F3B]" />
        )}
      </button>

      {/* 5. Menu / Mais */}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-1 px-2.5 min-w-[50px] min-h-[48px] rounded-xl text-[#7A6C5D] dark:text-[#A89A89] hover:text-[#2C241E] dark:hover:text-[#F3EDE6] transition-all active:scale-95 cursor-pointer relative"
      >
        <Menu className="w-5 h-5" strokeWidth={1.75} />
        <span className="text-[10px] mt-0.5 tracking-tight">Mais</span>
      </button>
    </nav>
  );
};
