import React, { useState } from 'react';
import { ShoppingBag, Instagram, Phone, Plus, Trash2, MapPin } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { CartItem, Order, OrderOrigin, OrderStatus, PaymentMethod } from '../../types';
import { formatBRL } from '../../utils/formatters';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit?: Order | null;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  orderToEdit,
}) => {
  const { products, customers, saveOrder, showToast } = useApp();

  const [origin, setOrigin] = useState<OrderOrigin>('instagram');
  const [customerName, setCustomerName] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [status, setStatus] = useState<OrderStatus>('novo');
  const [shipping, setShipping] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [trackingCode, setTrackingCode] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');

  // Handle adding an item
  const handleAddItem = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
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
          unitPrice: prod.promotionalPrice && prod.promotionalPrice > 0 ? prod.promotionalPrice : prod.price,
          originalPrice: prod.price,
          cost: prod.cost,
          minPrice: prod.minPrice,
          quantity: 1,
          discount: 0,
          total: prod.promotionalPrice && prod.promotionalPrice > 0 ? prod.promotionalPrice : prod.price,
        },
      ];
    });
  };

  const handleUpdateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity: qty, total: qty * i.unitPrice } : i))
      );
    }
  };

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const total = Math.max(0, subtotal - Number(discount || 0) + Number(shipping || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast('O nome do cliente é obrigatório.', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Adicione ao menos um item ao pedido.', 'warning');
      return;
    }

    const orderData: Order = {
      id: orderToEdit?.id || '',
      orderNumber: orderToEdit?.orderNumber || '',
      date: orderToEdit?.date || new Date().toISOString(),
      origin,
      customerName: customerName.trim(),
      instagramHandle: instagramHandle.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
      items,
      subtotal,
      discount: Number(discount) || 0,
      shipping: Number(shipping) || 0,
      total,
      paymentMethod,
      status,
      deliveryAddress: deliveryAddress.trim() || undefined,
      trackingCode: trackingCode.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: orderToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveOrder(orderData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={orderToEdit ? `Editar Pedido #${orderToEdit.orderNumber}` : 'Novo Pedido Instagram / WhatsApp'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Origin & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Origem do Pedido *</label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            >
              <option value="instagram">Instagram Direct / Stories</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="balcao">Balcão / Loja Física</option>
              <option value="outros">Outros Canais</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Status Inicial *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            >
              <option value="novo">Novo</option>
              <option value="aguardando_pagamento">Aguardando Pagamento</option>
              <option value="pagamento_confirmado">Pagamento Confirmado</option>
              <option value="em_separacao">Em Separação</option>
              <option value="pronto_envio">Pronto para Envio</option>
              <option value="enviado">Enviado</option>
              <option value="entregue">Entregue</option>
            </select>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Nome do Cliente *</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ex: Mariana Duarte"
              className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">@Instagram</label>
            <input
              type="text"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="@cliente"
              className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">WhatsApp</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            />
          </div>
        </div>

        {/* Products select */}
        <div className="space-y-2">
          <label className="block font-semibold text-[#2C241E] dark:text-[#F3EDE6]">Produtos do Pedido *</label>
          <div className="flex gap-2">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            >
              <option value="">Selecione um produto para adicionar...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {formatBRL(p.price)} (Estoque: {p.stock})
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
              disabled={!selectedProductId}
              className="btn-silver !py-2 !px-4 cursor-pointer disabled:opacity-50"
            >
              + Adicionar
            </button>
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <div className="divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A] border border-[#E8DFC8] dark:border-[#3A302A] rounded-xl overflow-hidden mt-2 bg-[#FFFDF9] dark:bg-[#201B17]">
              {items.map((i) => (
                <div key={i.productId} className="p-2.5 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <p className="font-semibold truncate text-[#2C241E] dark:text-[#F3EDE6]">{i.name}</p>
                    <p className="text-[10px] text-[#7E7062] dark:text-[#B5A796] font-mono">
                      {formatBRL(i.unitPrice)} cada
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min="1"
                      value={i.quantity}
                      onChange={(e) => handleUpdateQty(i.productId, Number(e.target.value))}
                      className="w-14 px-2 py-1 rounded-lg border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB] dark:bg-[#1A1512] text-center font-mono font-bold text-[#2C241E] dark:text-[#F3EDE6]"
                    />
                    <span className="font-mono font-bold w-20 text-right text-[#9D7320] dark:text-[#E6BE65]">{formatBRL(i.total)}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(i.productId, 0)}
                      className="p-1 text-[#8E8071] hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delivery Address & Tracking */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Endereço de Entrega</label>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Rua, número, complemento, bairro, cidade, CEP..."
              rows={2}
              className="w-full px-3 py-1.5 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            />
          </div>

          <div className="space-y-2">
            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Código de Rastreamento (Correios / Motoboy)</label>
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                placeholder="Ex: QB123456789BR"
                className="w-full px-3 py-1.5 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] font-mono uppercase focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              >
                <option value="pix">PIX</option>
                <option value="credito">Cartão de Crédito</option>
                <option value="debito">Cartão de Débito</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="transferencia">Transferência</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="p-3 rounded-2xl bg-[#F5EFEB] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] grid grid-cols-3 gap-3 items-center">
          <div>
            <span className="text-[10px] text-[#7E7062] dark:text-[#B5A796] block">Frete (R$)</span>
            <input
              type="number"
              min="0"
              value={shipping || ''}
              onChange={(e) => setShipping(Number(e.target.value))}
              placeholder="0.00"
              className="w-full px-2 py-1 rounded-lg border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] font-mono font-bold"
            />
          </div>
          <div>
            <span className="text-[10px] text-[#7E7062] dark:text-[#B5A796] block">Desconto (R$)</span>
            <input
              type="number"
              min="0"
              value={discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value))}
              placeholder="0.00"
              className="w-full px-2 py-1 rounded-lg border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] font-mono font-bold"
            />
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#7E7062] dark:text-[#B5A796] block">Total do Pedido:</span>
            <span className="text-base font-extrabold font-mono text-[#9D7320] dark:text-[#E6BE65]">
              {formatBRL(total)}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DFC8] dark:border-[#3A302A]">
          <button
            type="button"
            onClick={onClose}
            className="btn-silver !py-2 !px-4 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-gold !py-2 !px-6 cursor-pointer shadow-xs"
          >
            Salvar Pedido
          </button>
        </div>
      </form>
    </Modal>
  );
};
