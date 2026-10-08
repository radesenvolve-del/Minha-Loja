import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Receipt,
  ShoppingBag,
  Users,
  Truck,
  ArrowDownLeft,
  FileSpreadsheet,
  Coins,
  TrendingUp,
  BarChart3,
  Tag,
  BookOpen,
  Settings,
  Database,
  Camera,
  Sun,
  Moon,
  Instagram,
  Sparkles,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCardGenerator?: () => void;
}

interface MenuItem {
  id: ActiveTab;
  label: string;
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  badge?: number | string;
  badgeClass?: string;
  description: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  onOpenCardGenerator,
}) => {
  const {
    activeTab,
    setActiveTab,
    settings,
    orders,
    products,
    accountsPayable,
    currentUser,
    updateSettings,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute live badges
  const pendingOrders = orders.filter((o) => o.status === 'novo' || o.status === 'aguardando_pagamento').length;
  const lowStockCount = products.filter((p) => p.stock <= (p.minStock || 0)).length;
  const duePayables = accountsPayable.filter((p) => p.status === 'pendente').length;

  const menuSections: MenuSection[] = [
    {
      title: 'Vendas / Pedidos',
      items: [
        {
          id: 'pdv',
          label: 'Frente de Caixa (PDV)',
          icon: ShoppingCart,
          description: 'Venda ágil com leitor, PIX e comprovante',
        },
        {
          id: 'orders',
          label: 'Pedidos Instagram / Zap',
          icon: ShoppingBag,
          badge: pendingOrders > 0 ? pendingOrders : undefined,
          badgeClass: 'badge-gold',
          description: 'Funil Kanban de pedidos recebidos online',
        },
        {
          id: 'sales',
          label: 'Histórico de Vendas',
          icon: Receipt,
          description: 'Vendas realizadas, cancelamentos e recibos',
        },
        {
          id: 'quotes',
          label: 'Orçamentos / Propostas',
          icon: FileSpreadsheet,
          description: 'Propostas comerciais com validade e PDF',
        },
        {
          id: 'catalog',
          label: 'Catálogo Digital / Redes',
          icon: BookOpen,
          badge: 'Card Insta',
          badgeClass: 'badge-gold',
          description: 'Vitrine online e gerador de cards de venda',
        },
        {
          id: 'promotions',
          label: 'Promoções / Queima de Estoque',
          icon: Tag,
          description: 'Campanhas promocionais com desconto por período',
        },
      ],
    },
    {
      title: 'Produtos / Estoque',
      items: [
        {
          id: 'products',
          label: 'Catálogo de Produtos',
          icon: Package,
          description: 'Cadastro, fotos, preços e categorias em círculos',
        },
        {
          id: 'stock',
          label: 'Controle de Estoque',
          icon: Boxes,
          badge: lowStockCount > 0 ? `${lowStockCount} baixos` : undefined,
          badgeClass: 'badge-silver',
          description: 'Entradas, perdas, devoluções e alertas',
        },
        {
          id: 'purchases',
          label: 'Entrada de Mercadorias',
          icon: ArrowDownLeft,
          description: 'Registro de compras com fornecedores e rateio',
        },
        {
          id: 'labels',
          label: 'Impressão de Etiquetas',
          icon: Tag,
          description: 'Etiquetas de gôndola, joias e código de barras',
        },
      ],
    },
    {
      title: 'Financeiro / Caixa',
      items: [
        {
          id: 'cash',
          label: 'Controle de Caixa',
          icon: Coins,
          description: 'Abertura, fechamento, sangrias e suprimentos',
        },
        {
          id: 'financial',
          label: 'Módulo Financeiro',
          icon: TrendingUp,
          badge: duePayables > 0 ? `${duePayables} a pagar` : undefined,
          badgeClass: 'badge-gold',
          description: 'Contas a pagar, a receber e fluxo de caixa',
        },
        {
          id: 'reports',
          label: 'Relatórios / Inteligência',
          icon: BarChart3,
          description: 'DRE, margens reais, curva ABC e auditoria',
        },
      ],
    },
    {
      title: 'Relacionamento / Contatos',
      items: [
        {
          id: 'customers',
          label: 'Cadastro de Clientes',
          icon: Users,
          description: 'Histórico de compras e CRM por WhatsApp',
        },
        {
          id: 'crm',
          label: 'CRM / Fidelidade & Metas',
          icon: Sparkles,
          description: 'Aniversariantes do mês, cashback e comissões',
        },
        {
          id: 'suppliers',
          label: 'Fornecedores',
          icon: Truck,
          description: 'Parceiros de atacado e dados para reposição',
        },
      ],
    },
    {
      title: 'Configurações / Sistema',
      items: [
        {
          id: 'dashboard',
          label: 'Visão Geral / Métricas',
          icon: LayoutDashboard,
          description: 'Painel com resumos e gráficos da loja',
        },
        {
          id: 'sync',
          label: 'Sincronizar Dispositivos',
          icon: ArrowDownLeft,
          description: 'Sincronização P2P e QR Code gratuita',
        },
        {
          id: 'audit',
          label: 'Auditoria & Logs',
          icon: Shield,
          description: 'Histórico completo de alterações e acessos',
        },
        {
          id: 'settings',
          label: 'Configurações / Chave PIX',
          icon: Settings,
          description: 'Dados da loja, regras de preço e impressoras',
        },
        {
          id: 'backup',
          label: 'Backup / Instalação',
          icon: Database,
          description: 'Exportação JSON, segurança e instaladores',
        },
      ],
    },
  ];

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Drawer Container (Sliding in from Left) */}
      <div className="relative w-full max-w-md sm:max-w-lg bg-[#FBF9F5] dark:bg-[#171412] border-r border-[#E8DFC8] dark:border-[#3A302A] shadow-2xl z-10 flex flex-col h-full animate-in slide-in-from-left duration-300 ease-out">
        {/* Header */}
        <div className="pt-[max(1rem,env(safe-area-inset-top,0px))] px-5 pb-4 sm:py-5 border-b border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB] dark:bg-[#1F1A17] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {settings.logo ? (
              <img
                src={settings.logo}
                alt={settings.storeName}
                className="w-10 h-10 rounded-xl object-contain bg-[#FFFDF9] dark:bg-[#201B17] border border-[#C99F3B]/40 p-1 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D8B059] to-[#FDF4DC] p-[1.5px] shadow-sm">
                <div className="w-full h-full rounded-[10px] bg-[#171412] flex items-center justify-center text-[#D8B059]">
                  <Sparkles className="w-5 h-5" strokeWidth={1.75} />
                </div>
              </div>
            )}
            <div>
              <h2 className="text-sm font-extrabold tracking-tight text-[#2C241E] dark:text-[#F3EDE6] uppercase">
                {(settings.storeName || 'Minha Loja').replace('&', '/')}
              </h2>
              <p className="text-[10px] text-[#8E8071] dark:text-[#AFA292] font-mono tracking-wider">
                MENU NAVEGAÇÃO COMPLETO
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl text-[#7E7062] hover:text-[#2C241E] dark:text-[#AFA292] dark:hover:text-[#F3EDE6] hover:bg-[#EAE2D5] dark:hover:bg-[#302720] transition-colors cursor-pointer min-w-[42px] min-h-[42px] flex items-center justify-center"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Quick Search inside Drawer */}
        <div className="p-3 border-b border-[#E8DFC8] dark:border-[#3A302A] shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8071]" strokeWidth={1.75} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar seção ou funcionalidade..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#FFFDF9] dark:bg-[#201B17] border border-[#E8DFC8] dark:border-[#3A302A] text-[#2C241E] dark:text-[#F3EDE6] placeholder:text-[#8E8071] focus:outline-hidden focus:ring-2 focus:ring-[#C99F3B]/30"
              autoFocus
            />
          </div>
        </div>

        {/* Quick Action: Card Insta/Zap shortcut */}
        {onOpenCardGenerator && (
          <div className="px-3 pt-3 shrink-0">
            <button
              onClick={() => {
                onOpenCardGenerator();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#D8B059]/15 via-[#FFFDF9]/10 to-[#D8B059]/15 border border-[#D8B059]/40 text-[#9D7320] dark:text-[#E6BE65] hover:border-[#D8B059] transition-all text-xs font-bold shadow-xs group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#D8B059]/20 flex items-center justify-center text-[#C99F3B]">
                  <Instagram className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-xs">Gerar Card Insta / WhatsApp</p>
                  <p className="text-[10px] text-[#7E7062] dark:text-[#B5A796] font-normal">
                    Monte cards automáticos com foto, preço e QR Code
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-[#C99F3B]" strokeWidth={1.75} />
            </button>
          </div>
        )}

        {/* Menu Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {menuSections.map((section) => {
            const filteredItems = section.items.filter(
              (item) =>
                !searchQuery ||
                item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filteredItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <h3 className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-[#8E8071] dark:text-[#AFA292]">
                  {section.title}
                </h3>

                <div className="space-y-0.5">
                  {filteredItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left text-xs cursor-pointer ${
                          isActive
                            ? 'bg-[#D8B059]/15 text-[#9D7320] dark:text-[#E6BE65] font-extrabold border border-[#D8B059]/50 shadow-xs'
                            : 'text-[#4A3E33] dark:text-[#D5C9BA] hover:bg-[#F5EFEB] dark:hover:bg-[#231D18] hover:text-[#1A140F] dark:hover:text-[#FFFDF9] font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive
                                ? 'text-[#C99F3B]'
                                : 'text-[#8E8071] group-hover:text-[#2C241E] dark:group-hover:text-[#F3EDE6]'
                            }`}
                            strokeWidth={1.75}
                          />
                          <div className="min-w-0">
                            <p className="truncate leading-tight">{item.label}</p>
                            <p className="text-[10px] text-[#8E8071] dark:text-[#AFA292] truncate font-normal">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {item.badge && (
                          <span
                            className={`ml-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 ${
                              item.badgeClass || 'badge-silver'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer / User Profile & Theme */}
        <div className="p-3.5 border-t border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB] dark:bg-[#1F1A17] flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FFFDF9] dark:bg-[#28211C] border border-[#C99F3B]/40 flex items-center justify-center font-bold text-[#9D7320] dark:text-[#E6BE65]">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-[#2C241E] dark:text-[#F3EDE6] text-xs">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-[#8E8071] dark:text-[#AFA292]">
                {currentUser.role === 'admin' ? 'Administrador' : 'Vendedor'}
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
            }
            className="btn-silver !p-2 min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
            title="Alternar tema claro/escuro"
          >
            {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-[#E6BE65]" strokeWidth={1.75} /> : <Moon className="w-4 h-4 text-[#556070]" strokeWidth={1.75} />}
          </button>
        </div>
      </div>
    </div>
  );
};
