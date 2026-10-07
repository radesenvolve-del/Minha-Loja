import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Copy,
  Share2,
  Sparkles,
  Instagram,
  MessageCircle,
  QrCode,
  Image as ImageIcon,
  Check,
  Smartphone,
  Eye,
  Settings,
  Layers,
  Palette,
  X,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatBRL } from '../../utils/formatters';
import { generateQRCode } from '../../utils/barcodes';
import { openWhatsApp } from '../../utils/whatsapp';
import {
  renderCatalogCardToCanvas,
  CardFormat,
  CardTheme,
  CardGenerationOptions,
} from '../../utils/instagramCardCanvas';
import { getCategoryEmoji } from '../common/CircularCategoryBar';

interface InstagramCardGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: Product | null;
}

export const InstagramCardGeneratorModal: React.FC<InstagramCardGeneratorModalProps> = ({
  isOpen,
  onClose,
  initialProduct,
}) => {
  const { products, settings, showToast } = useApp();

  // Selected product
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || products[0]?.id || ''
  );

  const selectedProduct = products.find((p) => p.id === selectedProductId) || initialProduct || products[0];

  // Options
  const [format, setFormat] = useState<CardFormat>('square');
  const [theme, setTheme] = useState<CardTheme>('onyx');
  const [badgeText, setBadgeText] = useState('✨ Peça Exclusiva');
  const [showQrCode, setShowQrCode] = useState(true);
  const [showInstallments, setShowInstallments] = useState(true);
  const [installmentsCount, setInstallmentsCount] = useState(3);
  const [customCallToAction, setCustomCallToAction] = useState('Chame no WhatsApp para garantir o seu!');

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isCaptionCopied, setIsCaptionCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync selected product when initialProduct changes
  useEffect(() => {
    if (initialProduct?.id) {
      setSelectedProductId(initialProduct.id);
    }
  }, [initialProduct]);

  // Generate QR Code that directly links to WhatsApp message for this product
  useEffect(() => {
    if (!selectedProduct) return;
    const cleanPhone = (settings.whatsapp || settings.phone || '').replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá! Tenho interesse no produto: *${selectedProduct.name}* (Cód: ${selectedProduct.sku}). Está disponível para pronta entrega?`
    );
    const zapLink = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${message}` : window.location.href;

    generateQRCode(zapLink).then((url) => setQrCodeDataUrl(url));
  }, [selectedProduct, settings.whatsapp, settings.phone]);

  // Re-render canvas when options or product change
  useEffect(() => {
    if (!selectedProduct || !canvasRef.current || !isOpen) return;

    const render = async () => {
      setIsGenerating(true);
      const options: CardGenerationOptions = {
        format,
        theme,
        badgeText,
        showQrCode,
        showInstallments,
        installmentsCount,
        customCallToAction,
      };

      await renderCatalogCardToCanvas(
        canvasRef.current!,
        {
          name: selectedProduct.name,
          category: selectedProduct.category,
          sku: selectedProduct.sku,
          price: selectedProduct.price,
          promotionalPrice: selectedProduct.promotionalPrice,
          photo: selectedProduct.photo,
          description: selectedProduct.description,
          storeName: settings.storeName,
          whatsapp: settings.whatsapp,
          instagram: settings.instagram,
          qrCodeDataUrl,
        },
        options
      );
      setIsGenerating(false);
    };

    render();
  }, [
    isOpen,
    selectedProduct,
    format,
    theme,
    badgeText,
    showQrCode,
    showInstallments,
    installmentsCount,
    customCallToAction,
    qrCodeDataUrl,
    settings,
  ]);

  if (!selectedProduct) return null;

  const effectivePrice =
    selectedProduct.promotionalPrice && selectedProduct.promotionalPrice > 0
      ? selectedProduct.promotionalPrice
      : selectedProduct.price;

  // Download image PNG
  const handleDownloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    const safeName = selectedProduct.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `card_${safeName}_${format}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    showToast('Imagem em alta resolução baixada!', 'success');
  };

  // Copy image to clipboard
  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        showToast('Imagem copiada para a área de transferência!', 'success');
      });
    } catch {
      handleDownloadImage();
    }
  };

  // Copy ready-to-use social caption
  const handleCopyCaption = () => {
    const lines: string[] = [];
    lines.push(`✨ *${selectedProduct.name}*`);
    lines.push(`💎 Categoria: ${selectedProduct.category} | Cód: ${selectedProduct.sku}`);
    lines.push(``);
    if (selectedProduct.description) {
      lines.push(`${selectedProduct.description}`);
      lines.push(``);
    }
    if (selectedProduct.promotionalPrice && selectedProduct.promotionalPrice > 0) {
      lines.push(
        `🏷️ De: ~${formatBRL(selectedProduct.price)}~ por APENAS: *${formatBRL(effectivePrice)}*`
      );
    } else {
      lines.push(`🏷️ Valor: *${formatBRL(effectivePrice)}*`);
    }
    if (showInstallments && installmentsCount > 1) {
      lines.push(`💳 Em até ${installmentsCount}x de ${formatBRL(effectivePrice / installmentsCount)} sem juros`);
    }
    lines.push(``);
    lines.push(`📦 Enviamos com todo carinho para todo o Brasil!`);
    lines.push(`📲 Para pedir, envie uma mensagem no WhatsApp: ${settings.whatsapp || ''}`);
    lines.push(``);
    lines.push(`#${settings.storeName.replace(/\s+/g, '')} #semijoias #acessorios #moda #estilo #lookdodia`);

    navigator.clipboard.writeText(lines.join('\n'));
    setIsCaptionCopied(true);
    setTimeout(() => setIsCaptionCopied(false), 2500);
    showToast('Legenda de vendas copiada com sucesso!', 'success');
  };

  // Direct share to WhatsApp
  const handleShareToWhatsApp = () => {
    const lines: string[] = [];
    lines.push(`✨ *${selectedProduct.name}*`);
    lines.push(`💎 Cód: ${selectedProduct.sku}`);
    lines.push(`💰 Valor: *${formatBRL(effectivePrice)}*`);
    if (selectedProduct.description) {
      lines.push(`📝 ${selectedProduct.description}`);
    }
    lines.push(`\n👉 Responda esta mensagem para garantir a sua peça antes que esgote!`);

    openWhatsApp(settings.whatsapp || '', lines.join('\n'));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gerador de Card para Instagram & WhatsApp"
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Left Column: Live Card Canvas Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl">
          <div className="w-full flex items-center justify-between mb-3 text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
              <Eye className="w-3.5 h-3.5" />
              Prévia em Alta Resolução
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
              {format === 'square' ? '1080 × 1080 (1:1)' : '1080 × 1920 (9:16)'}
            </span>
          </div>

          {/* Canvas Wrapper */}
          <div
            className={`relative rounded-xl overflow-hidden shadow-2xl border border-amber-500/20 bg-zinc-900 flex items-center justify-center transition-all ${
              format === 'square' ? 'w-full aspect-square max-w-[340px]' : 'w-full aspect-[9/16] max-w-[260px]'
            }`}
          >
            {isGenerating && (
              <div className="absolute inset-0 z-10 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center text-amber-400 font-bold gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Renderizando Card...</span>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Quick Direct Actions under Preview */}
          <div className="w-full grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={handleDownloadImage}
              className="btn-gold !py-2.5 !px-3 !text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Imagem</span>
            </button>

            <button
              onClick={handleCopyImage}
              className="btn-neutral !py-2.5 !px-3 !text-xs"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copiado!' : 'Copiar Imagem'}</span>
            </button>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={handleShareToWhatsApp}
              className="btn-emerald !py-2 !px-3 !text-[11px]"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Enviar no WhatsApp</span>
            </button>

            <button
              onClick={handleCopyCaption}
              className="btn-neutral !py-2 !px-3 !text-[11px]"
            >
              {isCaptionCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Instagram className="w-3.5 h-3.5 text-pink-400" />}
              <span>{isCaptionCopied ? 'Legenda Copiada!' : 'Copiar Legenda'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Customization Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. Product Selector */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/80 border border-zinc-200 dark:border-zinc-750 space-y-2">
            <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Produto Selecionado:
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-semibold text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {getCategoryEmoji(p.category)} {p.name} — {formatBRL(p.promotionalPrice && p.promotionalPrice > 0 ? p.promotionalPrice : p.price)}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Format: Feed 1:1 vs Stories 9:16 */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Formato da Imagem:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormat('square')}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  format === 'square'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-500 dark:text-amber-400 ring-2 ring-amber-500/20 font-bold'
                    : 'border-zinc-200 dark:border-zinc-750 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-mono font-bold">1:1</span>
                </div>
                <div>
                  <p className="font-bold text-xs">Feed Instagram / Zap</p>
                  <p className="text-[10px] opacity-75">1080 × 1080 px (Quadrado)</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('story')}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  format === 'story'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-500 dark:text-amber-400 ring-2 ring-amber-500/20 font-bold'
                    : 'border-zinc-200 dark:border-zinc-750 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="font-bold text-xs">Stories / Status / Reels</p>
                  <p className="text-[10px] opacity-75">1080 × 1920 px (Vertical)</p>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Luxury Themes */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-500" />
              Estilo Visual / Tema de Luxo:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'onyx', name: 'Onyx Gold', bg: 'bg-zinc-950 border-amber-500', desc: 'Preto & Ouro' },
                { id: 'pearl', name: 'Pearl Minimal', bg: 'bg-stone-100 border-amber-600 text-stone-900', desc: 'Branco Pérola' },
                { id: 'rose', name: 'Rose Champagne', bg: 'bg-[#25141b] border-rose-300', desc: 'Rosé Suave' },
                { id: 'emerald', name: 'Emerald Noir', bg: 'bg-[#062d20] border-emerald-400', desc: 'Esmeralda & Ouro' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id as CardTheme)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    theme === t.id
                      ? 'ring-2 ring-amber-500 border-amber-400 font-extrabold shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                  }`}
                >
                  <div className={`w-full h-7 rounded-lg mb-1.5 border ${t.bg}`} />
                  <p className="font-bold text-[11px] truncate">{t.name}</p>
                  <p className="text-[9px] text-zinc-500 dark:text-zinc-400">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Badges & Callout */}
          <div className="space-y-2.5">
            <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Selo em Destaque no Card:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                '✨ Peça Exclusiva',
                '💎 Semijoia Banhada 18k',
                '⚡ Pronta Entrega',
                '👑 Lançamento da Semana',
                '🔥 Últimas Peças',
                'Garantia 1 Ano',
              ].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBadgeText(b)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    badgeText === b
                      ? 'bg-amber-500/15 border-amber-500 text-amber-500 dark:text-amber-400 font-bold'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              placeholder="Ou digite um selo personalizado..."
              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 text-xs focus:outline-hidden"
            />
          </div>

          {/* 5. Toggles: QR Code & Installments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-750 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100">QR Code de Compra</p>
                  <p className="text-[10px] text-zinc-500">Abre o WhatsApp com o produto</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showQrCode}
                onChange={(e) => setShowQrCode(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
              />
            </label>

            <label className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-750 flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Parcelamento</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-zinc-500">Simular até</span>
                  <select
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                    disabled={!showInstallments}
                    className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[10px] font-bold"
                  >
                    <option value={2}>2x</option>
                    <option value={3}>3x</option>
                    <option value={6}>6x</option>
                    <option value={10}>10x</option>
                    <option value={12}>12x</option>
                  </select>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showInstallments}
                onChange={(e) => setShowInstallments(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
              />
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
};
