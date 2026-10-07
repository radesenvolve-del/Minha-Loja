import React, { useState, useMemo } from 'react';
import { Search, Package, User, ShoppingBag, Truck, FileText, ArrowRight, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatBRL, formatDate } from '../../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (productId: string) => void;
  onSelectCustomer?: (customerId: string) => void;
  onSelectSale?: (saleId: string) => void;
  onSelectOrder?: (orderId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onSelectCustomer,
  onSelectSale,
  onSelectOrder,
}) => {
  const { products, customers, suppliers, sales, orders, setActiveTab } = useApp();
  const [query, setQuery] = useState('');

  const cleanQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!cleanQuery) return { products: [], customers: [], sales: [], orders: [], suppliers: [] };

    const matchingProducts = products.filter(
      (p) =>
        p.name.toLowerCase().includes(cleanQuery) ||
        p.sku.toLowerCase().includes(cleanQuery) ||
        (p.barcode && p.barcode.includes(cleanQuery)) ||
        p.category.toLowerCase().includes(cleanQuery)
    ).slice(0, 5);

    const matchingCustomers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(cleanQuery) ||
        (c.whatsapp && c.whatsapp.includes(cleanQuery)) ||
        (c.instagram && c.instagram.toLowerCase().includes(cleanQuery)) ||
        (c.cpf && c.cpf.includes(cleanQuery))
    ).slice(0, 5);

    const matchingSales = sales.filter(
      (s) =>
        s.saleNumber.includes(cleanQuery) ||
        s.customerName.toLowerCase().includes(cleanQuery) ||
        s.items.some((i) => i.name.toLowerCase().includes(cleanQuery))
    ).slice(0, 5);

    const matchingOrders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(cleanQuery) ||
        o.customerName.toLowerCase().includes(cleanQuery) ||
        (o.instagramHandle && o.instagramHandle.toLowerCase().includes(cleanQuery))
    ).slice(0, 5);

    const matchingSuppliers = suppliers.filter(
      (sup) =>
        sup.name.toLowerCase().includes(cleanQuery) ||
        (sup.whatsapp && sup.whatsapp.includes(cleanQuery))
    ).slice(0, 5);

    return {
      products: matchingProducts,
      customers: matchingCustomers,
      sales: matchingSales,
      orders: matchingOrders,
      suppliers: matchingSuppliers,
    };
  }, [cleanQuery, products, customers, sales, orders, suppliers]);

  if (!isOpen) return null;

  const totalResults =
    results.products.length +
    results.customers.length +
    results.sales.length +
    results.orders.length +
    results.suppliers.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 overflow-y-auto bg-black/60 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xl overflow-hidden z-10">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/60 dark:bg-[#28211C]">
          <Search className="w-5 h-5 text-[#8E8071]" strokeWidth={1.75} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar produto, SKU, código de barras, cliente, pedido, venda..."
            className="flex-1 bg-transparent text-sm sm:text-base text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#8E8071] focus:outline-hidden"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-[#8E8071] hover:text-[#2C241E] dark:hover:text-[#F3EDE6] cursor-pointer"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-[#8E8071] bg-[#F5EFEB] dark:bg-[#1A1512] rounded border border-[#E8DFC8] dark:border-[#3A302A]">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3 divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A]">
          {!cleanQuery ? (
            <div className="py-8 text-center text-xs text-[#8E8071]">
              Digite ao menos uma letra ou número para pesquisar em toda a loja.
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-xs text-[#8E8071]">
              Nenhum registro encontrado para "{query}".
            </div>
          ) : (
            <>
              {results.products.length > 0 && (
                <div className="py-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8071] px-2">
                    Produtos ({results.products.length})
                  </span>
                  <div className="mt-1 space-y-1">
                    {results.products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveTab('products');
                          onSelectProduct?.(p.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] text-left transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#F5EFEB] dark:bg-[#28211C] border border-[#E8DFC8] dark:border-[#3A302A] text-[#9D7320] dark:text-[#E6BE65] flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4" strokeWidth={1.75} />
                          </div>
                          <div className="truncate">
                            <p className="text-xs sm:text-sm font-semibold text-[#2C241E] dark:text-[#F3EDE6] truncate">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-[#8E8071] dark:text-[#AFA292] font-mono">
                              SKU: {p.sku} · Estoque: {p.stock} {p.unit}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#9D7320] dark:text-[#E6BE65] shrink-0 font-mono">
                          {formatBRL(p.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.orders.length > 0 && (
                <div className="py-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8071] px-2">
                    Pedidos ({results.orders.length})
                  </span>
                  <div className="mt-1 space-y-1">
                    {results.orders.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => {
                          setActiveTab('orders');
                          onSelectOrder?.(o.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#D8B059]/15 border border-[#C99F3B]/40 text-[#9D7320] dark:text-[#E6BE65] flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-4 h-4" strokeWidth={1.75} />
                          </div>
                          <div className="truncate">
                            <p className="text-xs sm:text-sm font-semibold text-[#2C241E] dark:text-[#F3EDE6] truncate">
                              Pedido #{o.orderNumber} · {o.customerName}
                            </p>
                            <p className="text-[11px] text-[#8E8071] dark:text-[#AFA292]">
                              Origem: {o.origin.toUpperCase()} · Status: {o.status}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#9D7320] dark:text-[#E6BE65] shrink-0 font-mono">
                          {formatBRL(o.total)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.sales.length > 0 && (
                <div className="py-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8071] px-2">
                    Vendas ({results.sales.length})
                  </span>
                  <div className="mt-1 space-y-1">
                    {results.sales.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setActiveTab('sales');
                          onSelectSale?.(s.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#F5EFEB] dark:bg-[#28211C] border border-[#E8DFC8] dark:border-[#3A302A] text-[#9D7320] dark:text-[#E6BE65] flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" strokeWidth={1.75} />
                          </div>
                          <div className="truncate">
                            <p className="text-xs sm:text-sm font-semibold text-[#2C241E] dark:text-[#F3EDE6] truncate">
                              Venda #{s.saleNumber} · {s.customerName}
                            </p>
                            <p className="text-[11px] text-[#8E8071] dark:text-[#AFA292]">
                              Data: {formatDate(s.date)} · {s.items.length} itens
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#9D7320] dark:text-[#E6BE65] shrink-0 font-mono">
                          {formatBRL(s.total)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.customers.length > 0 && (
                <div className="py-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8071] px-2">
                    Clientes ({results.customers.length})
                  </span>
                  <div className="mt-1 space-y-1">
                    {results.customers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveTab('customers');
                          onSelectCustomer?.(c.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#F5EFEB] dark:hover:bg-[#28211C] text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#F5EFEB] dark:bg-[#28211C] border border-[#E8DFC8] dark:border-[#3A302A] text-[#556070] dark:text-[#CBD5E1] flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" strokeWidth={1.75} />
                          </div>
                          <div className="truncate">
                            <p className="text-xs sm:text-sm font-semibold text-[#2C241E] dark:text-[#F3EDE6] truncate">
                              {c.name}
                            </p>
                            <p className="text-[11px] text-[#8E8071] dark:text-[#AFA292]">
                              {c.whatsapp || c.instagram || c.email || 'Sem contato'}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#8E8071] shrink-0" strokeWidth={1.75} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
