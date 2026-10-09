import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
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
  Gift,
  Award,
  Gem,
  Copy,
  ExternalLink,
  ArrowLeft,
  ZoomIn,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, CartItem, Order, StoreSettings } from '../../types';
import { sampleProducts } from '../../db/seedData';
import { formatBRL } from '../../utils/formatters';
import { getEffectiveProductPrice } from '../../utils/pricing';
import { openWhatsApp } from '../../utils/whatsapp';
import { JewelryCategoryGraphic } from '../common/JewelryCategoryGraphic';
import { db } from '../../db/indexedDB';
import sampleBoutiqueLogo from '../../assets/images/minha_loja_logo_1791030644359.jpg';

interface PublicCustomerInfo {
  name: string;
  phone: string;
  city?: string;
}

// Framer Motion Animation Variants for Haute Joaillerie Experience
const gridContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 28,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 24,
      stiffness: 260,
    },
  },
};

const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 26,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 12,
    transition: { duration: 0.2 },
  },
};

const drawerVariants: Variants = {
  hidden: { x: '100%', opacity: 0.8 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 28,
      stiffness: 280,
    },
  },
  exit: {
    x: '100%',
    opacity: 0.5,
    transition: { duration: 0.25, ease: 'easeInOut' },
  },
};

export const PublicCatalogView: React.FC = () => {
  const {
    products: contextProducts,
    settings: contextSettings,
    saveOrder,
    saveCustomer,
    customers,
    isLoading: contextIsLoading,
    showToast,
    refreshData,
  } = useApp();

  // Local synced data state to guarantee instant hydration and persistence
  const [syncedSettings, setSyncedSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('minha_loja_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...contextSettings, ...parsed };
      }
    } catch {}
    return contextSettings;
  });

  const [syncedProducts, setSyncedProducts] = useState<Product[]>(() => {
    try {
      const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('minha_loja_cleared') === 'true';
      if (isCleared) return [];
      if (contextProducts && contextProducts.length > 0) return contextProducts;
      const cached = localStorage.getItem('minha_loja_products_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return sampleProducts;
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Robust data loader: ensures store settings & system products are loaded immediately in public mode
  const loadFreshStoreData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Trigger AppContext refresh if available
      if (typeof refreshData === 'function') {
        await refreshData().catch(() => {});
      }

      const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('minha_loja_cleared') === 'true';

      // 2. Direct IndexedDB query for absolute consistency
      const [dbSettings, dbProducts] = await Promise.all([
        db.getSettings().catch(() => null),
        db.getAll<Product>('products').catch(() => []),
      ]);

      if (dbSettings && Object.keys(dbSettings).length > 0) {
        setSyncedSettings((prev) => ({ ...prev, ...dbSettings }));
      }

      if (isCleared) {
        setSyncedProducts([]);
      } else if (dbProducts) {
        setSyncedProducts(dbProducts);
      }
    } catch (err) {
      console.warn('Carregamento de dados da loja em modo público:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData]);

  // Sync on mount and listen to cross-tab updates or window focus
  useEffect(() => {
    loadFreshStoreData();

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === 'minha_loja_settings' ||
        e.key === 'minha_loja_products_cache' ||
        e.key === 'minha_loja_cleared'
      ) {
        loadFreshStoreData();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadFreshStoreData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadFreshStoreData]);

  // Keep synced when AppContext products update
  useEffect(() => {
    const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('minha_loja_cleared') === 'true';
    if (isCleared) {
      setSyncedProducts([]);
    } else if (contextProducts && contextProducts.length > 0) {
      setSyncedProducts(contextProducts);
    }
  }, [contextProducts]);

  useEffect(() => {
    if (contextSettings && contextSettings.storeName) {
      setSyncedSettings(contextSettings);
    }
  }, [contextSettings]);

  // Effective store configuration
  const settings = syncedSettings.storeName ? syncedSettings : contextSettings;
  const storeName = settings.storeName || (settings as any).companyName || 'Minha Loja';
  const storeTagline = settings.tagline || 'Alta Joalheria & Peças Exclusivas';
  const storeLogo = settings.logo || sampleBoutiqueLogo;
  const storePhone = settings.whatsapp || settings.phone || '';
  const storeInstagram = settings.instagram || '';
  const storeAddress = settings.address || '';
  const storeCity = [settings.city, settings.state].filter(Boolean).join(' - ');
  const storePix = settings.pixKey || '';
  const storeCnpj = settings.cnpjCpf || '';

  // Ensure products list is reactive to user's registered products and zeroed state
  const allProducts = useMemo(() => {
    const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('minha_loja_cleared') === 'true';
    if (isCleared) {
      // If store data was zeroed, delete all catalog examples as requested
      return syncedProducts && syncedProducts.length > 0 ? syncedProducts : (contextProducts && contextProducts.length > 0 ? contextProducts : []);
    }
    if (syncedProducts && syncedProducts.length > 0) {
      return syncedProducts;
    }
    if (contextProducts && contextProducts.length > 0) {
      return contextProducts;
    }
    return sampleProducts;
  }, [syncedProducts, contextProducts]);

  // 1. Customer Identification State (stored in localStorage)
  const [customerInfo, setCustomerInfo] = useState<PublicCustomerInfo | null>(() => {
    try {
      const saved = localStorage.getItem('public_catalog_customer');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
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
  const [onlyInStock, setOnlyInStock] = useState(false);
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

  // Navigation back to Admin
  const handleReturnToAdmin = () => {
    window.location.hash = '';
    if (window.location.search.includes('catalogo')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('catalogo');
      window.history.pushState({}, '', url.pathname + (url.hash || ''));
    }
    window.dispatchEvent(new Event('popstate'));
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };

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

  // Quick Guest Login (ideal for store owner testing and instant inspection)
  const handleQuickGuestAccess = () => {
    const guestInfo: PublicCustomerInfo = {
      name: 'Cliente VIP',
      phone: storePhone || '(11) 99999-9999',
      city: storeCity || 'Atelier',
    };
    try {
      localStorage.setItem('public_catalog_customer', JSON.stringify(guestInfo));
    } catch {}
    setCustomerInfo(guestInfo);
    setIsEditingCustomer(false);
  };

  // Product Categories
  const categories = useMemo(() => {
    const set = new Set(
      allProducts
        .map((p) => p.category?.trim() || 'Coleção Geral')
        .filter(Boolean)
    );
    return Array.from(set).sort();
  }, [allProducts]);

  // Active Promotional Products count
  const promoProductsCount = useMemo(() => {
    return allProducts.filter((p) => {
      const { isPromo } = getEffectiveProductPrice(p);
      return isPromo;
    }).length;
  }, [allProducts]);

  // Filtered & Sorted Products
  const displayProducts = useMemo(() => {
    return allProducts
      .filter((p) => {
        // Respect stock filter only if user clicked "Apenas Pronta Entrega"
        if (onlyInStock && p.stock <= 0) return false;

        const effective = getEffectiveProductPrice(p);
        if (onlyPromos && !effective.isPromo) return false;

        if (selectedCategory !== 'all') {
          const prodCat = (p.category || 'Coleção Geral').toLowerCase();
          if (prodCat !== selectedCategory.toLowerCase()) return false;
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
        deliveryType === 'pickup' ? `Tipo: Retirada no Atelier (${storeAddress || 'Loja Física'})` : `Tipo: Entrega em ${deliveryAddress.trim()}`,
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
        deliveryAddress: deliveryAddress.trim() || undefined,
        items: itemsForOrder,
        subtotal: totalCartAmount + totalCartSavings,
        discount: totalCartSavings,
        shipping: 0,
        total: totalCartAmount,
        status: 'novo',
        notes: finalNotes,
        createdAt: now,
        updatedAt: now,
      };

      await saveOrder(newOrder);

      // Build WhatsApp message text with haute joaillerie refinement
      const lines: string[] = [];
      lines.push(`✨ *NOVO PEDIDO NO ATELIER #${orderNumber}*`);
      lines.push(`*Loja:* ${storeName}`);
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
          ? `📍 *Recebimento:* Retirada no Atelier (${storeAddress || 'Loja Física'})`
          : `🚚 *Entrega:* ${deliveryAddress.trim()}`
      );
      if (isGiftPackaging) {
        lines.push(`🎁 *Embalagem:* Especial para Presente`);
      }
      if (orderNotes.trim()) {
        lines.push(`💬 *Detalhes:* ${orderNotes.trim()}`);
      }
      lines.push(`\nOlá! Acabei de escolher estas peças pelo Catálogo Oficial de *${storeName}*. Gostaria de confirmar a disponibilidade e os detalhes de pagamento! ✨`);

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
      if (storePhone) {
        openWhatsApp(storePhone, whatsappText);
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
    const name = storeName || 'Atelier';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [storeName]);

  // Loading State - Haute Joaillerie Splash
  if (contextIsLoading && allProducts.length === 0) {
    return (
      <div className="min-h-screen bg-[#14100E] text-[#F3EDE6] flex flex-col items-center justify-center p-6">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-full border border-[#D4AF37]/40 flex items-center justify-center luxury-glow-gold mb-6"
        >
          <Gem className="w-8 h-8 text-[#D4AF37]" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif-luxury text-2xl tracking-[0.2em] uppercase text-[#E8DFC8]"
        >
          {storeName}
        </motion.p>
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45 }}
        className="min-h-screen bg-linear-to-b from-[#FAF8F5] via-[#F4EFE6] to-[#EBE2D3] dark:from-[#14100E] dark:via-[#191411] dark:to-[#0F0C0A] flex flex-col justify-between p-4 sm:p-8 text-[#2C241E] dark:text-[#F3EDE6]"
      >
        {/* Top Atelier Branding & Admin Return Link */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mx-auto w-full pt-4 sm:pt-8 text-center space-y-3"
        >
          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E0D5BE]/60 dark:border-[#2C231E]">
            <span className="text-[11px] font-semibold text-[#8C6B1B] dark:text-[#D4AF37] tracking-wider uppercase">
              Catálogo Oficial · Acesso Exclusivo
            </span>
            <button
              onClick={handleReturnToAdmin}
              className="flex items-center gap-1.5 text-xs text-[#7E7062] hover:text-[#2C241E] dark:hover:text-white transition-colors cursor-pointer"
              title="Voltar ao painel administrativo da loja"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Painel do Lojista</span>
            </button>
          </div>

          {/* Luxury Monogram / Store Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-b from-[#2C241E] to-[#14100E] border-2 border-[#D4AF37] luxury-glow-gold shadow-2xl mx-auto">
            {storeLogo ? (
              <img
                src={storeLogo}
                alt={storeName}
                className="w-16 h-16 object-contain rounded-full"
              />
            ) : (
              <span className="font-serif-luxury text-3xl font-bold tracking-widest text-[#E6BE65]">
                {storeInitials}
              </span>
            )}
          </div>

          <div>
            <h1 className="font-serif-luxury text-3xl sm:text-4xl tracking-[0.06em] font-medium text-[#2C241E] dark:text-[#F3EDE6]">
              {storeName}
            </h1>
            <p className="text-xs tracking-[0.16em] uppercase text-[#8C6B1B] dark:text-[#D4AF37] font-semibold mt-1">
              {storeTagline}
            </p>
            {storeCity && (
              <p className="text-[11px] text-[#7E7062] dark:text-[#AFA292] mt-0.5 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3 text-[#C99F3B]" />
                <span>{storeCity}</span>
                {storeAddress && <span>· {storeAddress}</span>}
              </p>
            )}
          </div>
        </motion.header>

        {/* Real Products Preview Carousel (Proof of System Inventory) */}
        {allProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="max-w-xl mx-auto w-full my-4"
          >
            <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#1A1412]/70 border border-[#E0D5BE] dark:border-[#2C231E] backdrop-blur-xs">
              <div className="flex items-center justify-between text-[11px] text-[#8C6B1B] dark:text-[#D4AF37] font-bold uppercase tracking-wider mb-2.5">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Destaques da Coleção ({allProducts.length} peças cadastradas)
                </span>
                <span className="text-[10px] text-[#7E7062] dark:text-[#AFA292] lowercase">estoque em tempo real</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {allProducts.slice(0, 4).map((p) => {
                  const { price } = getEffectiveProductPrice(p);
                  const pImg = getProductImage(p);
                  return (
                    <div
                      key={p.id}
                      className="group bg-white dark:bg-[#14100E] rounded-xl border border-[#E8DFC8] dark:border-[#2E241E] overflow-hidden p-1.5 flex flex-col items-center text-center shadow-2xs"
                    >
                      <div className="w-full aspect-square bg-[#FAF8F5] dark:bg-[#1C1613] rounded-lg overflow-hidden flex items-center justify-center mb-1">
                        {pImg ? (
                          <img
                            src={pImg}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <JewelryCategoryGraphic category={p.category || 'joias'} size={40} />
                        )}
                      </div>
                      <p className="text-[10px] font-semibold text-[#2C241E] dark:text-white truncate w-full">
                        {p.name}
                      </p>
                      <p className="text-[11px] font-black font-mono text-[#8C6B1B] dark:text-[#D4AF37]">
                        {formatBRL(price)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Identification Form Card - Haute Couture Style */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="max-w-md mx-auto w-full my-2"
        >
          <div className="bg-white/95 dark:bg-[#1C1613]/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#E0D5BE] dark:border-[#382F28] shadow-2xl space-y-5">
            <div className="text-center space-y-1.5">
              <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#8C6B1B] dark:text-[#D4AF37]">
                Acesso Exclusivo à Vitrine
              </span>
              <h2 className="font-serif-luxury text-2xl font-normal text-[#2C241E] dark:text-[#F3EDE6]">
                Identifique-se para Visualizar
              </h2>
              <p className="text-xs text-[#7E7062] dark:text-[#AFA292] leading-relaxed max-w-xs mx-auto">
                Para consultar valores atualizados, fotos e montar sua seleção sob medida, sem senhas:
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
                  Para confirmação de disponibilidade das peças e detalhes de envio.
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

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full btn-gold !py-3.5 !px-6 !text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/25 hover:shadow-xl transition-all"
                >
                  <Sparkles className="w-4 h-4 text-[#1A1306]" />
                  <span>Acessar Coleção Exclusiva</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Quick Access button for store owner and instant preview */}
                <button
                  type="button"
                  onClick={handleQuickGuestAccess}
                  className="w-full btn-silver !py-2.5 !text-xs flex items-center justify-center gap-1.5 cursor-pointer text-[#7E7062] hover:text-[#2C241E]"
                  title="Acessa a vitrine diretamente em modo convidado / demonstração"
                >
                  <Eye className="w-3.5 h-3.5 text-[#C99F3B]" />
                  <span>Acessar Imediatamente (Visualização Rápida)</span>
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
        </motion.main>

        {/* Footer info */}
        <footer className="max-w-md mx-auto w-full text-center pb-4 text-[11px] text-[#8E8071] dark:text-[#9F9181]">
          <p>© {new Date().getFullYear()} {storeName}. {storeCity ? `${storeCity} · ` : ''}Todos os direitos reservados.</p>
        </footer>
      </motion.div>
    );
  }

  // ----------------------------------------------------
  // STEP 2: VITRINE DE LUXO / CATÁLOGO COMPLETO
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#120E0C] text-[#2C241E] dark:text-[#F3EDE6] flex flex-col pb-28 selection:bg-[#D4AF37] selection:text-white">
      {/* Editorial Luxury Top Announcement Bar */}
      <div className="bg-[#1C1613] text-[#E8DFC8] border-b border-[#2C231E] px-4 sm:px-6 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <Gem className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span className="font-serif-luxury tracking-wider text-xs sm:text-sm text-[#F3E5AB] truncate">
              {storeName} · Coleção Autoral & Peças Exclusivas
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-[11px]">
            {/* Sync live status indicator */}
            <button
              onClick={loadFreshStoreData}
              disabled={isRefreshing}
              className="flex items-center gap-1 text-[#C8BCAD] hover:text-[#F3E5AB] transition-colors cursor-pointer"
              title="Sincronizar estoque e preços em tempo real com o sistema"
            >
              <RefreshCw className={`w-3 h-3 text-[#D4AF37] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Sincronizando...' : 'Ao Vivo'}</span>
            </button>

            {storePhone && (
              <button
                onClick={() => openWhatsApp(storePhone, `Olá! Gostaria de tirar uma dúvida sobre os produtos do catálogo de ${storeName}.`)}
                className="flex items-center gap-1 hover:text-[#F3E5AB] transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            )}
            {storeInstagram && (
              <a
                href={`https://instagram.com/${storeInstagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-[#F3E5AB] transition-colors"
              >
                <Instagram className="w-3 h-3 text-pink-400" />
                <span className="hidden sm:inline">@{storeInstagram.replace('@', '')}</span>
              </a>
            )}
            {/* Merchant link to easily return to admin */}
            <button
              onClick={handleReturnToAdmin}
              className="flex items-center gap-1 text-[#D4AF37] hover:underline cursor-pointer pl-2 border-l border-[#3D3020]"
              title="Voltar ao painel administrativo da loja"
            >
              <ArrowLeft className="w-3 h-3" />
              <span className="hidden md:inline">Painel do Lojista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Luxury Storefront Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-30 bg-[#FAF8F5]/95 dark:bg-[#120E0C]/95 backdrop-blur-md border-b border-[#E8DFC8] dark:border-[#2C231E] px-4 sm:px-8 py-3.5 shadow-xs"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Emblem & Welcome */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-linear-to-b from-[#2C241E] to-[#14100E] border border-[#D4AF37] flex items-center justify-center text-[#E6BE65] font-serif-luxury font-bold text-lg sm:text-xl shrink-0 shadow-sm luxury-float">
              {storeLogo ? (
                <img
                  src={storeLogo}
                  alt={storeName}
                  className="w-8 h-8 rounded-full object-contain"
                />
              ) : (
                storeInitials
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-serif-luxury text-lg sm:text-2xl tracking-[0.06em] font-medium leading-none text-[#2C241E] dark:text-[#F3EDE6] truncate">
                {storeName}
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
              <span>Sobre o Atelier</span>
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
      </motion.header>

      {/* Hero Showcase Banner */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-6 pb-2"
      >
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
              {storeTagline || 'Explore nossa vitrine completa com fotos ampliadas, preços vigentes e pedidos online diretos pelo WhatsApp.'}
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
                {allProducts.length} Peças no Estoque Real
              </span>
              {storeCity && (
                <>
                  <span aria-hidden="true" className="text-[#645344]">·</span>
                  <span className="flex items-center gap-1 text-[#E6BE65]">
                    <MapPin className="w-3.5 h-3.5" />
                    {storeCity}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Filter, Search & Category Navigation Bar */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-4 space-y-3"
      >
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
            <span className="ml-1.5 opacity-60 text-[10px]">({allProducts.length})</span>
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
            const count = allProducts.filter((p) => (p.category || 'Coleção Geral').toLowerCase() === cat.toLowerCase()).length;
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
      </motion.section>

      {/* Product Grid Showcase with Framer Motion Staggering & Fade-in-up */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-6 flex-1">
        {displayProducts.length === 0 ? (
          allProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 px-6 bg-white/90 dark:bg-[#181310]/90 backdrop-blur-md rounded-3xl border border-[#E0D5BE] dark:border-[#2C231E] max-w-lg mx-auto shadow-xl space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-[#C99F3B]/30 flex items-center justify-center text-[#C99F3B]">
                <Sparkles className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#8C6B1B] dark:text-[#E6BE65]">
                  Catálogo Privativo
                </span>
                <h3 className="font-serif-luxury text-2xl sm:text-3xl text-[#2C241E] dark:text-[#F3EDE6]">
                  Coleção em Preparação
                </h3>
              </div>
              <p className="text-xs text-[#7E7062] dark:text-[#AFA292] max-w-md mx-auto leading-relaxed">
                Todos os dados foram resetados e não há peças cadastradas no momento. Nosso Atelier está preparando uma nova seleção exclusiva.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                {storePhone && (
                  <button
                    onClick={() =>
                      openWhatsApp(
                        storePhone,
                        `Olá! Gostaria de consultar sobre as novas peças e encomendas sob medida da loja ${storeName}.`
                      )
                    }
                    className="btn-gold !py-2.5 !px-5 !text-xs cursor-pointer flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Falar no WhatsApp</span>
                  </button>
                )}

                <button
                  onClick={handleReturnToAdmin}
                  className="btn-silver !py-2.5 !px-5 !text-xs cursor-pointer flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Acessar Painel da Loja</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 px-6 bg-white dark:bg-[#181310] rounded-3xl border border-[#E0D5BE] dark:border-[#2C231E] max-w-lg mx-auto shadow-sm space-y-4"
            >
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
            </motion.div>
          )
        ) : (
          <motion.div
            key={`${selectedCategory}-${search}-${sortBy}-${onlyPromos}-${onlyInStock}`}
            variants={gridContainerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {displayProducts.map((product) => {
              const { price: effectivePrice, isPromo } = getEffectiveProductPrice(product);
              const qtyInCart = cart[product.id] || 0;
              const photoUrl = getProductImage(product);
              const discountPercent =
                isPromo && product.price > effectivePrice
                  ? Math.round(((product.price - effectivePrice) / product.price) * 100)
                  : 0;

              return (
                <motion.div
                  key={product.id}
                  variants={cardVariants}
                  whileHover={{ y: -6, transition: { duration: 0.22, ease: 'easeOut' } }}
                  className="luxury-card-sheen group flex flex-col bg-white dark:bg-[#181310] rounded-3xl border border-[#E8DFC8] dark:border-[#2E241E] hover:border-[#C99F3B] dark:hover:border-[#C99F3B] transition-colors duration-300 overflow-hidden shadow-2xs hover:shadow-xl"
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
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>

      {/* Floating Luxury Dock (Bottom) with Framer Motion AnimatePresence */}
      <AnimatePresence>
        {totalCartCount > 0 && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="fixed bottom-4 inset-x-0 z-40 px-4 flex justify-center pointer-events-none"
          >
            <div className="pointer-events-auto bg-[#1C1613] text-[#F3EDE6] rounded-2xl p-2.5 sm:p-3 pl-4 sm:pl-5 border-2 border-[#D4AF37] luxury-glow-gold shadow-2xl flex items-center gap-4 max-w-md w-full justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-[#D4AF37] text-[#14100E] text-[10px] font-black">
                    {totalCartCount}
                  </span>
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] text-[#C8BCAD]">Sua Sacola</p>
                  <p className="font-mono font-black text-sm text-[#F3E5AB]">
                    {formatBRL(totalCartAmount)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="btn-gold !py-2 !px-4 !text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Ver Pedido</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* MODAL: SOBRE O ATELIER & INFORMAÇÕES DA LOJA         */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {showStoreInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setShowStoreInfoModal(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-xs"
            />
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-10 bg-white dark:bg-[#1A1412] rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-[#D4AF37]/50 space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E0D5BE] dark:border-[#2C231E]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-linear-to-b from-[#2C241E] to-[#14100E] border border-[#D4AF37] flex items-center justify-center">
                    {storeLogo ? (
                      <img src={storeLogo} alt={storeName} className="w-8 h-8 rounded-full object-contain" />
                    ) : (
                      <Gem className="w-5 h-5 text-[#D4AF37]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif-luxury text-xl font-bold text-[#2C241E] dark:text-[#F3EDE6]">
                      {storeName}
                    </h3>
                    <p className="text-[11px] text-[#8C6B1B] dark:text-[#D4AF37] font-semibold">
                      {storeTagline}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStoreInfoModal(false)}
                  className="w-8 h-8 rounded-full bg-[#FAF5EC] dark:bg-[#251D18] flex items-center justify-center text-[#7E7062] hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Address */}
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#14100E] border border-[#E0D5BE] dark:border-[#2C231E] flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#C99F3B] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-[#2C241E] dark:text-white text-xs">Endereço do Atelier</p>
                    <p className="text-[#524436] dark:text-[#C8BCAD] leading-relaxed">
                      {storeAddress || 'Atendimento com horário agendado ou envio direto com seguro.'}
                    </p>
                    {storeCity && (
                      <p className="text-[#8C6B1B] dark:text-[#D4AF37] font-semibold">
                        {storeCity}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contacts */}
                <div className="grid grid-cols-2 gap-2">
                  {storePhone && (
                    <button
                      onClick={() => openWhatsApp(storePhone, `Olá! Gostaria de falar com o atendimento de ${storeName}.`)}
                      className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      <div className="text-left truncate">
                        <p className="text-[10px] uppercase font-bold">WhatsApp</p>
                        <p className="font-mono text-xs font-semibold truncate">{storePhone}</p>
                      </div>
                    </button>
                  )}

                  {storeInstagram && (
                    <a
                      href={`https://instagram.com/${storeInstagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800 text-pink-800 dark:text-pink-300 flex items-center gap-2"
                    >
                      <Instagram className="w-4 h-4 shrink-0 text-pink-600" />
                      <div className="text-left truncate">
                        <p className="text-[10px] uppercase font-bold">Instagram</p>
                        <p className="text-xs font-semibold truncate">@{storeInstagram.replace('@', '')}</p>
                      </div>
                    </a>
                  )}
                </div>

                {/* CNPJ / CPF if configured */}
                {storeCnpj && (
                  <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#14100E] border border-[#E0D5BE] dark:border-[#2C231E] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-[#8C6B1B] dark:text-[#D4AF37]">
                        Registro Oficial (CNPJ/CPF)
                      </p>
                      <p className="font-mono text-xs text-[#2C241E] dark:text-[#F3EDE6]">
                        {storeCnpj}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#7E7062] dark:text-[#AFA292]">Loja Verificada</span>
                  </div>
                )}

                {/* PIX Key if configured */}
                {storePix && (
                  <div className="p-3.5 rounded-2xl bg-[#FAF5EC] dark:bg-[#1C1613] border border-[#ECD9A2] dark:border-[#382F28] flex items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-[#8C6B1B] dark:text-[#D4AF37]">
                        Chave PIX Oficial
                      </p>
                      <p className="font-mono text-xs text-[#2C241E] dark:text-[#F3EDE6] truncate select-all">
                        {storePix}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(storePix);
                        showToast('Chave PIX copiada!', 'success');
                      }}
                      className="btn-gold !py-1.5 !px-3 !text-[11px] shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </button>
                  </div>
                )}

                {/* Guarantee Seal */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#16110E] border border-[#E0D5BE] dark:border-[#2C231E] flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#C99F3B] shrink-0" />
                  <div className="text-[11px] text-[#7E7062] dark:text-[#AFA292] leading-snug">
                    <strong className="text-[#2C241E] dark:text-white block">Certificado & Garantia</strong>
                    Garantia da autenticidade dos materiais e atendimento direto pelo canal oficial.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowStoreInfoModal(false)}
                className="w-full btn-gold !py-3 !text-xs cursor-pointer"
              >
                Voltar à Coleção
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* DRAWER / MODAL: SHOPPING BAG (SACOLA DE COMPRAS)      */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-10 w-full max-w-md bg-white dark:bg-[#181310] h-full shadow-2xl border-l border-[#E0D5BE] dark:border-[#2C231E] flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#E0D5BE] dark:border-[#2C231E] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#8C6B1B] dark:text-[#D4AF37]" />
                  <h3 className="font-serif-luxury text-xl font-bold text-[#2C241E] dark:text-[#F3EDE6]">
                    Sua Sacola de Peças
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF5EC] dark:bg-[#251D18] text-[#8C6B1B] dark:text-[#D4AF37] font-mono font-bold">
                    {totalCartCount}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#FAF5EC] dark:bg-[#251D18] flex items-center justify-center text-[#7E7062] hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-full bg-[#FAF5EC] dark:bg-[#241C17] flex items-center justify-center text-[#8C6B1B]">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <h4 className="font-serif-luxury text-lg text-[#2C241E] dark:text-[#F3EDE6]">
                      Sua sacola está vazia
                    </h4>
                    <p className="text-xs text-[#7E7062] dark:text-[#AFA292] max-w-xs mx-auto">
                      Navegue pela coleção do atelier e selecione suas joias favoritas para solicitar online.
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="btn-gold !py-2 !px-4 !text-xs cursor-pointer mt-2"
                    >
                      Explorar Coleção
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <div
                          key={item.product.id}
                          className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#14100E] border border-[#EAE2D2] dark:border-[#2C231E] flex items-center gap-3"
                        >
                          <div className="w-14 h-14 rounded-xl bg-white dark:bg-[#1E1713] overflow-hidden flex items-center justify-center shrink-0 border border-[#E8DFC8] dark:border-[#2E241E]">
                            {getProductImage(item.product) ? (
                              <img
                                src={getProductImage(item.product)}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <JewelryCategoryGraphic category={item.product.category || 'joias'} size={34} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h5 className="font-serif-luxury text-sm font-medium text-[#2C241E] dark:text-[#F3EDE6] truncate">
                              {item.product.name}
                            </h5>
                            <p className="text-[10px] text-[#8C6B1B] dark:text-[#D4AF37] font-semibold">
                              Ref: {item.product.sku || 'N/A'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-xs font-bold text-[#2C241E] dark:text-white">
                                {formatBRL(item.unitPrice)}
                              </span>
                              {item.isPromo && (
                                <span className="font-mono text-[10px] text-[#A69989] line-through">
                                  {formatBRL(item.originalPrice)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity Stepper */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleAddToCart(item.product, -1)}
                              className="w-6 h-6 rounded-lg bg-white dark:bg-[#1F1915] border border-[#DDD3BF] dark:border-[#382F28] flex items-center justify-center text-xs hover:bg-red-50 hover:text-red-700 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono text-xs font-bold w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleAddToCart(item.product, 1)}
                              className="w-6 h-6 rounded-lg bg-white dark:bg-[#1F1915] border border-[#DDD3BF] dark:border-[#382F28] flex items-center justify-center text-xs hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleRemoveFromCart(item.product.id)}
                              className="w-6 h-6 ml-1 text-[#A69989] hover:text-red-600 flex items-center justify-center cursor-pointer"
                              title="Remover peça"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Selection */}
                    <div className="space-y-2 pt-2 border-t border-[#EAE2D2] dark:border-[#2C231E]">
                      <label className="block text-[11px] font-bold tracking-wider uppercase text-[#6E6052] dark:text-[#C8BCAD]">
                        Forma de Recebimento
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDeliveryType('pickup')}
                          className={`p-3 rounded-2xl text-xs font-semibold border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            deliveryType === 'pickup'
                              ? 'bg-[#FAF5EC] dark:bg-[#251D18] border-[#C99F3B] text-[#2C241E] dark:text-white shadow-xs'
                              : 'bg-white dark:bg-[#14100E] border-[#E0D5BE] dark:border-[#2C231E] text-[#7E7062]'
                          }`}
                        >
                          <Store className="w-4 h-4 text-[#C99F3B]" />
                          <span>Retirar no Atelier</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeliveryType('delivery')}
                          className={`p-3 rounded-2xl text-xs font-semibold border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            deliveryType === 'delivery'
                              ? 'bg-[#FAF5EC] dark:bg-[#251D18] border-[#C99F3B] text-[#2C241E] dark:text-white shadow-xs'
                              : 'bg-white dark:bg-[#14100E] border-[#E0D5BE] dark:border-[#2C231E] text-[#7E7062]'
                          }`}
                        >
                          <Truck className="w-4 h-4 text-[#C99F3B]" />
                          <span>Entrega / Envio</span>
                        </button>
                      </div>

                      {deliveryType === 'delivery' && (
                        <div className="space-y-1 pt-1">
                          <label className="block text-[10px] font-semibold text-[#6E6052] dark:text-[#C8BCAD]">
                            Endereço Completo para Envio *
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
                    <span>{isSubmittingOrder ? 'Registrando Pedido...' : `Enviar Pedido ao WhatsApp de ${storeName} ✨`}</span>
                  </button>
                  <p className="text-[11px] text-center text-[#8E8071] dark:text-[#9F9181]">
                    Seu pedido será registrado diretamente no sistema da loja para confirmação e atendimento.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* MODAL: ORDER CONFIRMATION / PEDIDO CONCLUÍDO         */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {completedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setCompletedOrder(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-xs"
            />
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-10 bg-white dark:bg-[#1A1412] rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-[#D4AF37] text-center space-y-5"
            >
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
                  Obrigado, {customerInfo.name.split(' ')[0]}! Sua solicitação foi registrada no sistema de {storeName}.
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
                {storePhone && (
                  <button
                    onClick={() => openWhatsApp(storePhone, completedOrder.itemsText)}
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* MODAL: PRODUCT DETAIL / FOTO AMPLIADA & DETALHES      */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {detailProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setDetailProduct(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-xs"
            />
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-10 bg-white dark:bg-[#1A1412] rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl border border-[#D4AF37]/50 overflow-hidden"
            >
              {/* Enlarged Photo Box */}
              <div className="relative aspect-4/3 sm:aspect-16/10 bg-[#FAF8F5] dark:bg-[#120E0C] flex items-center justify-center overflow-hidden group">
                {getProductImage(detailProduct) ? (
                  <img
                    src={getProductImage(detailProduct)}
                    alt={detailProduct.name}
                    className="w-full h-full object-contain group-hover:scale-125 transition-transform duration-500 cursor-zoom-in"
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

                  {storePhone && (
                    <button
                      onClick={() => {
                        const msg = `Olá! Gostaria de mais informações sobre a peça *${detailProduct.name}* (Ref: ${detailProduct.sku || 'N/A'}) que vi no catálogo de ${storeName}.`;
                        openWhatsApp(storePhone, msg);
                      }}
                      className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md"
                      title="Conversar com a atendente no WhatsApp"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
