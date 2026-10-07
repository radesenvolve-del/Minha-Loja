import React, { useState } from 'react';
import {
  Sparkles,
  CreditCard,
  Package,
  ShoppingBag,
  Clock,
  Boxes,
  Settings as SettingsIcon,
  Copy,
  Check,
  Plus,
  Camera,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  QrCode,
  CheckCircle2,
  ChevronRight,
  Send,
  MessageCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatBRL } from '../../utils/formatters';

interface ContextualWorkspaceBarProps {
  onOpenProductModal?: () => void;
  onOpenStockMovementModal?: () => void;
  onOpenCSVImport?: () => void;
  onOpenScanner?: () => void;
  onOpenOrderModal?: () => void;
}

export const ContextualWorkspaceBar: React.FC<ContextualWorkspaceBarProps> = ({
  onOpenProductModal,
  onOpenStockMovementModal,
  onOpenCSVImport,
  onOpenScanner,
  onOpenOrderModal,
}) => {
  const {
    activeTab,
    setActiveTab,
    settings,
    sales,
    orders,
    products,
    currentCashSession,
    setIsFastPDVOpen,
    showToast,
  } = useApp();

  const [copiedPix, setCopiedPix] = useState(false);

  const handleCopyPix = () => {
    if (!settings.pixKey) {
      setActiveTab('settings');
      showToast('Cadastre sua chave PIX para utilizá-la nos comprovantes.', 'info');
      return;
    }
    navigator.clipboard.writeText(settings.pixKey);
    setCopiedPix(true);
    showToast(`Chave PIX copiada: ${settings.pixKey}`, 'success');
    setTimeout(() => setCopiedPix(false), 2500);
  };

  // Today's metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.date.startsWith(todayStr) && s.status !== 'cancelled');
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);

  // Low stock
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  // Pending orders
  const pendingPaymentOrders = orders.filter((o) => o.status === 'aguardando_pagamento').length;

  return (
    <div className="mb-4 p-3 sm:p-3.5 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Context Left: Breadcrumb / Active Workspace Indicator */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#D8B059]/15 text-[#9D7320] dark:text-[#E6BE65] border border-[#C99F3B]/40 shrink-0">
          Atelier Workspace
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-[#8E8071] shrink-0" strokeWidth={1.75} />
        <span className="font-semibold text-[#2C241E] dark:text-[#F3EDE6] truncate capitalize">
          {activeTab === 'pdv' && 'Frente de Caixa / Vendas Rápidas'}
          {activeTab === 'sales' && 'Histórico de Vendas / Comprovantes'}
          {activeTab === 'orders' && 'Gestão de Pedidos (Instagram / WhatsApp)'}
          {activeTab === 'products' && 'Catálogo / Gestão de Peças'}
          {activeTab === 'stock' && 'Controle de Estoque / Movimentações'}
          {activeTab === 'settings' && 'Configurações / Chave PIX'}
          {activeTab === 'dashboard' && 'Painel de Indicadores'}
          {activeTab === 'customers' && 'Carteira de Clientes'}
          {activeTab === 'cash' && 'Fluxo de Caixa'}
          {activeTab === 'financial' && 'Gestão Financeira'}
          {activeTab === 'reports' && 'Relatórios Gerenciais'}
          {activeTab === 'labels' && 'Impressão de Etiquetas'}
          {activeTab === 'catalog' && 'Catálogo Digital Online'}
          {activeTab === 'backup' && 'Backup / Segurança de Dados'}
          {activeTab === 'suppliers' && 'Fornecedores'}
          {activeTab === 'purchases' && 'Entrada de Mercadorias'}
          {activeTab === 'quotes' && 'Orçamentos'}
        </span>
      </div>

      {/* Context Center / Right: Dynamic Tools / Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {/* PIX Key Quick Indicator (Available across all major selling views) */}
        {['pdv', 'sales', 'orders', 'settings', 'dashboard'].includes(activeTab) && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F5EFEB] dark:bg-[#28211C] border border-[#E8DFC8] dark:border-[#3A302A] text-[11px]">
            <span className="font-bold text-[#9D7320] dark:text-[#E6BE65] flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Chave PIX:</span>
            </span>
            {settings.pixKey ? (
              <button
                type="button"
                onClick={handleCopyPix}
                className="flex items-center gap-1 font-mono font-bold text-[#2C241E] dark:text-[#F3EDE6] hover:text-[#9D7320] dark:hover:text-[#E6BE65] transition-colors cursor-pointer"
                title="Clique para copiar a Chave PIX cadastrada"
              >
                <span>{settings.pixKey}</span>
                {copiedPix ? (
                  <Check className="w-3 h-3 text-[#9D7320] dark:text-[#E6BE65]" strokeWidth={2} />
                ) : (
                  <Copy className="w-3 h-3 text-[#8E8071] hover:text-[#9D7320]" strokeWidth={1.75} />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="text-[#9D7320] dark:text-[#E6BE65] underline font-semibold cursor-pointer"
              >
                Cadastrar Chave PIX
              </button>
            )}
          </div>
        )}

        {/* Tab-specific Contextual Actions */}
        {activeTab === 'pdv' && (
          <>
            <span
              className="px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 text-[11px] bg-[#F5EFEB] dark:bg-[#28211C] border border-[#E8DFC8] dark:border-[#3A302A] text-[#2C241E] dark:text-[#F3EDE6]"
            >
              <span className={`w-2 h-2 rounded-full ${currentCashSession ? 'bg-[#C99F3B] animate-pulse' : 'bg-[#8E8071]'}`} />
              {currentCashSession ? 'Caixa Aberto' : 'Caixa Fechado'}
            </span>

            <button
              onClick={() => setIsFastPDVOpen(true)}
              className="btn-gold !py-1 !px-3 !text-[11px]"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Abrir PDV</span>
            </button>
          </>
        )}

        {activeTab === 'sales' && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#635649] dark:text-[#CBD5E1]">
              Hoje: <strong className="text-[#2C241E] dark:text-[#F3EDE6] font-mono">{formatBRL(todayRevenue)}</strong> ({todaySales.length} {todaySales.length === 1 ? 'venda' : 'vendas'})
            </span>
            <span className="hidden sm:inline text-[#E8DFC8] dark:text-[#3A302A]">|</span>
            <span className="hidden sm:inline text-[11px] text-[#8E8071] dark:text-[#AFA292]">
              Comprovantes WhatsApp com Chave PIX automática
            </span>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="flex items-center gap-2">
            {pendingPaymentOrders > 0 && (
              <span className="px-2 py-0.5 rounded-lg bg-[#D8B059]/15 border border-[#C99F3B]/40 text-[#9D7320] dark:text-[#E6BE65] font-bold text-[11px]">
                {pendingPaymentOrders} aguardando PIX
              </span>
            )}
            {onOpenOrderModal && (
              <button
                onClick={onOpenOrderModal}
                className="btn-gold !py-1 !px-3 !text-[11px]"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Novo Pedido</span>
              </button>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="flex items-center gap-1.5">
            {lowStockCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#D8B059]/10 text-[#9D7320] dark:text-[#E6BE65] font-bold text-[11px] border border-[#C99F3B]/30">
                <AlertTriangle className="w-3 h-3" strokeWidth={1.75} />
                <span>{lowStockCount} c/ estoque baixo</span>
              </span>
            )}
            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="btn-silver !p-1.5"
                title="Bipar código com câmera"
              >
                <Camera className="w-3.5 h-3.5 text-[#C99F3B]" strokeWidth={1.75} />
              </button>
            )}
            {onOpenCSVImport && (
              <button
                onClick={onOpenCSVImport}
                className="btn-silver !p-1.5"
                title="Importar CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#556070] dark:text-[#CBD5E1]" strokeWidth={1.75} />
              </button>
            )}
            {onOpenProductModal && (
              <button
                onClick={onOpenProductModal}
                className="btn-gold !py-1 !px-3 !text-[11px]"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Novo Produto</span>
              </button>
            )}
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="flex items-center gap-2">
            {onOpenStockMovementModal && (
              <button
                onClick={onOpenStockMovementModal}
                className="btn-gold !py-1 !px-3 !text-[11px]"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Entrada / Ajuste</span>
              </button>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#8E8071] dark:text-[#AFA292]">
              Personalize Chave PIX, Margem de Lucro e Dados da Loja
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
