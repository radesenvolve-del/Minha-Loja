import React, { useState } from 'react';
import { Tag, Printer, Check, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { formatBRL } from '../../utils/formatters';

interface LabelPrintItem {
  product: Product;
  quantity: number;
}

export const BatchLabelsPrintView: React.FC = () => {
  const { products, settings } = useApp();

  const [selectedItems, setSelectedItems] = useState<LabelPrintItem[]>([]);
  const [labelTemplate, setLabelTemplate] = useState<'termica' | 'a4_grade'>('termica');
  const [includeBarcode, setIncludeBarcode] = useState(true);
  const [includeSku, setIncludeSku] = useState(true);
  const [includeLogo, setIncludeLogo] = useState(true);

  const handleAddProduct = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.product.id === prod.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === prod.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product: prod, quantity: 1 }];
    });
  };

  const handleUpdateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setSelectedItems((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setSelectedItems((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Flatten items for printing repetitions
  const flattenedLabels = selectedItems.flatMap((item) =>
    Array(item.quantity).fill(item.product)
  );

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
            <span>Impressão de Etiquetas de Produtos</span>
          </h2>
          <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
            Gere etiquetas para impressoras térmicas (58mm/80mm) ou folhas adesivas A4 prontas para colar nos produtos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            disabled={flattenedLabels.length === 0}
            className="btn-gold !py-2.5 !px-5 !text-xs sm:!text-sm cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Printer className="w-4 h-4" strokeWidth={1.75} />
            <span>Imprimir Etiquetas ({flattenedLabels.length})</span>
          </button>
        </div>
      </div>

      {/* Configuration & Selection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Product Selector */}
        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#7E7062] dark:text-[#B5A796]">
            1. Selecionar Produtos
          </h3>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {products.map((p) => {
              const inList = selectedItems.find((i) => i.product.id === p.id);
              return (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl border border-[#E8DFC8]/70 dark:border-[#3A302A] bg-[#F5EFEB]/40 dark:bg-[#201B17] flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <p className="font-semibold text-[#2C241E] dark:text-[#F3EDE6] truncate">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-[#7E7062] dark:text-[#B5A796] font-mono">
                      {formatBRL(p.price)} · SKU: {p.sku}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddProduct(p.id)}
                    className="btn-silver !py-1 !px-2.5 !text-[11px] cursor-pointer"
                  >
                    + Incluir
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Selected Quantities */}
        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#7E7062] dark:text-[#B5A796]">
            2. Quantidades por Produto
          </h3>

          {selectedItems.length === 0 ? (
            <p className="text-xs text-[#8E8071] py-8 text-center">
              Nenhum produto selecionado para imprimir.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {selectedItems.map((item) => (
                <div
                  key={item.product.id}
                  className="p-2.5 rounded-xl bg-[#F5EFEB] dark:bg-[#201B17] border border-[#E8DFC8] dark:border-[#3A302A] flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <p className="font-semibold truncate text-[#2C241E] dark:text-[#F3EDE6]">{item.product.name}</p>
                    <p className="text-[10px] text-[#7E7062] dark:text-[#B5A796] font-mono">
                      {formatBRL(item.product.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateQty(item.product.id, Number(e.target.value))
                      }
                      className="w-14 px-2 py-1 rounded-lg border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] text-center font-mono font-bold"
                    />
                    <button
                      onClick={() => handleUpdateQty(item.product.id, 0)}
                      className="p-1 text-[#8E8071] hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Layout Options */}
        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs space-y-3 text-xs">
          <h3 className="font-bold uppercase tracking-wider text-[#7E7062] dark:text-[#B5A796]">
            3. Modelo & Opções
          </h3>

          <div className="space-y-2">
            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Formato da Folha</label>
              <select
                value={labelTemplate}
                onChange={(e) => setLabelTemplate(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              >
                <option value="termica">Etiqueta Térmica Individual</option>
                <option value="a4_grade">Folha A4 Adesiva (Grade)</option>
              </select>
            </div>

            <div className="space-y-1.5 pt-2 text-[#2C241E] dark:text-[#F3EDE6]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBarcode}
                  onChange={(e) => setIncludeBarcode(e.target.checked)}
                  className="rounded text-[#C99F3B]"
                />
                <span>Exibir Código de Barras</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSku}
                  onChange={(e) => setIncludeSku(e.target.checked)}
                  className="rounded text-[#C99F3B]"
                />
                <span>Exibir SKU</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLogo}
                  onChange={(e) => setIncludeLogo(e.target.checked)}
                  className="rounded text-[#C99F3B]"
                />
                <span>Exibir Nome da Loja</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Sheet Preview */}
      <div className="p-6 bg-[#F5EFEB] dark:bg-[#171412] rounded-2xl border border-[#E8DFC8] dark:border-[#3A302A]">
        <h3 className="text-xs font-bold text-[#7E7062] dark:text-[#B5A796] uppercase tracking-wider mb-4">
          Prévia de Impressão ({flattenedLabels.length} etiquetas geradas)
        </h3>

        <div
          id="print-sheet"
          className={`grid gap-3 ${
            labelTemplate === 'termica'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
          }`}
        >
          {flattenedLabels.map((prod, index) => (
            <div
              key={index}
              className="p-3 bg-[#FFFDF9] text-[#2C241E] border border-[#E8DFC8] rounded-xl shadow-2xs text-center flex flex-col justify-between"
            >
              {includeLogo && (
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#7E7062]">
                  {settings.storeName}
                </span>
              )}

              <p className="text-xs font-bold line-clamp-2 leading-tight my-1 text-[#2C241E]">
                {prod.name}
              </p>

              <span className="text-base font-extrabold font-mono text-[#9D7320] my-1">
                {formatBRL(prod.price)}
              </span>

              {includeBarcode && (
                <div className="py-1">
                  <div className="h-6 w-full flex items-center justify-center font-mono text-[9px] border-y border-dashed border-[#E8DFC8] text-[#7E7062]">
                    |||||| | ||||| |||| |||
                  </div>
                  <span className="text-[9px] font-mono text-[#7E7062]">
                    {prod.barcode || prod.sku}
                  </span>
                </div>
              )}

              {includeSku && (
                <span className="text-[9px] font-mono text-[#8E8071]">
                  SKU: {prod.sku}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
