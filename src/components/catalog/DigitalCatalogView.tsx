import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Share2,
  QrCode,
  MessageCircle,
  Search,
  ShoppingBag,
  ExternalLink,
  Store,
  Tag,
  Check,
  Instagram,
  Sparkles,
  Eye,
  X,
  Copy,
  Printer,
  ShieldCheck,
  UserCheck,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { formatBRL } from '../../utils/formatters';
import { getEffectiveProductPrice } from '../../utils/pricing';
import { generateQRCode } from '../../utils/barcodes';
import { openWhatsApp } from '../../utils/whatsapp';
import { Modal } from '../common/Modal';
import { InstagramCardGeneratorModal } from './InstagramCardGeneratorModal';
import { JewelryCategoryGraphic } from '../common/JewelryCategoryGraphic';

export const DigitalCatalogView: React.FC = () => {
  const { products, settings, saveOrder, showToast, selectedCategory, setSelectedCategory } = useApp();
  const [search, setSearch] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [catalogQrUrl, setCatalogQrUrl] = useState('');

  // Card modal state
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedCardProduct, setSelectedCardProduct] = useState<Product | null>(null);

  // Photo viewer modal
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<{ url: string; title: string; price?: number } | null>(null);

  // Selected items in customer showcase bag
  const [customerBag, setCustomerBag] = useState<{ [productId: string]: number }>({});

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  // Counts per category for the circular badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      if (p.category && p.status !== 'inativo') {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const displayProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status === 'inativo') return false;
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCategory]);

  const getPublicCatalogUrl = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?catalogo=1`;
  };

  const handleOpenShare = async () => {
    const catalogUrl = getPublicCatalogUrl();
    const qr = await generateQRCode(catalogUrl);
    setCatalogQrUrl(qr);
    setShowShareModal(true);
  };

  const handleCopyPublicLink = () => {
    const url = getPublicCatalogUrl();
    navigator.clipboard.writeText(url);
    showToast('Link do catálogo público copiado!', 'success');
  };

  const handleOpenAsCustomer = () => {
    window.open(getPublicCatalogUrl(), '_blank');
  };

  const handleOpenCard = (product?: Product | null) => {
    setSelectedCardProduct(product || products[0] || null);
    setIsCardModalOpen(true);
  };

  const handleToggleBagItem = (productId: string) => {
    setCustomerBag((prev) => {
      const current = prev[productId] || 0;
      if (current > 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: 1 };
    });
  };

  // Order via WhatsApp
  const handleOrderViaWhatsApp = () => {
    const bagItems = Object.entries(customerBag)
      .map(([id, qty]) => {
        const prod = products.find((p) => p.id === id);
        return prod ? { ...prod, bagQty: qty } : null;
      })
      .filter(Boolean) as (Product & { bagQty: number })[];

    if (bagItems.length === 0) {
      showToast('Selecione ao menos um produto no catálogo.', 'warning');
      return;
    }

    const lines: string[] = [];
    lines.push(`🛍️ *Olá, ${settings.storeName}!*`);
    lines.push(`Gostaria de fazer o pedido dos seguintes itens do catálogo:`);
    lines.push(`--------------------------------`);

    let totalVal = 0;
    bagItems.forEach((item) => {
      const { price } = getEffectiveProductPrice(item);
      const sub = price * item.bagQty;
      totalVal += sub;
      lines.push(`▪️ ${item.bagQty}x ${item.name} (${formatBRL(price)})`);
    });

    lines.push(`--------------------------------`);
    lines.push(`*Total Estimado: ${formatBRL(totalVal)}*`);
    lines.push(`\nPor favor, informe a disponibilidade para envio/retirada! Obrigado! ✨`);

    // Register online order directly in the store Kanban pipeline
    try {
      const orderItems = bagItems.map((item) => {
        const { price } = getEffectiveProductPrice(item);
        return {
          productId: item.id,
          name: item.name,
          sku: item.sku,
          unitPrice: price,
          originalPrice: item.price,
          cost: item.cost,
          minPrice: item.minPrice,
          quantity: item.bagQty,
          discount: 0,
          total: price * item.bagQty,
        };
      });

      const orderNumber = `${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date().toISOString();
      saveOrder({
        id: `ord_${Date.now()}`,
        orderNumber,
        date: now,
        customerName: 'Cliente Online (Catálogo)',
        items: orderItems,
        subtotal: totalVal,
        discount: 0,
        shipping: 0,
        total: totalVal,
        origin: 'whatsapp',
        status: 'novo',
        notes: `Pedido #${orderNumber} gerado automaticamente via Catálogo Digital`,
        createdAt: now,
        updatedAt: now,
      });
      showToast(`Pedido #${orderNumber} adicionado ao Kanban de Pedidos e preparado no WhatsApp!`, 'success');
    } catch {
      // Fallback: still open WhatsApp even if local order save had an issue
    }

    openWhatsApp(settings.whatsapp || '', lines.join('\n'));
    setCustomerBag({});
  };

  const bagCount = Object.keys(customerBag).length;

  return (
    <div className="space-y-5">
      {/* Dedicated Public Catalog Section */}
      <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-br from-[#FAF3DE] via-[#FFFDF9] to-[#F5ECE0] dark:from-[#292014] dark:via-[#1F1914] dark:to-[#171310] border-2 border-[#D4AF37]/50 dark:border-[#D4AF37]/40 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-[#D4AF37] to-[#F3E5AB] flex items-center justify-center text-[#2C241E] shadow-sm shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-[#2C241E] dark:text-[#F3EDE6]">
                  Área Pública e Exclusiva do Catálogo
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#D4AF37] text-[#2C241E]">
                  Área do Cliente
                </span>
              </div>
              <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
                Vitrine pública para divulgação via link ou QR Code no Instagram, WhatsApp ou balcão físico. Totalmente isolada do painel administrativo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleOpenAsCustomer}
              className="flex-1 sm:flex-none btn-gold !py-2 !px-3.5 !text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir como Cliente</span>
            </button>
            <button
              onClick={handleOpenShare}
              className="flex-1 sm:flex-none btn-silver !py-2 !px-3.5 !text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Ver QR Code / Placa</span>
            </button>
          </div>
        </div>

        {/* Link box with 1-click copy */}
        <div className="p-3 rounded-2xl bg-white dark:bg-[#181310] border border-[#ECD9A2] dark:border-[#3D3020] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-bold text-[#8C6B1B] dark:text-[#F2D68C] shrink-0 uppercase tracking-wider">
              Link Público:
            </span>
            <span className="text-xs font-mono text-[#524436] dark:text-[#D5C6B5] truncate select-all">
              {getPublicCatalogUrl()}
            </span>
          </div>
          <button
            onClick={handleCopyPublicLink}
            className="py-1.5 px-3 rounded-xl bg-[#2C241E] hover:bg-black text-white dark:bg-[#D4AF37] dark:text-[#1F170A] text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar Link Exclusivo</span>
          </button>
        </div>

        {/* 4 Key Pillars of Public Catalog */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#1D1714]/80 border border-[#E8DFC8] dark:border-[#382F28] flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="leading-tight">
              <p className="font-bold text-[11px] text-[#2C241E] dark:text-white">Totalmente Separado</p>
              <p className="text-[10px] text-[#7E7062] dark:text-[#AFA292]">Sem acesso ao painel interno</p>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#1D1714]/80 border border-[#E8DFC8] dark:border-[#382F28] flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <div className="leading-tight">
              <p className="font-bold text-[11px] text-[#2C241E] dark:text-white">Identificação Prévia</p>
              <p className="text-[10px] text-[#7E7062] dark:text-[#AFA292]">Pede Nome e WhatsApp sem senha</p>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#1D1714]/80 border border-[#E8DFC8] dark:border-[#382F28] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="leading-tight">
              <p className="font-bold text-[11px] text-[#2C241E] dark:text-white">Preços & Estoque Reais</p>
              <p className="text-[10px] text-[#7E7062] dark:text-[#AFA292]">Sincronizados em tempo real</p>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#1D1714]/80 border border-[#E8DFC8] dark:border-[#382F28] flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <div className="leading-tight">
              <p className="font-bold text-[11px] text-[#2C241E] dark:text-white">Pedidos no Kanban</p>
              <p className="text-[10px] text-[#7E7062] dark:text-[#AFA292]">Direto na sua esteira e Zap</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-[#2C241E] dark:text-[#F3EDE6] uppercase tracking-tight">
              Catálogo Digital & Redes Sociais
            </h2>
            <span className="badge-gold">
              Vitrine
            </span>
          </div>
          <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
            Vitrine para divulgação no Instagram, status do WhatsApp e geração de cards de venda prontos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Gerar Card Insta/Zap */}
          <button
            onClick={() => handleOpenCard(null)}
            className="btn-gold !py-2 !px-3.5 !text-xs cursor-pointer shadow-xs"
          >
            <Instagram className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Gerar Card Insta/Zap</span>
          </button>

          {bagCount > 0 && (
            <button
              onClick={handleOrderViaWhatsApp}
              className="btn-gold !py-2 !px-3.5 !text-xs cursor-pointer animate-pulse shadow-xs"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={1.75} />
              <span>Pedir no Zap ({bagCount})</span>
            </button>
          )}

          <button
            onClick={handleOpenShare}
            className="btn-silver !py-2 !px-3.5 !text-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#556070] dark:text-[#CBD5E1]" strokeWidth={1.75} />
            <span>Compartilhar Link</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#8E8071]" strokeWidth={1.75} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar produtos no catálogo..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/50 dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] placeholder:text-[#8E8071] focus:outline-hidden focus:ring-2 focus:ring-[#C99F3B]/30"
          />
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayProducts.map((p) => {
          const { price: effectivePrice, isPromo } = getEffectiveProductPrice(p);
          const isSelected = !!customerBag[p.id];
          const isAvailable = p.stock > 0;

          return (
            <div
              key={p.id}
              className={`p-3.5 sm:p-4 rounded-3xl bg-[#FFFDF9] dark:bg-[#201B17] border transition-all flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'border-[#C99F3B] ring-2 ring-[#C99F3B]/30 shadow-md'
                  : 'border-[#E8DFC8] dark:border-[#3A302A] hover:border-[#C99F3B]/50 shadow-2xs'
              }`}
            >
              <div>
                {/* Product Photo Showcase */}
                {p.photo ? (
                  <div
                    onClick={() => setSelectedPhotoPreview({ url: p.photo!, title: p.name, price: effectivePrice })}
                    className="relative w-full h-48 sm:h-52 rounded-2xl overflow-hidden bg-[#F5EFEB] dark:bg-[#1A1512] border border-[#E8DFC8] dark:border-[#3A302A] mb-3 group cursor-pointer shadow-2xs"
                    title="Clique para ampliar foto"
                  >
                    <img
                      src={p.photo}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5 text-white">
                      <span className="text-[10px] font-bold flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-lg">
                        <Eye className="w-3 h-3" strokeWidth={1.75} /> Ampliar Foto
                      </span>
                    </div>
                    {isPromo && (
                      <span className="absolute top-2 left-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#9D7320] text-white shadow-xs">
                        Promoção
                      </span>
                    )}
                    <span className="absolute bottom-2 right-2 p-1 rounded-lg bg-black/50 text-white/90 backdrop-blur-xs group-hover:hidden">
                      <Eye className="w-3 h-3" strokeWidth={1.75} />
                    </span>
                  </div>
                ) : (
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-gradient-to-br from-[#D8B059]/5 to-[#F5EFEB] dark:from-[#201B17] dark:to-[#1A1512] border border-[#E8DFC8] dark:border-[#3A302A] flex items-center justify-center p-3 mb-3">
                    <JewelryCategoryGraphic category={p.category} size={70} isSelected={false} />
                    {isPromo && (
                      <span className="absolute top-2 left-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#9D7320] text-white shadow-xs">
                        Promoção
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#8E8071] dark:text-[#AFA292]">
                    {p.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                      isAvailable
                        ? 'badge-silver'
                        : 'badge-muted'
                    }`}
                  >
                    {isAvailable ? 'Em Estoque' : 'Esgotado'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#2C241E] dark:text-[#F3EDE6] line-clamp-2 leading-snug">
                  {p.name}
                </h3>

                {p.description && (
                  <p className="text-xs text-[#7E7062] dark:text-[#B5A796] line-clamp-2 mt-1.5 leading-relaxed">
                    {p.description}
                  </p>
                )}

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-lg font-black font-mono text-[#9D7320] dark:text-[#E6BE65]">
                    {formatBRL(effectivePrice)}
                  </span>
                  {isPromo && (
                    <span className="text-xs line-through text-[#8E8071] dark:text-[#AFA292] font-mono">
                      {formatBRL(p.price)}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#E8DFC8]/60 dark:border-[#3A302A]">
                <div className="grid grid-cols-2 gap-2">
                  {/* Generate Card button */}
                  <button
                    type="button"
                    onClick={() => handleOpenCard(p)}
                    className="btn-silver !py-1.5 !px-2.5 !text-xs cursor-pointer shadow-2xs"
                    title="Montar Card Instagram/Zap"
                  >
                    <Instagram className="w-3.5 h-3.5 text-[#C99F3B]" strokeWidth={1.75} />
                    <span className="text-[#8C6B1B] dark:text-[#E6BE65] font-bold">Card Insta</span>
                  </button>

                  {/* Add to Bag button */}
                  <button
                    type="button"
                    onClick={() => handleToggleBagItem(p.id)}
                    disabled={!isAvailable}
                    className={`font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      !isAvailable
                        ? 'btn-neutral opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'btn-gold !py-1.5 !px-2.5'
                        : 'btn-gold !py-1.5 !px-2.5'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>No Pedido</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>{isAvailable ? '+ Pedir' : 'Falta'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="QR Code & Link do Catálogo Público" maxWidth="sm">
        <div className="flex flex-col items-center text-center space-y-4 text-xs">
          <div className="p-4 bg-white border-2 border-[#D4AF37] rounded-3xl shadow-sm flex flex-col items-center">
            {catalogQrUrl ? (
              <img src={catalogQrUrl} alt="QR Catálogo" className="w-48 h-48 object-contain" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <span className="text-[11px] font-bold text-[#8C6B1B] mt-2">
              ✨ {settings.storeName}
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-sm text-[#2C241E] dark:text-[#F3EDE6]">
              Acesso Exclusivo para Clientes
            </h4>
            <p className="text-[#7E7062] dark:text-[#B5A796] max-w-xs">
              Aponte a câmera do celular no QR Code para abrir o catálogo diretamente na tela do cliente sem senha.
            </p>
          </div>

          <div className="w-full space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleCopyPublicLink}
                className="flex-1 btn-silver !py-2.5 flex items-center justify-center gap-1.5 cursor-pointer font-bold"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Link</span>
              </button>
              <button
                onClick={() => {
                  const url = getPublicCatalogUrl();
                  openWhatsApp(
                    '',
                    `✨ Olá! Acesse nosso catálogo exclusivo com fotos, preços e novidades da *${settings.storeName}*: ${url}`
                  );
                }}
                className="flex-1 btn-gold !py-2.5 flex items-center justify-center gap-1 cursor-pointer font-bold"
              >
                <MessageCircle className="w-4 h-4" strokeWidth={1.75} />
                <span>WhatsApp</span>
              </button>
            </div>

            <button
              onClick={() => {
                const printWindow = window.open('', '_blank');
                if (!printWindow) return;
                const url = getPublicCatalogUrl();
                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>QR Code - ${settings.storeName}</title>
                      <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fafafa; }
                        .card { background: white; border: 3px solid #D4AF37; border-radius: 28px; padding: 40px; text-align: center; max-width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
                        h1 { color: #2C241E; font-size: 26px; margin: 0 0 8px; font-weight: 900; }
                        p { color: #666; font-size: 14px; margin: 0 0 24px; line-height: 1.4; }
                        .qr-box { padding: 16px; border: 1px solid #eee; border-radius: 20px; display: inline-block; background: #fff; margin-bottom: 20px; }
                        img { width: 220px; height: 220px; display: block; }
                        .tag { display: inline-block; background: #FAF3DE; color: #9E7317; font-weight: bold; font-size: 12px; padding: 6px 16px; border-radius: 20px; border: 1px solid #ECD9A2; }
                        .footer { margin-top: 16px; font-size: 11px; color: #999; }
                      </style>
                    </head>
                    <body>
                      <div class="card">
                        <h1>✨ ${settings.storeName}</h1>
                        <p>Aponte a câmera do seu celular para ver nosso catálogo com fotos, preços e promoções exclusivas!</p>
                        <div class="qr-box">
                          <img src="${catalogQrUrl}" alt="QR Code" />
                        </div>
                        <div>
                          <span class="tag">Peças Exclusivas • Pronta Entrega</span>
                        </div>
                        <div class="footer">${url}</div>
                      </div>
                      <script>
                        window.onload = function() { window.print(); }
                      </script>
                    </body>
                  </html>
                `);
                printWindow.document.close();
              }}
              className="w-full py-2 px-3 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] text-xs text-[#524436] dark:text-[#C8BCAD] hover:bg-[#F5ECE0] dark:hover:bg-[#2C241E] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Plaquinha de Balcão com QR Code</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Instagram Card Generator Modal */}
      <InstagramCardGeneratorModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        initialProduct={selectedCardProduct}
      />

      {/* High-Resolution Photo Preview Modal */}
      <Modal
        isOpen={!!selectedPhotoPreview}
        onClose={() => setSelectedPhotoPreview(null)}
        title={selectedPhotoPreview?.title || 'Foto do Produto'}
        subtitle={selectedPhotoPreview?.price ? formatBRL(selectedPhotoPreview.price) : undefined}
        maxWidth="lg"
      >
        {selectedPhotoPreview && (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-full max-h-[65vh] rounded-2xl overflow-hidden bg-[#171412] flex items-center justify-center border border-[#E8DFC8] dark:border-[#3A302A] shadow-xl">
              <img
                src={selectedPhotoPreview.url}
                alt={selectedPhotoPreview.title}
                className="max-h-[65vh] w-auto max-w-full object-contain"
              />
            </div>
            <div className="w-full flex items-center justify-between text-xs text-[#7E7062] dark:text-[#B5A796] pt-1">
              <span>Imagem em alta resolução do catálogo</span>
              <button
                type="button"
                onClick={() => setSelectedPhotoPreview(null)}
                className="btn-silver !py-2 !px-4 cursor-pointer shadow-2xs"
              >
                Fechar Foto
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
