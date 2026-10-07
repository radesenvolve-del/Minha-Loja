import React, { useState, useEffect } from 'react';
import { Boxes, ArrowDownRight, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Product, StockMovementType } from '../../types';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProduct?: Product | null;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  targetProduct,
}) => {
  const { products, registerStockMovement, showToast } = useApp();

  const [selectedProductId, setSelectedProductId] = useState('');
  const [movementType, setMovementType] = useState<StockMovementType>('entrada');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (targetProduct) {
      setSelectedProductId(targetProduct.id);
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
    setQuantity(1);
    setReason('');
  }, [targetProduct, isOpen, products]);

  const activeProduct = products.find((p) => p.id === selectedProductId);
  const currentStock = activeProduct?.stock || 0;

  // Calculate new balance
  const isAddition =
    movementType === 'entrada' || movementType === 'devolucao';

  const isSubtraction =
    movementType === 'venda' ||
    movementType === 'perda' ||
    movementType === 'avaria' ||
    movementType === 'consumo' ||
    movementType === 'cancelamento';

  let calculatedNewStock = currentStock;
  if (movementType === 'ajuste') {
    calculatedNewStock = Math.max(0, quantity);
  } else if (isAddition) {
    calculatedNewStock = currentStock + Math.max(0, quantity);
  } else {
    calculatedNewStock = Math.max(0, currentStock - Math.max(0, quantity));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) {
      showToast('Selecione um produto.', 'error');
      return;
    }
    if (quantity <= 0 && movementType !== 'ajuste') {
      showToast('A quantidade deve ser maior que zero.', 'error');
      return;
    }
    if (!reason.trim()) {
      showToast('Informe o motivo da movimentação.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const netQty =
        movementType === 'ajuste'
          ? calculatedNewStock - currentStock
          : isAddition
          ? quantity
          : -quantity;

      await registerStockMovement({
        date: new Date().toISOString(),
        productId: activeProduct.id,
        productName: activeProduct.name,
        sku: activeProduct.sku,
        type: movementType,
        quantity: netQty,
        previousStock: currentStock,
        newStock: calculatedNewStock,
        reason: reason.trim(),
        unitCost: activeProduct.cost,
        userName: 'Operador',
      });

      onClose();
    } catch (err: any) {
      showToast(err.message || 'Erro ao movimentar estoque.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Movimentação de Estoque" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product selector */}
        <div>
          <label className="block text-xs font-semibold text-[#2C241E] dark:text-[#F3EDE6] mb-1">
            Produto *
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] text-sm focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B] font-medium"
            required
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Atual: {p.stock} {p.unit}) - SKU: {p.sku}
              </option>
            ))}
          </select>
        </div>

        {/* Movement Type */}
        <div>
          <label className="block text-xs font-semibold text-[#2C241E] dark:text-[#F3EDE6] mb-1">
            Tipo de Movimentação *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'entrada', label: 'Entrada (+)', icon: <ArrowUpRight className="w-3.5 h-3.5 text-[#C99F3B]" strokeWidth={1.75} /> },
              { id: 'ajuste', label: 'Ajuste (=)', icon: <Boxes className="w-3.5 h-3.5 text-[#556070] dark:text-[#CBD5E1]" strokeWidth={1.75} /> },
              { id: 'perda', label: 'Perda (-)', icon: <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" strokeWidth={1.75} /> },
              { id: 'avaria', label: 'Avaria (-)', icon: <ArrowDownRight className="w-3.5 h-3.5 text-[#9D7320]" strokeWidth={1.75} /> },
              { id: 'consumo', label: 'Consumo (-)', icon: <ArrowDownRight className="w-3.5 h-3.5 text-[#556070]" strokeWidth={1.75} /> },
              { id: 'devolucao', label: 'Devolução (+)', icon: <ArrowUpRight className="w-3.5 h-3.5 text-[#C99F3B]" strokeWidth={1.75} /> },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setMovementType(t.id as any)}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  movementType === t.id
                    ? 'btn-gold !p-2 !text-xs !shadow-xs'
                    : 'btn-silver !p-2 !text-xs'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quantity and Balance Card */}
        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-[#2C241E] dark:text-[#F3EDE6] mb-1">
              {movementType === 'ajuste' ? 'Novo Saldo Real:' : 'Quantidade:'} *
            </label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] text-base font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              required
            />
          </div>

          <div className="p-2.5 rounded-xl bg-[#F5EFEB] dark:bg-[#201B17] border border-[#E8DFC8] dark:border-[#3A302A] text-xs">
            <span className="text-[#8E8071] dark:text-[#AFA292] block text-[10px]">Saldo Posterior:</span>
            <div className="flex items-center gap-1 font-mono font-bold text-sm text-[#2C241E] dark:text-[#F3EDE6]">
              <span className="text-[#8E8071]">{currentStock}</span>
              <span>→</span>
              <span className="text-[#9D7320] dark:text-[#E6BE65]">
                {calculatedNewStock} {activeProduct?.unit}
              </span>
            </div>
          </div>
        </div>

        {/* Reason / Notes */}
        <div>
          <label className="block text-xs font-semibold text-[#2C241E] dark:text-[#F3EDE6] mb-1">
            Motivo / Justificativa *
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Compra de reposição, contagem física periódica, defeito de fabricação..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] text-sm focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            required
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DFC8] dark:border-[#3A302A]">
          <button
            type="button"
            onClick={onClose}
            className="btn-silver !py-2 !px-4 !text-xs cursor-pointer shadow-2xs"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-gold !py-2 !px-5 !text-xs cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? 'Registrando...' : 'Confirmar Movimentação'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
