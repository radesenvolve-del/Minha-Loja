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
  const { products, settings, showToast, selectedCategory, setSelectedCategory } = useApp();
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

  const handleOpenShare = async () => {
    const catalogUrl = window.location.href;
    const qr = await generateQRCode(catalogUrl);
    setCatalogQrUrl(qr);
    setShowShareModal(true);
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

    openWhatsApp(settings.whatsapp || '', lines.join('\n'));
  };

  const bagCount = Object.keys(customerBag).length;

  return (
    <div className="space-y-5">
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
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Compartilhar Catálogo" maxWidth="sm">
        <div className="flex flex-col items-center text-center space-y-4 text-xs">
          <div className="p-3 bg-white border rounded-2xl">
            {catalogQrUrl && (
              <img src={catalogQrUrl} alt="QR Catálogo" className="w-44 h-44 object-contain" />
            )}
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-sm text-[#2C241E] dark:text-[#F3EDE6]">
              {settings.storeName}
            </h4>
            <p className="text-[#7E7062] dark:text-[#B5A796]">
              Aponte a câmera do celular para abrir o catálogo diretamente na tela.
            </p>
          </div>

          <div className="w-full flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showToast('Link do catálogo copiado!', 'success');
              }}
              className="flex-1 btn-silver !py-2.5 cursor-pointer"
            >
              Copiar Link
            </button>
            <button
              onClick={() => {
                openWhatsApp(
                  '',
                  `Confira nosso catálogo de produtos atualizado na ${settings.storeName}: ${window.location.href}`
                );
              }}
              className="flex-1 btn-gold !py-2.5 flex items-center justify-center gap-1 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={1.75} />
              <span>WhatsApp</span>
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
