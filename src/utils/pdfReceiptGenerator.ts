import { jsPDF } from 'jspdf';
import { Sale, Order, StoreSettings } from '../types';
import { formatBRL, formatDateTime, formatDate } from './formatters';
import QRCode from 'qrcode';
import { generateSaleWhatsAppReceipt, generateOrderWhatsAppMessage, openWhatsApp } from './whatsapp';

export interface GeneratePdfOptions {
  sale: Sale;
  settings: StoreSettings;
  customerPhone?: string;
}

/**
 * Generates an elegant, boutique-grade PDF receipt for a sale,
 * optimized for smartphone viewing and WhatsApp sharing.
 */
export async function generateSalePdfReceipt({
  sale,
  settings,
}: GeneratePdfOptions): Promise<{
  doc: jsPDF;
  blob: Blob;
  fileName: string;
  dataUrl: string;
}> {
  // Page size: 80mm width thermal/mobile voucher (80mm x 200mm)
  // or A6 (105mm x 148mm) - 80mm thermal mobile roll is standard in retail/jewelry
  const rollWidth = 80;
  // Calculate dynamic height based on items count
  const baseHeight = 160;
  const itemsHeight = Math.max(20, sale.items.length * 9);
  const totalHeight = Math.max(180, baseHeight + itemsHeight);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [rollWidth, totalHeight],
  });

  const margin = 5;
  const pageWidth = rollWidth;
  const contentWidth = pageWidth - margin * 2;
  let y = 8;

  // 1. Header & Store Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(24, 24, 27); // Zinc-900
  const storeName = (settings.storeName || 'MINHA LOJA').toUpperCase();
  doc.text(storeName, pageWidth / 2, y, { align: 'center' });
  y += 5;

  if (settings.tagline) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(113, 113, 122); // Zinc-500
    doc.text(settings.tagline, pageWidth / 2, y, { align: 'center' });
    y += 4;
  }

  // CNPJ / Phone info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(82, 82, 91);
  if (settings.cnpjCpf) {
    doc.text(`CNPJ/CPF: ${settings.cnpjCpf}`, pageWidth / 2, y, { align: 'center' });
    y += 3.5;
  }
  if (settings.phone) {
    doc.text(`WhatsApp / Tel: ${settings.phone}`, pageWidth / 2, y, { align: 'center' });
    y += 3.5;
  }
  if (settings.address) {
    const loc = `${settings.address}${settings.city ? ` - ${settings.city}` : ''}`;
    doc.text(loc.slice(0, 48), pageWidth / 2, y, { align: 'center' });
    y += 4;
  }

  // Divider line
  y += 1;
  doc.setDrawColor(212, 212, 216); // Zinc-300
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // 2. Receipt Title & Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 130, 32); // Amber-600 gold finish
  doc.text('COMPROVANTE DE VENDA / PAGAMENTO', pageWidth / 2, y, { align: 'center' });
  y += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(24, 24, 27);
  doc.text(`Venda: #${sale.saleNumber}`, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(82, 82, 91);
  doc.text(formatDateTime(sale.date), pageWidth - margin, y, { align: 'right' });
  y += 3.8;

  // Customer info
  doc.text(`Cliente: ${sale.customerName || 'Consumidor Final'}`, margin, y);
  y += 4;

  // Table header
  doc.setFillColor(244, 244, 245); // Zinc-100
  doc.rect(margin, y - 2.5, contentWidth, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(63, 63, 70);
  doc.text('QTD', margin + 1, y + 0.8);
  doc.text('ITEM / DESCRIÇÃO', margin + 9, y + 0.8);
  doc.text('TOTAL', pageWidth - margin - 1, y + 0.8, { align: 'right' });
  y += 4.5;

  // 3. Items list
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(24, 24, 27);

  sale.items.forEach((item) => {
    const qtyText = `${item.quantity}x`;
    const totalText = formatBRL(item.total);

    doc.setFont('helvetica', 'bold');
    doc.text(qtyText, margin + 1, y);

    doc.setFont('helvetica', 'normal');
    // Truncate item name if too long
    const maxChars = 28;
    const nameText = item.name.length > maxChars ? item.name.slice(0, maxChars - 2) + '..' : item.name;
    doc.text(nameText, margin + 9, y);

    doc.setFont('helvetica', 'bold');
    doc.text(totalText, pageWidth - margin - 1, y, { align: 'right' });
    y += 3.8;

    // Unit price subtitle if qty > 1
    if (item.quantity > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(113, 113, 122);
      doc.text(`(${formatBRL(item.unitPrice)} un)`, margin + 9, y);
      y += 3.2;
      doc.setFontSize(7);
      doc.setTextColor(24, 24, 27);
    }
  });

  // Divider
  y += 1;
  doc.setDrawColor(228, 228, 231);
  doc.line(margin, y, pageWidth - margin, y);
  y += 3.5;

  // 4. Subtotals, Discount, Total
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(82, 82, 91);

  if (sale.discountAmount > 0 || (sale.shipping && sale.shipping > 0)) {
    doc.text('Subtotal:', margin, y);
    doc.text(formatBRL(sale.subtotal), pageWidth - margin, y, { align: 'right' });
    y += 3.5;

    if (sale.discountAmount > 0) {
      doc.text('Desconto Aplicado:', margin, y);
      doc.setTextColor(225, 29, 72); // Rose-600
      doc.text(`-${formatBRL(sale.discountAmount)}`, pageWidth - margin, y, { align: 'right' });
      doc.setTextColor(82, 82, 91);
      y += 3.5;
    }

    if (sale.shipping && sale.shipping > 0) {
      doc.text('Taxa de Entrega:', margin, y);
      doc.text(formatBRL(sale.shipping), pageWidth - margin, y, { align: 'right' });
      y += 3.5;
    }
  }

  // Total Final Highlight Box
  y += 1;
  doc.setFillColor(24, 24, 27); // Zinc-900 dark bar
  doc.roundedRect(margin, y - 2.5, contentWidth, 7, 1.2, 1.2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL PAGO / A PAGAR:', margin + 2.5, y + 2);

  doc.setFontSize(9.5);
  doc.text(formatBRL(sale.total), pageWidth - margin - 2.5, y + 2, { align: 'right' });
  y += 7.5;

  // Payment Method
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(82, 82, 91);
  let methodLabel = sale.paymentMethod.toUpperCase();
  if (sale.paymentMethod === 'credito_parcelado') {
    methodLabel = `CARTÃO DE CRÉDITO (${sale.installments || 1}X)`;
  } else if (sale.paymentMethod === 'pix') {
    methodLabel = 'PAGAMENTO VIA PIX';
  } else if (sale.paymentMethod === 'dinheiro') {
    methodLabel = 'DINHEIRO';
  }
  doc.text(`Forma de Pagamento: ${methodLabel}`, margin, y);
  y += 4;

  // 5. PIX Key Box (If configured)
  if (settings.pixKey) {
    y += 1;
    doc.setFillColor(236, 253, 245); // Emerald-50
    doc.setDrawColor(167, 243, 208); // Emerald-200
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y - 2, contentWidth, 12, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(4, 120, 87); // Emerald-700
    doc.text(`CHAVE PIX (${(settings.pixKeyType || 'CHAVE').toUpperCase()}):`, margin + 2, y + 1.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(6, 78, 59); // Emerald-900
    doc.text(settings.pixKey, margin + 2, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(5, 150, 105);
    doc.text('Pague pelo app do seu banco lendo o QR Code ou copiando a chave.', margin + 2, y + 8.5);
    y += 13.5;

    // Generate small QR code for PIX if payload or key exists
    try {
      const qrData = settings.pixKey;
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        margin: 1,
        width: 120,
        color: { dark: '#047857', light: '#ffffff' },
      });
      // Place small QR Code in center
      const qrSize = 22;
      doc.addImage(qrDataUrl, 'PNG', (pageWidth - qrSize) / 2, y, qrSize, qrSize);
      y += qrSize + 2;
    } catch {
      // Fallback without QR image
    }
  }

  // 6. Footer Note
  y += 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(113, 113, 122);
  doc.text('Agradecemos pela preferência e confiança!', pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text('Este comprovante possui validade como recibo de compra.', pageWidth / 2, y, { align: 'center' });

  // Output
  const fileName = `Comprovante_${sale.saleNumber}_${new Date().toISOString().slice(0, 10)}.pdf`;
  const blob = doc.output('blob');
  const dataUrl = doc.output('datauristring');

  return {
    doc,
    blob,
    fileName,
    dataUrl,
  };
}

/**
 * Downloads the PDF directly to device
 */
export async function downloadSalePdf(options: GeneratePdfOptions): Promise<string> {
  const { blob, fileName } = await generateSalePdfReceipt(options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return fileName;
}

/**
 * Shares the PDF via Web Share API (native WhatsApp file sharing on mobile)
 * or falls back to downloading the PDF + opening WhatsApp chat.
 */
export async function shareSalePdfViaWhatsApp(
  options: GeneratePdfOptions
): Promise<{ method: 'native-share' | 'whatsapp-fallback' }> {
  const { sale, settings, customerPhone } = options;
  const { blob, fileName } = await generateSalePdfReceipt(options);

  const file = new File([blob], fileName, { type: 'application/pdf' });
  const textSummary = generateSaleWhatsAppReceipt(
    sale,
    settings.storeName,
    settings.phone,
    settings.pixKey,
    settings.pixKeyType
  );

  // If browser supports Web Share API with files (Android, iOS Safari, Chrome Mobile):
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `Comprovante #${sale.saleNumber} - ${settings.storeName}`,
        text: `Olá! Segue seu comprovante de compra #${sale.saleNumber}.\nTotal: ${formatBRL(sale.total)}.`,
        files: [file],
      });
      return { method: 'native-share' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { method: 'native-share' };
      }
      // Continue to fallback
    }
  }

  // Fallback: Trigger instant PDF download and open WhatsApp
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Open WhatsApp with text
  const messageWithPdfNote = `${textSummary}\n\n📄 *O arquivo PDF do comprovante foi gerado e baixado no seu dispositivo para anexo.*`;
  openWhatsApp(customerPhone || '', messageWithPdfNote);

  return { method: 'whatsapp-fallback' };
}

