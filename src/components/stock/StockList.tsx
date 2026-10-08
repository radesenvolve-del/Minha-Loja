import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  History,
  ShoppingCart,
  Calendar,
  Sparkles,
  TrendingDown,
  Search,
  MessageCircle,
  Flame,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, StockMovement } from '../../types';
import { formatBRL, formatDateTime, getDaysDiff } from '../../utils/formatters';
import { openWhatsApp } from '../../utils/whatsapp';

interface StockListProps {
  onOpenMovementModal: (product?: Product) => void;
  onOpenNewProduct: () => void;
}

export const StockList: React.FC<StockListProps> = ({
  onOpenMovementModal,
  onOpenNewProduct,
}) => {
  const { products, stockMovements, sales, suppliers, saveProduct, showToast, selectedCategory, settings } = useApp();
  const [activeTab, setActiveTab] = useState<'estoque' | 'historico' | 'comprar' | 'parados'>('estoque');
  const [search, setSearch] = useState('');
  const [idleDaysThreshold, setIdleDaysThreshold] = useState<number>(30);

  const handleOrderSupplierWhatsApp = (product: Product, quantityToOrder: number) => {
    const supplier = suppliers.find((s) => s.id === product.supplierId || s.name === product.supplierName);
    const phone = supplier?.whatsapp || supplier?.phone || '';

    const text = `📦 *Olá${supplier ? `, ${supplier.name}` : ''}! Aqui é da ${settings.storeName}.*\n\nGostaria de fazer uma cotação/pedido de reposição para o seguinte item:\n▪️ *Produto:* ${product.name}\n▪️ *SKU:* ${product.sku}\n▪️ *Quantidade:* ${quantityToOrder} ${product.unit}\n▪️ *Último Custo:* ${formatBRL(product.cost)}\n\nPoderia confirmar a disponibilidade e o prazo de entrega? Muito obrigado! ✨`;

    if (!phone) {
      showToast('Fornecedor não possui telefone ou WhatsApp cadastrado. Copie a mensagem ou cadastre o contato no menu Fornecedores.', 'warning');
      navigator.clipboard.writeText(text);
      return;
    }

    openWhatsApp(phone, text);
    showToast(`Pedido de reposição preparado para o WhatsApp de ${supplier?.name || 'Fornecedor'}!`, 'success');
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

    showToast(`Queima de Estoque (-25% OFF) ativada para "${product.name}"! Preço promocional: ${formatBRL(promoPrice)}`, 'success');
  };

  // Filtered inventory
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        !selectedCategory ||
        selectedCategory === 'all' ||
        p.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);

  // Products to buy (stock <= minStock)
  const productsToBuy = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStock);
  }, [products]);

  // Idle Products (no sales in X days)
  const idleProducts = useMemo(() => {
    const today = new Date().getTime();
    const productLastSaleMap = new Map<string, number>();

    // Map last sale timestamp per product
    sales.forEach((s) => {
      if (s.status !== 'cancelled') {
        const saleTime = new Date(s.date).getTime();
        s.items.forEach((item) => {
          const current = productLastSaleMap.get(item.productId) || 0;
          if (saleTime > current) {
            productLastSaleMap.set(item.productId, saleTime);
          }
        });
      }
    });

    return products.filter((p) => {
      if (p.stock <= 0) return false;
      const lastSaleTime = productLastSaleMap.get(p.id);
      const referenceTime = lastSaleTime || new Date(p.createdAt).getTime();
      const diffDays = Math.floor((today - referenceTime) / (1000 * 60 * 60 * 24));
      return diffDays >= idleDaysThreshold;
    });
  }, [products, sales, idleDaysThreshold]);

  return (
    <div className="space-y-4">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
            <span>Controle de Estoque & Movimentações</span>
          </h2>
          <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
            Acompanhe o saldo real, histórico completo de entradas/saídas e alertas de reposição.
          </p>
        </div>

        <button
          onClick={() => onOpenMovementModal()}
          className="btn-gold !py-2.5 !px-4 !text-xs sm:!text-sm shrink-0 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" strokeWidth={1.75} />
          <span>Lançar Movimentação</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-2xl bg-[#F5EFEB] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('estoque')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'estoque'
              ? 'bg-[#FFFDF9] dark:bg-[#2B241F] text-[#9D7320] dark:text-[#E6BE65] shadow-2xs border border-[#C99F3B]/40'
              : 'text-[#635649] dark:text-[#CBD5E1] hover:text-[#2C241E] dark:hover:text-[#F3EDE6]'
          }`}
        >
          <Boxes className="w-4 h-4" strokeWidth={1.75} />
          <span>Estoque Atual ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('historico')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'historico'
              ? 'bg-[#FFFDF9] dark:bg-[#2B241F] text-[#9D7320] dark:text-[#E6BE65] shadow-2xs border border-[#C99F3B]/40'
              : 'text-[#635649] dark:text-[#CBD5E1] hover:text-[#2C241E] dark:hover:text-[#F3EDE6]'
          }`}
        >
          <History className="w-4 h-4" strokeWidth={1.75} />
          <span>Histórico de Movimentações ({stockMovements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('comprar')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'comprar'
              ? 'bg-[#FFFDF9] dark:bg-[#2B241F] text-[#9D7320] dark:text-[#E6BE65] shadow-2xs border border-[#C99F3B]/40'
              : 'text-[#635649] dark:text-[#CBD5E1] hover:text-[#2C241E] dark:hover:text-[#F3EDE6]'
          }`}
        >
          <AlertTriangle className="w-4 h-4" strokeWidth={1.75} />
          <span>Precisam Comprar ({productsToBuy.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('parados')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'parados'
              ? 'bg-[#FFFDF9] dark:bg-[#2B241F] text-[#9D7320] dark:text-[#E6BE65] shadow-2xs border border-[#C99F3B]/40'
              : 'text-[#635649] dark:text-[#CBD5E1] hover:text-[#2C241E] dark:hover:text-[#F3EDE6]'
          }`}
        >
          <TrendingDown className="w-4 h-4" strokeWidth={1.75} />
          <span>Produtos Parados ({idleProducts.length})</span>
        </button>
      </div>

      {/* Tab 1: Estoque Atual */}
      {activeTab === 'estoque' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#8E8071]" strokeWidth={1.75} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por produto, SKU ou categoria..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1F1A17] text-[#2C241E] dark:text-[#F3EDE6] placeholder:text-[#8E8071] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            />
          </div>

          <div className="bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F5EFEB] dark:bg-[#28211C] border-b border-[#E8DFC8] dark:border-[#3A302A] text-[#7E7062] dark:text-[#B5A796] font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Produto</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3 text-right">Custo Unit.</th>
                    <th className="p-3 text-center">Saldo Atual</th>
                    <th className="p-3 text-center">Mínimo</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A]">
                  {filteredProducts.map((p) => {
                    const isLow = p.stock > 0 && p.stock <= p.minStock;
                    const isOut = p.stock <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-[#F5EFEB]/60 dark:hover:bg-[#251E19]/60 transition-colors">
                        <td className="p-3 font-semibold text-[#2C241E] dark:text-[#F3EDE6] max-w-[200px] truncate">
                          {p.name}
                        </td>
                        <td className="p-3 font-mono text-[#8E8071] dark:text-[#AFA292]">{p.sku}</td>
                        <td className="p-3 text-[#7E7062] dark:text-[#B5A796]">{p.category}</td>
                        <td className="p-3 text-right font-mono text-[#2C241E] dark:text-[#F3EDE6]">{formatBRL(p.cost)}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded-lg ${
                              isOut
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                : isLow
                                ? 'bg-[#D8B059]/15 text-[#9D7320] dark:text-[#E6BE65] border border-[#C99F3B]/40'
                                : 'bg-[#F5EFEB] text-[#2C241E] dark:bg-[#28211C] dark:text-[#F3EDE6] border border-[#E8DFC8] dark:border-[#3A302A]'
                            }`}
                          >
                            {p.stock} {p.unit}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-[#8E8071] dark:text-[#AFA292]">
                          {p.minStock} {p.unit}
                        </td>
                        <td className="p-3 text-center">
                          {isOut ? (
                            <span className="badge-silver !text-rose-600 dark:!text-rose-400">
                              Esgotado
                            </span>
                          ) : isLow ? (
                            <span className="badge-gold">
                              Estoque Baixo
                            </span>
                          ) : (
                            <span className="badge-silver">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onOpenMovementModal(p)}
                            className="btn-silver !py-1 !px-2.5 !text-xs cursor-pointer shadow-2xs"
                          >
                            Ajustar
                          </button>
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

      {/* Tab 2: Histórico de Movimentações */}
      {activeTab === 'historico' && (
        <div className="bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] rounded-2xl overflow-hidden shadow-2xs">
          {stockMovements.length === 0 ? (
            <p className="text-xs text-[#8E8071] py-12 text-center">Nenhuma movimentação registrada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F5EFEB] dark:bg-[#28211C] border-b border-[#E8DFC8] dark:border-[#3A302A] text-[#7E7062] dark:text-[#B5A796] font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Data / Hora</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Produto</th>
                    <th className="p-3 text-center">Qtd</th>
                    <th className="p-3 text-center">Saldo Anterior</th>
                    <th className="p-3 text-center">Saldo Novo</th>
                    <th className="p-3">Motivo</th>
                    <th className="p-3">Responsável</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A]">
                  {stockMovements.map((m) => {
                    const isPositive = m.quantity > 0;
                    return (
                      <tr key={m.id} className="hover:bg-[#F5EFEB]/60 dark:hover:bg-[#251E19]/60 transition-colors">
                        <td className="p-3 font-mono text-[#8E8071] dark:text-[#AFA292] whitespace-nowrap">
                          {formatDateTime(m.date)}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase font-mono ${
                              isPositive
                                ? 'badge-gold'
                                : 'badge-silver !text-rose-600 dark:!text-rose-400'
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-[#2C241E] dark:text-[#F3EDE6]">
                          {m.productName}
                          <span className="text-[10px] text-[#8E8071] dark:text-[#AFA292] block font-mono">SKU: {m.sku}</span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          <span className={isPositive ? 'text-[#9D7320] dark:text-[#E6BE65]' : 'text-rose-600'}>
                            {isPositive ? `+${m.quantity}` : m.quantity}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-[#8E8071] dark:text-[#AFA292]">{m.previousStock}</td>
                        <td className="p-3 text-center font-mono font-bold text-[#2C241E] dark:text-[#F3EDE6]">
                          {m.newStock}
                        </td>
                        <td className="p-3 text-[#635649] dark:text-[#CBD5E1] max-w-[220px] truncate">
                          {m.reason}
                        </td>
                        <td className="p-3 text-[#8E8071] dark:text-[#AFA292]">{m.userName}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Produtos que precisam ser comprados */}
      {activeTab === 'comprar' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#C99F3B]/40 text-xs text-[#2C241E] dark:text-[#F3EDE6] shadow-2xs">
            <strong className="text-[#9D7320] dark:text-[#E6BE65]">Relatório de Reposição Urgente:</strong> Itens cujo estoque atual atingiu ou ficou abaixo do limite mínimo cadastrado.
          </div>

          <div className="bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] rounded-2xl overflow-hidden shadow-2xs">
            {productsToBuy.length === 0 ? (
              <p className="text-xs text-[#8E8071] py-12 text-center">Parabéns! Todos os produtos estão com estoque acima do mínimo.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F5EFEB] dark:bg-[#28211C] border-b border-[#E8DFC8] dark:border-[#3A302A] text-[#7E7062] dark:text-[#B5A796] font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Produto</th>
                      <th className="p-3">Fornecedor</th>
                      <th className="p-3 text-center">Estoque Atual</th>
                      <th className="p-3 text-center">Mínimo Definido</th>
                      <th className="p-3 text-center">Sugestão Compra</th>
                      <th className="p-3 text-right">Custo Est. Compra</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A]">
                    {productsToBuy.map((p) => {
                      const suggestQty = Math.max(1, (p.maxStock || p.minStock * 3) - p.stock);
                      const estimatedCost = suggestQty * p.cost;
                      return (
                        <tr key={p.id} className="hover:bg-[#F5EFEB]/60 dark:hover:bg-[#251E19]/60 transition-colors">
                          <td className="p-3 font-semibold text-[#2C241E] dark:text-[#F3EDE6]">
                            {p.name}
                            <span className="text-[10px] text-[#8E8071] dark:text-[#AFA292] block font-mono">SKU: {p.sku}</span>
                          </td>
                          <td className="p-3 text-[#635649] dark:text-[#CBD5E1]">
                            {p.supplierName || 'Não vinculado'}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-rose-600">
                            {p.stock} {p.unit}
                          </td>
                          <td className="p-3 text-center font-mono text-[#8E8071] dark:text-[#AFA292]">
                            {p.minStock} {p.unit}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-[#9D7320] dark:text-[#E6BE65]">
                            +{suggestQty} {p.unit}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-[#2C241E] dark:text-[#F3EDE6]">
                            {formatBRL(estimatedCost)}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOrderSupplierWhatsApp(p, suggestQty)}
                                className="btn-emerald !py-1 !px-2.5 !text-xs cursor-pointer shadow-xs"
                                title="Enviar pedido de compra no WhatsApp do fornecedor"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Pedir no Zap</span>
                              </button>
                              <button
                                onClick={() => onOpenMovementModal(p)}
                                className="btn-gold !py-1 !px-3 !text-xs cursor-pointer shadow-xs"
                              >
                                + Entrada
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Produtos Parados */}
      {activeTab === 'parados' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] text-xs shadow-2xs">
            <div>
              <p className="font-semibold text-[#2C241E] dark:text-[#F3EDE6]">
                Identificação de Estoque Encalhado / Produtos Parados
              </p>
              <p className="text-[#7E7062] dark:text-[#B5A796] mt-0.5">
                Produtos com saldo em estoque que não tiveram nenhuma venda no período selecionado.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#8E8071] dark:text-[#AFA292]">Filtrar sem vendas há:</span>
              {[30, 60, 90, 120].map((days) => (
                <button
                  key={days}
                  onClick={() => setIdleDaysThreshold(days)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    idleDaysThreshold === days
                      ? 'btn-gold !py-1 !px-2.5 !text-xs'
                      : 'btn-silver !py-1 !px-2.5 !text-xs'
                  }`}
                >
                  {days} dias
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] rounded-2xl overflow-hidden shadow-2xs">
            {idleProducts.length === 0 ? (
              <p className="text-xs text-[#8E8071] py-12 text-center">Nenhum produto parado há mais de {idleDaysThreshold} dias!</p>
            ) : (
              <div className="divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A]">
                {idleProducts.map((p) => (
                  <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#2C241E] dark:text-[#F3EDE6]">
                          {p.name}
                        </span>
                        <span className="badge-silver !text-rose-600 dark:!text-rose-400">
                          Parado &gt; {idleDaysThreshold} dias
                        </span>
                      </div>
                      <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
                        Estoque parado: <strong>{p.stock} {p.unit}</strong> · Capital parado:{' '}
                        <strong className="text-rose-600 font-mono">{formatBRL(p.stock * p.cost)}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleQuickClearance(p)}
                        className="btn-gold !py-1.5 !px-3 !text-xs cursor-pointer shadow-xs"
                        title="Ativar preço promocional com 25% de desconto para girar a peça"
                      >
                        <Flame className="w-3.5 h-3.5 text-rose-600" />
                        <span>Queima (-25%)</span>
                      </button>
                      <button
                        onClick={() => onOpenMovementModal(p)}
                        className="btn-silver !py-1.5 !px-3 !text-xs cursor-pointer shadow-2xs"
                      >
                        Ajustar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
