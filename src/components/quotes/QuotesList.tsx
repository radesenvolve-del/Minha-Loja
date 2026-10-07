import React, { useState } from 'react';
import { FileCheck, Plus, CheckCircle, Trash2, Printer, ShoppingBag, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CartItem, Quote, QuoteStatus } from '../../types';
import { formatBRL, formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';

export const QuotesList: React.FC = () => {
  const { quotes, saveQuote, products, completeSale, showToast } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  const handleAddItem = (pId: string) => {
    const prod = products.find((p) => p.id === pId);
    if (!prod) return;

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === prod.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === prod.id
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: prod.id,
          name: prod.name,
          sku: prod.sku,
          unitPrice: prod.price,
          originalPrice: prod.price,
          cost: prod.cost,
          minPrice: prod.minPrice,
          quantity: 1,
          discount: 0,
          total: prod.price,
        },
      ];
    });
  };

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const total = Math.max(0, subtotal - Number(discount || 0));

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || items.length === 0) {
      showToast('Preencha o cliente e inclua itens.', 'error');
      return;
    }
    await saveQuote({
      id: `quote_${Date.now()}`,
      quoteNumber: `ORC-${quotes.length + 101}`,
      customerName: customerName.trim(),
      customerWhatsapp: customerPhone.trim() || undefined,
      date: new Date().toISOString(),
      validUntil,
      items,
      subtotal,
      discount: Number(discount) || 0,
      shipping: 0,
      total,
      status: 'enviado',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });

    setShowModal(false);
    setCustomerName('');
    setItems([]);
  };

  // Convert Quote into Sale
  const handleConvertToSale = async (quote: Quote) => {
    try {
      await completeSale({
        date: new Date().toISOString(),
        customerName: quote.customerName,
        items: quote.items,
        subtotal: quote.subtotal,
        discountType: 'fixed',
        discountValue: quote.discount,
        discountAmount: quote.discount,
        shipping: quote.shipping,
        fees: 0,
        total: quote.total,
        costTotal: quote.items.reduce((s, i) => s + i.cost * i.quantity, 0),
        estimatedProfit: Math.max(0, quote.total - quote.items.reduce((s, i) => s + i.cost * i.quantity, 0)),
        paymentMethod: 'pix',
        status: 'completed',
        notes: `Convertido do Orçamento #${quote.quoteNumber}`,
      });

      await saveQuote({
        ...quote,
        status: 'aprovado',
      });

      showToast(`Orçamento #${quote.quoteNumber} aprovado e convertido em venda!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao converter orçamento.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
            <span>Orçamentos & Propostas</span>
            <span className="badge-silver">
              {quotes.length}
            </span>
          </h2>
          <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
            Crie cotações com prazo de validade e converta orçamentos aprovados diretamente em vendas.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-gold !py-2 !px-4 !text-xs sm:!text-sm cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={1.75} />
          <span>+ Novo Orçamento</span>
        </button>
      </div>

      {/* Quotes Table */}
      <div className="bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] rounded-2xl overflow-hidden shadow-2xs">
        {quotes.length === 0 ? (
          <p className="text-xs text-[#8E8071] py-12 text-center">Nenhum orçamento cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F5EFEB] dark:bg-[#28211C] border-b border-[#E8DFC8] dark:border-[#3A302A] text-[#7E7062] dark:text-[#B5A796] font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Orçamento</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Validade</th>
                  <th className="p-3">Itens</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A]">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-[#F5EFEB]/50 dark:hover:bg-[#251E19]/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#9D7320] dark:text-[#E6BE65]">#{q.quoteNumber}</td>
                    <td className="p-3 font-mono text-[#8E8071] dark:text-[#AFA292]">{formatDate(q.date)}</td>
                    <td className="p-3 font-semibold text-[#2C241E] dark:text-[#F3EDE6]">{q.customerName}</td>
                    <td className="p-3 font-mono text-[#8E8071] dark:text-[#AFA292]">{formatDate(q.validUntil)}</td>
                    <td className="p-3 max-w-[200px] truncate text-[#7E7062] dark:text-[#B5A796]">
                      {q.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-sm text-[#9D7320] dark:text-[#E6BE65]">{formatBRL(q.total)}</td>
                    <td className="p-3 text-center">
                      <span className={`badge-silver ${q.status === 'aprovado' ? '!border-[#C99F3B]/50 text-[#9D7320] dark:text-[#E6BE65]' : ''}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {q.status !== 'aprovado' && (
                        <button
                          onClick={() => handleConvertToSale(q)}
                          className="btn-gold !py-1 !px-2.5 !text-[11px] cursor-pointer shadow-xs ml-auto inline-flex items-center gap-1"
                        >
                          <span>Virar Venda</span>
                          <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Quote Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Orçamento" maxWidth="md">
        <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Cliente *</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nome do cliente"
              className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">WhatsApp</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Válido Até *</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Adicionar Produtos</label>
            <div className="flex gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              >
                <option value="">Selecione um produto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {formatBRL(p.price)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (selectedProductId) {
                    handleAddItem(selectedProductId);
                    setSelectedProductId('');
                  }
                }}
                className="btn-silver !py-2 !px-3.5 cursor-pointer"
              >
                +
              </button>
            </div>

            {items.length > 0 && (
              <div className="mt-2 divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A] border border-[#E8DFC8] dark:border-[#3A302A] rounded-xl overflow-hidden bg-[#FFFDF9] dark:bg-[#201B17]">
                {items.map((i) => (
                  <div key={i.productId} className="p-2 flex justify-between items-center text-[#2C241E] dark:text-[#F3EDE6]">
                    <span>
                      {i.quantity}x {i.name}
                    </span>
                    <span className="font-mono font-bold text-[#9D7320] dark:text-[#E6BE65]">{formatBRL(i.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[#E8DFC8] dark:border-[#3A302A]">
            <span className="text-[#7E7062] dark:text-[#B5A796]">Total:</span>
            <span className="text-base font-extrabold font-mono text-[#9D7320] dark:text-[#E6BE65]">
              {formatBRL(total)}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFC8] dark:border-[#3A302A]">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-silver !py-2 !px-4 cursor-pointer"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-gold !py-2 !px-5 cursor-pointer shadow-xs">
              Salvar Orçamento
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
