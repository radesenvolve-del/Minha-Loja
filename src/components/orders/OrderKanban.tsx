import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  MessageCircle,
  Instagram,
  ShoppingBag,
  ChevronRight,
  Printer,
  Edit2,
  CheckCircle2,
  Truck,
  Package,
  Layers,
  List,
  FileText,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { formatBRL, formatDate } from '../../utils/formatters';
import { generateOrderWhatsAppMessage, openWhatsApp } from '../../utils/whatsapp';
import { shareOrderPdfViaWhatsApp, downloadOrderPdf } from '../../utils/pdfReceiptGenerator';
import { SwipeableRow, SwipeAction } from '../common/SwipeableRow';
import { ConfirmModal } from '../common/ConfirmModal';
import { OrderReceiptModal } from './OrderReceiptModal';

interface OrderKanbanProps {
  onOpenCreate: () => void;
  onOpenEdit: (order: Order) => void;
}

const KANBAN_STAGES: { id: OrderStatus; label: string; badgeClass: string }[] = [
  { id: 'novo', label: 'Novo', badgeClass: 'badge-silver' },
  { id: 'aguardando_pagamento', label: 'Aguard. Pagamento', badgeClass: 'badge-gold' },
  { id: 'pagamento_confirmado', label: 'Pago', badgeClass: 'badge-gold' },
  { id: 'em_separacao', label: 'Em Separação', badgeClass: 'badge-silver' },
  { id: 'pronto_envio', label: 'Pronto p/ Envio', badgeClass: 'badge-silver' },
  { id: 'enviado', label: 'Enviado', badgeClass: 'badge-gold' },
  { id: 'entregue', label: 'Entregue', badgeClass: 'badge-muted' },
];

