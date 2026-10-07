export type CardFormat = 'square' | 'story';
export type CardTheme = 'onyx' | 'pearl' | 'rose' | 'emerald';

export interface CardGenerationOptions {
  format: CardFormat;
  theme: CardTheme;
  badgeText: string;
  showQrCode: boolean;
  showInstallments: boolean;
  installmentsCount: number;
  customCallToAction: string;
}

interface ProductCardData {
  name: string;
  category: string;
  sku: string;
  price: number;
  promotionalPrice?: number;
  photo?: string;
  description?: string;
  storeName: string;
  whatsapp?: string;
  instagram?: string;
  qrCodeDataUrl?: string;
}

const THEME_STYLES: Record<
  CardTheme,
  {
    bgGradient: [string, string];
    cardBg: string;
    cardBorder: string;
    goldAccent: string;
    goldText: string;
    titleColor: string;
    subtitleColor: string;
    badgeBg: string;
    badgeText: string;
    photoPlaceholderBg: string;
  }
> = {
  onyx: {
    bgGradient: ['#09090b', '#18181b'],
    cardBg: '#121215',
    cardBorder: '#d4af37',
    goldAccent: '#d4af37',
    goldText: '#f59e0b',
    titleColor: '#ffffff',
    subtitleColor: '#a1a1aa',
    badgeBg: 'rgba(212, 175, 55, 0.15)',
    badgeText: '#fcd34d',
    photoPlaceholderBg: '#27272a',
  },
  pearl: {
    bgGradient: ['#fcfbf9', '#f3f0e8'],
    cardBg: '#ffffff',
    cardBorder: '#c5a059',
    goldAccent: '#b48a3c',
    goldText: '#92400e',
    titleColor: '#1c1917',
    subtitleColor: '#78716c',
    badgeBg: '#fef3c7',
    badgeText: '#92400e',
    photoPlaceholderBg: '#f5f5f4',
  },
  rose: {
    bgGradient: ['#1c1014', '#2c1820'],
    cardBg: '#25141b',
    cardBorder: '#e0a899',
    goldAccent: '#e0a899',
    goldText: '#fca5a5',
    titleColor: '#fff1f2',
    subtitleColor: '#fecdd3',
    badgeBg: 'rgba(224, 168, 153, 0.2)',
    badgeText: '#fecdd3',
    photoPlaceholderBg: '#381e28',
  },
  emerald: {
    bgGradient: ['#051c14', '#062d20'],
    cardBg: '#092419',
    cardBorder: '#e6c762',
    goldAccent: '#e6c762',
    goldText: '#fef08a',
    titleColor: '#f0fdf4',
    subtitleColor: '#bbf7d0',
    badgeBg: 'rgba(230, 199, 98, 0.18)',
    badgeText: '#fef08a',
    photoPlaceholderBg: '#0e3a29',
  },
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function renderCatalogCardToCanvas(
  canvas: HTMLCanvasElement,
  data: ProductCardData,
  options: CardGenerationOptions
): Promise<void> {
  const isSquare = options.format === 'square';
  const width = 1080;
  const height = isSquare ? 1080 : 1920;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const theme = THEME_STYLES[options.theme] || THEME_STYLES.onyx;

  // 1. Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, theme.bgGradient[0]);
  bgGrad.addColorStop(1, theme.bgGradient[1]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Luxury Outer Frame
  ctx.strokeStyle = theme.goldAccent;
  ctx.lineWidth = 4;
  roundRect(ctx, 36, 36, width - 72, height - 72, 32);
  ctx.stroke();

  // Subtle inner decorative frame
  ctx.strokeStyle = `${theme.goldAccent}33`;
  ctx.lineWidth = 1.5;
  roundRect(ctx, 48, 48, width - 96, height - 96, 26);
  ctx.stroke();

  // 3. Header: Store Name & Badge
  const headerY = isSquare ? 90 : 120;

  // Store Brand Title
  ctx.fillStyle = theme.goldAccent;
  ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText((data.storeName || 'MINHA LOJA').toUpperCase(), width / 2, headerY);

  // Decorative diamond separator
  ctx.fillStyle = theme.goldAccent;
  ctx.font = '16px serif';
  ctx.fillText('✦   ✦   ✦', width / 2, headerY + 28);

  // 4. Product Photo Box
  let photoY = isSquare ? 150 : 200;
  let photoSize = isSquare ? 490 : 860;
  let photoX = (width - photoSize) / 2;

  // Photo Frame Background
  ctx.fillStyle = theme.photoPlaceholderBg;
  roundRect(ctx, photoX, photoY, photoSize, photoSize, 28);
  ctx.fill();

  // Gold border around photo
  ctx.strokeStyle = `${theme.goldAccent}77`;
  ctx.lineWidth = 3;
  roundRect(ctx, photoX, photoY, photoSize, photoSize, 28);
  ctx.stroke();

  // Load and Draw Product Image if available
  if (data.photo) {
    const img = await loadImage(data.photo);
    if (img) {
      ctx.save();
      roundRect(ctx, photoX, photoY, photoSize, photoSize, 28);
      ctx.clip();

      // Cover crop calculations
      const imgAspect = img.width / img.height;
      const targetAspect = 1;
      let drawW, drawH, drawX, drawY;

      if (imgAspect > targetAspect) {
        drawH = photoSize;
        drawW = photoSize * imgAspect;
        drawX = photoX - (drawW - photoSize) / 2;
        drawY = photoY;
      } else {
        drawW = photoSize;
        drawH = photoSize / imgAspect;
        drawX = photoX;
        drawY = photoY - (drawH - photoSize) / 2;
      }
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    }
  } else {
    // Elegant fallback icon
    ctx.fillStyle = theme.goldAccent;
    ctx.font = `${isSquare ? 110 : 150}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText('💍', width / 2, photoY + photoSize / 2 + (isSquare ? 40 : 50));
  }

  // Badge in corner of photo (e.g. "Semijoia Banhada 18k")
  if (options.badgeText) {
    const badgeText = options.badgeText.toUpperCase();
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    const textWidth = ctx.measureText(badgeText).width;
    const badgePadX = 24;
    const badgePadY = 12;
    const badgeX = photoX + 24;
    const badgeY = photoY + 24;

    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.goldAccent;
    ctx.lineWidth = 2;
    roundRect(ctx, badgeX, badgeY, textWidth + badgePadX * 2, 44, 22);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = theme.badgeText;
    ctx.textAlign = 'left';
    ctx.fillText(badgeText, badgeX + badgePadX, badgeY + 29);
  }

  // 5. Product Details Section
  let contentY = photoY + photoSize + (isSquare ? 45 : 70);

  // Category
  ctx.fillStyle = theme.goldAccent;
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText((data.category || 'EXCLUSIVO').toUpperCase(), width / 2, contentY);

  // Product Name (wrapped or truncated)
  contentY += isSquare ? 48 : 65;
  ctx.fillStyle = theme.titleColor;
  ctx.font = `bold ${isSquare ? 38 : 46}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'center';

  const productName = data.name.length > 48 ? `${data.name.slice(0, 45)}...` : data.name;
  ctx.fillText(productName, width / 2, contentY);

  // SKU / Reference Code
  contentY += isSquare ? 32 : 45;
  ctx.fillStyle = theme.subtitleColor;
  ctx.font = '19px "JetBrains Mono", monospace';
  ctx.fillText(`CÓD: ${data.sku || 'REF-001'}`, width / 2, contentY);

  // 6. Pricing Section
  contentY += isSquare ? 50 : 75;
  const effectivePrice = data.promotionalPrice && data.promotionalPrice > 0 ? data.promotionalPrice : data.price;
  const isPromo = data.promotionalPrice && data.promotionalPrice > 0 && data.promotionalPrice < data.price;

  if (isPromo) {
    // Old price with strikethrough
    ctx.fillStyle = theme.subtitleColor;
    ctx.font = '28px "Plus Jakarta Sans", sans-serif';
    const oldPriceStr = `De R$ ${data.price.toFixed(2).replace('.', ',')}`;
    const oldWidth = ctx.measureText(oldPriceStr).width;
    const oldX = width / 2 - 130;
    ctx.fillText(oldPriceStr, oldX, contentY - 8);

    // Strikethrough line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(oldX - oldWidth / 2 - 4, contentY - 16);
    ctx.lineTo(oldX + oldWidth / 2 + 4, contentY - 16);
    ctx.stroke();

    // New Price
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 56px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Por R$ ${effectivePrice.toFixed(2).replace('.', ',')}`, width / 2 + 110, contentY);
  } else {
    // Regular Price in large luxury gold
    ctx.fillStyle = theme.goldAccent;
    ctx.font = `bold ${isSquare ? 58 : 72}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(`R$ ${effectivePrice.toFixed(2).replace('.', ',')}`, width / 2, contentY);
  }

  // Installments simulation (e.g. 3x sem juros)
  if (options.showInstallments && options.installmentsCount > 1) {
    contentY += isSquare ? 34 : 45;
    const instValue = effectivePrice / options.installmentsCount;
    ctx.fillStyle = theme.subtitleColor;
    ctx.font = '22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `ou ${options.installmentsCount}x de R$ ${instValue.toFixed(2).replace('.', ',')} sem juros`,
      width / 2,
      contentY
    );
  }

  // 7. Footer / QR Code / Call to Action
  if (options.showQrCode && data.qrCodeDataUrl) {
    const qrImg = await loadImage(data.qrCodeDataUrl);
    if (qrImg) {
      const qrSize = isSquare ? 110 : 160;
      const qrY = isSquare ? height - 165 : height - 250;
      const qrX = width / 2 - qrSize / 2;

      // QR Code white box with rounded corners
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 12);
      ctx.fill();
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      ctx.fillStyle = theme.goldAccent;
      ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('APONTE A CÂMERA PARA COMPRAR', width / 2, qrY + qrSize + 22);
    }
  }

  // Bottom WhatsApp & Instagram contacts
  const bottomY = height - (isSquare ? 42 : 55);
  ctx.fillStyle = theme.subtitleColor;
  ctx.font = '20px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';

  const contactPieces: string[] = [];
  if (data.whatsapp) contactPieces.push(`WhatsApp: ${data.whatsapp}`);
  if (data.instagram) contactPieces.push(`Insta: ${data.instagram}`);

  const contactLine = contactPieces.length > 0 ? contactPieces.join('   ✦   ') : (options.customCallToAction || 'Peça já pelo WhatsApp');
  ctx.fillText(contactLine, width / 2, bottomY);
}
