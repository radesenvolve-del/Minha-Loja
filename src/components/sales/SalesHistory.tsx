import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Printer,
  MessageCircle,
  XCircle,
  RotateCcw,
  Receipt,
  Eye,
  Calendar,
  AlertTriangle,
  Download,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import { formatBRL, formatDateTime } from '../../utils/formatters';
import { generateSaleWhatsAppReceipt, openWhatsApp } from '../../utils/whatsapp';
import { shareSalePdfViaWhatsApp } from '../../utils/pdfReceiptGenerator';
import { ConfirmModal } from '../common/ConfirmModal';
import { ReceiptModal } from '../pdv/ReceiptModal';
import { Modal } from '../common/Modal';
import { SwipeableRow, SwipeAction } from '../common/SwipeableRow';
import { AdminApprovalModal } from '../common/AdminApprovalModal';

export const SalesHistory: React.FC = () => {
  const {
    sales,
    cancelSale,
    processItemReturn,
    settings,
    customers,
    showToast,
    currentUser,
    hasPermission,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<Sale | null>(null);

  // Cancellation Modal State
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isAdminApprovalOpen, setIsAdminApprovalOpen] = useState(false);

  // Return Modal State
  const [saleForReturn, setSaleForReturn] = useState<Sale | null>(null);
  const [returnItemIndex, setReturnItemIndex] = useState<number>(0);
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnReason, setReturnReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'credito_cliente' | 'estorno_dinheiro' | 'estorno_pix' | 'troca_produto'>('credito_cliente');

  const handleSendWhatsAppDirect = (sale: Sale) => {
    const text = generateSaleWhatsAppReceipt(
      sale,
      settings.storeName,
      settings.phone,
      settings.pixKey,
      settings.pixKeyType
    );
    const customer = customers.find(
      (c) => c.id === sale.customerId || c.name.toLowerCase() === sale.customerName.toLowerCase()
    );
    const phone = customer?.whatsapp || '';
    openWhatsApp(phone, text);
    showToast(
      settings.pixKey
        ? `Comprovante com Chave PIX (${settings.pixKey}) enviado ao WhatsApp!`
        : `Comprovante enviado ao WhatsApp! (Dica: cadastre sua chave PIX nas configurações)`,
      'success'
    );
  };

  const handleShareSalePdf = async (sale: Sale) => {
    const customer = customers.find(
      (c) => c.id === sale.customerId || c.name.toLowerCase() === sale.customerName.toLowerCase()
    );
    const phone = customer?.whatsapp || '';
    try {
      const res = await shareSalePdfViaWhatsApp({ sale, settings, customerPhone: phone });
      if (res.method === 'native-share') {
        showToast('Comprovante em PDF compartilhado no WhatsApp!', 'success');
      } else {
        showToast('PDF baixado e WhatsApp aberto para anexar!', 'success');
      }
    } catch {
      showToast('Erro ao preparar envio do PDF pelo WhatsApp.', 'error');
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        !search ||
        s.saleNumber.includes(search) ||
        s.customerName.toLowerCase().includes(search.toLowerCase()) ||
        s.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [sales, search, statusFilter]);

  const handleInitiateCancel = (sale: Sale) => {
    if (!hasPermission('canCancelSales') && settings.requireAdminPinForCancel !== false) {
      setSaleToCancel(sale);
      setIsAdminApprovalOpen(true);
      return;
    }
    setSaleToCancel(sale);
  };

  const handleConfirmCancel = async () => {
    if (!saleToCancel) return;
    if (!cancelReason.trim()) {
      showToast('O motivo do cancelamento é obrigatório.', 'error');
      return;
    }
    await cancelSale(saleToCancel.id, cancelReason.trim());
    setSaleToCancel(null);
    setCancelReason('');
  };

  const handleConfirmReturn = async () => {
    if (!saleForReturn) return;
    const item = saleForReturn.items[returnItemIndex];
    if (!item) return;

    if (returnQty <= 0 || returnQty > item.quantity) {
      showToast('Quantidade inválida para devolução.', 'error');
      return;
    }
    if (!returnReason.trim()) {
      showToast('Informe o motivo da devolução.', 'error');
      return;
    }

    try {
      await processItemReturn(
        saleForReturn.id,
        returnItemIndex,
        returnQty,
        returnReason.trim(),
        refundMethod
      );
      setSaleForReturn(null);
      setReturnReason('');
      setReturnQty(1);
    } catch (err: any) {
      showToast(err.message || 'Erro ao processar devolução.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
            <span>Histórico de Vendas</span>
            <span className="badge-silver">
              {filteredSales.length}
            </span>
          </h2>
          <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
            Consulte cupons emitidos, reimprima comprovantes, envie comprovantes por WhatsApp ou realize devoluções.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 p-3 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#8E8071]" strokeWidth={1.75} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número do cupom, cliente ou produto..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/50 dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] placeholder:text-[#8E8071] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/50 dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
          >
            <option value="all">Todas as Vendas</option>
            <option value="completed">Concluídas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Sales Display (Desktop Table + Mobile Adaptive Stacked List with Swipe) */}
      {filteredSales.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#8E8071] border border-dashed border-[#E8DFC8] dark:border-[#3A302A] rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17]/50">
          Nenhuma venda encontrada com os filtros atuais.
        </div>
      ) : (
        <div className="space-y-3 pb-16 sm:pb-0">
          {/* Mobile Stacked List with Swipe */}
          <div className="flex sm:hidden flex-col space-y-2.5">
            <div className="flex items-center justify-between px-1 text-[11px] text-[#8E8071] dark:text-[#AFA292]">
              <span className="flex items-center gap-1 font-medium">
                <span>👈 Deslize p/ Ações Rápidas (Cupom/PDF/Zap)</span>
              </span>
              <span className="font-mono text-[10px]">
                {filteredSales.length} vendas
              </span>
            </div>

            {filteredSales.map((sale) => {
              const isCancelled = sale.status === 'cancelled';

              const rightActions: SwipeAction[] = [
                {
                  id: 'details',
                  label: 'Detalhes',
                  icon: Eye,
                  variant: 'neutral',
                  onClick: () => setSelectedSaleForDetails(sale),
                },
                {
                  id: 'receipt',
                  label: 'Cupom',
                  icon: Printer,
                  variant: 'primary',
                  onClick: () => setSelectedSaleForReceipt(sale),
                },
              ];

              const leftActions: SwipeAction[] = [
                {
                  id: 'pdf',
                  label: 'PDF Zap',
                  icon: FileText,
                  className: 'bg-[#C99F3B] hover:bg-[#B58B2A] text-white',
                  onClick: () => handleShareSalePdf(sale),
                },
                {
                  id: 'whatsapp',
                  label: 'WhatsApp',
                  icon: MessageCircle,
                  className: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                  onClick: () => handleSendWhatsAppDirect(sale),
                },
              ];

              return (
                <SwipeableRow
                  key={`mobile-${sale.id}`}
                  rightActions={rightActions}
                  leftActions={leftActions}
                  className={`border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#201B17] shadow-2xs hover:border-[#C99F3B]/50 transition-all rounded-2xl ${
                    isCancelled ? 'opacity-65' : ''
                  }`}
                >
                  <div className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#2C241E] dark:text-[#F3EDE6]">
                          #{sale.saleNumber}
                        </span>
                        <span className="text-[10px] font-mono text-[#8E8071] dark:text-[#AFA292]">
                          {formatDateTime(sale.date)}
                        </span>
                      </div>
                      {isCancelled ? (
                        <span className="badge-silver !text-rose-600 dark:!text-rose-400">
                          Cancelada
                        </span>
                      ) : (
                        <span className="badge-gold">
                          Concluída
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-[#2C241E] dark:text-[#F3EDE6] truncate">
                          {sale.customerName}
                        </p>
                        <p className="text-[11px] text-[#7E7062] dark:text-[#B5A796] truncate mt-0.5">
                          {sale.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                      </div>

                      <div className="text-right pl-3 shrink-0">
                        <span className="text-sm font-extrabold font-mono text-[#9D7320] dark:text-[#E6BE65] block">
                          {formatBRL(sale.total)}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-[#8E8071] dark:text-[#AFA292]">
                          {sale.paymentMethod}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E8DFC8]/60 dark:border-[#3A302A] text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleShareSalePdf(sale)}
                          className="btn-gold !py-1 !px-2.5 !text-[11px] cursor-pointer shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
                          <span>PDF Zap</span>
                        </button>
                        <button
                          onClick={() => setSelectedSaleForReceipt(sale)}
                          className="btn-silver !py-1 !px-2.5 !text-[11px] cursor-pointer shadow-2xs"
                        >
                          <Printer className="w-3 h-3 text-[#556070] dark:text-[#CBD5E1]" strokeWidth={1.75} />
                          <span>Cupom</span>
                        </button>
                      </div>

                      <button
                        onClick={() => setSelectedSaleForDetails(sale)}
                        className="text-[#9D7320] dark:text-[#E6BE65] hover:underline font-semibold cursor-pointer"
                      >
                        Ver Detalhes →
                      </button>
                    </div>
                  </div>
                </SwipeableRow>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F5EFEB] dark:bg-[#28211C] border-b border-[#E8DFC8] dark:border-[#3A302A] text-[#7E7062] dark:text-[#B5A796] font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Cupom</th>
                    <th className="p-3">Data / Hora</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Produtos</th>
                    <th className="p-3">Pagamento</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A]">
                  {filteredSales.map((sale) => {
                    const isCancelled = sale.status === 'cancelled';
                    return (
                      <tr
                        key={sale.id}
                        className={`hover:bg-[#F5EFEB]/60 dark:hover:bg-[#251E19]/60 transition-colors ${
                          isCancelled ? 'opacity-60 bg-[#F5EFEB]/30 dark:bg-[#1A1512]/30' : ''
                        }`}
                      >
                        <td className="p-3 font-mono font-bold text-[#2C241E] dark:text-[#F3EDE6]">
                          #{sale.saleNumber}
                        </td>
                        <td className="p-3 font-mono text-[#8E8071] dark:text-[#AFA292] whitespace-nowrap">
                          {formatDateTime(sale.date)}
                        </td>
                        <td className="p-3 font-semibold text-[#2C241E] dark:text-[#F3EDE6]">
                          {sale.customerName}
                        </td>
                        <td className="p-3 max-w-[200px] truncate text-[#635649] dark:text-[#CBD5E1]">
                          {sale.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </td>
                        <td className="p-3 uppercase text-[11px] font-semibold text-[#635649] dark:text-[#CBD5E1]">
                          {sale.paymentMethod === 'credito_parcelado'
                            ? `Crédito ${sale.installments || 1}x`
                            : sale.paymentMethod}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-[#9D7320] dark:text-[#E6BE65] text-sm">
                          {formatBRL(sale.total)}
                        </td>
                        <td className="p-3 text-center">
                          {isCancelled ? (
                            <span className="badge-silver !text-rose-600 dark:!text-rose-400">
                              Cancelada
                            </span>
                          ) : (
                            <span className="badge-gold">
                              Concluída
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedSaleForDetails(sale)}
                              className="p-1.5 rounded-lg text-[#8E8071] hover:text-[#2C241E] dark:hover:text-[#F3EDE6] hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] cursor-pointer"
                              title="Ver detalhes da venda"
                            >
                              <Eye className="w-4 h-4" strokeWidth={1.75} />
                            </button>

                            <button
                              onClick={() => handleShareSalePdf(sale)}
                              className="p-1.5 rounded-lg text-[#9D7320] dark:text-[#E6BE65] hover:bg-[#D8B059]/15 cursor-pointer"
                              title="Enviar Comprovante PDF via WhatsApp"
                            >
                              <FileText className="w-4 h-4" strokeWidth={1.75} />
                            </button>

                            <button
                              onClick={() => setSelectedSaleForReceipt(sale)}
                              className="p-1.5 rounded-lg text-[#8E8071] hover:text-[#2C241E] dark:hover:text-[#F3EDE6] hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] cursor-pointer"
                              title="Comprovante de Venda"
                            >
                              <Printer className="w-4 h-4" strokeWidth={1.75} />
                            </button>

                            <button
                              onClick={() => handleSendWhatsAppDirect(sale)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                              title="Enviar Comprovante pelo WhatsApp (com Chave PIX inclusa)"
                            >
                              <MessageCircle className="w-4 h-4" strokeWidth={1.75} />
                            </button>

                            {!isCancelled && (
                              <>
                                <button
                                  onClick={() => {
                                    setSaleForReturn(sale);
                                    setReturnItemIndex(0);
                                    setReturnQty(1);
                                  }}
                                  className="p-1.5 rounded-lg text-[#8E8071] hover:text-[#9D7320] dark:hover:text-[#E6BE65] hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] cursor-pointer"
                                  title="Registrar Devolução de Item"
                                >
                                  <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
                                </button>

                                <button
                                  onClick={() => {
                                    setSaleToCancel(sale);
                                    setCancelReason('');
                                  }}
                                  className="p-1.5 rounded-lg text-[#8E8071] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] cursor-pointer"
                                  title="Cancelar Venda e Reverter Estoque"
                                >
                                  <XCircle className="w-4 h-4" strokeWidth={1.75} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sale Details Modal */}
      {selectedSaleForDetails && (
        <Modal
          isOpen={!!selectedSaleForDetails}
          onClose={() => setSelectedSaleForDetails(null)}
          title={`Detalhes da Venda #${selectedSaleForDetails.saleNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#F5EFEB] dark:bg-[#201B17] border border-[#E8DFC8] dark:border-[#3A302A] space-y-1.5 text-[#2C241E] dark:text-[#F3EDE6]">
              <p>
                <strong className="text-[#8E8071] dark:text-[#AFA292]">Cliente:</strong> {selectedSaleForDetails.customerName}
              </p>
              <p>
                <strong className="text-[#8E8071] dark:text-[#AFA292]">Data:</strong> {formatDateTime(selectedSaleForDetails.date)}
              </p>
              <p>
                <strong className="text-[#8E8071] dark:text-[#AFA292]">Vendedor:</strong> {selectedSaleForDetails.userName}
              </p>
              <p>
                <strong className="text-[#8E8071] dark:text-[#AFA292]">Forma de Pagamento:</strong> {selectedSaleForDetails.paymentMethod}
              </p>
              {selectedSaleForDetails.status === 'cancelled' && (
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 mt-2 font-semibold">
                  <strong>Venda Cancelada:</strong> {selectedSaleForDetails.cancelReason}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#8E8071] dark:text-[#AFA292] uppercase tracking-wider text-[10px]">
                Itens Vendidos
              </h4>
              <div className="divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A] border border-[#E8DFC8] dark:border-[#3A302A] rounded-2xl overflow-hidden bg-[#FFFDF9] dark:bg-[#1A1512]">
                {selectedSaleForDetails.items.map((i, idx) => (
                  <div key={idx} className="p-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-[#2C241E] dark:text-[#F3EDE6]">{i.name}</p>
                      <p className="text-[#8E8071] dark:text-[#AFA292] text-[11px] font-mono">
                        {i.quantity}x {formatBRL(i.unitPrice)} · Custo: {formatBRL(i.cost)}
                      </p>
                    </div>
                    <span className="font-bold font-mono text-[#9D7320] dark:text-[#E6BE65]">{formatBRL(i.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F5EFEB] dark:bg-[#201B17] border border-[#E8DFC8] dark:border-[#3A302A] space-y-1.5 text-[#2C241E] dark:text-[#F3EDE6]">
              <div className="flex justify-between text-[#8E8071] dark:text-[#AFA292]">
                <span>Subtotal:</span>
                <span className="font-mono">{formatBRL(selectedSaleForDetails.subtotal)}</span>
              </div>
              {selectedSaleForDetails.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Desconto:</span>
                  <span className="font-mono">-{formatBRL(selectedSaleForDetails.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-[#2C241E] dark:text-[#F3EDE6] pt-1.5 border-t border-[#E8DFC8]/60 dark:border-[#3A302A]">
                <span>Total:</span>
                <span className="font-mono text-base font-black text-[#9D7320] dark:text-[#E6BE65]">{formatBRL(selectedSaleForDetails.total)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
                <span>Lucro Estimado:</span>
                <span className="font-mono">{formatBRL(selectedSaleForDetails.estimatedProfit)}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#E8DFC8] dark:border-[#3A302A]">
              <button
                type="button"
                onClick={() => {
                  const sale = selectedSaleForDetails;
                  setSelectedSaleForDetails(null);
                  setSelectedSaleForReceipt(sale);
                }}
                className="btn-silver !py-2 !px-3.5 !text-xs cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4 text-[#556070] dark:text-[#CBD5E1]" strokeWidth={1.75} />
                <span>Imprimir Cupom</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSendWhatsAppDirect(selectedSaleForDetails);
                }}
                className="btn-gold !py-2 !px-4 !text-xs cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" strokeWidth={1.75} />
                <span>Enviar no WhatsApp</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Sale Cancellation Modal with required reason */}
      <ConfirmModal
        isOpen={!!saleToCancel}
        onClose={() => setSaleToCancel(null)}
        onConfirm={handleConfirmCancel}
        title="Cancelar Venda e Reverter Estoque"
        description={`Você está cancelando a venda #${saleToCancel?.saleNumber} no valor de ${formatBRL(
          saleToCancel?.total
        )}. Todos os itens voltarão automaticamente para o estoque da loja e a transação será estornada do caixa.`}
        confirmText="Confirmar Cancelamento"
        variant="danger"
        inputReason={true}
        reasonPlaceholder="Informe o motivo do cancelamento (ex: Desistência do cliente, erro no valor)..."
        reasonValue={cancelReason}
        onReasonChange={setCancelReason}
      />

      {/* Sale Return (Devolução) Modal */}
      {saleForReturn && (
        <Modal
          isOpen={!!saleForReturn}
          onClose={() => setSaleForReturn(null)}
          title={`Devolução - Venda #${saleForReturn.saleNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-[#7E7062] dark:text-[#B5A796]">
              Selecione o produto devolvido pelo cliente. Ele retornará automaticamente ao estoque da loja.
            </p>

            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Item a Devolver:</label>
              <select
                value={returnItemIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setReturnItemIndex(idx);
                  setReturnQty(1);
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/50 dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6]"
              >
                {saleForReturn.items.map((item, idx) => (
                  <option key={idx} value={idx}>
                    {item.name} ({item.quantity} un compradas - {formatBRL(item.unitPrice)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Quantidade Devolvida:</label>
                <input
                  type="number"
                  min="1"
                  max={saleForReturn.items[returnItemIndex]?.quantity || 1}
                  value={returnQty}
                  onChange={(e) => setReturnQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/50 dark:bg-[#1A1512] font-mono font-bold text-[#2C241E] dark:text-[#F3EDE6]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Valor do Reembolso:</label>
                <div className="px-3 py-2 rounded-xl bg-[#F5EFEB] dark:bg-[#201B17] border border-[#E8DFC8] dark:border-[#3A302A] font-mono font-bold text-[#9D7320] dark:text-[#E6BE65]">
                  {formatBRL(
                    (saleForReturn.items[returnItemIndex]?.unitPrice || 0) * returnQty
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Forma de Restituição / Reembolso:</label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/50 dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] font-semibold"
              >
                <option value="credito_cliente">Crédito na Loja (Saldo em haver para o cliente)</option>
                <option value="estorno_dinheiro">Estorno em Dinheiro (Saída do Caixa)</option>
                <option value="estorno_pix">Estorno via PIX</option>
                <option value="troca_produto">Troca Direta por Outra Peça</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Motivo da Devolução *</label>
              <input
                type="text"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Ex: Tamanho incorreto, produto com defeito, troca..."
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/50 dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6]"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8DFC8] dark:border-[#3A302A]">
              <button
                type="button"
                onClick={() => setSaleForReturn(null)}
                className="btn-silver !py-2 !px-4 !text-xs cursor-pointer shadow-2xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="btn-gold !py-2 !px-4 !text-xs cursor-pointer shadow-xs"
              >
                Concluir Devolução
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin Approval for Non-Admin Cancellation */}
      <AdminApprovalModal
        isOpen={isAdminApprovalOpen}
        onClose={() => {
          setIsAdminApprovalOpen(false);
          setSaleToCancel(null);
        }}
        onApproved={() => {
          setIsAdminApprovalOpen(false);
          // Now proceed to confirm modal
        }}
        title="Autorização para Cancelamento de Venda"
        description="Operadores necessitam de autorização do Administrador ou Gerente para estornar vendas já finalizadas."
      />

      {/* Thermal Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedSaleForReceipt}
        onClose={() => setSelectedSaleForReceipt(null)}
        sale={selectedSaleForReceipt}
      />
    </div>
  );
};
