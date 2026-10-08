import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Calendar,
  Flame,
  Percent,
  Check,
  Package,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Promotion, Product } from '../../types';
import { formatBRL, formatDate } from '../../utils/formatters';

export const PromotionsView: React.FC = () => {
  const { promotions, savePromotion, deletePromotion, products, saveProduct, showToast } = useApp();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [promoName, setPromoName] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // Idle products (> 30 days without sale or idle stock)
  const idleProducts = products.filter((p) => p.stock > 0 && p.status === 'ativo');

  const handleToggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedProductIds.length === idleProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(idleProducts.map((p) => p.id));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoName.trim()) {
      showToast('Informe o nome da campanha promocional.', 'error');
      return;
    }
    if (selectedProductIds.length === 0) {
      showToast('Selecione ao menos um produto para participar da promoção.', 'warning');
      return;
    }

    const newPromo: Promotion = {
      id: `promo_${Date.now()}`,
      name: promoName.trim(),
      discountPercent,
      startDate,
      endDate,
      productIds: selectedProductIds,
      active: true,
      createdAt: new Date().toISOString(),
    };

    // Apply promotional price to each selected product
    for (const prodId of selectedProductIds) {
      const prod = products.find((p) => p.id === prodId);
      if (prod) {
        const promoPrice = Math.round(prod.price * (1 - discountPercent / 100) * 100) / 100;
        await saveProduct({
          ...prod,
          promotionalPrice: promoPrice,
          promoStartDate: startDate,
          promoEndDate: endDate,
        });
      }
    }

    await savePromotion(newPromo);
    setIsFormOpen(false);
    setPromoName('');
    setSelectedProductIds([]);
    showToast(`Campanha "${newPromo.name}" criada e preços atualizados!`, 'success');
  };

  const handleQuickClearance = async (product: Product) => {
    const promoPrice = Math.round(product.price * 0.75 * 100) / 100; // 25% OFF
    const today = new Date().toISOString().slice(0, 10);
    const in15Days = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);

    await saveProduct({
      ...product,
      promotionalPrice: promoPrice,
      promoStartDate: today,
      promoEndDate: in15Days,
    });

    showToast(`Queima de Estoque ativada para "${product.name}" (-25% OFF)!`, 'success');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
            <span>Promoções & Queima de Estoque</span>
            <span className="badge-gold">
              <Flame className="w-3.5 h-3.5 inline text-rose-500 mr-1" />
              {promotions.length} Ativas
            </span>
          </h2>
          <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
            Crie campanhas de desconto para acelerar giro de peças paradas e atrair clientes no PDV e Catálogo Digital.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-gold !py-2 !px-4 !text-xs cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nova Promoção</span>
        </button>
      </div>

      {/* Form Modal / Accordion */}
      {isFormOpen && (
        <form onSubmit={handleSave} className="p-5 rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm uppercase text-[#2C241E] dark:text-[#F3EDE6]">
              Cadastrar Campanha Promocional
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-zinc-500 hover:text-zinc-700"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                Nome da Campanha *
              </label>
              <input
                type="text"
                placeholder="Ex: Queima de Coleção / Black Week"
                value={promoName}
                onChange={(e) => setPromoName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-white dark:bg-[#25201C] text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                Desconto (%) *
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-white dark:bg-[#25201C] text-xs font-bold text-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                Válido Até
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-white dark:bg-[#25201C] text-xs font-bold"
              />
            </div>
          </div>

          {/* Product Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-700 dark:text-zinc-300">
                Selecione os Produtos ({selectedProductIds.length} selecionados)
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-[#C99F3B] hover:underline font-bold"
              >
                {selectedProductIds.length === idleProducts.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-zinc-50 dark:bg-[#171412]">
              {idleProducts.map((p) => {
                const isSelected = selectedProductIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border text-xs transition-colors ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-[#C99F3B]'
                        : 'bg-white dark:bg-[#201B17] border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleProduct(p.id)}
                      className="rounded text-[#C99F3B]"
                    />
                    <div className="min-w-0">
                      <p className="font-bold truncate text-[11px]">{p.name}</p>
                      <p className="text-[10px] text-zinc-500">
                        {formatBRL(p.price)} →{' '}
                        <strong className="text-rose-600">
                          {formatBRL(p.price * (1 - discountPercent / 100))}
                        </strong>
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFC8]/60 dark:border-[#3A302A]/60">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="btn-neutral !py-2 !px-4 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-gold !py-2 !px-5 text-xs"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar Promoção</span>
            </button>
          </div>
        </form>
      )}

      {/* Active Promotions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className="p-5 rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] shadow-xs flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/15 text-rose-600 border border-rose-500/30">
                  -{promo.discountPercent}% OFF
                </span>
                <button
                  onClick={() => deletePromotion(promo.id)}
                  className="text-zinc-400 hover:text-rose-500 p-1"
                  title="Excluir promoção"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h4 className="font-extrabold text-sm text-[#2C241E] dark:text-[#F3EDE6] mt-2">
                {promo.name}
              </h4>
              <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C99F3B]" />
                <span>Até {formatDate(promo.endDate)}</span>
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                <strong>{promo.productIds.length} produtos</strong> com preço promocional ativo no PDV e Catálogo.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
