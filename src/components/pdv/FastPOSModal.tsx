import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Camera,
  CreditCard,
  QrCode,
  DollarSign,
  User,
  AlertTriangle,
  Receipt,
  X,
  Star,
  Check,
  ChevronRight,
  Sparkles,
  ShoppingCart,
  ArrowLeft,
  Package,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CartItem, Customer, PaymentMethod, Product, Sale } from '../../types';
import { formatBRL } from '../../utils/formatters';
import { getEffectiveProductPrice } from '../../utils/pricing';
import { generatePixPayload, generateQRCode } from '../../utils/barcodes';
import { CameraScannerModal } from '../common/CameraScannerModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { ReceiptModal } from './ReceiptModal';
import { AdminApprovalModal } from '../common/AdminApprovalModal';

interface FastPOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FastPOSModal: React.FC<FastPOSModalProps> = ({ isOpen, onClose }) => {
  const {
    products,
    customers,
    settings,
    completeSale,
    saveCustomer,
    saveProduct,
    showToast,
    currentUser,
  } = useApp();

  // Mobile View Format (Catalog vs Cart)
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerNameInput, setCustomerNameInput] = useState('Consumidor Final');

  // Global Discount & Shipping
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [installments, setInstallments] = useState(1);
  const [cashAmountPaid, setCashAmountPaid] = useState<number>(0);

  // PIX Modal / State
  const [pixPayload, setPixPayload] = useState<string>('');
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState<string>('');
  const [showPixDialog, setShowPixDialog] = useState(false);

  // Confirmation for Below Minimum Price Discount
  const [showBelowMinModal, setShowBelowMinModal] = useState(false);
  const [pendingSaleFinish, setPendingSaleFinish] = useState(false);

  // Admin Authorization State for Discounts & Minimum Price
  const [isAdminApprovalOpen, setIsAdminApprovalOpen] = useState(false);
  const [adminApprovalReason, setAdminApprovalReason] = useState('');
  const [isApprovedByAdmin, setIsApprovedByAdmin] = useState(false);
  const [approvedAdminName, setApprovedAdminName] = useState<string | undefined>();

  // Completed Receipt Modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Quick Customer Create
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [products]);

  // Product Search Results
  const displayProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search));
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);

  // Favorite Products
  const favoriteProducts = useMemo(() => {
    return products.filter((p) => p.isFavorite && p.stock > 0).slice(0, 6);
  }, [products]);

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const totalMinPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.minPrice * item.quantity, 0);
  }, [cart]);

  const totalCost = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.cost * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percentage') {
      return (subtotal * Math.min(100, Math.max(0, discountValue))) / 100;
    }
    return Math.min(subtotal, Math.max(0, discountValue));
  }, [subtotal, discountType, discountValue]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + Number(shipping || 0));
  }, [subtotal, discountAmount, shipping]);

  const isBelowMinimumPrice = total < totalMinPrice && total > 0;
  const cashChange = cashAmountPaid > total ? cashAmountPaid - total : 0;

  // Add item to cart
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0 && !settings.allowNegativeStock) {
      showToast(`O produto "${product.name}" está esgotado no estoque.`, 'warning');
      return;
    }

    const { price: effectivePrice } = getEffectiveProductPrice(product);

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock && !settings.allowNegativeStock) {
          showToast(`Estoque máximo atingido para ${product.name} (${product.stock} un).`, 'warning');
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      }

      const newItem: CartItem = {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unitPrice: effectivePrice,
        originalPrice: product.price,
        cost: product.cost,
        minPrice: product.minPrice,
        quantity: 1,
        discount: 0,
        total: effectivePrice,
        isKit: product.isKit,
        kitComponents: product.kitComponents,
      };
      return [...prev, newItem];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              total: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleScanCode = (code: string) => {
    const found = products.find(
      (p) => p.barcode === code || p.sku.toUpperCase() === code.toUpperCase()
    );
    if (found) {
      handleAddToCart(found);
      showToast(`Produto adicionado: ${found.name}`, 'success');
    } else {
      showToast(`Nenhum produto cadastrado com o código: ${code}`, 'warning');
    }
  };

  // Generate PIX QR Code when PIX is selected
  useEffect(() => {
    if (paymentMethod === 'pix' && total > 0 && settings.pixKey) {
      const payload = generatePixPayload({
        key: settings.pixKey,
        merchantName: settings.storeName || 'MINHA LOJA',
        merchantCity: settings.city || 'SAO PAULO',
        amount: total,
      });
      setPixPayload(payload);
      generateQRCode(payload).then((url) => setPixQrCodeUrl(url));
    }
  }, [paymentMethod, total, settings]);

  // Complete Sale
  const handleProceedToFinish = async () => {
    if (cart.length === 0) {
      showToast('Adicione ao menos um produto para vender.', 'warning');
      return;
    }

    // Check minimum price & discount safety rules
    const currentDiscountPercent = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;
    const maxDiscountAllowed = currentUser.permissions?.maxDiscountPercent ?? settings.maxSellerDiscountPercent ?? 10;
    const isDiscountAboveLimit = currentDiscountPercent > maxDiscountAllowed;
    const isBelowMin = isBelowMinimumPrice && settings.requireAdminPinForBelowMinPrice !== false;

    const needsAdminAuth =
      currentUser.role !== 'admin' &&
      currentUser.role !== 'gerente' &&
      (isDiscountAboveLimit || isBelowMin);

    if (needsAdminAuth && !isApprovedByAdmin) {
      setAdminApprovalReason(
        isDiscountAboveLimit
          ? `Desconto de ${currentDiscountPercent.toFixed(1)}% ultrapassa o limite máximo permitido (${maxDiscountAllowed}%).`
          : `Valor total abaixo do preço mínimo / margem de segurança da loja.`
      );
      setIsAdminApprovalOpen(true);
      return;
    }

    if (isBelowMinimumPrice && !pendingSaleFinish && !isApprovedByAdmin) {
      setShowBelowMinModal(true);
      return;
    }

    try {
      const sale = await completeSale({
        date: new Date().toISOString(),
        customerId: selectedCustomerId || undefined,
        customerName: customerNameInput || 'Consumidor Final',
        items: cart,
        subtotal,
        discountType,
        discountValue,
        discountAmount,
        adminApprovedBy: approvedAdminName,
        shipping,
        fees: 0,
        total,
        costTotal: totalCost,
        estimatedProfit: Math.max(0, total - totalCost),
        paymentMethod,
        installments: paymentMethod === 'credito_parcelado' ? installments : undefined,
        amountPaid: paymentMethod === 'dinheiro' && cashAmountPaid > 0 ? cashAmountPaid : total,
        change: cashChange,
        status: 'completed',
      });

      // Clear cart
      setCart([]);
      setDiscountValue(0);
      setShipping(0);
      setCashAmountPaid(0);
      setPendingSaleFinish(false);
      setIsApprovedByAdmin(false);
      setApprovedAdminName(undefined);
      setCompletedSale(sale);
    } catch (err: any) {
      showToast(err.message || 'Erro ao finalizar venda.', 'error');
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      name: newCustName.trim(),
      whatsapp: newCustPhone.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    await saveCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setCustomerNameInput(newCust.name);
    setShowNewCustomerForm(false);
    setNewCustName('');
    setNewCustPhone('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-6xl h-full sm:h-[94vh] bg-[#FBF9F5] dark:bg-[#171412] border-0 sm:border border-[#E8DFC8] dark:border-[#3A302A] rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10">
        {/* Top POS Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-[max(0.85rem,env(safe-area-inset-top,0px))] pb-3 sm:py-3.5 border-b border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB] dark:bg-[#1F1A17] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D8B059] to-[#FDF4DC] p-[1.5px] shadow-sm flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-[6.5px] bg-[#171412] flex items-center justify-center text-[#D8B059]">
                <Receipt className="w-4 h-4" strokeWidth={1.75} />
              </div>
            </div>
            <div>
              <h2 className="text-xs sm:text-base font-extrabold text-[#2C241E] dark:text-[#F3EDE6] leading-tight">
                Frente de Caixa (PDV) · Atelier
              </h2>
              <span className="text-[10px] sm:text-[11px] text-[#7E7062] dark:text-[#B5A796] block">
                {settings.storeName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="btn-silver !py-2 !px-3 !text-xs min-h-[42px] cursor-pointer shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5 text-[#C99F3B]" strokeWidth={1.75} />
              <span className="hidden sm:inline">Ler Código</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-[#7E7062] hover:text-[#2C241E] dark:text-[#AFA292] dark:hover:text-[#F3EDE6] hover:bg-[#EAE2D5] dark:hover:bg-[#302720] transition-colors min-w-[42px] min-h-[42px] flex items-center justify-center cursor-pointer"
              title="Fechar PDV"
            >
              <X className="w-5 h-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Mobile View Mode Tabs (Catalog vs Cart) */}
        <div className="lg:hidden flex items-center p-1.5 bg-[#F5EFEB] dark:bg-[#1F1A17] border-b border-[#E8DFC8] dark:border-[#3A302A] shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('catalog')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'catalog'
                ? 'bg-[#FFFDF9] dark:bg-[#28211C] text-[#2C241E] dark:text-[#F3EDE6] shadow-xs border border-[#E8DFC8] dark:border-[#3A302A]'
                : 'text-[#7E7062] dark:text-[#AFA292]'
            }`}
          >
            <Package className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>1. Catálogo ({displayProducts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 relative cursor-pointer ${
              mobileTab === 'cart'
                ? 'btn-gold !py-2 !px-3 font-extrabold'
                : 'text-[#9D7320] dark:text-[#E6BE65]'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>2. Carrinho ({cart.reduce((a, b) => a + b.quantity, 0)}) · {formatBRL(total)}</span>
          </button>
        </div>

        {/* POS Body: 2 Columns (Catalog on left, Cart & Checkout on right) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Product Search & Quick Grid */}
          <div
            className={`flex-1 flex-col border-b lg:border-b-0 lg:border-r border-[#E8DFC8] dark:border-[#3A302A] overflow-hidden ${
              mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Search Input & Category Selectors */}
            <div className="p-3 border-b border-[#E8DFC8] dark:border-[#3A302A] space-y-2 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[#8E8071]" strokeWidth={1.75} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar produto por nome, SKU ou bipar código..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#201B17] text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#8E8071] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B] font-medium"
                  autoFocus
                />
              </div>

              {/* Categories horizontal scroll */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#D8B059]/20 text-[#9D7320] dark:text-[#E6BE65] font-extrabold border border-[#C99F3B]'
                        : 'bg-[#FFFDF9] dark:bg-[#201B17] text-[#635649] dark:text-[#CBD5E1] border border-[#E8DFC8] dark:border-[#3A302A] hover:border-[#C99F3B]/40'
                    }`}
                  >
                    {cat === 'all' ? 'Todos' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Favorites Section if no search active */}
            {!search && selectedCategory === 'all' && favoriteProducts.length > 0 && (
              <div className="px-3 pt-2 pb-1 border-b border-[#E8DFC8]/70 dark:border-[#3A302A] shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9D7320] dark:text-[#E6BE65] flex items-center gap-1 mb-1.5">
                  <Star className="w-3 h-3 fill-[#C99F3B] text-[#C99F3B]" strokeWidth={1.75} />
                  <span>Favoritos Rápidos</span>
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {favoriteProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleAddToCart(p)}
                      className="p-2 rounded-xl bg-[#FFFDF9] dark:bg-[#201B17] hover:border-[#C99F3B] border border-[#E8DFC8] dark:border-[#3A302A] text-left transition-all active:scale-95 truncate cursor-pointer shadow-2xs"
                    >
                      <p className="text-xs font-bold text-[#2C241E] dark:text-[#F3EDE6] truncate">
                        {p.name}
                      </p>
                      <p className="text-[11px] font-mono font-bold text-[#9D7320] dark:text-[#E6BE65] mt-0.5">
                        {formatBRL(getEffectiveProductPrice(p).price)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Products List Grid */}
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 content-start">
              {displayProducts.map((p) => {
                const { price: effectivePrice, isPromo } = getEffectiveProductPrice(p);
                const isOut = p.stock <= 0;

                return (
                  <button
                    key={p.id}
                    onClick={() => handleAddToCart(p)}
                    disabled={isOut && !settings.allowNegativeStock}
                    className={`flex flex-col justify-between p-3 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer ${
                      isOut
                        ? 'opacity-50 cursor-not-allowed border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB] dark:bg-[#1A1512]'
                        : 'border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#201B17] hover:border-[#C99F3B]/60 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <div>
                      {p.photo && (
                        <div className="w-full h-20 rounded-xl overflow-hidden mb-2 bg-[#F5EFEB] dark:bg-[#1A1512] border border-[#E8DFC8] dark:border-[#3A302A]">
                          <img
                            src={p.photo}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <span className="text-[10px] text-[#8E8071] uppercase font-semibold block truncate">
                        {p.category}
                      </span>
                      <h4 className="text-xs font-bold text-[#2C241E] dark:text-[#F3EDE6] line-clamp-2 leading-tight mt-0.5">
                        {p.name}
                      </h4>
                    </div>

                    <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-[#E8DFC8]/60 dark:border-[#3A302A]">
                      <div>
                        <span className="text-xs sm:text-sm font-extrabold font-mono text-[#9D7320] dark:text-[#E6BE65]">
                          {formatBRL(effectivePrice)}
                        </span>
                        {isPromo && (
                          <span className="text-[10px] text-[#D4AF37] font-bold block">
                            PROMOÇÃO
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                          isOut
                            ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/40'
                            : 'text-[#8E8071] bg-[#F5EFEB] dark:bg-[#28211C] border border-[#E8DFC8] dark:border-[#3A302A]'
                        }`}
                      >
                        {p.stock} un
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mobile Sticky Bottom CTA to go to Cart */}
            {cart.length > 0 && (
              <div className="lg:hidden p-3 bg-[#FFFDF9]/95 dark:bg-[#1F1A17]/95 border-t border-[#E8DFC8] dark:border-[#3A302A] backdrop-blur-md sticky bottom-0 z-20">
                <button
                  type="button"
                  onClick={() => setMobileTab('cart')}
                  className="w-full btn-gold !py-3 !px-4 flex items-center justify-between text-xs sm:text-sm font-extrabold shadow-md cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" strokeWidth={1.75} />
                    <span>Ver Carrinho ({cart.reduce((a, b) => a + b.quantity, 0)} itens)</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span>{formatBRL(total)}</span>
                    <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Cart, Customer & Checkout */}
          <div
            className={`w-full lg:w-[420px] flex-col bg-[#F5EFEB]/80 dark:bg-[#1C1713]/80 border-l border-[#E8DFC8] dark:border-[#3A302A] overflow-hidden shrink-0 ${
              mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Mobile Back to Catalog Button */}
            <div className="lg:hidden p-2.5 bg-[#D8B059]/10 border-b border-[#C99F3B]/30 shrink-0">
              <button
                type="button"
                onClick={() => setMobileTab('catalog')}
                className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-bold text-[#9D7320] dark:text-[#E6BE65] cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>← Voltar e Adicionar Mais Produtos</span>
              </button>
            </div>
            {/* Customer Bar */}
            <div className="p-3 border-b border-[#E8DFC8] dark:border-[#3A302A] flex items-center justify-between gap-2 shrink-0 bg-[#FFFDF9] dark:bg-[#201B17]">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <User className="w-4 h-4 text-[#8E8071] shrink-0" strokeWidth={1.75} />
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    const found = customers.find((c) => c.id === e.target.value);
                    setCustomerNameInput(found ? found.name : 'Consumidor Final');
                  }}
                  className="w-full text-xs font-semibold bg-transparent focus:outline-hidden text-[#2C241E] dark:text-[#F3EDE6] truncate cursor-pointer"
                >
                  <option value="">Consumidor Final (Sem cadastro)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.whatsapp ? `(${c.whatsapp})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                className="text-[11px] font-semibold text-[#9D7320] dark:text-[#E6BE65] hover:underline shrink-0 cursor-pointer"
              >
                + Cliente
              </button>
            </div>

            {/* Quick Customer Register Inline Dropdown */}
            {showNewCustomerForm && (
              <form
                onSubmit={handleCreateCustomer}
                className="p-3 bg-[#FFFDF9] dark:bg-[#251E19] border-b border-[#E8DFC8] dark:border-[#3A302A] flex flex-col gap-2 shrink-0"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="Nome do cliente *"
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/50 dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6]"
                    required
                  />
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="WhatsApp"
                    className="w-32 px-2.5 py-1.5 text-xs rounded-lg border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/50 dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerForm(false)}
                    className="px-2 py-1 text-[11px] text-[#8E8071]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-gold !py-1 !px-3 !text-[11px]"
                  >
                    Salvar Cliente
                  </button>
                </div>
              </form>
            )}

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8E8071]">
                  <Receipt className="w-10 h-10 mb-2 opacity-40 text-[#C99F3B]" strokeWidth={1.5} />
                  <p className="text-xs font-semibold text-[#2C241E] dark:text-[#F3EDE6]">Carrinho vazio</p>
                  <p className="text-[11px] text-[#8E8071] dark:text-[#AFA292] mt-0.5">
                    Toque nos produtos ao lado ou escaneie o código para iniciar a venda.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="p-3 rounded-2xl bg-[#FFFDF9] dark:bg-[#201B17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#2C241E] dark:text-[#F3EDE6] truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-[#8E8071] dark:text-[#AFA292] font-mono">
                        {formatBRL(item.unitPrice)} cada
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, -1)}
                        className="w-6 h-6 rounded-lg bg-[#F5EFEB] dark:bg-[#2A221C] border border-[#E8DFC8] dark:border-[#3A302A] text-[#2C241E] dark:text-[#F3EDE6] font-bold flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" strokeWidth={1.75} />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, 1)}
                        className="w-6 h-6 rounded-lg bg-[#F5EFEB] dark:bg-[#2A221C] border border-[#E8DFC8] dark:border-[#3A302A] text-[#2C241E] dark:text-[#F3EDE6] font-bold flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" strokeWidth={1.75} />
                      </button>
                    </div>

                    <div className="text-right shrink-0 min-w-[70px]">
                      <span className="text-xs font-extrabold font-mono text-[#9D7320] dark:text-[#E6BE65] block">
                        {formatBRL(item.total)}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Checkout & Payment Section */}
            {cart.length > 0 && (
              <div className="p-4 bg-[#FFFDF9] dark:bg-[#201B17] border-t border-[#E8DFC8] dark:border-[#3A302A] space-y-3 shrink-0">
                {/* Discount & Shipping inputs */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-[#8E8071] mb-0.5">
                      <span>Desconto</span>
                      <div className="flex gap-1 font-semibold">
                        <button
                          type="button"
                          onClick={() => setDiscountType('fixed')}
                          className={discountType === 'fixed' ? 'text-[#9D7320] dark:text-[#E6BE65] font-bold' : ''}
                        >
                          R$
                        </button>
                        <span>|</span>
                        <button
                          type="button"
                          onClick={() => setDiscountType('percentage')}
                          className={discountType === 'percentage' ? 'text-[#9D7320] dark:text-[#E6BE65] font-bold' : ''}
                        >
                          %
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/50 dark:bg-[#1A1512] font-mono text-[#2C241E] dark:text-[#F3EDE6]"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-[#8E8071] block mb-0.5">Frete Adicional</span>
                    <input
                      type="number"
                      min="0"
                      value={shipping || ''}
                      onChange={(e) => setShipping(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/50 dark:bg-[#1A1512] font-mono text-[#2C241E] dark:text-[#F3EDE6]"
                    />
                  </div>
                </div>

                {/* Subtotal & Total display */}
                <div className="space-y-1 text-xs pt-1 border-t border-[#E8DFC8]/60 dark:border-[#3A302A]">
                  <div className="flex justify-between text-[#8E8071]">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatBRL(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>Desconto aplicado:</span>
                      <span className="font-mono">-{formatBRL(discountAmount)}</span>
                    </div>
                  )}
                  {shipping > 0 && (
                    <div className="flex justify-between text-[#8E8071]">
                      <span>Frete:</span>
                      <span className="font-mono">+{formatBRL(shipping)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-[#2C241E] dark:text-[#F3EDE6] pt-1 border-t border-[#E8DFC8]/60 dark:border-[#3A302A]">
                    <span>Total a Pagar:</span>
                    <span className="font-mono text-xl font-black text-[#9D7320] dark:text-[#E6BE65]">
                      {formatBRL(total)}
                    </span>
                  </div>
                </div>

                {/* Payment Methods buttons */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8071] dark:text-[#AFA292] block mb-1">
                    Forma de Pagamento
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'pix', label: 'PIX' },
                      { id: 'dinheiro', label: 'Dinheiro' },
                      { id: 'debito', label: 'Débito' },
                      { id: 'credito', label: 'Crédito' },
                      { id: 'credito_parcelado', label: 'Parcelado' },
                      { id: 'transferencia', label: 'Transf.' },
                      { id: 'outro', label: 'Outro' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                          paymentMethod === m.id
                            ? 'btn-gold !p-2 !text-xs !shadow-xs'
                            : 'btn-silver !p-2 !text-xs'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Installments selector if parcelado */}
                {paymentMethod === 'credito_parcelado' && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F5EFEB] dark:bg-[#28211C] border border-[#E8DFC8] dark:border-[#3A302A] text-xs">
                    <span className="text-[#8E8071]">Parcelas:</span>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="flex-1 bg-transparent font-bold focus:outline-hidden text-[#2C241E] dark:text-[#F3EDE6]"
                    >
                      {[2, 3, 4, 5, 6, 10, 12].map((num) => (
                        <option key={num} value={num}>
                          {num}x de {formatBRL(total / num)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Cash Change Calculator */}
                {paymentMethod === 'dinheiro' && (
                  <div className="p-2.5 rounded-xl bg-[#F5EFEB] dark:bg-[#28211C] border border-[#E8DFC8] dark:border-[#3A302A] text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E8071]">Valor Recebido (R$):</span>
                      <input
                        type="number"
                        step="0.50"
                        min={total}
                        value={cashAmountPaid || ''}
                        onChange={(e) => setCashAmountPaid(Number(e.target.value))}
                        placeholder={total.toFixed(2)}
                        className="w-28 px-2 py-1 text-right font-mono font-bold rounded-lg border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6]"
                      />
                    </div>
                    {cashChange > 0 && (
                      <div className="flex items-center justify-between font-bold text-emerald-700 dark:text-emerald-400">
                        <span>Troco a Devolver:</span>
                        <span className="font-mono text-sm">{formatBRL(cashChange)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* PIX QR Code Direct Preview */}
                {paymentMethod === 'pix' && pixQrCodeUrl && (
                  <div className="p-2.5 rounded-xl bg-[#D8B059]/10 border border-[#C99F3B]/30 flex items-center gap-3">
                    <img src={pixQrCodeUrl} alt="PIX QR" className="w-14 h-14 rounded-lg bg-white p-1 border border-[#E8DFC8]" />
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-bold text-[#9D7320] dark:text-[#E6BE65]">PIX Imediato Gerado</p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(pixPayload);
                          showToast('Chave/Código Copia e Cola copiado!', 'success');
                        }}
                        className="text-[11px] text-[#9D7320] dark:text-[#E6BE65] underline font-semibold mt-0.5 block cursor-pointer"
                      >
                        Copiar Código PIX
                      </button>
                    </div>
                  </div>
                )}

                {/* Complete Sale Button */}
                <button
                  type="button"
                  onClick={handleProceedToFinish}
                  className="w-full btn-gold !py-3.5 !text-sm sm:!text-base !font-black !tracking-wide uppercase shadow-lg"
                >
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>Finalizar Venda ({formatBRL(total)})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barcode Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanCode}
      />

      {/* Below Minimum Price Safety Warning Modal (Section 15) */}
      <ConfirmModal
        isOpen={showBelowMinModal}
        onClose={() => setShowBelowMinModal(false)}
        onConfirm={() => {
          setShowBelowMinModal(false);
          setPendingSaleFinish(true);
          handleProceedToFinish();
        }}
        title="Alerta: Desconto Abaixo do Preço Mínimo"
        description={`O desconto aplicado faz o valor total (R$ ${total.toFixed(2)}) ficar abaixo do preço mínimo de custo da loja (R$ ${totalMinPrice.toFixed(2)}). Você deseja autorizar a venda com margem negativa mesmo assim?`}
        confirmText="Sim, autorizar desconto"
        variant="warning"
      />

      {/* Admin Authorization Modal for Discount / Minimum Price */}
      <AdminApprovalModal
        isOpen={isAdminApprovalOpen}
        onClose={() => setIsAdminApprovalOpen(false)}
        onApproved={(approver) => {
          setIsApprovedByAdmin(true);
          setApprovedAdminName(approver.name);
          setIsAdminApprovalOpen(false);
          // Automatically finish sale after admin approval
          setTimeout(() => {
            handleProceedToFinish();
          }, 100);
        }}
        title="Autorização de Desconto / Preço"
        description={adminApprovalReason}
      />

      {/* Sale Finished Receipt Modal */}
      <ReceiptModal
        isOpen={!!completedSale}
        onClose={() => {
          setCompletedSale(null);
          onClose();
        }}
        sale={completedSale}
      />
    </div>
  );
};
