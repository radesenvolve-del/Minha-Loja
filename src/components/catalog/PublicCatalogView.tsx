import React, { useState, useMemo, useEffect } from 'react';
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
  Tag,
  ShieldCheck,
  Truck,
  Store,
  ChevronRight,
  Filter,
  Eye,
  Heart,
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, CartItem, Order } from '../../types';
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
    products,
    settings,
    saveOrder,
    saveCustomer,
    customers,
    promotions,
    showToast,
  } = useApp();

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

  // Catalog Navigation & Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyPromos, setOnlyPromos] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(true);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'name'>('relevance');

  // Customer Shopping Bag
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
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

      showToast(`Bem-vindo(a), ${cleanName}! Boas compras ✨`, 'success');
    } catch {
      setCustomerInfo(info);
    }
  };

  // Product Categories
  const categories = useMemo(() => {
    const set = new Set(
      products
        .filter((p) => p.status !== 'inativo')
        .map((p) => p.category)
        .filter(Boolean)
    );
    return Array.from(set).sort();
  }, [products]);

  // Active Promotional Products count
  const promoProductsCount = useMemo(() => {
    return products.filter((p) => {
      if (p.status === 'inativo') return false;
      const { isPromo } = getEffectiveProductPrice(p);
      return isPromo;
    }).length;
  }, [products]);

  // Filtered & Sorted Products
  const displayProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (p.status === 'inativo') return false;
        if (onlyInStock && p.stock <= 0) return false;

        const effective = getEffectiveProductPrice(p);
        if (onlyPromos && !effective.isPromo) return false;

        if (selectedCategory !== 'all' && p.category !== selectedCategory) {
          return false;
        }

        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchCat = p.category?.toLowerCase().includes(q);
          const matchDesc = p.description?.toLowerCase().includes(q);
          const matchSku = p.sku?.toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchDesc && !matchSku) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = getEffectiveProductPrice(a).price;
        const priceB = getEffectiveProductPrice(b).price;

        if (sortBy === 'price_asc') return priceA - priceB;
        if (sortBy === 'price_desc') return priceB - priceA;
        if (sortBy === 'name') return a.name.localeCompare(b.name);

        // Relevance: promos first, then available stock, then name
        const promoA = getEffectiveProductPrice(a).isPromo ? 1 : 0;
        const promoB = getEffectiveProductPrice(b).isPromo ? 1 : 0;
        if (promoA !== promoB) return promoB - promoA;
        return (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0);
      });
  }, [products, search, selectedCategory, onlyPromos, onlyInStock, sortBy]);

  // Cart Calculations
  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const product = products.find((p) => p.id === id);
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
  }, [cart, products]);

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
      // Check stock limit if strictly in stock
      if (product.stock > 0 && next > product.stock) {
        showToast(`Limite de estoque: apenas ${product.stock} disponíveis`, 'warning');
        return { ...prev, [product.id]: product.stock };
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
        deliveryType === 'pickup' ? 'Tipo: Retirada na Loja Física' : `Tipo: Entrega em ${deliveryAddress.trim()}`,
        orderNotes.trim() ? `Observações do Cliente: ${orderNotes.trim()}` : '',
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

      // Build WhatsApp message text
      const lines: string[] = [];
      lines.push(`🛍️ *NOVO PEDIDO ONLINE #${orderNumber}*`);
      lines.push(`*Cliente:* ${customerInfo.name}`);
      lines.push(`*WhatsApp:* ${customerInfo.phone}`);
      if (customerInfo.city) lines.push(`*Cidade:* ${customerInfo.city}`);
      lines.push(`--------------------------------`);
      lines.push(`*ITENS DO PEDIDO:*`);
      cartItems.forEach((item) => {
        lines.push(`▪️ ${item.quantity}x ${item.product.name} (${formatBRL(item.unitPrice)}) = ${formatBRL(item.subtotal)}`);
      });
      lines.push(`--------------------------------`);
      lines.push(`*TOTAL DO PEDIDO: ${formatBRL(totalCartAmount)}*`);
      if (totalCartSavings > 0) {
        lines.push(`🎉 *Economia em Promoções: ${formatBRL(totalCartSavings)}*`);
      }
      lines.push(`--------------------------------`);
      lines.push(deliveryType === 'pickup' ? `📍 *Forma de Recebimento:* Retirada na Loja` : `🚚 *Endereço de Entrega:* ${deliveryAddress.trim()}`);
      if (orderNotes.trim()) {
        lines.push(`💬 *Observação:* ${orderNotes.trim()}`);
      }
      lines.push(`\nOlá! Acabei de enviar meu pedido pelo catálogo virtual da loja. Aguardo instruções para pagamento e confirmação! ✨`);

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
        openWhatsApp(settings.whatsapp, whatsappText);
      }
    } catch (err) {
      showToast('Ocorreu um erro ao processar o pedido. Tente novamente.', 'error');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // ----------------------------------------------------
  // STEP 1: ONBOARDING / IDENTIFICAÇÃO DO CLIENTE
  // ----------------------------------------------------
  if (!customerInfo || isEditingCustomer) {
    return (
      <div className="min-h-screen bg-linear-to-b from-[#FAF7F2] via-[#F4EFE6] to-[#EAE0D0] dark:from-[#181412] dark:via-[#1D1815] dark:to-[#120F0D] flex flex-col justify-between p-4 sm:p-6 text-[#2C241E] dark:text-[#F3EDE6]">
        {/* Top Branding */}
        <header className="max-w-md mx-auto w-full pt-6 sm:pt-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-linear-to-tr from-[#D4AF37] to-[#F3E5AB] shadow-lg shadow-[#D4AF37]/25 border-2 border-white dark:border-[#3A302A] mb-4">
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-[#2C241E]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2C241E] dark:text-[#F3EDE6]">
            {settings.storeName || 'Vitrine Exclusiva'}
          </h1>
          <p className="text-xs sm:text-sm text-[#7E7062] dark:text-[#B5A796] mt-1 max-w-xs mx-auto">
            Catálogo Oficial de Peças & Coleções com Preços Exclusivos e Pedidos Online
          </p>
        </header>

        {/* Identification Form Card */}
        <main className="max-w-md mx-auto w-full my-6">
          <div className="bg-white/95 dark:bg-[#231C18]/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#E8DFC8] dark:border-[#3A302A] shadow-xl shadow-[#D4AF37]/5 space-y-5">
            <div className="space-y-1 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FAF3DE] text-[#9E7317] dark:bg-[#382C15] dark:text-[#F2D68C] border border-[#ECD9A2] dark:border-[#52411E]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Acesso Seguro & Direto
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#2C241E] dark:text-[#F3EDE6] pt-1">
                Identifique-se para começar
              </h2>
              <p className="text-xs text-[#7E7062] dark:text-[#B5A796]">
                Para ver preços, fotos e montar sua sacola sem precisar criar senha ou cadastro burocrático:
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
                <label className="block text-xs font-semibold text-[#5A4E42] dark:text-[#C8BCAD] mb-1.5">
                  Seu Nome Completo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9E8E7D]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="Ex: Fernanda Lima"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FAF8F5] dark:bg-[#1A1513] border border-[#DDD4C1] dark:border-[#3D332B] text-sm text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#A89C8E] focus:outline-hidden focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4E42] dark:text-[#C8BCAD] mb-1.5">
                  Seu WhatsApp / Telefone *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9E8E7D]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={inputPhone}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FAF8F5] dark:bg-[#1A1513] border border-[#DDD4C1] dark:border-[#3D332B] text-sm text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#A89C8E] focus:outline-hidden focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all font-mono"
                  />
                </div>
                <p className="text-[11px] text-[#8E8071] dark:text-[#A19483] mt-1">
                  Usado apenas para enviar o resumo da sua compra e confirmação do pedido.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4E42] dark:text-[#C8BCAD] mb-1.5">
                  Cidade / Bairro <span className="text-[10px] font-normal text-[#8E8071]">(Opcional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9E8E7D]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={inputCity}
                    onChange={(e) => setInputCity(e.target.value)}
                    placeholder="Ex: Jardins - São Paulo"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FAF8F5] dark:bg-[#1A1513] border border-[#DDD4C1] dark:border-[#3D332B] text-sm text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#A89C8E] focus:outline-hidden focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-2xl bg-linear-to-r from-[#D4AF37] via-[#DFBF58] to-[#B8942A] hover:from-[#DFBF58] hover:to-[#A88620] text-[#1E170A] font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/25 hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Acessar Catálogo & Promoções</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {isEditingCustomer && customerInfo && (
                <button
                  type="button"
                  onClick={() => setIsEditingCustomer(false)}
                  className="w-full py-2 text-xs text-[#8E8071] hover:text-[#2C241E] dark:hover:text-white transition-colors"
                >
                  Cancelar alteração e voltar
                </button>
              )}
            </form>

            <div className="pt-3 border-t border-[#EFE8DA] dark:border-[#332A24] flex items-center justify-between text-[11px] text-[#8E8071] dark:text-[#9F9181]">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                Estoque em tempo real
              </span>
              <span>🔒 100% Seguro</span>
            </div>
          </div>
        </main>

        {/* Footer info */}
        <footer className="max-w-md mx-auto w-full text-center pb-4 text-xs text-[#8E8071] dark:text-[#9F9181]">
          <p>© {new Date().getFullYear()} {settings.storeName}. Todos os direitos reservados.</p>
        </footer>
      </div>
    );
  }

  // ----------------------------------------------------
  // STEP 2: VITRINE / CATÁLOGO COMPLETO DO CLIENTE
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#14100E] text-[#2C241E] dark:text-[#F3EDE6] flex flex-col pb-24">
      {/* Top Banner Notice */}
      <div className="bg-linear-to-r from-[#2C241E] to-[#4A3B30] text-[#F3E5AB] px-4 py-2 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#D4AF37]" />
          <span className="font-medium truncate">
            Bem-vindo(a) à nossa Vitrine Oficial! Peças exclusivas com pronta entrega.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 pl-2">
          {settings.whatsapp && (
            <button
              onClick={() => openWhatsApp(settings.whatsapp || '', 'Olá! Gostaria de tirar uma dúvida sobre os produtos do catálogo.')}
              className="flex items-center gap-1 hover:underline text-[11px]"
            >
              <MessageCircle className="w-3 h-3 text-emerald-400" />
              <span>WhatsApp</span>
            </button>
          )}
          {settings.instagram && (
            <a
              href={`https://instagram.com/${settings.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:underline text-[11px]"
            >
              <Instagram className="w-3 h-3 text-pink-400" />
              <span className="hidden sm:inline">@{settings.instagram.replace('@', '')}</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Store Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#1D1714]/95 backdrop-blur-md border-b border-[#E8DFC8] dark:border-[#382F28] px-4 sm:px-6 py-3.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Store Logo & Client Welcome */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-linear-to-tr from-[#D4AF37] to-[#F3E5AB] flex items-center justify-center text-[#2C241E] font-black shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight text-[#2C241E] dark:text-[#F3EDE6]">
                {settings.storeName || 'Vitrine Digital'}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-[#7E7062] dark:text-[#B5A796]">
                <span>Olá, <strong className="text-[#2C241E] dark:text-white font-semibold">{customerInfo.name.split(' ')[0]}</strong></span>
                <span>•</span>
                <button
                  onClick={() => setIsEditingCustomer(true)}
                  className="text-[#9E7317] dark:text-[#F2D68C] hover:underline cursor-pointer"
                >
                  (alterar)
                </button>
              </div>
            </div>
          </div>

          {/* Cart Trigger Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative py-2 px-3 sm:px-4 rounded-2xl bg-[#2C241E] hover:bg-[#3D322A] text-white dark:bg-[#D4AF37] dark:text-[#1F170A] dark:hover:bg-[#E0BC45] flex items-center gap-2 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Minha Sacola</span>
              {totalCartCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#D4AF37] text-[#2C241E] dark:bg-[#2C241E] dark:text-[#F3EDE6] text-[10px] font-black">
                  {totalCartCount}
                </span>
              )}
              {totalCartAmount > 0 && (
                <span className="font-extrabold pl-1 border-l border-white/20 dark:border-black/20 text-xs">
                  {formatBRL(totalCartAmount)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Promotional Callout Banner if available */}
      {promoProductsCount > 0 && (
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div className="rounded-2xl p-4 bg-linear-to-r from-[#D4AF37]/15 via-[#F3E5AB]/25 to-[#D4AF37]/10 dark:from-[#3D3015] dark:via-[#4D3D1A] dark:to-[#332812] border border-[#ECD9A2] dark:border-[#634E22] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-black flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#9E7317] dark:text-[#F2D68C]">
                    Ofertas Especiais
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37] text-[#2C241E]">
                    {promoProductsCount} {promoProductsCount === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                <p className="text-xs text-[#524436] dark:text-[#D5C6B5] mt-0.5">
                  Aproveite descontos exclusivos por tempo limitado diretamente no nosso catálogo!
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setOnlyPromos(!onlyPromos);
                setSelectedCategory('all');
              }}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                onlyPromos
                  ? 'bg-[#2C241E] text-white dark:bg-white dark:text-black'
                  : 'bg-[#D4AF37] text-[#2C241E] hover:bg-[#E0BC45]'
              }`}
            >
              {onlyPromos ? 'Ver Todas as Peças' : '🔥 Ver Apenas Promoções'}
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9E8E7D]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por anel, brinco, colar, prata, ouro..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-[#1E1714] border border-[#E3DAC7] dark:border-[#382F28] text-xs sm:text-sm text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#A6998A] focus:outline-hidden focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9E8E7D] hover:text-[#2C241E] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters & Sorting */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-2.5 px-3 rounded-2xl bg-white dark:bg-[#1E1714] border border-[#E3DAC7] dark:border-[#382F28] text-xs font-semibold text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:border-[#D4AF37] shadow-xs cursor-pointer"
            >
              <option value="relevance">Destaques</option>
              <option value="price_asc">Menor Preço</option>
              <option value="price_desc">Maior Preço</option>
              <option value="name">Nome (A-Z)</option>
            </select>

            <button
              onClick={() => setOnlyInStock(!onlyInStock)}
              className={`py-2 px-3 rounded-2xl text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer ${
                onlyInStock
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-white dark:bg-[#1E1714] border-[#E3DAC7] dark:border-[#382F28] text-[#7E7062] dark:text-[#B5A796]'
              }`}
            >
              {onlyInStock ? '✓ Pronta Entrega' : 'Todos'}
            </button>
          </div>
        </div>

        {/* Category Carousel Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setOnlyPromos(false);
            }}
            className={`py-2 px-4 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'all' && !onlyPromos
                ? 'bg-[#2C241E] text-white dark:bg-[#D4AF37] dark:text-[#1F170A] shadow-sm'
                : 'bg-white dark:bg-[#1E1714] border border-[#E3DAC7] dark:border-[#382F28] text-[#5A4E42] dark:text-[#D5C6B5] hover:border-[#D4AF37]'
            }`}
          >
            <span>Todas as Peças</span>
            <span className="text-[10px] opacity-75">({products.filter((p) => p.status !== 'inativo').length})</span>
          </button>

          {promoProductsCount > 0 && (
            <button
              onClick={() => {
                setOnlyPromos(true);
                setSelectedCategory('all');
              }}
              className={`py-2 px-4 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                onlyPromos
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 hover:border-red-400'
              }`}
            >
              <span>🔥 Promoções</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-600 text-white">
                {promoProductsCount}
              </span>
            </button>
          )}

          {categories.map((cat) => {
            const count = products.filter((p) => p.status !== 'inativo' && p.category === cat).length;
            const isSelected = selectedCategory === cat && !onlyPromos;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setOnlyPromos(false);
                }}
                className={`py-2 px-4 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#2C241E] text-white dark:bg-[#D4AF37] dark:text-[#1F170A] shadow-sm'
                    : 'bg-white dark:bg-[#1E1714] border border-[#E3DAC7] dark:border-[#382F28] text-[#5A4E42] dark:text-[#D5C6B5] hover:border-[#D4AF37]'
                }`}
              >
                <span>{cat}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid Area */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-5 flex-1">
        {displayProducts.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-[#1C1613] rounded-3xl border border-[#E8DFC8] dark:border-[#382F28] p-8 max-w-md mx-auto my-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF5EC] dark:bg-[#28201B] flex items-center justify-center text-[#9E8E7D] mb-3">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#2C241E] dark:text-[#F3EDE6]">
              Nenhum produto encontrado
            </h3>
            <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-1 mb-4">
              Tente alterar os termos de busca ou remover os filtros aplicados.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
                setOnlyPromos(false);
                setOnlyInStock(false);
              }}
              className="py-2 px-4 rounded-xl bg-[#2C241E] text-white text-xs font-semibold hover:bg-black transition-colors"
            >
              Limpar Todos os Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {displayProducts.map((product) => {
              const { price: effectivePrice, isPromo } = getEffectiveProductPrice(product);
              const qtyInCart = cart[product.id] || 0;
              const discountPercent =
                isPromo && product.price > effectivePrice
                  ? Math.round(((product.price - effectivePrice) / product.price) * 100)
                  : 0;

              return (
                <div
                  key={product.id}
                  className="group flex flex-col bg-white dark:bg-[#1E1714] rounded-2xl sm:rounded-3xl border border-[#E8DFC8] dark:border-[#382F28] hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md"
                >
                  {/* Product Image Box */}
                  <div
                    onClick={() => setDetailProduct(product)}
                    className="relative aspect-square w-full bg-[#FAF7F2] dark:bg-[#15110F] overflow-hidden flex items-center justify-center cursor-pointer"
                  >
                    {product.photo ? (
                      <img
                        src={product.photo}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <JewelryCategoryGraphic
                        category={product.category || 'joias'}
                        size={100}
                        className="opacity-90 group-hover:scale-105 transition-transform duration-300"
                      />
                    )}

                    {/* Promo or Status Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
                      {isPromo && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-red-600 text-white shadow-xs">
                          {discountPercent > 0 ? `-${discountPercent}%` : 'OFERTA'}
                        </span>
                      )}
                      {product.stock > 0 && product.stock <= 3 && (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-amber-500 text-white shadow-xs">
                          Últimas {product.stock} un.
                        </span>
                      )}
                    </div>

                    {/* Zoom icon on hover */}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="p-2 rounded-full bg-white/90 dark:bg-black/80 text-[#2C241E] dark:text-white shadow-sm">
                        <Eye className="w-4 h-4" />
                      </span>
                    </div>

                    {/* Stock Status Badge */}
                    <div className="absolute bottom-2 right-2">
                      {product.stock > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-white/90 dark:bg-black/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Em estoque
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-white/90 dark:bg-black/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-2xs">
                          Sob Encomenda
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Details & Pricing */}
                  <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-2.5">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9E8E7D] dark:text-[#A89886]">
                        {product.category || 'Joalheria'}
                      </span>
                      <h4
                        onClick={() => setDetailProduct(product)}
                        className="text-xs sm:text-sm font-bold text-[#2C241E] dark:text-[#F3EDE6] line-clamp-2 leading-snug cursor-pointer hover:text-[#9E7317] dark:hover:text-[#F2D68C] transition-colors"
                        title={product.name}
                      >
                        {product.name}
                      </h4>
                    </div>

                    <div>
                      {/* Price Row */}
                      <div className="space-y-0.5">
                        {isPromo && product.price > effectivePrice && (
                          <div className="text-[11px] text-[#A89C8E] line-through font-medium">
                            {formatBRL(product.price)}
                          </div>
                        )}
                        <div className="text-sm sm:text-base font-black text-[#2C241E] dark:text-[#F3EDE6]">
                          {formatBRL(effectivePrice)}
                        </div>
                        {effectivePrice >= 60 && (
                          <p className="text-[10px] text-[#8E8071] dark:text-[#A89886]">
                            ou 3x de {formatBRL(effectivePrice / 3)}
                          </p>
                        )}
                      </div>

                      {/* Add to Cart or Stepper */}
                      <div className="mt-3 pt-2 border-t border-[#F2ECE0] dark:border-[#2C241E]">
                        {qtyInCart > 0 ? (
                          <div className="flex items-center justify-between bg-[#FAF5EC] dark:bg-[#28201B] rounded-xl p-1 border border-[#ECD9A2] dark:border-[#4A3B22]">
                            <button
                              onClick={() => handleAddToCart(product, -1)}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-[#1E1714] text-[#2C241E] dark:text-white flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer shadow-2xs"
                              title="Diminuir"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black text-[#2C241E] dark:text-white px-2">
                              {qtyInCart}
                            </span>
                            <button
                              onClick={() => handleAddToCart(product, 1)}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-[#1E1714] text-[#2C241E] dark:text-white flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer shadow-2xs"
                              title="Aumentar"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(product, 1)}
                            className="w-full py-2 px-3 rounded-xl bg-[#2C241E] hover:bg-[#3D322A] text-white dark:bg-[#D4AF37] dark:text-[#1F170A] dark:hover:bg-[#E0BC45] text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Adicionar</span>
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

      {/* Floating Cart Bar (Bottom Mobile/Desktop) */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="bg-[#2C241E] text-white rounded-3xl p-3 sm:p-4 shadow-2xl border border-white/20 flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#D4AF37] text-[#2C241E] flex items-center justify-center font-black relative shrink-0">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-black">
                  {totalCartCount}
                </span>
              </div>
              <div>
                <p className="text-xs text-[#E3DAC7] leading-none">
                  {totalCartCount} {totalCartCount === 1 ? 'item na sacola' : 'itens na sacola'}
                </p>
                <p className="text-sm sm:text-base font-black text-white mt-0.5">
                  Total: {formatBRL(totalCartAmount)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="py-2.5 px-5 rounded-2xl bg-[#D4AF37] hover:bg-[#E0BC45] text-[#1E170A] font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <span>Ver Sacola & Pedir</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: SHOPPING BAG / SACOLA DE COMPRAS & CHECKOUT   */}
      {/* ---------------------------------------------------- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1E1714] rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-[#E8DFC8] dark:border-[#382F28] overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#E8DFC8] dark:border-[#382F28] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF5EC] dark:bg-[#2C241E] text-[#D4AF37] flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#2C241E] dark:text-[#F3EDE6]">
                    Sua Sacola de Compras
                  </h3>
                  <p className="text-xs text-[#7E7062] dark:text-[#B5A796]">
                    {totalCartCount} {totalCartCount === 1 ? 'peça selecionada' : 'peças selecionadas'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF5EC] dark:bg-[#2C241E] text-[#7E7062] hover:text-[#2C241E] dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <ShoppingBag className="w-12 h-12 mx-auto text-[#A89C8E]" />
                  <p className="text-sm font-semibold text-[#7E7062] dark:text-[#B5A796]">
                    Sua sacola está vazia.
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="py-2 px-4 rounded-xl bg-[#D4AF37] text-[#2C241E] text-xs font-bold"
                  >
                    Explorar Produtos
                  </button>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#171210] border border-[#EFE8DA] dark:border-[#2C241E]"
                      >
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-xl bg-white dark:bg-[#201A17] overflow-hidden shrink-0 flex items-center justify-center border border-[#E8DFC8] dark:border-[#382F28]">
                          {item.product.photo ? (
                            <img
                              src={item.product.photo}
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
                          <h5 className="text-xs font-bold text-[#2C241E] dark:text-[#F3EDE6] truncate">
                            {item.product.name}
                          </h5>
                          <div className="flex items-center gap-1.5 text-xs mt-0.5">
                            <span className="font-bold text-[#2C241E] dark:text-[#F3EDE6]">
                              {formatBRL(item.unitPrice)}
                            </span>
                            {item.isPromo && (
                              <span className="text-[10px] text-[#A89C8E] line-through">
                                {formatBRL(item.originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stepper & Trash */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center bg-white dark:bg-[#201A17] rounded-xl border border-[#E8DFC8] dark:border-[#382F28] p-0.5">
                            <button
                              onClick={() => handleAddToCart(item.product, -1)}
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-[#7E7062] hover:text-[#2C241E] dark:hover:text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-black px-2">{item.quantity}</span>
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
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Mode Choice */}
                  <div className="space-y-2 pt-2 border-t border-[#E8DFC8] dark:border-[#382F28]">
                    <label className="block text-xs font-bold text-[#5A4E42] dark:text-[#C8BCAD]">
                      Forma de Recebimento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('pickup')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                          deliveryType === 'pickup'
                            ? 'bg-[#FAF3DE] dark:bg-[#382C15] border-[#D4AF37] text-[#9E7317] dark:text-[#F2D68C]'
                            : 'bg-white dark:bg-[#1A1412] border-[#E8DFC8] dark:border-[#382F28] text-[#7E7062]'
                        }`}
                      >
                        <Store className="w-4 h-4" />
                        <span>Retirar na Loja (Grátis)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryType('delivery')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                          deliveryType === 'delivery'
                            ? 'bg-[#FAF3DE] dark:bg-[#382C15] border-[#D4AF37] text-[#9E7317] dark:text-[#F2D68C]'
                            : 'bg-white dark:bg-[#1A1412] border-[#E8DFC8] dark:border-[#382F28] text-[#7E7062]'
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                        <span>Entrega / Delivery</span>
                      </button>
                    </div>

                    {deliveryType === 'delivery' && (
                      <div className="pt-2 animate-in fade-in">
                        <label className="block text-xs font-semibold text-[#5A4E42] dark:text-[#C8BCAD] mb-1">
                          Endereço para Entrega *
                        </label>
                        <input
                          type="text"
                          required
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Rua, número, complemento e bairro"
                          className="w-full p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#171210] border border-[#E8DFC8] dark:border-[#382F28] text-xs text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#A6998A] focus:outline-hidden focus:border-[#D4AF37]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Order Notes Field */}
                  <div className="space-y-1 pt-1">
                    <label className="block text-xs font-bold text-[#5A4E42] dark:text-[#C8BCAD]">
                      Observações <span className="font-normal text-[10px] text-[#8E8071]">(aro de anel, presente, etc.)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Ex: Embalar para presente; aro do anel tamanho 16..."
                      className="w-full p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#171210] border border-[#E8DFC8] dark:border-[#382F28] text-xs text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#A6998A] focus:outline-hidden focus:border-[#D4AF37] resize-none"
                    />
                  </div>

                  {/* Price Summary */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF5EC] dark:bg-[#1A1412] border border-[#ECD9A2] dark:border-[#4A3B22] space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#7E7062] dark:text-[#B5A796]">
                      <span>Subtotal dos produtos</span>
                      <span>{formatBRL(totalCartAmount)}</span>
                    </div>
                    {totalCartSavings > 0 && (
                      <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                        <span>Você economizou</span>
                        <span>-{formatBRL(totalCartSavings)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black text-[#2C241E] dark:text-[#F3EDE6] pt-1.5 border-t border-[#ECD9A2]/60 dark:border-[#4A3B22]">
                      <span>Total do Pedido</span>
                      <span className="text-[#9E7317] dark:text-[#F2D68C]">{formatBRL(totalCartAmount)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions */}
            {cartItems.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-[#E8DFC8] dark:border-[#382F28] bg-[#FAF8F5] dark:bg-[#171210] space-y-2">
                <button
                  type="button"
                  disabled={isSubmittingOrder}
                  onClick={handleFinalizeOrder}
                  className="w-full py-3.5 px-6 rounded-2xl bg-linear-to-r from-[#D4AF37] via-[#DFBF58] to-[#B8942A] hover:from-[#DFBF58] hover:to-[#A88620] text-[#1E170A] font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>{isSubmittingOrder ? 'Processando Pedido...' : 'Concluir Pedido Online ✨'}</span>
                </button>
                <p className="text-[11px] text-center text-[#8E8071] dark:text-[#A19483]">
                  Seu pedido será registrado e enviado para o WhatsApp da loja para confirmação imediata.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1E1714] rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-[#E8DFC8] dark:border-[#382F28] text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF3DE] text-[#9E7317] dark:bg-[#382C15] dark:text-[#F2D68C]">
                Pedido #{completedOrder.orderNumber}
              </span>
              <h3 className="text-xl font-black text-[#2C241E] dark:text-[#F3EDE6] pt-1">
                Pedido Realizado com Sucesso!
              </h3>
              <p className="text-xs text-[#7E7062] dark:text-[#B5A796]">
                Obrigado, {customerInfo.name.split(' ')[0]}! Seu pedido já está registrado no sistema da loja.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#171210] border border-[#E8DFC8] dark:border-[#382F28] text-left text-xs space-y-1.5">
              <div className="flex justify-between text-[#7E7062]">
                <span>Itens:</span>
                <span className="font-bold text-[#2C241E] dark:text-white">{completedOrder.itemsCount} peças</span>
              </div>
              <div className="flex justify-between text-[#7E7062]">
                <span>Total:</span>
                <span className="font-extrabold text-[#D4AF37] text-sm">{formatBRL(completedOrder.total)}</span>
              </div>
              <div className="flex justify-between text-[#7E7062]">
                <span>Cliente:</span>
                <span className="text-[#2C241E] dark:text-white">{customerInfo.name}</span>
              </div>
            </div>

            <div className="space-y-2">
              {settings.whatsapp && (
                <button
                  onClick={() => openWhatsApp(settings.whatsapp || '', completedOrder.itemsText)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-98 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Abrir / Reenviar no WhatsApp</span>
                </button>
              )}

              <button
                onClick={() => setCompletedOrder(null)}
                className="w-full py-2.5 px-4 rounded-2xl bg-[#FAF5EC] dark:bg-[#2C241E] hover:bg-[#EFE8DA] text-[#2C241E] dark:text-[#F3EDE6] text-xs font-bold transition-colors cursor-pointer"
              >
                Continuar Navegando no Catálogo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: PRODUCT DETAIL / FOTO AMPLIADA & DETALHES      */}
      {/* ---------------------------------------------------- */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1E1714] rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-[#E8DFC8] dark:border-[#382F28] overflow-hidden">
            <div className="relative aspect-4/3 sm:aspect-16/10 bg-[#FAF7F2] dark:bg-[#120E0C] flex items-center justify-center overflow-hidden">
              {detailProduct.photo ? (
                <img
                  src={detailProduct.photo}
                  alt={detailProduct.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <JewelryCategoryGraphic
                  category={detailProduct.category || 'joias'}
                  size={140}
                />
              )}
              <button
                onClick={() => setDetailProduct(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                  {detailProduct.category || 'Joalheria Fina'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#2C241E] dark:text-[#F3EDE6] leading-tight">
                  {detailProduct.name}
                </h3>
                {detailProduct.sku && (
                  <p className="text-[11px] text-[#8E8071] font-mono mt-0.5">
                    Ref / SKU: {detailProduct.sku}
                  </p>
                )}
              </div>

              {detailProduct.description && (
                <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#171210] border border-[#E8DFC8] dark:border-[#382F28] text-xs text-[#5A4E42] dark:text-[#C8BCAD] leading-relaxed">
                  {detailProduct.description}
                </div>
              )}

              {/* Price Details */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF5EC] dark:bg-[#201A16] border border-[#ECD9A2] dark:border-[#4A3B22]">
                <div>
                  <span className="text-[11px] text-[#7E7062]">Valor da Peça:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-[#2C241E] dark:text-[#F3EDE6]">
                      {formatBRL(getEffectiveProductPrice(detailProduct).price)}
                    </span>
                    {getEffectiveProductPrice(detailProduct).isPromo && (
                      <span className="text-xs text-[#A89C8E] line-through">
                        {formatBRL(detailProduct.price)}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {detailProduct.stock > 0 ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      ✓ Em estoque ({detailProduct.stock} un)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      Sob Encomenda
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    handleAddToCart(detailProduct, 1);
                    setDetailProduct(null);
                    showToast(`${detailProduct.name} adicionado à sacola!`, 'success');
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#2C241E] hover:bg-black text-white dark:bg-[#D4AF37] dark:text-[#1F170A] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Adicionar à Minha Sacola</span>
                </button>

                {settings.whatsapp && (
                  <button
                    onClick={() => {
                      const msg = `Olá! Tenho interesse na peça *${detailProduct.name}* (Ref: ${detailProduct.sku || 'N/A'}) vista no catálogo.`;
                      openWhatsApp(settings.whatsapp || '', msg);
                    }}
                    className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    title="Tirar dúvida no WhatsApp"
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
