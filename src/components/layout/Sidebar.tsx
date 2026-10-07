import React from 'react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Clock,
  Users,
  Building2,
  FileCheck,
  Wallet,
  BarChart3,
  Tag,
  Smartphone,
  Settings,
  Database,
  Store,
  X,
  CreditCard,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
  const {
    activeTab,
    setActiveTab,
    settings,
    currentCashSession,
    currentUser,
    users,
    setCurrentUser,
    isSidebarCompact,
    toggleSidebarCompact,
  } = useApp();

  const menuItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Início', icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
    { id: 'products', label: 'Produtos', icon: <Package className="w-5 h-5 shrink-0" /> },
    { id: 'stock', label: 'Estoque', icon: <Boxes className="w-5 h-5 shrink-0" /> },
    { id: 'pdv', label: 'PDV / Caixa', icon: <CreditCard className="w-5 h-5 shrink-0" /> },
    { id: 'sales', label: 'Vendas', icon: <ShoppingBag className="w-5 h-5 shrink-0" /> },
    { id: 'orders', label: 'Pedidos', icon: <Clock className="w-5 h-5 shrink-0" /> },
    { id: 'customers', label: 'Clientes', icon: <Users className="w-5 h-5 shrink-0" /> },
    { id: 'suppliers', label: 'Fornecedores', icon: <Building2 className="w-5 h-5 shrink-0" /> },
    { id: 'quotes', label: 'Orçamentos', icon: <FileCheck className="w-5 h-5 shrink-0" /> },
    { id: 'financial', label: 'Financeiro', icon: <Wallet className="w-5 h-5 shrink-0" /> },
    { id: 'reports', label: 'Relatórios', icon: <BarChart3 className="w-5 h-5 shrink-0" /> },
    { id: 'labels', label: 'Etiquetas', icon: <Tag className="w-5 h-5 shrink-0" /> },
    { id: 'catalog', label: 'Catálogo Digital', icon: <Smartphone className="w-5 h-5 shrink-0" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-5 h-5 shrink-0" /> },
    { id: 'backup', label: 'Backup / Dados', icon: <Database className="w-5 h-5 shrink-0" /> },
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    onMobileClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out ${
          isMobileOpen
            ? 'translate-x-0 w-[80%] max-w-[280px] shadow-2xl'
            : '-translate-x-full md:translate-x-0'
        } ${isSidebarCompact ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Brand Header */}
        <div className={`flex items-center h-16 border-b border-zinc-200 dark:border-zinc-800 shrink-0 ${
          isSidebarCompact ? 'justify-center px-2' : 'justify-between px-4'
        }`}>
          {isSidebarCompact ? (
            <div className="flex flex-col items-center gap-1 group">
              <button
                onClick={() => handleSelect('dashboard')}
                title={`${settings.storeName || 'Minha Loja'} - Início`}
                className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md hover:scale-105 transition-transform"
              >
                <Store className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {settings.storeName || 'Minha Loja'}
                  </h1>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-mono tracking-wider truncate">
                    Workspace ERP
                  </p>
                </div>
              </div>

              {/* Desktop Collapse Toggle */}
              <button
                onClick={toggleSidebarCompact}
                className="hidden md:flex p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Recolher para barra compacta"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cash Status Indicator */}
        <div className={`border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50 dark:bg-zinc-900/60 ${
          isSidebarCompact ? 'py-2 flex justify-center' : 'px-4 py-2'
        }`}>
          {isSidebarCompact ? (
            <div
              className="flex items-center justify-center cursor-pointer"
              onClick={() => handleSelect('pdv')}
              title={currentCashSession ? 'Caixa Aberto (Clique para ir ao PDV)' : 'Caixa Fechado (Clique para abrir)'}
            >
              <span className="relative flex h-3 w-3">
                {currentCashSession && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    currentCashSession ? 'bg-emerald-500' : 'bg-zinc-400'
                  }`}
                />
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Caixa:</span>
              <button
                onClick={() => handleSelect('pdv')}
                className={`flex items-center gap-1.5 font-semibold text-xs transition-colors ${
                  currentCashSession
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentCashSession ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                  }`}
                />
                {currentCashSession ? 'Aberto' : 'Fechado'}
              </button>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className={`flex-1 overflow-y-auto py-2.5 space-y-1 ${
          isSidebarCompact ? 'px-2' : 'px-3'
        }`}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                title={item.label}
                className={`w-full flex items-center transition-all ${
                  isSidebarCompact
                    ? 'justify-center p-2.5 rounded-xl'
                    : 'justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium'
                } ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs ring-1 ring-indigo-200 dark:ring-indigo-800/40'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <div className={`flex items-center ${isSidebarCompact ? 'justify-center relative' : 'gap-3'}`}>
                  <span className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'}>
                    {item.icon}
                  </span>
                  {!isSidebarCompact && <span className="truncate">{item.label}</span>}
                  {isSidebarCompact && item.badge && (
                    <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-zinc-900" />
                  )}
                </div>
                {!isSidebarCompact && item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / Toggle & User Profile */}
        <div className={`border-t border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/30 ${
          isSidebarCompact ? 'p-2 flex flex-col items-center gap-2' : 'p-3'
        }`}>
          {isSidebarCompact ? (
            <>
              {/* Expand Toggle Button */}
              <button
                onClick={toggleSidebarCompact}
                className="hidden md:flex p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
                title="Expandir barra lateral"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>

              {/* User Avatar */}
              <div
                className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-bold text-xs cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                title={`${currentUser.name} (${currentUser.role === 'admin' ? 'Administrador' : 'Operador'})`}
                onClick={() => handleSelect('settings')}
              >
                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-bold text-xs shrink-0">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 uppercase font-mono">
                    {currentUser.role === 'admin' ? 'Administrador' : 'Operador'}
                  </p>
                </div>
              </div>
              {users.length > 1 && (
                <select
                  value={currentUser.id}
                  onChange={(e) => {
                    const selected = users.find((u) => u.id === e.target.value);
                    if (selected) setCurrentUser(selected);
                  }}
                  className="text-[11px] bg-transparent text-indigo-600 dark:text-indigo-400 font-medium focus:outline-hidden cursor-pointer"
                  title="Trocar Usuário"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
