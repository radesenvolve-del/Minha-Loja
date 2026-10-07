import React, { useRef, useState } from 'react';
import {
  Printer,
  MessageCircle,
  Copy,
  QrCode,
  FileText,
  Download,
  Loader2,
  Check,
  Phone,
  AlertCircle,
  Package,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatBRL, formatDate } from '../../utils/formatters';
import { generateOrderWhatsAppMessage, openWhatsApp } from '../../utils/whatsapp';
import { downloadOrderPdf, shareOrderPdfViaWhatsApp } from '../../utils/pdfReceiptGenerator';

interface OrderReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({ isOpen, onClose, order }) => {
  const { settings, showToast } = useApp();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  // Sync phone when order opens
  React.useEffect(() => {
    if (order && isOpen) {
      setCustomerPhone(order.whatsapp || '');
    }
  }, [order, isOpen]);

  if (!order) return null;

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const fileName = await downloadOrderPdf({ order, settings, customerPhone });
      showToast(`Comprovante PDF "${fileName}" baixado com sucesso!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao gerar arquivo PDF do comprovante.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSharePdfWhatsApp = async () => {
    try {
      setIsGeneratingPdf(true);
      const res = await shareOrderPdfViaWhatsApp({ order, settings, customerPhone });
      if (res.method === 'native-share') {
        showToast('Comprovante em PDF compartilhado no WhatsApp!', 'success');
      } else {
        showToast('PDF baixado e WhatsApp aberto para envio!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao preparar envio do PDF pelo WhatsApp.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyText = () => {
    const text = generateOrderWhatsAppMessage(
      order,
      settings.storeName,
      settings.pixKey,
      settings.pixKeyType
    );
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    showToast('Resumo do pedido copiado com sucesso!', 'success');
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopyPixKey = () => {
    if (!settings.pixKey) return;
    navigator.clipboard.writeText(settings.pixKey);
    setCopiedPix(true);
    showToast(`Chave PIX copiada: ${settings.pixKey}`, 'success');
    setTimeout(() => setCopiedPix(false), 2500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Comprovante de Pedido #${order.orderNumber}`} maxWidth="sm">
      <div className="flex flex-col items-center space-y-3">
        {/* PDF Share Banner */}
        <div className="w-full p-3.5 rounded-2xl bg-[#FFFDF9] dark:bg-[#201B17] border border-[#E8DFC8] dark:border-[#3A302A] text-xs space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-1.5 text-xs">
              <FileText className="w-4 h-4 text-[#C99F3B]" strokeWidth={1.75} />
              <span>Comprovante PDF p/ WhatsApp</span>
            </span>
            <span className="badge-silver">
              Oficial
            </span>
          </div>
          <p className="text-[11px] text-[#7E7062] dark:text-[#B5A796] leading-relaxed">
            Gera um comprovante térmico PDF pronto para visualização rápida no celular e compartilhamento direto com o cliente no WhatsApp.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleSharePdfWhatsApp}
              className="flex-1 btn-gold !py-2.5 !px-3.5 !text-xs cursor-pointer shadow-xs"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" strokeWidth={1.75} />
                  <span>Enviar PDF via WhatsApp</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="btn-silver !py-2.5 !px-3 !text-xs cursor-pointer"
              title="Baixar arquivo PDF no dispositivo"
            >
              <Download className="w-4 h-4 text-[#C99F3B]" strokeWidth={1.75} />
              <span>Baixar PDF</span>
            </button>
          </div>
        </div>

        {/* PIX Key Banner */}
        {settings.pixKey ? (
          <div className="w-full p-2.5 rounded-xl bg-[#D8B059]/10 border border-[#C99F3B]/40 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#9D7320] dark:text-[#E6BE65] flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#C99F3B]" strokeWidth={1.75} />
                <span>Chave PIX da Loja:</span>
              </span>
              <button
                type="button"
                onClick={handleCopyPixKey}
                className="text-[11px] font-mono font-bold text-[#9D7320] dark:text-[#E6BE65] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedPix ? <Check className="w-3 h-3 text-[#9D7320]" strokeWidth={2} /> : <Copy className="w-3 h-3 text-[#C99F3B]" strokeWidth={1.75} />}
                <span>{copiedPix ? 'Copiada!' : 'Copiar'}</span>
              </button>
            </div>
            <p className="font-mono text-[#2C241E] dark:text-[#F3EDE6] font-bold mt-1 select-all text-xs">
              {settings.pixKey}{' '}
              <span className="badge-silver uppercase">
                {settings.pixKeyType?.toUpperCase() || 'CHAVE'}
              </span>
            </p>
          </div>
        ) : null}

        {/* Receipt Voucher Preview */}
        <div className="w-full p-4 sm:p-5 bg-[#FFFDF9] text-[#2C241E] border border-[#E8DFC8] rounded-2xl shadow-2xs font-mono text-xs leading-relaxed">
          <div className="text-center pb-3 border-b border-dashed border-[#E8DFC8]">
            <h3 className="font-black text-sm tracking-tight uppercase text-[#2C241E]">
              {settings.storeName || 'MINHA LOJA'}
            </h3>
            <p className="text-[10px] text-[#7E7062]">COMPROVANTE DE PEDIDO</p>
          </div>

          <div className="py-2.5 border-b border-dashed border-[#E8DFC8] space-y-0.5 text-[11px] text-[#554639]">
            <div className="flex justify-between">
              <span>PEDIDO: #{order.orderNumber}</span>
              <span>{formatDate(order.date)}</span>
            </div>
            <div>
              <span>CLIENTE: {order.customerName}</span>
            </div>
            <div>
              <span>ORIGEM: {order.origin.toUpperCase()}</span>
            </div>
            <div>
              <span>STATUS: {order.status.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>

          {/* Items */}
          <div className="py-2.5 border-b border-dashed border-[#E8DFC8] space-y-1">
            <div className="flex justify-between font-bold text-[10px] uppercase text-[#7E7062] pb-1">
              <span>Item / Qtd</span>
              <span>Total</span>
            </div>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-[11px]">
                <div className="pr-2 truncate">
                  <p className="font-semibold truncate text-[#2C241E]">{item.name}</p>
                  <p className="text-[10px] text-[#7E7062]">
                    {item.quantity}x {formatBRL(item.unitPrice)}
                  </p>
                </div>
                <span className="font-bold text-[#9D7320] shrink-0">{formatBRL(item.total)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-2.5 border-b border-dashed border-[#E8DFC8] space-y-1 text-[11px]">
            <div className="flex justify-between text-[#7E7062]">
              <span>Subtotal:</span>
              <span>{formatBRL(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Desconto:</span>
                <span>-{formatBRL(order.discount)}</span>
              </div>
            )}
            {order.shipping > 0 && (
              <div className="flex justify-between text-[#7E7062]">
                <span>Frete:</span>
                <span>+{formatBRL(order.shipping)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black pt-1 border-t border-[#E8DFC8]">
              <span>TOTAL DO PEDIDO:</span>
              <span className="text-[#9D7320] text-base font-black">{formatBRL(order.total)}</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Phone Input */}
        <div className="w-full space-y-1">
          <label className="block text-[11px] font-semibold text-[#7E7062] dark:text-[#B5A796]">
            WhatsApp para Envio (Deixe vazio para selecionar na hora):
          </label>
          <div className="relative">
            <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-[#8E8071]" strokeWidth={1.75} />
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Ex: (11) 98765-4321"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/50 dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] font-mono focus:outline-hidden focus:ring-2 focus:ring-[#C99F3B]/30"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 w-full">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 btn-silver !py-2.5 !px-3 !text-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#556070] dark:text-[#CBD5E1]" strokeWidth={1.75} />
            <span>Imprimir</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="flex-1 btn-silver !py-2.5 !px-3 !text-xs cursor-pointer"
            title="Copiar texto completo para área de transferência"
          >
            {copiedText ? (
              <>
                <Check className="w-4 h-4 text-[#9D7320]" strokeWidth={2} />
                <span className="text-[#9D7320] font-bold">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#556070] dark:text-[#CBD5E1]" strokeWidth={1.75} />
                <span>Copiar Texto</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
