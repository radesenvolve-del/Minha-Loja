import React, { useState } from 'react';
import {
  CreditCard,
  Camera,
  Instagram,
  Plus,
  QrCode,
  Copy,
  Check,
  Package,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MobileQuickActionStripProps {
  onOpenProductModal: () => void;
  onOpenScanner: () => void;
  onOpenCardGenerator: () => void;
  onOpenSearch: () => void;
  onOpenStockMovementModal?: () => void;
}

export const MobileQuickActionStrip: React.FC<MobileQuickActionStripProps> = ({
  onOpenProductModal,
  onOpenScanner,
  onOpenCardGenerator,
  onOpenSearch,
  onOpenStockMovementModal,
}) => {
  const {
    activeTab,
    setActiveTab,
    settings,
    setIsFastPDVOpen,
    showToast,
    isOnline,
  } = useApp();

  const [copiedPix, setCopiedPix] = useState(false);

  const handleCopyPix = () => {
    if (!settings.pixKey) {
      setActiveTab('settings');
      showToast('Cadastre sua chave PIX nas configurações para copiar.', 'info');
      return;
    }
    navigator.clipboard.writeText(settings.pixKey);
    setCopiedPix(true);
    showToast(`Chave PIX copiada: ${settings.pixKey}`, 'success');
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Início / Métricas';
      case 'products':
        return 'Catálogo de Peças';
      case 'pdv':
        return 'Frente de Caixa';
      case 'orders':
        return 'Gestão de Pedidos';
      case 'stock':
        return 'Controle de Estoque';
      case 'cash':
        return 'Fluxo de Caixa';
      case 'financial':
        return 'Gestão Financeira';
      case 'settings':
        return 'Configurações';
      case 'catalog':
        return 'Catálogo Digital';
      case 'customers':
        return 'Clientes';
      case 'sales':
        return 'Histórico de Vendas';
      default:
        return 'Luxe Gestão';
    }
  };

  return (
    <div className="md:hidden mb-3 space-y-2 select-none">
      {/* 1. Context Status Row: Section Name + Quick PIX Copy + Online Dot */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-[#FFFDF9] dark:bg-[#201B17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#C99F3B] animate-pulse shrink-0" />
          <span className="font-bold text-[#2C241E] dark:text-[#F3EDE6] truncate text-[11px] uppercase tracking-wider">
            {getTabLabel()}
          </span>
        </div>

        {/* Quick PIX Copy Button */}
        {settings.pixKey ? (
          <button
            type="button"
            onClick={handleCopyPix}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all active:scale-95 cursor-pointer shrink-0 ${
              copiedPix
                ? 'bg-[#C99F3B] text-black shadow-xs'
                : 'bg-[#D8B059]/10 text-[#9D7320] dark:text-[#E6BE65] border border-[#D8B059]/30 hover:bg-[#D8B059]/20'
            }`}
            title="Copiar Chave PIX"
          >
            {copiedPix ? (
              <>
                <Check className="w-3 h-3 stroke-[2.5]" />
                <span>PIX Copiado!</span>
              </>
            ) : (
              <>
                <QrCode className="w-3 h-3 text-[#C99F3B]" strokeWidth={1.75} />
                <span>PIX: {settings.pixKey.length > 14 ? settings.pixKey.slice(0, 11) + '…' : settings.pixKey}</span>
                <Copy className="w-2.5 h-2.5 opacity-60 ml-0.5 text-[#C99F3B]" strokeWidth={1.75} />
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="text-[10px] font-bold text-[#9D7320] dark:text-[#E6BE65] hover:underline shrink-0"
          >
            + Chave PIX
          </button>
        )}
      </div>

      {/* 2. Horizontal Ergonomic Thumb Actions Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 px-0.5 no-scrollbar scroll-smooth">
        {/* A. Nova Venda PDV */}
        <button
          onClick={() => setIsFastPDVOpen(true)}
          className="btn-gold !py-2 !px-3.5 !text-xs shrink-0 cursor-pointer shadow-xs"
        >
          <CreditCard className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>+ Vender</span>
        </button>

        {/* B. Bipar Código / Câmera */}
        <button
          onClick={onOpenScanner}
          className="btn-silver !py-2 !px-3 !text-xs shrink-0 cursor-pointer shadow-2xs"
        >
          <Camera className="w-3.5 h-3.5 text-[#C99F3B]" strokeWidth={1.75} />
          <span>Bipar</span>
        </button>

        {/* C. Card Insta / Zap */}
        <button
          onClick={onOpenCardGenerator}
          className="btn-silver !py-2 !px-3 !text-xs shrink-0 cursor-pointer shadow-2xs"
        >
          <Instagram className="w-3.5 h-3.5 text-[#C99F3B]" strokeWidth={1.75} />
          <span>Card Zap/Insta</span>
        </button>

        {/* D. Novo Produto */}
        <button
          onClick={onOpenProductModal}
          className="btn-silver !py-2 !px-3 !text-xs shrink-0 cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-[#556070] dark:text-[#CBD5E1]" strokeWidth={1.75} />
          <span>+ Produto</span>
        </button>

        {/* E. Ajuste de Estoque */}
        {onOpenStockMovementModal && (
          <button
            onClick={onOpenStockMovementModal}
            className="btn-silver !py-2 !px-3 !text-xs shrink-0 cursor-pointer shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5 text-[#556070] dark:text-[#CBD5E1]" strokeWidth={1.75} />
            <span>Estoque</span>
          </button>
        )}

        {/* F. Pesquisar */}
        <button
          onClick={onOpenSearch}
          className="btn-silver !py-2 !px-3 !text-xs shrink-0 cursor-pointer shadow-2xs"
        >
          <Search className="w-3.5 h-3.5 text-[#556070] dark:text-[#CBD5E1]" strokeWidth={1.75} />
          <span>Buscar</span>
        </button>
      </div>
    </div>
  );
};
