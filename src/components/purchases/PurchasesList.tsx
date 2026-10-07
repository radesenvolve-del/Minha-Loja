import React, { useState } from 'react';
import { Truck, Plus, Trash2, Calendar, FileText, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Purchase, PurchaseItem } from '../../types';
import { formatBRL, formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';

export const PurchasesList: React.FC = () => {
  const { purchases, suppliers, products, savePurchase, showToast } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [costUpdateStrategy, setCostUpdateStrategy] = useState<'ultimo' | 'medio' | 'nenhum'>('ultimo');
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [extraExpenses, setExtraExpenses] = useState<number>(0);

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemCost, setItemCost] = useState<number>(0);

  const handleAddItem = () => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;
    if (itemQty <= 0 || itemCost <= 0) {
      showToast('Quantidade e custo unitário devem ser maiores que zero.', 'error');
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: itemQty,
        unitCost: itemCost,
        total: itemQty * itemCost,
      },
    ]);

    setSelectedProductId('');
    setItemQty(1);
    setItemCost(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const itemsTotal = items.reduce((sum, i) => sum + i.total, 0);
  const grandTotal = itemsTotal + Number(shippingCost || 0) + Number(extraExpenses || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast('Adicione ao menos um produto à compra.', 'warning');
      return;
    }

    const sup = suppliers.find((s) => s.id === supplierId);
    await savePurchase({
      id: `purch_${Date.now()}`,
      purchaseNumber: `COMP-${purchases.length + 101}`,
      supplierId: supplierId || undefined,
      supplierName: sup?.name || 'Fornecedor Avulso',
      invoiceNumber: invoiceNumber.trim() || undefined,
      date,
      items,
      shippingCost: Number(shippingCost) || 0,
      extraExpenses: Number(extraExpenses) || 0,
      totalCost: grandTotal,
      costUpdateStrategy,
      createdAt: new Date().toISOString(),
    });

    setShowModal(false);
    setItems([]);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
            <span>Entrada de Mercadorias (Compras)</span>
            <span className="badge-silver">
              {purchases.length}
            </span>
          </h2>
          <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
            Dê entrada em notas fiscais de fornecedores com atualização automática de estoque e recalculo de custo.
          </p>
        </div>

        <button
          onClick={() => {
            setItems([]);
            setShowModal(true);
          }}
          className="btn-gold !py-2 !px-4 !text-xs sm:!text-sm cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={1.75} />
          <span>+ Registrar Entrada</span>
        </button>
      </div>

      {/* Purchases Table */}
      <div className="bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] rounded-2xl overflow-hidden shadow-2xs">
        {purchases.length === 0 ? (
          <p className="text-xs text-[#8E8071] py-12 text-center">Nenhuma compra ou entrada registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F5EFEB] dark:bg-[#28211C] border-b border-[#E8DFC8] dark:border-[#3A302A] text-[#7E7062] dark:text-[#B5A796] font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Compra</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Fornecedor</th>
                  <th className="p-3">NF</th>
                  <th className="p-3">Produtos Entrados</th>
                  <th className="p-3 text-right">Total da Nota</th>
                  <th className="p-3 text-center">Estratégia Custo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A]">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F5EFEB]/50 dark:hover:bg-[#251E19]/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#9D7320] dark:text-[#E6BE65]">
                      #{p.purchaseNumber}
                    </td>
                    <td className="p-3 font-mono text-[#8E8071] dark:text-[#AFA292]">{formatDate(p.date)}</td>
                    <td className="p-3 font-semibold text-[#2C241E] dark:text-[#F3EDE6]">{p.supplierName}</td>
                    <td className="p-3 font-mono text-[#8E8071] dark:text-[#AFA292]">{p.invoiceNumber || 'S/N'}</td>
                    <td className="p-3 max-w-[200px] truncate text-[#7E7062] dark:text-[#B5A796]">
                      {p.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-sm text-[#9D7320] dark:text-[#E6BE65]">
                      {formatBRL(p.totalCost)}
                    </td>
                    <td className="p-3 text-center uppercase text-[10px] font-bold">
                      <span className="badge-silver">{p.costUpdateStrategy}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Nova Entrada */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Entrada de Mercadorias" maxWidth="2xl">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Fornecedor</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              >
                <option value="">Selecione o fornecedor...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Número da Nota Fiscal (NF)</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Ex: NF 1024"
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Data da Entrada</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Atualização do Custo dos Produtos</label>
              <select
                value={costUpdateStrategy}
                onChange={(e) => setCostUpdateStrategy(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              >
                <option value="ultimo">Substituir pelo Último Custo</option>
                <option value="medio">Calcular Custo Médio Ponderado</option>
                <option value="nenhum">Não atualizar custo cadastrado</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Frete da Mercadoria (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={shippingCost || ''}
                onChange={(e) => setShippingCost(Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Outras Despesas (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={extraExpenses || ''}
                onChange={(e) => setExtraExpenses(Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              />
            </div>
          </div>

          {/* Add Product Row */}
          <div className="p-3.5 rounded-2xl bg-[#F5EFEB] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] space-y-2">
            <span className="font-bold text-[#2C241E] dark:text-[#F3EDE6] block text-[11px] uppercase tracking-wider">
              Adicionar Item da Nota
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
              <div className="sm:col-span-2">
                <span className="text-[10px] text-[#7E7062] dark:text-[#B5A796] block mb-0.5">Produto</span>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const prod = products.find((p) => p.id === e.target.value);
                    if (prod) setItemCost(prod.cost);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] text-xs focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
                >
                  <option value="">Selecione o produto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Atual: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] text-[#7E7062] dark:text-[#B5A796] block mb-0.5">Quantidade</span>
                <input
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
                />
              </div>

              <div>
                <span className="text-[10px] text-[#7E7062] dark:text-[#B5A796] block mb-0.5">Custo Unit. (R$)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemCost || ''}
                  onChange={(e) => setItemCost(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
                />
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="btn-silver !py-2 !px-3 !text-xs cursor-pointer"
              >
                + Adicionar Item
              </button>
            </div>
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <div className="divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A] border border-[#E8DFC8] dark:border-[#3A302A] rounded-xl overflow-hidden bg-[#FFFDF9] dark:bg-[#201B17]">
              {items.map((i, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[#2C241E] dark:text-[#F3EDE6]">{i.productName}</span>
                    <span className="text-[11px] text-[#7E7062] dark:text-[#B5A796] font-mono block">
                      {i.quantity}x {formatBRL(i.unitCost)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-[#9D7320] dark:text-[#E6BE65]">{formatBRL(i.total)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-[#8E8071] hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grand Total */}
          <div className="p-3.5 rounded-2xl bg-[#F5EFEB] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] flex justify-between items-center text-sm">
            <span className="font-semibold text-[#2C241E] dark:text-[#F3EDE6]">Valor Total da Compra:</span>
            <span className="font-mono font-extrabold text-base text-[#9D7320] dark:text-[#E6BE65]">
              {formatBRL(grandTotal)}
            </span>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E8DFC8] dark:border-[#3A302A]">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-silver !py-2 !px-4 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={items.length === 0}
              className="btn-gold !py-2 !px-5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              Confirmar Entrada e Atualizar Estoque
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
