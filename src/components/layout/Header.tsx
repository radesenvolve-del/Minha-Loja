import React from 'react';
import {
  Menu,
  Search,
  Camera,
  Sun,
  Moon,
  PlusCircle,
  Instagram,
  Sparkles,
  ShoppingBag,
  Package,
  TrendingUp,
  LayoutDashboard,
  ShoppingCart,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';

interface HeaderProps {
  onOpenMenuDrawer: () => void;
  onOpenSearch: () => void;
  onOpenScanner: () => void;
  onOpenCardGenerator: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMenuDrawer,
  onOpenSearch,
  onOpenScanner,
  onOpenCardGenerator,
}) => {
  const {
    activeTab,
    setActiveTab,
    settings,
    updateSettings,
    setIsFastPDVOpen,
    orders,
  } = useApp();

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
  };

  const pendingOrders = orders.filter(
    (o) => o.status === 'novo' || o.status === 'aguardando_pagamento'
  ).length;

  const quickNavTabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'pdv', label: 'PDV', icon: ShoppingCart },
    { id: 'orders', label: 'Pedidos', icon: ShoppingBag, badge: pendingOrders },
    { id: 'catalog', label: 'Catálogo', icon: BookOpen },
    { id: 'financial', label: 'Financeiro', icon: TrendingUp },
  ];

  return (
    <header className="sticky top-0 z-40 w-full min-h-[4.25rem] sm:min-h-[4.5rem] h-auto bg-[#FBF9F5]/95 dark:bg-[#171412]/95 backdrop-blur-md border-b border-[#E8DFC8] dark:border-[#3A302A] transition-colors pt-[max(0.85rem,env(safe-area-inset-top,0px))] pb-3 sm:py-3.5 shadow-2xs">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 md:px-8 pl-[max(1.25rem,env(safe-area-inset-left,0px))] pr-[max(1.25rem,env(safe-area-inset-right,0px))] flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Left: Retractable Menu Button + Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          {/* Sleek Retractable Menu Button */}
          <button
            onClick={onOpenMenuDrawer}
            className="btn-silver group cursor-pointer !p-2.5 sm:!px-3.5 sm:!py-2 min-w-[42px] min-h-[42px] flex items-center justify-center shrink-0 rounded-xl shadow-2xs"
            title="Abrir menu de navegação completo (M)"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="w-4 h-4 text-[#C99F3B] group-hover:rotate-90 transition-transform duration-200" strokeWidth={1.75} />
            <span className="hidden sm:inline font-extrabold uppercase tracking-wider text-[11px] ml-1">
              Menu
            </span>
            <kbd className="hidden lg:inline text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#EAE2D5] dark:bg-[#332A22] text-[#6E5D4E] dark:text-[#C5B7A6] ml-1">
              M
            </kbd>
          </button>

          {/* Store Logo / Title */}
          <div className="flex items-center gap-2.5 cursor-pointer min-w-0" onClick={() => setActiveTab('dashboard')}>
            {settings.logo ? (
              <img
                src={settings.logo}
                alt={settings.storeName}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain bg-[#FFFDF9] dark:bg-[#231D18] border border-[#C99F3B]/40 p-1 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#D8B059] to-[#FDF4DC] p-[1.5px] shadow-sm flex items-center justify-center shrink-0">
                <div className="w-full h-full rounded-[6.5px] bg-[#171412] flex items-center justify-center text-[#D8B059]">
                  <Sparkles className="w-4 h-4" strokeWidth={1.75} />
                </div>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-base font-extrabold text-[#2C241E] dark:text-[#F3EDE6] tracking-tight leading-none uppercase truncate">
                  {(settings.storeName || 'Minha Loja').replace('&', '/')}
                </h1>
                <span className="hidden md:inline-block px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-widest rounded bg-[#D8B059]/15 border border-[#D8B059]/40 text-[#A67C1E] dark:text-[#E6BE65] shrink-0">
                  Atelier
                </span>
              </div>
              <p className="text-[10px] text-[#7E7062] dark:text-[#B5A796] hidden sm:block leading-tight truncate mt-0.5">
                {(settings.tagline || 'Gestão / Vendas').replace('&', '/')}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Top Quick Navigation (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-[#F5EFEB]/90 dark:bg-[#1F1A17]/90 border border-[#E8DFC8] dark:border-[#3A302A]">
          {quickNavTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FFFDF9] dark:bg-[#2B241F] text-[#9D7320] dark:text-[#E6BE65] font-extrabold shadow-xs border border-[#C99F3B]/50'
                    : 'text-[#635649] dark:text-[#CBD5E1] hover:text-[#2C241E] dark:hover:text-[#F3EDE6] hover:bg-[#EAE3D6]/50 dark:hover:bg-[#302821]/50 font-medium'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#C99F3B]' : 'text-[#8E8071]'}`} strokeWidth={1.75} />
                <span>{tab.label.replace('&', '/')}</span>

                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="w-4 h-4 rounded-full bg-gradient-to-r from-[#D8B059] to-[#AF8323] text-[#1A1306] font-black text-[9px] flex items-center justify-center shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Card Insta/Zap Generator (Desktop & Tablet) */}
          <button
            onClick={onOpenCardGenerator}
            className="hidden sm:inline-flex btn-gold !py-2 !px-3.5 !text-xs cursor-pointer shadow-xs min-h-[42px]"
            title="Gerar Card para Instagram / WhatsApp com foto, preço e QR Code"
          >
            <Instagram className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Card Insta/Zap</span>
          </button>

          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            className="btn-silver !p-2.5 min-w-[42px] min-h-[42px] flex items-center justify-center !text-xs cursor-pointer rounded-xl shadow-2xs"
            title="Pesquisar (Ctrl+K)"
            aria-label="Pesquisar no sistema"
          >
            <Search className="w-4 h-4 text-[#556070] dark:text-[#CBD5E1]" strokeWidth={1.75} />
            <kbd className="hidden xl:inline text-[9px] font-mono px-1 py-0.2 rounded bg-[#E4E8EE] dark:bg-[#383E48] text-[#556070] dark:text-[#CBD5E1] ml-1">
              ⌘K
            </kbd>
          </button>

          {/* Camera Barcode Scanner */}
          <button
            onClick={onOpenScanner}
            className="btn-silver !p-2.5 min-w-[42px] min-h-[42px] flex items-center justify-center !text-xs cursor-pointer rounded-xl shadow-2xs"
            title="Ler Código de Barras pela Câmera"
            aria-label="Abrir Leitor de Código de Barras"
          >
            <Camera className="w-4 h-4 text-[#C99F3B]" strokeWidth={1.75} />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn-silver !p-2.5 min-w-[42px] min-h-[42px] flex items-center justify-center !text-xs cursor-pointer rounded-xl shadow-2xs"
            title={settings.theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            aria-label="Alternar tema claro/escuro"
          >
            {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-[#E6BE65]" strokeWidth={1.75} /> : <Moon className="w-4 h-4 text-[#556070]" strokeWidth={1.75} />}
          </button>

          {/* Primary CTA: Nova Venda PDV */}
          <button
            onClick={() => setIsFastPDVOpen(true)}
            className="hidden md:inline-flex btn-gold !py-2 !px-4 !text-xs cursor-pointer shrink-0 min-h-[42px]"
          >
            <PlusCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>+ Venda</span>
          </button>
        </div>
      </div>
    </header>
  );
};
