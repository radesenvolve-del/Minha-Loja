import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Sparkles,
  MessageCircle,
  Instagram,
  Check,
  Plus,
  Minus,
  Trash2,
  X,
  Phone,
  User,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Truck,
  Store,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  ExternalLink,
  Gift,
  Award,
  Gem,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, CartItem, Order } from '../../types';
import { sampleProducts } from '../../db/seedData';
import { formatBRL } from '../../utils/formatters';
import { getEffectiveProductPrice } from '../../utils/pricing';
import { openWhatsApp } from '../../utils/whatsapp';
import { JewelryCategoryGraphic } from '../common/JewelryCategoryGraphic';

interface PublicCustomerInfo {
  name: string;
  phone: string;
  city?: string;
}

export const PublicCatalogView: React.FC = () => {
  const {
    products: contextProducts,
    settings,
    saveOrder,
    saveCustomer,
    customers,
    isLoading,
    showToast,
  } = useApp();

  // Ensure products list is never empty: fall back to sampleProducts if store is initializing
  const allProducts = useMemo(() => {
    if (contextProducts && contextProducts.length > 0) {
      return contextProducts;
    }
    return sampleProducts;
  }, [contextProducts]);

  // 1. Customer Identification State (stored in localStorage)
  const [customerInfo, setCustomerInfo] = useState<PublicCustomerInfo | null>(() => {
    try {
      const saved = localStorage.getItem('public_catalog_customer');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return null;
  });

  // Customer onboarding form state
  const [inputName, setInputName] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [inputCity, setInputCity] = useState('');
  const [formError, setFormError] = useState('');
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  // Store details modal state
  const [showStoreInfoModal, setShowStoreInfoModal] = useState(false);

  // Catalog Navigation & Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyPromos, setOnlyPromos] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false); // Default to false so all registered products are visible!
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'name'>('relevance');

  // Customer Shopping Bag
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isGiftPackaging, setIsGiftPackaging] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Completed Order Modal
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    total: number;
    itemsCount: number;
    itemsText: string;
  } | null>(null);

  // Product Detail Modal
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  // Phone auto mask
  const formatPhoneInput = (val: string) => {
    const numbers = val.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPhone(formatPhoneInput(e.target.value));
  };

  // Submit onboarding identification
  const handleSaveCustomerInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanName = inputName.trim();
    const cleanPhone = inputPhone.replace(/\D/g, '');

    if (!cleanName || cleanName.length < 2) {
      setFormError('Por favor, informe seu nome completo.');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setFormError('Por favor, informe um WhatsApp válido com DDD (mínimo 10 dígitos).');
      return;
    }

    const info: PublicCustomerInfo = {
      name: cleanName,
      phone: inputPhone,
      city: inputCity.trim() || undefined,
    };

    try {
      localStorage.setItem('public_catalog_customer', JSON.stringify(info));
      setCustomerInfo(info);
      setIsEditingCustomer(false);

      // Register/sync customer in store CRM database so merchant sees the lead
      const existingCustomer = customers.find(
        (c) => ((c.phone || c.whatsapp || '').replace(/\D/g, '')) === cleanPhone
      );

      if (!existingCustomer) {
        await saveCustomer({
          id: `cust_${Date.now()}`,
          name: cleanName,
          phone: inputPhone,
          whatsapp: inputPhone,
          city: inputCity.trim() || undefined,
          notes: 'Cliente cadastrado através do Catálogo Digital Público',
          createdAt: new Date().toISOString(),
        });
      }

      showToast(`Bem-vindo(a), ${cleanName}! Coleção liberada ✨`, 'success');
    } catch {
      setCustomerInfo(info);
    }
  };

  // Product Categories
  const categories = useMemo(() => {
    const set = new Set(
      allProducts
        .filter((p) => p.status !== 'inativo')
        .map((p) => p.category)
        .filter(Boolean)
    );
    return Array.from(set).sort();
  }, [allProducts]);

  // Active Promotional Products count
  const promoProductsCount = useMemo(() => {
    return allProducts.filter((p) => {
      if (p.status === 'inativo') return false;
      const { isPromo } = getEffectiveProductPrice(p);
      return isPromo;
    }).length;
  }, [allProducts]);

  // Filtered & Sorted Products
  const displayProducts = useMemo(() => {
    return allProducts
      .filter((p) => {
        if (p.status === 'inativo') return false;
        if (onlyInStock && p.stock <= 0) return false;

        const effective = getEffectiveProductPrice(p);
        if (onlyPromos && !effective.isPromo) return false;

        if (selectedCategory !== 'all' && p.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }

        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = p.name?.toLowerCase().includes(q);
          const matchCat = p.category?.toLowerCase().includes(q);
          const matchDesc = p.description?.toLowerCase().includes(q);
          const matchSku = p.sku?.toLowerCase().includes(q);
          const matchBrand = p.brand?.toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchDesc && !matchSku && !matchBrand) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = getEffectiveProductPrice(a).price;
        const priceB = getEffectiveProductPrice(b).price;

        if (sortBy === 'price_asc') return priceA - priceB;
        if (sortBy === 'price_desc') return priceB - priceA;
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');

        // Relevance: promos first, then available stock, then favorite
        const favA = a.isFavorite ? 1 : 0;
        const favB = b.isFavorite ? 1 : 0;
        if (favA !== favB) return favB - favA;

        const promoA = getEffectiveProductPrice(a).isPromo ? 1 : 0;
        const promoB = getEffectiveProductPrice(b).isPromo ? 1 : 0;
        if (promoA !== promoB) return promoB - promoA;
        return (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0);
      });
  }, [allProducts, search, selectedCategory, onlyPromos, onlyInStock, sortBy]);

  // Cart Calculations
  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const product = allProducts.find((p) => p.id === id);
        if (!product || qty <= 0) return null;
        const { price, isPromo } = getEffectiveProductPrice(product);
        return {
          product,
          quantity: qty,
          unitPrice: price,
          originalPrice: product.price,
          isPromo,
          subtotal: price * qty,
        };
      })
      .filter(Boolean) as {
      product: Product;
      quantity: number;
      unitPrice: number;
      originalPrice: number;
      isPromo: boolean;
      subtotal: number;
    }[];
  }, [cart, allProducts]);

  const totalCartCount = useMemo(() => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }, [cart]);

  const totalCartAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cartItems]);

  const totalCartSavings = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      if (item.isPromo && item.originalPrice > item.unitPrice) {
        return sum + (item.originalPrice - item.unitPrice) * item.quantity;
      }
      return sum;
    }, 0);
  }, [cartItems]);

  // Add / Remove from Cart
  const handleAddToCart = (product: Product, delta = 1) => {
    setCart((prev) => {
      const current = prev[product.id] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      }
      return { ...prev, [product.id]: next };
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  // Submit Order Online
  const handleFinalizeOrder = async () => {
    if (!customerInfo) {
      setIsEditingCustomer(true);
      return;
    }

    if (cartItems.length === 0) {
      showToast('Sua sacola está vazia.', 'warning');
      return;
    }

    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      showToast('Por favor, informe seu endereço para entrega.', 'warning');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const orderNumber = `${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date().toISOString();

      const itemsForOrder: CartItem[] = cartItems.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        unitPrice: item.unitPrice,
        originalPrice: item.originalPrice,
        cost: item.product.cost,
        minPrice: item.product.minPrice,
        quantity: item.quantity,
        discount: item.isPromo ? item.originalPrice - item.unitPrice : 0,
        total: item.subtotal,
      }));

      const finalNotes = [
        deliveryType === 'pickup' ? 'Tipo: Retirada no Atelier' : `Tipo: Entrega em ${deliveryAddress.trim()}`,
        isGiftPackaging ? 'Embalagem: Solicitação de Embalagem para Presente' : '',
        orderNotes.trim() ? `Observações: ${orderNotes.trim()}` : '',
        `WhatsApp Cliente: ${customerInfo.phone}`,
      ]
        .filter(Boolean)
        .join(' | ');

      const newOrder: Order = {
        id: `ord_${Date.now()}`,
        orderNumber,
        date: now,
        origin: 'catalogo_online',
        customerName: customerInfo.name,
        whatsapp: customerInfo.phone,
        items: itemsForOrder,
        subtotal: totalCartAmount,
        discount: totalCartSavings,
        shipping: 0,
        total: totalCartAmount,
        status: 'novo',
        deliveryAddress: deliveryType === 'delivery' ? deliveryAddress.trim() : 'Retirada na Loja',
        notes: finalNotes,
        createdAt: now,
        updatedAt: now,
      };

      await saveOrder(newOrder);

      // Build WhatsApp message text with haute joaillerie refinement
      const lines: string[] = [];
      lines.push(`✨ *PEDIDO ATELIER #${orderNumber}*`);
      lines.push(`*Cliente:* ${customerInfo.name}`);
      lines.push(`*Contato:* ${customerInfo.phone}`);
      if (customerInfo.city) lines.push(`*Localização:* ${customerInfo.city}`);
      lines.push(`--------------------------------`);
      lines.push(`*SELEÇÃO DE PEÇAS:*`);
      cartItems.forEach((item) => {
        lines.push(`▪️ ${item.quantity}x ${item.product.name}`);
        lines.push(`   Ref: ${item.product.sku || 'N/A'} · ${formatBRL(item.unitPrice)} cada`);
      });
      lines.push(`--------------------------------`);
      lines.push(`*VALOR TOTAL: ${formatBRL(totalCartAmount)}*`);
      if (totalCartSavings > 0) {
        lines.push(`✨ *Desconto Exclusivo Aplicado: ${formatBRL(totalCartSavings)}*`);
      }
      lines.push(`--------------------------------`);
      lines.push(
        deliveryType === 'pickup'
          ? `📍 *Recebimento:* Retirada no Atelier (${settings.address || 'Loja Física'})`
          : `🚚 *Entrega:* ${deliveryAddress.trim()}`
      );
      if (isGiftPackaging) {
        lines.push(`🎁 *Embalagem:* Especial para Presente`);
      }
      if (orderNotes.trim()) {
        lines.push(`💬 *Detalhes:* ${orderNotes.trim()}`);
      }
      lines.push(`\nOlá! Acabei de escolher estas peças pelo Catálogo Oficial. Gostaria de confirmar a disponibilidade e os detalhes de pagamento! ✨`);

      const whatsappText = lines.join('\n');

      setCompletedOrder({
        orderNumber,
        total: totalCartAmount,
        itemsCount: totalCartCount,
        itemsText: whatsappText,
      });

      // Clear cart
      setCart({});
      setIsCartOpen(false);
      setOrderNotes('');

      // Open WhatsApp automatically
      if (settings.whatsapp) {
        openWhatsApp(settings.whatsapp || '', whatsappText);
      }
    } catch (err) {
      showToast('Ocorreu um erro ao processar o pedido. Tente novamente.', 'error');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Helper for product photo resolution
  const getProductImage = (p: Product) => {
    return p.photo || (p as any).imageUrl || (p as any).image || '';
  };

  // Store Brand Initials for Luxury Monogram
  const storeInitials = useMemo(() => {
    const name = settings.storeName || 'Atelier';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [settings.storeName]);

  // Loading State - Haute Joaillerie Splash
  if (isLoading && allProducts.length === 0) {
    return (
      <div className="min-h-screen bg-[#14100E] text-[#F3EDE6] flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-full border border-[#D4AF37]/40 flex items-center justify-center luxury-glow-gold mb-6">
          <Gem className="w-8 h-8 text-[#D4AF37] animate-pulse" />
        </div>
        <p className="font-serif-luxury text-2xl tracking-[0.2em] uppercase text-[#E8DFC8]">
          {settings.storeName || 'Atelier'}
        </p>
        <p className="text-xs text-[#A89A89] tracking-widest uppercase mt-2">
          Carregando Coleção Exclusiva...
        </p>
      </div>
    );
  }

  // ----------------------------------------------------
  // STEP 1: ONBOARDING / IDENTIFICAÇÃO DO CLIENTE (VIP SALON)
  // ----------------------------------------------------
  if (!customerInfo || isEditingCustomer) {
    return (
      <div className="min-h-screen bg-linear-to-b from-[#FAF8F5] via-[#F4EFE6] to-[#EBE2D3] dark:from-[#14100E] dark:via-[#191411] dark:to-[#0F0C0A] flex flex-col justify-between p-4 sm:p-8 text-[#2C241E] dark:text-[#F3EDE6]">
        {/* Top Atelier Branding */}
        <header className="max-w-md mx-auto w-full pt-6 sm:pt-12 text-center">
          {/* Luxury Monogram */}
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-linear-to-b from-[#2C241E] to-[#14100E] border-2 border-[#D4AF37] luxury-glow-gold shadow-2xl mb-4">
            {settings.logo ? (
              <img
                src={settings.logo}
                alt={settings.storeName}
                className="w-12 h-12 object-contain rounded-full"
              />
            ) : (
              <span className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-widest text-[#E6BE65]">
                {storeInitials}
              </span>
            )}
          </div>

          <h1 className="font-serif-luxury text-3xl sm:text-4xl tracking-[0.08em] font-medium text-[#2C241E] dark:text-[#F3EDE6]">
            {settings.storeName || 'Atelier de Joias'}
          </h1>
          <p className="text-xs tracking-[0.18em] uppercase text-[#8C6B1B] dark:text-[#D4AF37] font-semibold mt-1.5">
            {settings.tagline || 'Alta Joalheria & Acessórios Contemporâneos'}
          </p>
        </header>

        {/* Identification Form Card - Haute Couture Style */}
        <main className="max-w-md mx-auto w-full my-6">
          <div className="bg-white/95 dark:bg-[#1C1613]/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#E0D5BE] dark:border-[#382F28] shadow-2xl space-y-6">
            <div className="text-center space-y-1.5">
              <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#8C6B1B] dark:text-[#D4AF37]">
                Acesso Exclusivo à Vitrine
              </span>
              <h2 className="font-serif-luxury text-2xl font-normal text-[#2C241E] dark:text-[#F3EDE6]">
                Identifique-se para Visualizar
              </h2>
              <p className="text-xs text-[#7E7062] dark:text-[#AFA292] leading-relaxed max-w-xs mx-auto">
                Para consultar valores atualizados, fotos e montar sua seleção sob medida, sem criação de senha:
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomerInfo} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#6E6052] dark:text-[#C8BCAD] mb-1.5">
                  Seu Nome Completo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A89A89]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="Ex: Dra. Mariana Albuquerque"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FAF8F5] dark:bg-[#15110F] border border-[#DDD3BF] dark:border-[#332A24] text-sm text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#A69989] focus:outline-hidden focus:border-[#C99F3B] focus:ring-2 focus:ring-[#C99F3B]/20 transition-all font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#6E6052] dark:text-[#C8BCAD] mb-1.5">
                  Seu WhatsApp / Telefone *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A89A89]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={inputPhone}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FAF8F5] dark:bg-[#15110F] border border-[#DDD3BF] dark:border-[#332A24] text-sm text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#A69989] focus:outline-hidden focus:border-[#C99F3B] focus:ring-2 focus:ring-[#C99F3B]/20 transition-all font-mono"
                  />
                </div>
                <p className="text-[10px] text-[#8E8071] dark:text-[#9F9181] mt-1">
                  Para enviar confirmação das peças reservadas e detalhes de envio.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#6E6052] dark:text-[#C8BCAD] mb-1.5">
                  Cidade / Bairro <span className="text-[10px] lowercase text-[#A89A89]">(opcional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A89A89]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={inputCity}
                    onChange={(e) => setInputCity(e.target.value)}
                    placeholder="Ex: São Paulo - SP"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FAF8F5] dark:bg-[#15110F] border border-[#DDD3BF] dark:border-[#332A24] text-sm text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#A69989] focus:outline-hidden focus:border-[#C99F3B] focus:ring-2 focus:ring-[#C99F3B]/20 transition-all font-sans"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full btn-gold !py-3.5 !px-6 !text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/25 hover:shadow-xl transition-all"
                >
                  <Sparkles className="w-4 h-4 text-[#1A1306]" />
                  <span>Acessar Coleção Exclusiva</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {isEditingCustomer && customerInfo && (
                <button
                  type="button"
                  onClick={() => setIsEditingCustomer(false)}
                  className="w-full py-2 text-xs text-[#8E8071] hover:text-[#2C241E] dark:hover:text-white transition-colors"
                >
                  Cancelar alteração e voltar à vitrine
                </button>
              )}
            </form>

            <div className="pt-3 border-t border-[#EFE8DC] dark:border-[#2C231E] flex items-center justify-between text-[11px] text-[#8E8071] dark:text-[#9F9181]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C99F3B]" />
                Ateliê Oficial com Garantia
              </span>
              <span>🔒 Acesso Direto</span>
            </div>
          </div>
        </main>

        {/* Footer info */}
        <footer className="max-w-md mx-auto w-full text-center pb-4 text-[11px] text-[#8E8071] dark:text-[#9F9181]">
          <p>© {new Date().getFullYear()} {settings.storeName}. {settings.city ? `${settings.city} · ` : ''}Todos os direitos reservados.</p>
        </footer>
      </div>
    );
  }

  // ----------------------------------------------------
  // STEP 2: VITRINE DE LUXO / CATÁLOGO COMPLETO
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#120E0C] text-[#2C241E] dark:text-[#F3EDE6] flex flex-col pb-28 selection:bg-[#D4AF37] selection:text-white">
      {/* Editorial Luxury Top Announcement */}
      <div className="bg-[#1C1613] text-[#E8DFC8] border-b border-[#2C231E] px-4 sm:px-6 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <Gem className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span className="font-serif-luxury tracking-wider text-xs sm:text-sm text-[#F3E5AB] truncate">
              {settings.storeName || 'Atelier'} · Coleção Autoral & Peças Exclusivas
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-[11px]">
            {settings.whatsapp && (
              <button
                onClick={() => openWhatsApp(settings.whatsapp || '', 'Olá! Gostaria de consultar sobre uma peça do catálogo.')}
                className="flex items-center gap-1 hover:text-[#F3E5AB] transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            )}
            {settings.instagram && (
              <a
                href={`https://instagram.com/${settings.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-[#F3E5AB] transition-colors"
              >
                <Instagram className="w-3 h-3 text-pink-400" />
                <span className="hidden sm:inline">@{settings.instagram.replace('@', '')}</span>
              </a>
            )}
            <button
              onClick={() => setShowStoreInfoModal(true)}
              className="flex items-center gap-1 hover:text-[#F3E5AB] transition-colors cursor-pointer text-[#D4AF37]"
            >
              <Info className="w-3 h-3" />
              <span>Sobre o Atelier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Luxury Storefront Header */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 dark:bg-[#120E0C]/95 backdrop-blur-md border-b border-[#E8DFC8] dark:border-[#2C231E] px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Emblem & Welcome */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-linear-to-b from-[#2C241E] to-[#14100E] border border-[#D4AF37] flex items-center justify-center text-[#E6BE65] font-serif-luxury font-bold text-lg sm:text-xl shrink-0 shadow-sm luxury-float">
              {settings.logo ? (
                <img
                  src={settings.logo}
                  alt={settings.storeName}
                  className="w-8 h-8 rounded-full object-contain"
                />
              ) : (
                storeInitials
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-serif-luxury text-lg sm:text-2xl tracking-[0.06em] font-medium leading-none text-[#2C241E] dark:text-[#F3EDE6] truncate">
                {settings.storeName || 'Atelier'}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-[#7E7062] dark:text-[#AFA292] mt-1 truncate">
                <span>Bem-vindo(a), <strong className="text-[#2C241E] dark:text-white font-semibold">{customerInfo.name.split(' ')[0]}</strong></span>
                <span aria-hidden="true">·</span>
                <button
                  onClick={() => setIsEditingCustomer(true)}
                  className="text-[#8C6B1B] dark:text-[#D4AF37] hover:underline cursor-pointer"
                >
                  Alterar dados
                </button>
              </div>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setShowStoreInfoModal(true)}
              className="btn-silver !py-2 !px-3 !text-xs hidden sm:flex items-center gap-1.5 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-[#C99F3B]" />
              <span>Atelier & Localização</span>
            </button>

            {/* Shopping Bag Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="btn-gold !py-2 !px-3.5 sm:!px-4 !text-xs sm:!text-sm flex items-center gap-2 cursor-pointer shadow-md"
            >
              <ShoppingBag className="w-4 h-4 text-[#1A1306]" />
              <span className="hidden sm:inline">Sacola</span>
              {totalCartCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#2C241E] text-[#F3E5AB] text-[10px] font-black">
                  {totalCartCount}
                </span>
              )}
              {totalCartAmount > 0 && (
                <span className="font-mono font-bold pl-1 border-l border-[#2C241E]/20 text-xs text-[#1A1306]">
                  {formatBRL(totalCartAmount)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Showcase Banner */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-6 pb-2">
        <div className="relative rounded-3xl overflow-hidden bg-linear-to-r from-[#241D17] via-[#2F2620] to-[#1C1613] text-[#F3EDE6] p-6 sm:p-10 border border-[#42362C] shadow-xl">
          {/* Subtle Ambient Shimmer Background Pattern */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#E6BE65] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              Alta Joalheria & Curadoria Exclusiva
            </span>
            <h2 className="font-serif-luxury text-2xl sm:text-4xl font-normal leading-tight tracking-[0.04em] text-white">
              Peças de Acabamento Nobre Criadas para Encantar
            </h2>
            <p className="text-xs sm:text-sm text-[#C8BCAD] leading-relaxed max-w-xl">
              {settings.tagline || 'Explore nossa vitrine completa com fotos ampliadas, preços vigentes e pedidos online diretos pelo WhatsApp.'}
            </p>

            {/* Atelier Highlights */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#E8DFC8]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                Garantia & Autenticidade
              </span>
              <span aria-hidden="true" className="text-[#645344]">·</span>
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#D4AF37]" />
                Envio Seguro ou Retirada
              </span>
              <span aria-hidden="true" className="text-[#645344]">·</span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#D4AF37]" />
                Pronta Entrega no Estoque
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter, Search & Category Navigation Bar */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E8071]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por anel, colar, brinco, prata, ouro, ref..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-[#1A1412] border border-[#E0D5BE] dark:border-[#2C231E] text-xs sm:text-sm text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#9E9080] focus:outline-hidden focus:border-[#C99F3B] focus:ring-2 focus:ring-[#C99F3B]/20 shadow-2xs font-sans"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8E8071] hover:text-[#2C241E] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sorting and Stock Controls */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-2.5 px-3 rounded-2xl bg-white dark:bg-[#1A1412] border border-[#E0D5BE] dark:border-[#2C231E] text-xs font-semibold text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:border-[#C99F3B] shadow-2xs cursor-pointer font-sans"
            >
              <option value="relevance">Destaques do Atelier</option>
              <option value="price_asc">Menor Preço</option>
              <option value="price_desc">Maior Preço</option>
              <option value="name">Nome (A a Z)</option>
            </select>

            <button
              onClick={() => setOnlyInStock(!onlyInStock)}
              className={`py-2 px-3 rounded-2xl text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer ${
                onlyInStock
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-white dark:bg-[#1A1412] border-[#E0D5BE] dark:border-[#2C231E] text-[#7E7062] dark:text-[#AFA292]'
              }`}
            >
              {onlyInStock ? '✓ Apenas Pronta Entrega' : 'Todas as Peças'}
            </button>
          </div>
        </div>

        {/* Category Horizontal Navigation (Zero-Pill Minimalist Segmented Tabs) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 border-b border-[#E8DFC8]/60 dark:border-[#2C231E] pb-3">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setOnlyPromos(false);
            }}
            className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'all' && !onlyPromos
                ? 'bg-[#2C241E] text-white dark:bg-[#D4AF37] dark:text-[#14100E] shadow-sm'
                : 'bg-white dark:bg-[#1A1412] border border-[#E0D5BE] dark:border-[#2C231E] text-[#5A4E42] dark:text-[#C8BCAD] hover:border-[#C99F3B]'
            }`}
          >
            <span>Todas as Peças</span>
            <span className="ml-1.5 opacity-60 text-[10px]">({allProducts.filter((p) => p.status !== 'inativo').length})</span>
          </button>

          {promoProductsCount > 0 && (
            <button
              onClick={() => {
                setOnlyPromos(true);
                setSelectedCategory('all');
              }}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                onlyPromos
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300'
              }`}
            >
              <span>🔥 Ofertas Especiais</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-600 text-white">
                {promoProductsCount}
              </span>
            </button>
          )}

          {categories.map((cat) => {
            const count = allProducts.filter((p) => p.status !== 'inativo' && p.category?.toLowerCase() === cat.toLowerCase()).length;
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase() && !onlyPromos;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setOnlyPromos(false);
                }}
                className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#2C241E] text-white dark:bg-[#D4AF37] dark:text-[#14100E] shadow-sm'
                    : 'bg-white dark:bg-[#1A1412] border border-[#E0D5BE] dark:border-[#2C231E] text-[#5A4E42] dark:text-[#C8BCAD] hover:border-[#C99F3B]'
                }`}
              >
                <span>{cat}</span>
                <span className="ml-1.5 opacity-60 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Product Grid Area - Haute Joaillerie Showcase */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-6 flex-1">
        {displayProducts.length === 0 ? (
          <div className="text-center py-20 px-6 bg-white dark:bg-[#181310] rounded-3xl border border-[#E0D5BE] dark:border-[#2C231E] max-w-lg mx-auto shadow-sm space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF5EC] dark:bg-[#241C17] flex items-center justify-center text-[#8C6B1B]">
              <Gem className="w-8 h-8" />
            </div>
            <h3 className="font-serif-luxury text-2xl text-[#2C241E] dark:text-[#F3EDE6]">
              Nenhuma peça encontrada
            </h3>
            <p className="text-xs text-[#7E7062] dark:text-[#AFA292] max-w-sm mx-auto leading-relaxed">
              Não encontramos produtos para os filtros selecionados. Tente buscar por outros termos ou visualizar toda a coleção.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
                setOnlyPromos(false);
                setOnlyInStock(false);
              }}
              className="btn-gold !py-2.5 !px-5 !text-xs cursor-pointer"
            >
              Exibir Todas as Peças do Atelier
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayProducts.map((product) => {
              const { price: effectivePrice, isPromo } = getEffectiveProductPrice(product);
              const qtyInCart = cart[product.id] || 0;
              const photoUrl = getProductImage(product);
              const discountPercent =
                isPromo && product.price > effectivePrice
                  ? Math.round(((product.price - effectivePrice) / product.price) * 100)
                  : 0;

              return (
                <div
                  key={product.id}
                  className="luxury-card-sheen group flex flex-col bg-white dark:bg-[#181310] rounded-3xl border border-[#E8DFC8] dark:border-[#2E241E] hover:border-[#C99F3B] dark:hover:border-[#C99F3B] transition-all duration-300 overflow-hidden shadow-2xs hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Photo Showcase Container */}
                  <div
                    onClick={() => setDetailProduct(product)}
                    className="relative aspect-square w-full bg-[#FAF8F5] dark:bg-[#14100E] overflow-hidden flex items-center justify-center cursor-pointer"
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-b from-[#FAF5EC]/50 to-transparent">
                        <JewelryCategoryGraphic
                          category={product.category || 'joias'}
                          size={110}
                          className="group-hover:scale-106 transition-transform duration-500"
                        />
                      </div>
                    )}

                    {/* Promotional Offer Tag */}
                    {isPromo && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-700 text-white shadow-md">
                          {discountPercent > 0 ? `-${discountPercent}% OFF` : 'OFERTA'}
                        </span>
                      </div>
                    )}

                    {/* Stock Status Indicator */}
                    <div className="absolute top-3 right-3 z-10">
                      {product.stock > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/95 dark:bg-[#1A1412]/95 backdrop-blur-xs text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                          {product.stock <= 3 ? `Últimas ${product.stock} un` : 'Pronta Entrega'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/95 dark:bg-[#1A1412]/95 backdrop-blur-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs">
                          Sob Encomenda
                        </span>
                      )}
                    </div>

                    {/* Subtle Quick-View Eye Button */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="py-1.5 px-3 rounded-full bg-white/95 dark:bg-[#201A16]/95 text-xs font-bold text-[#2C241E] dark:text-white shadow-lg flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Detalhes</span>
                      </span>
                    </div>
                  </div>

                  {/* Product Editorial Meta & Pricing */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
                    <div className="space-y-1">
                      {/* Quiet Unboxed Metadata (Zero-Pill Discipline) */}
                      <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#8C6B1B] dark:text-[#D4AF37]">
                        {product.category || 'Atelier'} {product.sku ? `· Ref: ${product.sku}` : ''}
                      </p>

                      <h4
                        onClick={() => setDetailProduct(product)}
                        className="font-serif-luxury text-base sm:text-lg font-medium text-[#2C241E] dark:text-[#F3EDE6] line-clamp-2 leading-snug cursor-pointer hover:text-[#8C6B1B] dark:hover:text-[#D4AF37] transition-colors"
                        title={product.name}
                      >
                        {product.name}
                      </h4>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#F0E8DC] dark:border-[#2C231E]">
                      {/* Price presentation */}
                      <div>
                        {isPromo && product.price > effectivePrice && (
                          <p className="text-[11px] text-[#A69989] line-through font-mono">
                            {formatBRL(product.price)}
                          </p>
                        )}
                        <p className="text-base sm:text-lg font-black font-mono text-[#2C241E] dark:text-[#F3EDE6] leading-none">
                          {formatBRL(effectivePrice)}
                        </p>
                        {effectivePrice >= 60 && (
                          <p className="text-[10px] text-[#8E8071] dark:text-[#9F9181] mt-0.5">
                            ou 3x de {formatBRL(effectivePrice / 3)} sem juros
                          </p>
                        )}
                      </div>

                      {/* Add to Bag Button or Stepper */}
                      <div>
                        {qtyInCart > 0 ? (
                          <div className="flex items-center justify-between bg-[#FAF5EC] dark:bg-[#241C17] rounded-xl p-1 border border-[#D4AF37]/50">
                            <button
                              onClick={() => handleAddToCart(product, -1)}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-[#1A1412] text-[#2C241E] dark:text-white flex items-center justify-center hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer shadow-2xs"
                              title="Diminuir quantidade"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black font-mono text-[#2C241E] dark:text-white px-2">
                              {qtyInCart}
                            </span>
                            <button
                              onClick={() => handleAddToCart(product, 1)}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-[#1A1412] text-[#2C241E] dark:text-white flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer shadow-2xs"
                              title="Aumentar quantidade"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(product, 1)}
                            className="w-full btn-gold !py-2 !px-3 !text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-[#1A1306]" />
                            <span>Adicionar à Sacola</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Luxury Dock (Bottom) */}
      {totalCartCount > 0 && (
        <aside
          aria-label="Resumo da Sacola Flutuante"
          className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40 animate-in fade-in slide-in-from-bottom duration-300"
        >
          <div className="bg-[#1C1613]/95 text-white rounded-3xl p-3 sm:p-4 shadow-2xl border border-[#D4AF37]/40 backdrop-blur-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-b from-[#D4AF37] to-[#B8942A] text-[#14100E] flex items-center justify-center font-black relative shrink-0 shadow-sm">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-black">
                  {totalCartCount}
                </span>
              </div>
              <div>
                <p className="text-xs text-[#E8DFC8]">
                  {totalCartCount} {totalCartCount === 1 ? 'peça selecionada' : 'peças selecionadas'}
                </p>
                <p className="font-mono text-sm sm:text-base font-black text-white mt-0.5">
                  Total: {formatBRL(totalCartAmount)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="btn-gold !py-2.5 !px-5 !text-xs sm:!text-sm flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <span>Ver Sacola & Concluir</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: SOBRE O ATELIER / INFORMAÇÕES DA LOJA         */}
      {/* ---------------------------------------------------- */}
      {showStoreInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1A1412] rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-[#E0D5BE] dark:border-[#382F28] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DC] dark:border-[#2C231E]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1C1613] border border-[#D4AF37] flex items-center justify-center text-[#E6BE65] font-serif-luxury font-bold text-lg">
                  {storeInitials}
                </div>
                <div>
                  <h3 className="font-serif-luxury text-xl font-medium text-[#2C241E] dark:text-[#F3EDE6]">
                    {settings.storeName || 'Atelier'}
                  </h3>
                  <p className="text-[10px] uppercase tracking-wider text-[#8C6B1B] dark:text-[#D4AF37]">
                    Ateliê & Loja Oficial
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStoreInfoModal(false)}
                className="w-8 h-8 rounded-full bg-[#FAF5EC] dark:bg-[#241C17] text-[#7E7062] hover:text-[#2C241E] dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-[#524436] dark:text-[#C8BCAD]">
              {settings.tagline && (
                <p className="italic text-[#7E7062] dark:text-[#AFA292] leading-relaxed">
                  "{settings.tagline}"
                </p>
              )}

              {/* Physical Location */}
              {(settings.address || settings.city) && (
                <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#14100E] border border-[#E8DFC8] dark:border-[#2C231E] flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#C99F3B] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#2C241E] dark:text-white">Localização do Atelier:</strong>
                    <span>{settings.address}</span>
                    {settings.city && <span>, {settings.city} - {settings.state}</span>}
                  </div>
                </div>
              )}

              {/* Direct WhatsApp Contact */}
              {settings.whatsapp && (
                <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#14100E] border border-[#E8DFC8] dark:border-[#2C231E] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Oficial: <strong>{settings.whatsapp}</strong></span>
                  </div>
                  <button
                    onClick={() => openWhatsApp(settings.whatsapp || '', 'Olá! Gostaria de falar com o atendimento do atelier.')}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Conversar
                  </button>
                </div>
              )}

              {/* Instagram */}
              {settings.instagram && (
                <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#14100E] border border-[#E8DFC8] dark:border-[#2C231E] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-500" />
                    <span>Instagram: <strong>@{settings.instagram.replace('@', '')}</strong></span>
                  </div>
                  <a
                    href={`https://instagram.com/${settings.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline"
                  >
                    Seguir
                  </a>
                </div>
              )}

              {/* Key Highlights */}
              <div className="pt-2 grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-[#FAF5EC] dark:bg-[#201914] border border-[#ECD9A2] dark:border-[#382F28]">
                  <p className="font-bold text-[#2C241E] dark:text-white">Pagamento Seguro</p>
                  <p className="text-[#8E8071] dark:text-[#AFA292]">Pix com desconto e Cartões em até 12x</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF5EC] dark:bg-[#201914] border border-[#ECD9A2] dark:border-[#382F28]">
                  <p className="font-bold text-[#2C241E] dark:text-white">Certificado</p>
                  <p className="text-[#8E8071] dark:text-[#AFA292]">Garantia autêntica para cada peça</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowStoreInfoModal(false)}
              className="w-full btn-silver !py-2.5 cursor-pointer font-bold"
            >
              Voltar ao Catálogo
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: SHOPPING BAG / SACOLA DE COMPRAS & CHECKOUT   */}
      {/* ---------------------------------------------------- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1A1412] rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-[#E0D5BE] dark:border-[#382F28] overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#E0D5BE] dark:border-[#2C231E] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF5EC] dark:bg-[#241C17] text-[#D4AF37] flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-luxury text-lg font-medium text-[#2C241E] dark:text-[#F3EDE6]">
                    Sua Sacola do Atelier
                  </h3>
                  <p className="text-[11px] text-[#7E7062] dark:text-[#AFA292]">
                    {totalCartCount} {totalCartCount === 1 ? 'peça selecionada' : 'peças selecionadas'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF5EC] dark:bg-[#241C17] text-[#7E7062] hover:text-[#2C241E] dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <ShoppingBag className="w-12 h-12 mx-auto text-[#A69989]" />
                  <p className="font-serif-luxury text-xl text-[#2C241E] dark:text-[#F3EDE6]">
                    Sua sacola está vazia.
                  </p>
                  <p className="text-xs text-[#7E7062] dark:text-[#AFA292]">
                    Explore nossa vitrine e adicione suas peças favoritas.
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="btn-gold !py-2 !px-4 !text-xs cursor-pointer mt-2"
                  >
                    Ver Catálogo
                  </button>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="space-y-3">
                    {cartItems.map((item) => {
                      const photoUrl = getProductImage(item.product);
                      return (
                        <div
                          key={item.product.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#14100E] border border-[#EAE2D2] dark:border-[#2C231E]"
                        >
                          {/* Thumbnail */}
                          <div className="w-14 h-14 rounded-xl bg-white dark:bg-[#1C1613] overflow-hidden shrink-0 flex items-center justify-center border border-[#E0D5BE] dark:border-[#382F28]">
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <JewelryCategoryGraphic
                                category={item.product.category || 'joias'}
                                size={40}
                              />
                            )}
                          </div>

                          {/* Title & Price */}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-serif-luxury text-sm font-medium text-[#2C241E] dark:text-[#F3EDE6] truncate">
                              {item.product.name}
                            </h5>
                            <div className="flex items-center gap-2 text-xs mt-0.5">
                              <span className="font-mono font-bold text-[#2C241E] dark:text-[#F3EDE6]">
                                {formatBRL(item.unitPrice)}
                              </span>
                              {item.isPromo && (
                                <span className="text-[10px] font-mono text-[#A69989] line-through">
                                  {formatBRL(item.originalPrice)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stepper & Trash */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center bg-white dark:bg-[#1C1613] rounded-xl border border-[#E0D5BE] dark:border-[#2C231E] p-0.5">
                              <button
                                onClick={() => handleAddToCart(item.product, -1)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-[#7E7062] hover:text-[#2C241E] dark:hover:text-white"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-mono font-black px-2">{item.quantity}</span>
                              <button
                                onClick={() => handleAddToCart(item.product, 1)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-[#7E7062] hover:text-[#2C241E] dark:hover:text-white"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => handleRemoveFromCart(item.product.id)}
                              className="p-1.5 text-red-500 hover:text-red-700 transition-colors"
                              title="Remover da sacola"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Delivery Mode Choice */}
                  <div className="space-y-2 pt-2 border-t border-[#EAE2D2] dark:border-[#2C231E]">
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-[#6E6052] dark:text-[#C8BCAD]">
                      Forma de Recebimento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('pickup')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                          deliveryType === 'pickup'
                            ? 'bg-[#FAF5EC] dark:bg-[#241C17] border-[#C99F3B] text-[#8C6B1B] dark:text-[#D4AF37]'
                            : 'bg-white dark:bg-[#14100E] border-[#E0D5BE] dark:border-[#2C231E] text-[#7E7062]'
                        }`}
                      >
                        <Store className="w-4 h-4" />
                        <span>Retirar no Atelier (Grátis)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryType('delivery')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                          deliveryType === 'delivery'
                            ? 'bg-[#FAF5EC] dark:bg-[#241C17] border-[#C99F3B] text-[#8C6B1B] dark:text-[#D4AF37]'
                            : 'bg-white dark:bg-[#14100E] border-[#E0D5BE] dark:border-[#2C231E] text-[#7E7062]'
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                        <span>Entrega / Delivery</span>
                      </button>
                    </div>

                    {deliveryType === 'delivery' && (
                      <div className="pt-2 animate-in fade-in">
                        <label className="block text-xs font-semibold text-[#5A4E42] dark:text-[#C8BCAD] mb-1">
                          Endereço para Envio Seguro *
                        </label>
                        <input
                          type="text"
                          required
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Rua, número, complemento, bairro e cidade"
                          className="w-full p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#14100E] border border-[#E0D5BE] dark:border-[#2C231E] text-xs text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#A69989] focus:outline-hidden focus:border-[#C99F3B]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Gift Packaging Checkbox */}
                  <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#14100E] border border-[#EAE2D2] dark:border-[#2C231E] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGiftPackaging}
                      onChange={(e) => setIsGiftPackaging(e.target.checked)}
                      className="w-4 h-4 accent-[#D4AF37] rounded-sm cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-[#2C241E] dark:text-[#F3EDE6]">
                      <Gift className="w-4 h-4 text-[#C99F3B]" />
                      <span>Embalagem Especial para Presente com laço de cetim</span>
                    </div>
                  </label>

                  {/* Order Notes Field */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-[#6E6052] dark:text-[#C8BCAD]">
                      Observações <span className="font-normal lowercase text-[10px] text-[#8E8071]">(aro do anel, gravação, etc.)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Ex: Anel tamanho 16; cartão com mensagem para presente..."
                      className="w-full p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#14100E] border border-[#E0D5BE] dark:border-[#2C231E] text-xs text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#A69989] focus:outline-hidden focus:border-[#C99F3B] resize-none"
                    />
                  </div>

                  {/* Price Summary */}
                  <div className="p-4 rounded-2xl bg-[#FAF5EC] dark:bg-[#18120F] border border-[#ECD9A2] dark:border-[#382F28] space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#7E7062] dark:text-[#AFA292]">
                      <span>Subtotal das peças</span>
                      <span className="font-mono">{formatBRL(totalCartAmount)}</span>
                    </div>
                    {totalCartSavings > 0 && (
                      <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                        <span>Desconto em ofertas</span>
                        <span className="font-mono">-{formatBRL(totalCartSavings)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black text-[#2C241E] dark:text-[#F3EDE6] pt-2 border-t border-[#ECD9A2]/60 dark:border-[#382F28]">
                      <span>Total</span>
                      <span className="font-mono text-[#8C6B1B] dark:text-[#D4AF37]">{formatBRL(totalCartAmount)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions */}
            {cartItems.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-[#E0D5BE] dark:border-[#2C231E] bg-[#FAF8F5] dark:bg-[#14100E] space-y-2">
                <button
                  type="button"
                  disabled={isSubmittingOrder}
                  onClick={handleFinalizeOrder}
                  className="w-full btn-gold !py-3.5 !px-6 !text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20 disabled:opacity-50"
                >
                  <MessageCircle className="w-5 h-5 text-[#1A1306]" />
                  <span>{isSubmittingOrder ? 'Registrando Pedido...' : 'Enviar Pedido ao WhatsApp da Loja ✨'}</span>
                </button>
                <p className="text-[11px] text-center text-[#8E8071] dark:text-[#9F9181]">
                  Seu pedido será registrado diretamente no sistema da loja para confirmação e atendimento.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ORDER CONFIRMATION / PEDIDO CONCLUÍDO         */}
      {/* ---------------------------------------------------- */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1A1412] rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-[#D4AF37] text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#FAF5EC] dark:bg-[#241C17] text-[#C99F3B] mx-auto flex items-center justify-center border-2 border-[#D4AF37] luxury-glow-gold">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="font-mono text-xs font-bold text-[#8C6B1B] dark:text-[#D4AF37]">
                PEDIDO #{completedOrder.orderNumber}
              </span>
              <h3 className="font-serif-luxury text-2xl font-medium text-[#2C241E] dark:text-[#F3EDE6]">
                Pedido Realizado com Sucesso!
              </h3>
              <p className="text-xs text-[#7E7062] dark:text-[#AFA292]">
                Obrigado, {customerInfo.name.split(' ')[0]}! Sua solicitação foi registrada no sistema do atelier.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#14100E] border border-[#E0D5BE] dark:border-[#2C231E] text-left text-xs space-y-2">
              <div className="flex justify-between text-[#7E7062] dark:text-[#AFA292]">
                <span>Peças Selecionadas:</span>
                <span className="font-bold text-[#2C241E] dark:text-white">{completedOrder.itemsCount} itens</span>
              </div>
              <div className="flex justify-between text-[#7E7062] dark:text-[#AFA292]">
                <span>Total:</span>
                <span className="font-mono font-bold text-[#8C6B1B] dark:text-[#D4AF37] text-sm">{formatBRL(completedOrder.total)}</span>
              </div>
              <div className="flex justify-between text-[#7E7062] dark:text-[#AFA292]">
                <span>Cliente:</span>
                <span className="text-[#2C241E] dark:text-white">{customerInfo.name}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {settings.whatsapp && (
                <button
                  onClick={() => openWhatsApp(settings.whatsapp || '', completedOrder.itemsText)}
                  className="w-full btn-gold !py-3.5 !px-6 !text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <MessageCircle className="w-5 h-5 text-[#1A1306]" />
                  <span>Reenviar / Conversar no WhatsApp</span>
                </button>
              )}

              <button
                onClick={() => setCompletedOrder(null)}
                className="w-full btn-silver !py-2.5 cursor-pointer text-xs font-bold"
              >
                Continuar Navegando na Coleção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: PRODUCT DETAIL / FOTO AMPLIADA & DETALHES      */}
      {/* ---------------------------------------------------- */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1A1412] rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl border border-[#D4AF37]/50 overflow-hidden">
            {/* Enlarged Photo Box */}
            <div className="relative aspect-4/3 sm:aspect-16/10 bg-[#FAF8F5] dark:bg-[#120E0C] flex items-center justify-center overflow-hidden">
              {getProductImage(detailProduct) ? (
                <img
                  src={getProductImage(detailProduct)}
                  alt={detailProduct.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <JewelryCategoryGraphic
                  category={detailProduct.category || 'joias'}
                  size={150}
                />
              )}
              <button
                onClick={() => setDetailProduct(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Meta & Purchase Trigger */}
            <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6B1B] dark:text-[#D4AF37]">
                  {detailProduct.category || 'Atelier'} {detailProduct.sku ? `· Ref: ${detailProduct.sku}` : ''}
                </p>
                <h3 className="font-serif-luxury text-xl sm:text-2xl font-medium text-[#2C241E] dark:text-[#F3EDE6] leading-tight mt-1">
                  {detailProduct.name}
                </h3>
              </div>

              {detailProduct.description && (
                <p className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#14100E] border border-[#E0D5BE] dark:border-[#2C231E] text-xs text-[#524436] dark:text-[#C8BCAD] leading-relaxed">
                  {detailProduct.description}
                </p>
              )}

              {/* Price Details */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF5EC] dark:bg-[#18120F] border border-[#ECD9A2] dark:border-[#382F28]">
                <div>
                  <span className="text-[11px] text-[#7E7062] dark:text-[#AFA292]">Valor da Peça:</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-mono text-xl sm:text-2xl font-black text-[#2C241E] dark:text-[#F3EDE6]">
                      {formatBRL(getEffectiveProductPrice(detailProduct).price)}
                    </span>
                    {getEffectiveProductPrice(detailProduct).isPromo && (
                      <span className="font-mono text-xs text-[#A69989] line-through">
                        {formatBRL(detailProduct.price)}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {detailProduct.stock > 0 ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      ✓ Pronta Entrega ({detailProduct.stock} un)
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      Sob Encomenda
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  onClick={() => {
                    handleAddToCart(detailProduct, 1);
                    setDetailProduct(null);
                    showToast(`${detailProduct.name} adicionado à sacola!`, 'success');
                  }}
                  className="flex-1 btn-gold !py-3 !px-4 !text-xs sm:!text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <ShoppingBag className="w-4 h-4 text-[#1A1306]" />
                  <span>Adicionar à Minha Sacola</span>
                </button>

                {settings.whatsapp && (
                  <button
                    onClick={() => {
                      const msg = `Olá! Gostaria de mais informações sobre a peça *${detailProduct.name}* (Ref: ${detailProduct.sku || 'N/A'}) que vi no catálogo.`;
                      openWhatsApp(settings.whatsapp || '', msg);
                    }}
                    className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md"
                    title="Conversar com a atendente no WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