export interface GenerateOrderPdfOptions {
  order: Order;
  settings: StoreSettings;
  customerPhone?: string;
}

/**
 * Generates an elegant PDF receipt for an order (Instagram / WhatsApp)
 */
export async function generateOrderPdfReceipt({
  order,
  settings,
}: GenerateOrderPdfOptions): Promise<{
  doc: jsPDF;
  blob: Blob;
  fileName: string;
  dataUrl: string;
}> {
  const rollWidth = 80;
  const baseHeight = 165;
  const itemsHeight = Math.max(20, order.items.length * 9);
  const totalHeight = Math.max(185, baseHeight + itemsHeight);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [rollWidth, totalHeight],
  });

  const margin = 5;
  const pageWidth = rollWidth;
  const contentWidth = pageWidth - margin * 2;
  let y = 8;

  // 1. Header & Store Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(24, 24, 27);
  const storeName = (settings.storeName || 'MINHA LOJA').toUpperCase();
  doc.text(storeName, pageWidth / 2, y, { align: 'center' });
  y += 5;

  if (settings.tagline) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(113, 113, 122);
    doc.text(settings.tagline, pageWidth / 2, y, { align: 'center' });
    y += 4;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(82, 82, 91);
  if (settings.cnpjCpf) {
    doc.text(`CNPJ/CPF: ${settings.cnpjCpf}`, pageWidth / 2, y, { align: 'center' });
    y += 3.5;
  }
  if (settings.phone) {
    doc.text(`WhatsApp / Tel: ${settings.phone}`, pageWidth / 2, y, { align: 'center' });
    y += 3.5;
  }
  if (settings.address) {
    const loc = `${settings.address}${settings.city ? ` - ${settings.city}` : ''}`;
    doc.text(loc.slice(0, 48), pageWidth / 2, y, { align: 'center' });
    y += 4;
  }

  // Divider line
  y += 1;
  doc.setDrawColor(212, 212, 216);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // 2. Receipt Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 130, 32); // Amber gold
  doc.text('COMPROVANTE DE PEDIDO / COMPRA', pageWidth / 2, y, { align: 'center' });
  y += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(24, 24, 27);
  doc.text(`Pedido: #${order.orderNumber}`, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(82, 82, 91);
  doc.text(formatDate(order.date), pageWidth - margin, y, { align: 'right' });
  y += 3.8;

  // Customer info & origin
  const originTag = order.origin === 'instagram' ? 'Instagram' : 'WhatsApp';
  doc.text(`Cliente: ${order.customerName || 'Cliente'} (${originTag})`, margin, y);
  y += 3.8;

  const statusMap: Record<string, string> = {
    novo: 'Novo Pedido',
    aguardando_pagamento: 'Aguardando Pagamento',
    pagamento_confirmado: 'Pago Confirmado',
    em_separacao: 'Em Separação',
    pronto_envio: 'Pronto p/ Envio',
    enviado: 'Enviado / A Caminho',
    entregue: 'Entregue com Sucesso',
    cancelado: 'Cancelado',
    devolvido: 'Devolvido',
  };
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: ${statusMap[order.status] || order.status}`, margin, y);
  y += 4;

  // Table header
  doc.setFillColor(244, 244, 245);
  doc.rect(margin, y - 2.5, contentWidth, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(63, 63, 70);
  doc.text('QTD', margin + 1, y + 0.8);
  doc.text('ITEM / DESCRIÇÃO', margin + 9, y + 0.8);
  doc.text('TOTAL', pageWidth - margin - 1, y + 0.8, { align: 'right' });
  y += 4.5;

  // Items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(24, 24, 27);

  order.items.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.quantity}x`, margin + 1, y);

    doc.setFont('helvetica', 'normal');
    const maxChars = 28;
    const nameText = item.name.length > maxChars ? item.name.slice(0, maxChars - 2) + '..' : item.name;
    doc.text(nameText, margin + 9, y);

    doc.setFont('helvetica', 'bold');
    doc.text(formatBRL(item.total), pageWidth - margin - 1, y, { align: 'right' });
    y += 3.8;

    if (item.quantity > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(113, 113, 122);
      doc.text(`(${formatBRL(item.unitPrice)} un)`, margin + 9, y);
      y += 3.2;
      doc.setFontSize(7);
      doc.setTextColor(24, 24, 27);
    }
  });

  // Divider
  y += 1;
  doc.setDrawColor(228, 228, 231);
  doc.line(margin, y, pageWidth - margin, y);
  y += 3.5;

  // Subtotals
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(82, 82, 91);

  if (order.subtotal !== order.total || order.discount > 0 || order.shipping > 0) {
    doc.text('Subtotal:', margin, y);
    doc.text(formatBRL(order.subtotal), pageWidth - margin, y, { align: 'right' });
    y += 3.5;

    if (order.discount > 0) {
      doc.text('Desconto Aplicado:', margin, y);
      doc.setTextColor(225, 29, 72);
      doc.text(`-${formatBRL(order.discount)}`, pageWidth - margin, y, { align: 'right' });
      doc.setTextColor(82, 82, 91);
      y += 3.5;
    }

    if (order.shipping > 0) {
      doc.text('Taxa de Entrega / Frete:', margin, y);
      doc.text(formatBRL(order.shipping), pageWidth - margin, y, { align: 'right' });
      y += 3.5;
    }
  }

  // Total Final Box
  y += 1;
  doc.setFillColor(24, 24, 27);
  doc.roundedRect(margin, y - 2.5, contentWidth, 7, 1.2, 1.2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('VALOR TOTAL DO PEDIDO:', margin + 2.5, y + 2);

  doc.setFontSize(9.5);
  doc.text(formatBRL(order.total), pageWidth - margin - 2.5, y + 2, { align: 'right' });
  y += 7.5;

  // Delivery Address or Notes if present
  if (order.deliveryAddress) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(82, 82, 91);
    doc.text(`Endereço: ${order.deliveryAddress.slice(0, 50)}`, margin, y);
    y += 3.5;
  }
  if (order.trackingCode) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(14, 116, 144);
    doc.text(`Código Rastreio: ${order.trackingCode}`, margin, y);
    y += 3.8;
  }

  // PIX Box
  if (settings.pixKey) {
    y += 1;
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y - 2, contentWidth, 12, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(4, 120, 87);
    doc.text(`CHAVE PIX PARA PAGAMENTO (${(settings.pixKeyType || 'CHAVE').toUpperCase()}):`, margin + 2, y + 1.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(6, 78, 59);
    doc.text(settings.pixKey, margin + 2, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(5, 150, 105);
    doc.text('Pague pelo app do seu banco lendo o QR Code ou copiando a chave.', margin + 2, y + 8.5);
    y += 13.5;

    try {
      const qrDataUrl = await QRCode.toDataURL(settings.pixKey, {
        margin: 1,
        width: 120,
        color: { dark: '#047857', light: '#ffffff' },
      });
      const qrSize = 22;
      doc.addImage(qrDataUrl, 'PNG', (pageWidth - qrSize) / 2, y, qrSize, qrSize);
      y += qrSize + 2;
    } catch {
      // Fallback without QR
    }
  }

  // Footer
  y += 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(113, 113, 122);
  doc.text('Agradecemos pela preferência e confiança!', pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text('Comprovante oficial emitido para o cliente.', pageWidth / 2, y, { align: 'center' });

  const fileName = `Comprovante_Pedido_${order.orderNumber}_${new Date().toISOString().slice(0, 10)}.pdf`;
  const blob = doc.output('blob');
  const dataUrl = doc.output('datauristring');

  return { doc, blob, fileName, dataUrl };
}

/**
 * Downloads Order PDF
 */
export async function downloadOrderPdf(options: GenerateOrderPdfOptions): Promise<string> {
  const { blob, fileName } = await generateOrderPdfReceipt(options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return fileName;
}

/**
 * Shares Order PDF via WhatsApp
 */
export async function shareOrderPdfViaWhatsApp(
  options: GenerateOrderPdfOptions
): Promise<{ method: 'native-share' | 'whatsapp-fallback' }> {
  const { order, settings, customerPhone } = options;
  const { blob, fileName } = await generateOrderPdfReceipt(options);

  const file = new File([blob], fileName, { type: 'application/pdf' });
  const textSummary = generateOrderWhatsAppMessage(
    order,
    settings.storeName,
    settings.pixKey,
    settings.pixKeyType
  );

  const phone = customerPhone || order.whatsapp || '';

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `Comprovante Pedido #${order.orderNumber} - ${settings.storeName}`,
        text: `Olá! Segue seu comprovante de pedido #${order.orderNumber}.\nTotal: ${formatBRL(order.total)}.`,
        files: [file],
      });
      return { method: 'native-share' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { method: 'native-share' };
      }
    }
  }

  // Fallback: download PDF and open WhatsApp
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  const messageWithPdfNote = `${textSummary}\n\n📄 *O arquivo PDF oficial do comprovante foi gerado e baixado para anexo.*`;
  openWhatsApp(phone, messageWithPdfNote);

  return { method: 'whatsapp-fallback' };
}
