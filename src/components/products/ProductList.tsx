import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Barcode,
  Copy,
  Edit2,
  Trash2,
  Star,
  Download,
  Upload,
  ArrowUpDown,
  Tag,
  Boxes,
  Layers,
  Instagram,
  Sparkles,
  LayoutGrid,
  List,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { formatBRL } from '../../utils/formatters';
import { getEffectiveProductPrice } from '../../utils/pricing';
import { ConfirmModal } from '../common/ConfirmModal';
import { SwipeableRow, SwipeAction } from '../common/SwipeableRow';
import { JewelryCategoryGraphic } from '../common/JewelryCategoryGraphic';

interface ProductListProps {
  onOpenCreate: () => void;
  onOpenEdit: (product: Product) => void;
  onOpenDuplicate: (product: Product) => void;
  onOpenBarcode: (product: Product) => void;
  onOpenImportCSV: () => void;
  onOpenQuickStock: (product: Product) => void;
  onOpenCardGenerator?: (product?: Product | null) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  onOpenCreate,
  onOpenEdit,
  onOpenDuplicate,
  onOpenBarcode,
  onOpenImportCSV,
  onOpenQuickStock,
  onOpenCardGenerator,
}) => {
  const { products, deleteProduct, saveProduct, showToast, selectedCategory, setSelectedCategory } = useApp();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'ativo' | 'esgotado' | 'promocao' | 'favorito'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'recent'>('name');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [viewLayout, setViewLayout] = useState<'grid' | 'stacked'>('grid');

  const getProductSwipeActions = (product: Product) => {
    const rightActions: SwipeAction[] = [
      {
        id: 'edit',
        label: 'Editar',
        icon: Edit2,
        variant: 'primary',
        onClick: () => onOpenEdit(product),
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        variant: 'danger',
        onClick: () => setProductToDelete(product),
      },
    ];

    const leftActions: SwipeAction[] = [];
    if (onOpenCardGenerator) {
      leftActions.push({
        id: 'card',
        label: 'Card Zap',
        icon: Instagram,
        className: 'bg-amber-600 hover:bg-amber-700 text-white',
        onClick: () => onOpenCardGenerator(product),
      });
    }
    leftActions.push({
      id: 'barcode',
      label: 'Código',
      icon: Barcode,
      variant: 'neutral',
      onClick: () => onOpenBarcode(product),
    });

    return { rightActions, leftActions };
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  // Counts per category for the circular badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()) ||
          (p.barcode && p.barcode.includes(search));

        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

        let matchesStatus = true;
        if (selectedStatus === 'ativo') matchesStatus = p.status === 'ativo';
        else if (selectedStatus === 'esgotado') matchesStatus = p.stock <= 0;
        else if (selectedStatus === 'favorito') matchesStatus = !!p.isFavorite;
        else if (selectedStatus === 'promocao') {
          const promo = getEffectiveProductPrice(p);
          matchesStatus = promo.isPromo;
        }

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price') return a.price - b.price;
        if (sortBy === 'stock') return a.stock - b.stock;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [products, search, selectedCategory, selectedStatus, sortBy]);

  const handleToggleFavorite = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    await saveProduct({ ...product, isFavorite: !product.isFavorite });
  };

  const handleExportCSV = () => {
    if (products.length === 0) {
      showToast('Nenhum produto cadastrado para exportar.', 'info');
      return;
    }
    const headers = 'ID;Nome;SKU;Categoria;Custo;Preco;PrecoPromocional;Estoque;EstoqueMinimo;CodigoBarras\n';
    const rows = products
      .map(
        (p) =>
          `"${p.id}";"${p.name}";"${p.sku}";"${p.category}";${p.cost};${p.price};${p.promotionalPrice || ''};${p.stock};${p.minStock};"${p.barcode || ''}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `produtos-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Produtos exportados em CSV com sucesso!', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Top Bar Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Produtos</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {filteredProducts.length}
            </span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode switcher: Grid vs Stacked List */}
          <div className="flex p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750">
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewLayout === 'grid'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
              title="Modo Grade"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('stacked')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewLayout === 'stacked'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
              title="Modo Lista Empilhada (com Swipe)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {onOpenCardGenerator && (
            <button
              onClick={() => onOpenCardGenerator(null)}
              className="btn-silver !py-2 !px-3 !text-xs cursor-pointer shadow-2xs"
              title="Gerar Card Automático para Redes Sociais"
            >
              <Instagram className="w-3.5 h-3.5 text-[#C99F3B]" />
              <span className="text-[#8C6B1B] dark:text-[#E6BE65] font-bold">Card Insta/Zap</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="btn-silver !py-2 !px-3 !text-xs cursor-pointer shadow-2xs"
            title="Exportar Produtos em CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#556070] dark:text-[#CBD5E1]" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={onOpenImportCSV}
            className="btn-silver !py-2 !px-3 !text-xs cursor-pointer shadow-2xs"
            title="Importar Produtos via Planilha CSV"
          >
            <Upload className="w-3.5 h-3.5 text-[#556070] dark:text-[#CBD5E1]" />
            <span className="hidden sm:inline">Importar CSV</span>
          </button>

          <button
            onClick={onOpenCreate}
            className="btn-gold !text-xs sm:!text-sm !py-2 !px-4 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#8E8071]" strokeWidth={1.75} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, SKU ou código..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/50 dark:bg-[#28211C] text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#8E8071] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
          />
        </div>

        {/* Category */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/50 dark:bg-[#28211C] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/50 dark:bg-[#28211C] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
          >
            <option value="all">Todos os Status</option>
            <option value="ativo">Ativos</option>
            <option value="esgotado">Esgotados</option>
            <option value="promocao">Em Promoção</option>
            <option value="favorito">Favoritos</option>
          </select>
        </div>
      </div>

      {/* Products Grid / Cards / Adaptive Stacked List */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1F1A17]/50 p-6">
          <Package className="w-12 h-12 text-[#C99F3B] mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="text-base font-bold text-[#2C241E] dark:text-[#F3EDE6]">
            Nenhum produto encontrado
          </h3>
          <p className="text-xs text-[#8E8071] dark:text-[#AFA292] mt-1 max-w-sm mx-auto">
            {search || selectedCategory !== 'all' || selectedStatus !== 'all'
              ? 'Tente ajustar os filtros ou termo de busca para encontrar o item desejado.'
              : 'Você ainda não cadastrou produtos. Adicione seu primeiro item agora mesmo!'}
          </p>
          <button
            onClick={onOpenCreate}
            className="mt-4 btn-gold"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            <span>+ Cadastrar Produto</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Stacked List View (Mobile Default or Stacked Mode) */}
          <div className={`${viewLayout === 'stacked' ? 'flex flex-col space-y-2.5' : 'sm:hidden flex flex-col space-y-2.5'}`}>
            <div className="flex items-center justify-between px-1 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1 font-medium">
                <span>👈 Deslize para Ações Rápidas (Editar/Excluir)</span>
              </span>
              <span className="font-mono text-[10px]">
                {filteredProducts.length} itens
              </span>
            </div>

            {filteredProducts.map((product) => {
              const { price: effectivePrice, isPromo } = getEffectiveProductPrice(product);
              const isLowStock = product.stock > 0 && product.stock <= product.minStock;
              const isOutStock = product.stock <= 0;
              const { rightActions, leftActions } = getProductSwipeActions(product);

              return (
                <SwipeableRow
                  key={`stacked-${product.id}`}
                  rightActions={rightActions}
                  leftActions={leftActions}
                  className="border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#201B17] shadow-2xs hover:border-[#C99F3B]/50 transition-all rounded-2xl"
                >
                  <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                    {/* Category Graphic or Product Photo */}
                    <div
                      onClick={() => onOpenEdit(product)}
                      className="shrink-0 flex items-center justify-center cursor-pointer group"
                      title={product.photo ? 'Clique para editar produto e foto' : 'Sem foto - Clique para adicionar'}
                    >
                      {product.photo ? (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#C99F3B]/40 bg-[#F5EFEB] dark:bg-[#1A1512] shadow-2xs">
                          <img
                            src={product.photo}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="relative">
                          <JewelryCategoryGraphic
                            category={product.category}
                            size={46}
                            isSelected={false}
                          />
                          <span
                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#F5EFEB] dark:bg-[#28211C] text-[#8E8071] flex items-center justify-center text-[8px] font-bold border border-[#E8DFC8] dark:border-[#3A302A]"
                            title="Sem foto"
                          >
                            <Camera className="w-2.5 h-2.5" strokeWidth={1.75} />
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#8E8071] dark:text-[#AFA292] uppercase font-semibold">
                        <span className="truncate max-w-[130px]">{product.category}</span>
                        {product.isFavorite && (
                          <Star className="w-3 h-3 fill-[#C99F3B] text-[#C99F3B] shrink-0" strokeWidth={1.75} />
                        )}
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-[#2C241E] dark:text-[#F3EDE6] truncate mt-0.5">
                        {product.name}
                      </h3>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-sm font-extrabold font-mono text-[#9D7320] dark:text-[#E6BE65]">
                          {formatBRL(effectivePrice)}
                        </span>
                        {isPromo && (
                          <span className="text-[10px] line-through text-[#8E8071] dark:text-[#AFA292] font-mono">
                            {formatBRL(product.price)}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-[#8E8071] dark:text-[#AFA292] hidden xs:inline">
                          SKU: {product.sku}
                        </span>
                      </div>
                    </div>

                    {/* Stock Stepper & Quick Action */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (product.stock > 0) saveProduct({ ...product, stock: product.stock - 1 });
                          }}
                          className="w-7 h-7 rounded-lg bg-[#F5EFEB] hover:bg-[#EAE2D5] dark:bg-[#28211C] dark:hover:bg-[#332A22] border border-[#E8DFC8] dark:border-[#3A302A] text-[#2C241E] dark:text-[#F3EDE6] font-bold flex items-center justify-center text-xs active:scale-90 transition-all cursor-pointer"
                          title="Diminuir estoque (-1)"
                        >
                          -
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenQuickStock(product)}
                          className={`text-xs font-bold font-mono px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                            isOutStock
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                              : isLowStock
                              ? 'bg-[#D8B059]/10 text-[#9D7320] dark:text-[#E6BE65] border-[#C99F3B]/40'
                              : 'bg-[#F5EFEB] text-[#2C241E] border-[#E8DFC8] dark:bg-[#28211C] dark:text-[#F3EDE6] dark:border-[#3A302A]'
                          }`}
                          title="Ajuste manual de estoque"
                        >
                          {product.stock} {product.unit}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            saveProduct({ ...product, stock: product.stock + 1 });
                          }}
                          className="w-7 h-7 rounded-lg bg-[#F5EFEB] hover:bg-[#EAE2D5] dark:bg-[#28211C] dark:hover:bg-[#332A22] border border-[#E8DFC8] dark:border-[#3A302A] text-[#2C241E] dark:text-[#F3EDE6] font-bold flex items-center justify-center text-xs active:scale-90 transition-all cursor-pointer"
                          title="Aumentar estoque (+1)"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px]">
                        <button
                          onClick={() => onOpenEdit(product)}
                          className="text-[#9D7320] dark:text-[#E6BE65] font-semibold hover:underline cursor-pointer"
                        >
                          Editar
                        </button>
                        <span className="text-[#8E8071] dark:text-[#AFA292]">·</span>
                        <button
                          onClick={() => setProductToDelete(product)}
                          className="text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </SwipeableRow>
              );
            })}
          </div>

          {/* Desktop/Tablet Grid View */}
          {viewLayout === 'grid' && (
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredProducts.map((product) => {
                const { price: effectivePrice, isPromo } = getEffectiveProductPrice(product);
                const isLowStock = product.stock > 0 && product.stock <= product.minStock;
                const isOutStock = product.stock <= 0;
                const { rightActions, leftActions } = getProductSwipeActions(product);

                return (
                  <SwipeableRow
                    key={`grid-${product.id}`}
                    rightActions={rightActions}
                    leftActions={leftActions}
                    className="border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#201B17] hover:border-[#C99F3B]/50 shadow-2xs hover:shadow-xs transition-all rounded-2xl"
                  >
                    <div className="p-4 flex flex-col justify-between h-full space-y-3">
                      <div>
                        {/* Top card bar: Category and Favorite Star */}
                        <div className="flex items-center justify-between text-xs text-[#8E8071] mb-2">
                          <span className="font-semibold uppercase tracking-wider text-[10px] text-[#8E8071] dark:text-[#AFA292] truncate max-w-[150px]">
                            {product.category}
                          </span>
                          <button
                            onClick={(e) => handleToggleFavorite(product, e)}
                            className="p-1 rounded-md text-[#8E8071] hover:text-[#C99F3B] transition-colors cursor-pointer"
                            title={product.isFavorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                product.isFavorite ? 'fill-[#C99F3B] text-[#C99F3B]' : ''
                              }`}
                              strokeWidth={1.75}
                            />
                          </button>
                        </div>

                        {/* Product Photo or Placeholder */}
                        {product.photo ? (
                          <div
                            onClick={() => onOpenEdit(product)}
                            className="relative w-full h-36 rounded-2xl overflow-hidden bg-[#F5EFEB] dark:bg-[#1A1512] border border-[#E8DFC8] dark:border-[#3A302A] mb-2.5 group cursor-pointer shadow-2xs"
                            title="Clique para editar produto e foto"
                          >
                            <img
                              src={product.photo}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-2xs">
                              <Camera className="w-3.5 h-3.5" strokeWidth={1.75} />
                              <span>Trocar / Editar Foto</span>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => onOpenEdit(product)}
                            className="relative w-full h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-[#D8B059]/5 to-[#F5EFEB] dark:from-[#201B17] dark:to-[#1A1512] border border-dashed border-[#E8DFC8] dark:border-[#3A302A] hover:border-[#C99F3B]/60 flex items-center justify-center gap-2 mb-2.5 cursor-pointer group transition-colors"
                            title="Clique para adicionar foto do produto"
                          >
                            <Camera className="w-4 h-4 text-[#8E8071] group-hover:text-[#C99F3B] transition-colors" strokeWidth={1.75} />
                            <span className="text-[11px] font-bold text-[#8E8071] group-hover:text-[#9D7320] dark:group-hover:text-[#E6BE65] transition-colors">
                              + Adicionar Foto
                            </span>
                          </div>
                        )}

                        {/* Name and SKU */}
                        <h3 className="text-sm font-bold text-[#2C241E] dark:text-[#F3EDE6] line-clamp-2 leading-snug">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8E8071] dark:text-[#AFA292] font-mono">
                          <span>SKU: {product.sku}</span>
                          {product.isKit && (
                            <span className="text-[#9D7320] dark:text-[#E6BE65] font-sans font-bold text-[10px]">
                              · KIT
                            </span>
                          )}
                          {product.hasVariants && (
                            <span className="text-[#556070] dark:text-[#CBD5E1] font-sans font-bold text-[10px]">
                              · VARIAÇÕES
                            </span>
                          )}
                        </div>

                        {/* Price info in Noble Gold */}
                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-lg font-extrabold font-mono text-[#9D7320] dark:text-[#E6BE65]">
                            {formatBRL(effectivePrice)}
                          </span>
                          {isPromo && (
                            <span className="text-xs line-through text-[#8E8071] dark:text-[#AFA292] font-mono">
                              {formatBRL(product.price)}
                            </span>
                          )}
                        </div>

                        {/* Cost & Estimated Margin */}
                        <div className="mt-1 flex items-center justify-between text-[11px] text-[#8E8071] dark:text-[#AFA292]">
                          <span>Custo: {formatBRL(product.cost)}</span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
                            Lucro: {formatBRL(Math.max(0, effectivePrice - product.cost))}
                          </span>
                        </div>
                      </div>

                      {/* Stock Status & Actions footer */}
                      <div className="mt-4 pt-3 border-t border-[#E8DFC8]/60 dark:border-[#3A302A] flex items-center justify-between gap-2">
                        {/* Stock counter with quick steppers */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (product.stock > 0) saveProduct({ ...product, stock: product.stock - 1 });
                            }}
                            className="w-7 h-7 rounded-lg bg-[#F5EFEB] hover:bg-[#EAE2D5] dark:bg-[#28211C] dark:hover:bg-[#332A22] border border-[#E8DFC8] dark:border-[#3A302A] text-[#2C241E] dark:text-[#F3EDE6] font-bold flex items-center justify-center text-xs active:scale-90 transition-all cursor-pointer"
                            title="Diminuir estoque (-1)"
                          >
                            -
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenQuickStock(product)}
                            className={`text-xs font-bold font-mono px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                              isOutStock
                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                                : isLowStock
                                ? 'bg-[#D8B059]/10 text-[#9D7320] dark:text-[#E6BE65] border-[#C99F3B]/40'
                                : 'bg-[#F5EFEB] text-[#2C241E] border-[#E8DFC8] dark:bg-[#28211C] dark:text-[#F3EDE6] dark:border-[#3A302A]'
                            }`}
                            title="Ajuste manual de estoque"
                          >
                            {product.stock} {product.unit}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              saveProduct({ ...product, stock: product.stock + 1 });
                            }}
                            className="w-7 h-7 rounded-lg bg-[#F5EFEB] hover:bg-[#EAE2D5] dark:bg-[#28211C] dark:hover:bg-[#332A22] border border-[#E8DFC8] dark:border-[#3A302A] text-[#2C241E] dark:text-[#F3EDE6] font-bold flex items-center justify-center text-xs active:scale-90 transition-all cursor-pointer"
                            title="Aumentar estoque (+1)"
                          >
                            +
                          </button>

                          {isOutStock ? (
                            <span className="text-[9px] text-rose-500 font-bold uppercase ml-1">Esgotado</span>
                          ) : isLowStock ? (
                            <span className="text-[9px] text-[#9D7320] dark:text-[#E6BE65] font-bold uppercase ml-1">Baixo</span>
                          ) : null}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {onOpenCardGenerator && (
                            <button
                              onClick={() => onOpenCardGenerator(product)}
                              className="p-1.5 sm:p-2 rounded-lg text-[#9D7320] dark:text-[#E6BE65] hover:bg-[#D8B059]/15 transition-colors active:scale-95 cursor-pointer"
                              title="Gerar Card Instagram / WhatsApp"
                            >
                              <Instagram className="w-4 h-4" strokeWidth={1.75} />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenBarcode(product)}
                            className="p-1.5 sm:p-2 rounded-lg text-[#8E8071] hover:text-[#2C241E] dark:hover:text-[#F3EDE6] hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] transition-colors active:scale-95 cursor-pointer"
                            title="Código de Barras e QR Code"
                          >
                            <Barcode className="w-4 h-4" strokeWidth={1.75} />
                          </button>

                          <button
                            onClick={() => onOpenDuplicate(product)}
                            className="p-1.5 sm:p-2 rounded-lg text-[#8E8071] hover:text-[#2C241E] dark:hover:text-[#F3EDE6] hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] transition-colors active:scale-95 cursor-pointer"
                            title="Duplicar Produto"
                          >
                            <Copy className="w-4 h-4" strokeWidth={1.75} />
                          </button>

                          <button
                            onClick={() => onOpenEdit(product)}
                            className="p-1.5 sm:p-2 rounded-lg text-[#8E8071] hover:text-[#9D7320] dark:hover:text-[#E6BE65] hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] transition-colors active:scale-95 cursor-pointer"
                            title="Editar Produto"
                          >
                            <Edit2 className="w-4 h-4" strokeWidth={1.75} />
                          </button>

                          <button
                            onClick={() => setProductToDelete(product)}
                            className="p-1.5 sm:p-2 rounded-lg text-[#8E8071] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] transition-colors active:scale-95 cursor-pointer"
                            title="Excluir Produto"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </SwipeableRow>
                );
              })}
            </div>
          )}

          {/* Accessible Mobile Bottom Action Bar (Ensures action buttons stay easily accessible without overlapping content) */}
          <div className="sm:hidden sticky bottom-18 z-30 pt-2 flex items-center justify-center pointer-events-none">
            <button
              onClick={onOpenCreate}
              className="pointer-events-auto btn-gold !py-3 !px-5 rounded-2xl shadow-lg !text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Cadastrar Produto</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      <ConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={async () => {
          if (productToDelete) {
            await deleteProduct(productToDelete.id);
            setProductToDelete(null);
          }
        }}
        title="Excluir Produto"
        description={`Tem certeza que deseja excluir "${productToDelete?.name}"? Esta ação removerá o produto do catálogo.`}
        confirmText="Sim, excluir"
        variant="danger"
      />
    </div>
  );
};
