import { Order, Sale } from '../types';
import { formatBRL, formatDate } from './formatters';

export function openWhatsApp(phone: string, text: string) {
  const clean = phone.replace(/\D/g, '');
  if (!clean) return;
  const targetPhone = clean.length === 10 || clean.length === 11 ? `55${clean}` : clean;
  const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

export function generateOrderWhatsAppMessage(
  order: Order,
  storeName: string,
  pixKey?: string,
  pixKeyType?: string
): string {
  const lines: string[] = [];
  lines.push(`🛍️ *Olá, ${order.customerName}!*`);
  lines.push(`Aqui é da *${storeName}*. Seguem os detalhes do seu pedido:`);
  lines.push(`\n📦 *Pedido #${order.orderNumber}* (${formatDate(order.date)})`);
  lines.push(`--------------------------------`);

  order.items.forEach((item) => {
    lines.push(`▪️ ${item.quantity}x ${item.name} - ${formatBRL(item.total)}`);
  });

  lines.push(`--------------------------------`);
  if (order.subtotal !== order.total) {
    lines.push(`Subtotal: ${formatBRL(order.subtotal)}`);
  }
  if (order.discount > 0) {
    lines.push(`Desconto: -${formatBRL(order.discount)}`);
  }
  if (order.shipping > 0) {
    lines.push(`Frete: +${formatBRL(order.shipping)}`);
  }
  lines.push(`*Total: ${formatBRL(order.total)}*`);

  const statusMap: Record<string, string> = {
    novo: 'Novo Pedido Recebido',
    aguardando_pagamento: 'Aguardando Pagamento',
    pagamento_confirmado: 'Pagamento Confirmado ✅',
    em_separacao: 'Em Separação no Estoque 📦',
    pronto_envio: 'Pronto para Envio 🚀',
    enviado: 'Enviado / A Caminho 🚚',
    entregue: 'Entregue com Sucesso 🎉',
    cancelado: 'Cancelado',
    devolvido: 'Devolvido',
  };

  lines.push(`\n📌 *Status:* ${statusMap[order.status] || order.status}`);

  if (order.trackingCode) {
    lines.push(`🔎 *Rastreio:* ${order.trackingCode}`);
  }

  if (order.deliveryAddress) {
    lines.push(`📍 *Entrega:* ${order.deliveryAddress}`);
  }

  if (pixKey && pixKey.trim()) {
    lines.push(`\n--------------------------------`);
    lines.push(`🔑 *PAGAMENTO VIA PIX:*`);
    lines.push(`*Chave:* \`${pixKey.trim()}\`${pixKeyType ? ` (${pixKeyType.toUpperCase()})` : ''}`);
    lines.push(`*Favorecido:* ${storeName}`);
    lines.push(`*Valor:* ${formatBRL(order.total)}`);
    lines.push(`_(Copie a chave acima e cole no app do seu banco para pagar)_`);
  }

  lines.push(`\nQualquer dúvida, estamos à disposição! Muito obrigado! ❤️`);
  return lines.join('\n');
}

export function generateSaleWhatsAppReceipt(
  sale: Sale,
  storeName: string,
  storePhone?: string,
  pixKey?: string,
  pixKeyType?: string
): string {
  const lines: string[] = [];
  lines.push(`🧾 *COMPROVANTE DE VENDA - ${storeName.toUpperCase()}*`);
  lines.push(`Venda #${sale.saleNumber} · ${formatDate(sale.date)}`);
  lines.push(`Cliente: ${sale.customerName}`);
  lines.push(`--------------------------------`);

  sale.items.forEach((item) => {
    lines.push(`▪️ ${item.quantity}x ${item.name} - ${formatBRL(item.total)}`);
  });

  lines.push(`--------------------------------`);
  if (sale.discountAmount > 0) {
    lines.push(`Desconto: -${formatBRL(sale.discountAmount)}`);
  }
  if (sale.shipping > 0) {
    lines.push(`Frete: +${formatBRL(sale.shipping)}`);
  }
  lines.push(`*TOTAL PAGO: ${formatBRL(sale.total)}*`);

  const methodMap: Record<string, string> = {
    pix: 'PIX',
    dinheiro: 'Dinheiro',
    debito: 'Cartão de Débito',
    credito: 'Cartão de Crédito',
    credito_parcelado: `Crédito em ${sale.installments || 1}x`,
    transferencia: 'Transferência Bancária',
    outro: 'Outro',
  };

  lines.push(`Forma: ${methodMap[sale.paymentMethod] || sale.paymentMethod}`);
  if (sale.change && sale.change > 0) {
    lines.push(`Troco: ${formatBRL(sale.change)}`);
  }

  // Include PIX key automatically if configured
  if (pixKey && pixKey.trim()) {
    lines.push(`\n--------------------------------`);
    lines.push(`🔑 *DADOS PARA PAGAMENTO VIA PIX:*`);
    lines.push(`*Chave:* \`${pixKey.trim()}\`${pixKeyType ? ` (${pixKeyType.toUpperCase()})` : ''}`);
    lines.push(`*Favorecido:* ${storeName}`);
    lines.push(`*Valor:* ${formatBRL(sale.total)}`);
    lines.push(`_(Copie a chave acima para pagar facilmente no app do seu banco)_`);
  }

  lines.push(`\nAgradecemos a sua preferência! Volte sempre! ✨`);
  if (storePhone) {
    lines.push(`Contato: ${storePhone}`);
  }

  return lines.join('\n');
}