export const OrderKanban: React.FC<OrderKanbanProps> = ({ onOpenCreate, onOpenEdit }) => {
  const { orders, updateOrderStatus, deleteOrder, settings, showToast } = useApp();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [channelFilter, setChannelFilter] = useState<'all' | 'instagram' | 'whatsapp' | 'catalogo_online'>('all');
  const [selectedMobileStage, setSelectedMobileStage] = useState<OrderStatus>('novo');
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (channelFilter !== 'all' && o.origin !== channelFilter) return false;
      return true;
    });
  }, [orders, channelFilter]);

  const handleNextStatus = async (order: Order) => {
    const stageIds = KANBAN_STAGES.map((s) => s.id);
    const currentIndex = stageIds.indexOf(order.status);
    if (currentIndex >= 0 && currentIndex < stageIds.length - 1) {
      await updateOrderStatus(order.id, stageIds[currentIndex + 1]);
    }
  };

  const handleSendWhatsApp = (order: Order) => {
    const message = generateOrderWhatsAppMessage(
      order,
      settings.storeName,
      settings.pixKey,
      settings.pixKeyType
    );
    openWhatsApp(order.whatsapp || '', message);
  };

  const getOrderSwipeActions = (order: Order) => {
    const rightActions: SwipeAction[] = [
      {
        id: 'edit',
        label: 'Editar',
        icon: Edit2,
        variant: 'primary',
        onClick: () => onOpenEdit(order),
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        variant: 'danger',
        onClick: () => setOrderToDelete(order),
      },
    ];

    if (order.status !== 'entregue') {
      rightActions.push({
        id: 'next',
        label: 'Avançar',
        icon: ChevronRight,
        variant: 'success',
        onClick: () => handleNextStatus(order),
      });
    }

    const leftActions: SwipeAction[] = [
      {
        id: 'pdf',
        label: 'PDF Zap',
        icon: FileText,
        className: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        onClick: () => setSelectedOrderForReceipt(order),
      },
    ];

    if (order.whatsapp) {
      leftActions.push({
        id: 'whatsapp',
        label: 'WhatsApp',
        icon: MessageCircle,
        className: 'bg-teal-600 hover:bg-teal-700 text-white',
        onClick: () => handleSendWhatsApp(order),
      });
    }

    return { rightActions, leftActions };
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
            <span>Gestão de Pedidos (Instagram / WhatsApp)</span>
            <span className="badge-silver">
              {filteredOrders.length}
            </span>
          </h2>
          <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
            Acompanhe cada pedido desde o direct até a entrega pelo motoboy ou correios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/60 dark:bg-[#28211C] text-[#2C241E] dark:text-[#F3EDE6] cursor-pointer"
          >
            <option value="all">Todos os Canais</option>
            <option value="catalogo_online">📱 Catálogo Online</option>
            <option value="instagram">Apenas Instagram</option>
            <option value="whatsapp">Apenas WhatsApp</option>
          </select>

          {/* Toggle Kanban vs List */}
          <div className="flex p-0.5 rounded-xl bg-[#F5EFEB] dark:bg-[#28211C] border border-[#E8DFC8] dark:border-[#3A302A]">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-[#FFFDF9] dark:bg-[#1F1A17] text-[#9D7320] dark:text-[#E6BE65] shadow-xs border border-[#C99F3B]/40'
                  : 'text-[#8E8071] dark:text-[#AFA292]'
              }`}
              title="Visualização em Kanban"
            >
              <Layers className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#FFFDF9] dark:bg-[#1F1A17] text-[#9D7320] dark:text-[#E6BE65] shadow-xs border border-[#C99F3B]/40'
                  : 'text-[#8E8071] dark:text-[#AFA292]'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>

          <button
            onClick={onOpenCreate}
            className="btn-gold !py-2 !px-4 !text-xs sm:!text-sm cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            <span>+ Novo Pedido</span>
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <>
          {/* Mobile Stages Tab Bar & Feed */}
          <div className="sm:hidden space-y-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {KANBAN_STAGES.map((stage) => {
                const count = filteredOrders.filter((o) => o.status === stage.id).length;
                const isSelected = selectedMobileStage === stage.id;

                return (
                  <button
                    key={stage.id}
                    onClick={() => setSelectedMobileStage(stage.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      isSelected
                        ? 'btn-gold !py-1.5 !px-3 !text-xs'
                        : 'btn-silver !py-1.5 !px-3 !text-xs'
                    }`}
                  >
                    <span>{stage.label}</span>
                    <span className="font-mono text-[10px] opacity-80">
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Mobile Stage Orders Feed */}
            <div className="space-y-3 pb-16 sm:pb-0">
              <div className="flex items-center justify-between px-1 text-[11px] text-[#8E8071] dark:text-[#AFA292]">
                <span className="flex items-center gap-1 font-medium">
                  <span>👈 Deslize p/ Ações Rápidas (Editar/Excluir/PDF/Zap)</span>
                </span>
                <span className="font-mono text-[10px]">
                  {filteredOrders.filter((o) => o.status === selectedMobileStage).length} pedidos
                </span>
              </div>

              {filteredOrders.filter((o) => o.status === selectedMobileStage).length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-dashed border-[#E8DFC8] dark:border-[#3A302A] text-[#8E8071] dark:text-[#AFA292] text-xs">
                  Nenhum pedido nesta etapa no momento.
                </div>
              ) : (
                filteredOrders
                  .filter((o) => o.status === selectedMobileStage)
                  .map((order) => {
                    const { rightActions, leftActions } = getOrderSwipeActions(order);
                    return (
                      <SwipeableRow
                        key={order.id}
                        rightActions={rightActions}
                        leftActions={leftActions}
                        className="border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#201B17] shadow-2xs hover:border-[#C99F3B]/50 transition-all rounded-2xl"
                      >
                        <div className="p-4 space-y-2.5">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-black text-[#9D7320] dark:text-[#E6BE65]">
                              #{order.orderNumber}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                              {order.origin === 'catalogo_online' ? (
                                <span className="flex items-center gap-1 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                                  <ShoppingBag className="w-3.5 h-3.5 text-purple-600" strokeWidth={1.75} />
                                  <span>CATÁLOGO</span>
                                </span>
                              ) : order.origin === 'instagram' ? (
                                <span className="flex items-center gap-1 text-[#9D7320] dark:text-[#E6BE65] font-mono text-[10px] font-bold">
                                  <Instagram className="w-3.5 h-3.5 text-[#C99F3B]" strokeWidth={1.75} />
                                  <span>INSTAGRAM</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[#556070] dark:text-[#CBD5E1] font-mono text-[10px] font-bold">
                                  <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                                  <span>WHATSAPP</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Customer */}
                          <div>
                            <p className="text-sm font-bold text-[#2C241E] dark:text-[#F3EDE6]">
                              {order.customerName}
                            </p>
                            {order.instagramHandle && (
                              <p className="text-xs text-[#9D7320] dark:text-[#E6BE65]">
                                {order.instagramHandle}
                              </p>
                            )}
                            {order.whatsapp && (
                              <p className="text-xs text-[#8E8071] dark:text-[#AFA292] font-mono">
                                {order.whatsapp}
                              </p>
                            )}
                          </div>

                          {/* Items */}
                          <div className="text-xs text-[#554639] dark:text-[#D5C9BA] bg-[#F5EFEB]/70 dark:bg-[#1A1512] border border-[#E8DFC8]/60 dark:border-[#3A302A]/80 p-2.5 rounded-xl">
                            {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                          </div>

                          {/* Total & Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-[#E8DFC8]/60 dark:border-[#3A302A]">
                            <span className="text-sm font-black font-mono text-[#9D7320] dark:text-[#E6BE65]">
                              {formatBRL(order.total)}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {/* PDF Receipt Button */}
                              <button
                                onClick={() => setSelectedOrderForReceipt(order)}
                                className="btn-silver !py-1 !px-2.5 !text-[11px] cursor-pointer"
                                title="Gerar comprovante PDF para envio no WhatsApp"
                              >
                                <FileText className="w-3.5 h-3.5 text-[#C99F3B]" strokeWidth={1.75} />
                                <span>PDF</span>
                              </button>

                              {order.whatsapp && (
                                <button
                                  onClick={() => handleSendWhatsApp(order)}
                                  className="btn-silver !p-1.5 cursor-pointer"
                                  title="Conversar no WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4 text-[#C99F3B]" strokeWidth={1.75} />
                                </button>
                              )}

                              <button
                                onClick={() => onOpenEdit(order)}
                                className="btn-silver !p-1.5 cursor-pointer"
                                title="Editar pedido"
                              >
                                <Edit2 className="w-4 h-4" strokeWidth={1.75} />
                              </button>

                              {selectedMobileStage !== 'entregue' && (
                                <button
                                  onClick={() => handleNextStatus(order)}
                                  className="btn-gold !py-1 !px-2.5 !text-[11px] cursor-pointer"
                                >
                                  <span>Avançar</span>
                                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </SwipeableRow>
                    );
                  })
              )}
            </div>
          </div>

          {/* Desktop Kanban View */}
          <div className="hidden sm:flex gap-3 overflow-x-auto pb-4 pt-1 min-h-[60vh] -mx-4 px-4 sm:mx-0 sm:px-0">
          {KANBAN_STAGES.map((stage) => {
            const stageOrders = filteredOrders.filter((o) => o.status === stage.id);
            return (
              <div
                key={stage.id}
                className="w-72 shrink-0 flex flex-col rounded-2xl bg-[#F5EFEB]/90 dark:bg-[#1F1A17]/90 border border-[#E8DFC8] dark:border-[#3A302A] p-2.5 max-h-[75vh]"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-[#E8DFC8]/60 dark:border-[#3A302A]">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#2C241E] dark:text-[#F3EDE6]">
                    {stage.label}
                  </span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFFDF9] dark:bg-[#28211C] text-[#556070] dark:text-[#CBD5E1] border border-[#CBD5E1]/60 dark:border-[#475569] shadow-2xs">
                    {stageOrders.length}
                  </span>
                </div>

                {/* Orders inside stage */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                  {stageOrders.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-[#8E8071] dark:text-[#AFA292]">
                      Nenhum pedido nesta etapa
                    </div>
                  ) : (
                    stageOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-3 rounded-xl bg-[#FFFDF9] dark:bg-[#201B17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs hover:border-[#C99F3B]/50 transition-all space-y-2"
                      >
                        {/* Order Header */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-black text-[#9D7320] dark:text-[#E6BE65]">
                            #{order.orderNumber}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#8E8071] dark:text-[#AFA292] font-mono">
                            {order.origin === 'instagram' ? (
                              <Instagram className="w-3 h-3 text-[#C99F3B]" strokeWidth={1.75} />
                            ) : (
                              <MessageCircle className="w-3 h-3 text-[#556070] dark:text-[#CBD5E1]" strokeWidth={1.75} />
                            )}
                            <span>{order.origin.toUpperCase()}</span>
                          </span>
                        </div>

                        {/* Customer */}
                        <div>
                          <p className="text-xs font-bold text-[#2C241E] dark:text-[#F3EDE6] truncate">
                            {order.customerName}
                          </p>
                          {order.instagramHandle && (
                            <p className="text-[10px] text-[#9D7320] dark:text-[#E6BE65]">
                              {order.instagramHandle}
                            </p>
                          )}
                          {order.whatsapp && (
                            <p className="text-[10px] text-[#8E8071] dark:text-[#AFA292] font-mono">
                              {order.whatsapp}
                            </p>
                          )}
                        </div>

                        {/* Items preview */}
                        <div className="text-[11px] text-[#554639] dark:text-[#D5C9BA] line-clamp-2 bg-[#F5EFEB]/70 dark:bg-[#1A1512] border border-[#E8DFC8]/60 dark:border-[#3A302A]/80 p-1.5 rounded-lg">
                          {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>

                        {/* Price and Next Status */}
                        <div className="flex items-center justify-between pt-1 border-t border-[#E8DFC8]/60 dark:border-[#3A302A]">
                          <span className="text-xs font-black font-mono text-[#9D7320] dark:text-[#E6BE65]">
                            {formatBRL(order.total)}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedOrderForReceipt(order)}
                              className="p-1 rounded-md text-[#8E8071] hover:text-[#C99F3B] hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] cursor-pointer"
                              title="Gerar Comprovante PDF para envio no WhatsApp"
                            >
                              <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
                            </button>

                            {order.whatsapp && (
                              <button
                                onClick={() => handleSendWhatsApp(order)}
                                className="p-1 rounded-md text-[#8E8071] hover:text-[#C99F3B] hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] cursor-pointer"
                                title="Conversar no WhatsApp com mensagem do pedido"
                              >
                                <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                              </button>
                            )}

                            <button
                              onClick={() => onOpenEdit(order)}
                              className="p-1 rounded-md text-[#8E8071] hover:text-[#2C241E] dark:hover:text-[#F3EDE6] hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] cursor-pointer"
                              title="Editar pedido"
                            >
                              <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                            </button>

                            {stage.id !== 'entregue' && (
                              <button
                                onClick={() => handleNextStatus(order)}
                                className="btn-gold !py-0.5 !px-2 !text-[10px] cursor-pointer"
                                title="Avançar para a próxima etapa"
                              >
                                <span>Avançar</span>
                                <ChevronRight className="w-3 h-3" strokeWidth={1.75} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </>
      ) : (
        /* List View (Desktop Table + Mobile Adaptive Stacked List with Swipe) */
        <div className="space-y-3 pb-16 sm:pb-0">
          {/* Mobile Stacked List with Swipe */}
          <div className="flex sm:hidden flex-col space-y-2.5">
            <div className="flex items-center justify-between px-1 text-[11px] text-[#8E8071] dark:text-[#AFA292]">
              <span className="flex items-center gap-1 font-medium">
                <span>👈 Deslize p/ Ações Rápidas (Editar/Excluir/PDF)</span>
              </span>
              <span className="font-mono text-[10px]">
                {filteredOrders.length} pedidos
              </span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-dashed border-[#E8DFC8] dark:border-[#3A302A] text-[#8E8071] text-xs">
                Nenhum pedido encontrado.
              </div>
            ) : (
              filteredOrders.map((o) => {
                const { rightActions, leftActions } = getOrderSwipeActions(o);
                return (
                  <SwipeableRow
                    key={`list-mobile-${o.id}`}
                    rightActions={rightActions}
                    leftActions={leftActions}
                    className="border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#201B17] shadow-2xs hover:border-[#C99F3B]/50 transition-all rounded-2xl"
                  >
                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-[#9D7320] dark:text-[#E6BE65]">
                            #{o.orderNumber}
                          </span>
                          <span className="badge-silver">
                            {o.origin}
                          </span>
                          <span className="text-[10px] font-semibold text-[#8E8071] dark:text-[#AFA292]">
                            {o.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-[#2C241E] dark:text-[#F3EDE6] truncate mt-0.5">
                          {o.customerName}
                        </p>
                        <p className="text-[11px] text-[#8E8071] dark:text-[#AFA292] truncate mt-0.5">
                          {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                      </div>

                      <div className="flex flex-col items-end shrink-0 pl-2 border-l border-[#E8DFC8] dark:border-[#3A302A]">
                        <strong className="text-xs sm:text-sm font-mono font-black text-[#9D7320] dark:text-[#E6BE65]">
                          {formatBRL(o.total)}
                        </strong>
                        <button
                          onClick={() => setSelectedOrderForReceipt(o)}
                          className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#9D7320] dark:text-[#E6BE65] hover:underline cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-[#C99F3B]" strokeWidth={1.75} />
                          <span>PDF Recibo</span>
                        </button>
                      </div>
                    </div>
                  </SwipeableRow>
                );
              })
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block bg-[#FFFDF9] dark:bg-[#201B17] border border-[#E8DFC8] dark:border-[#3A302A] rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F5EFEB] dark:bg-[#1A1512] border-b border-[#E8DFC8] dark:border-[#3A302A] text-[#7E7062] dark:text-[#AFA292] font-extrabold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Pedido</th>
                    <th className="p-3">Origem</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Produtos</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A]">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-[#F5EFEB]/50 dark:hover:bg-[#28211C]/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#9D7320] dark:text-[#E6BE65]">#{o.orderNumber}</td>
                      <td className="p-3 uppercase text-[10px] font-bold text-[#8E8071] dark:text-[#AFA292]">{o.origin}</td>
                      <td className="p-3 font-semibold text-[#2C241E] dark:text-[#F3EDE6]">{o.customerName}</td>
                      <td className="p-3 max-w-[200px] truncate text-[#7E7062] dark:text-[#B5A796]">
                        {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-sm text-[#9D7320] dark:text-[#E6BE65]">{formatBRL(o.total)}</td>
                      <td className="p-3 text-center">
                        <span className="badge-silver">
                          {o.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrderForReceipt(o)}
                            className="p-1.5 rounded-lg text-[#8E8071] hover:text-[#C99F3B] hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] cursor-pointer"
                            title="Gerar Comprovante PDF para envio no WhatsApp"
                          >
                            <FileText className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                          {o.whatsapp && (
                            <button
                              onClick={() => handleSendWhatsApp(o)}
                              className="p-1.5 rounded-lg text-[#8E8071] hover:text-[#C99F3B] hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] cursor-pointer"
                              title="Conversar no WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" strokeWidth={1.75} />
                            </button>
                          )}
                          <button
                            onClick={() => onOpenEdit(o)}
                            className="p-1.5 rounded-lg text-[#8E8071] hover:text-[#2C241E] dark:hover:text-[#F3EDE6] hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] cursor-pointer"
                            title="Editar pedido"
                          >
                            <Edit2 className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                          <button
                            onClick={() => setOrderToDelete(o)}
                            className="p-1.5 rounded-lg text-[#8E8071] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] cursor-pointer"
                            title="Excluir pedido"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Accessible Mobile Bottom Action Bar */}
      <div className="sm:hidden sticky bottom-18 z-30 pt-2 flex items-center justify-center pointer-events-none">
        <button
          onClick={onOpenCreate}
          className="pointer-events-auto btn-gold !py-3 !px-5 rounded-2xl shadow-lg !text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Novo Pedido</span>
        </button>
      </div>

      {/* Order Receipt Modal (PDF Generation & WhatsApp Sharing) */}
      <OrderReceiptModal
        isOpen={!!selectedOrderForReceipt}
        onClose={() => setSelectedOrderForReceipt(null)}
        order={selectedOrderForReceipt}
      />

      {/* Confirm Order Deletion Modal */}
      <ConfirmModal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={async () => {
          if (orderToDelete) {
            await deleteOrder(orderToDelete.id);
            setOrderToDelete(null);
          }
        }}
        title="Excluir Pedido"
        description={`Tem certeza que deseja remover o pedido #${orderToDelete?.orderNumber} de ${orderToDelete?.customerName}?`}
        confirmText="Sim, excluir pedido"
        variant="danger"
      />
    </div>
  );
};
