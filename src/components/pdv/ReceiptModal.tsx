import React, { useRef, useEffect, useState } from 'react';
import {
  Printer,
  MessageCircle,
  Check,
  X,
  Store,
  Copy,
  QrCode,
  Share2,
  Phone,
  AlertCircle,
  FileText,
  Download,
  Loader2,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Sale } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatBRL, formatDateTime } from '../../utils/formatters';
import { generateSaleWhatsAppReceipt, openWhatsApp } from '../../utils/whatsapp';
import { renderBarcodeToSvg } from '../../utils/barcodes';
import { downloadSalePdf, shareSalePdfViaWhatsApp } from '../../utils/pdfReceiptGenerator';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, sale }) => {
  const { settings, customers, setActiveTab, showToast } = useApp();
  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!sale) return;
    try {
      setIsGeneratingPdf(true);
      const fileName = await downloadSalePdf({ sale, settings, customerPhone });
      showToast(`Comprovante PDF "${fileName}" baixado com sucesso!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao gerar arquivo PDF do comprovante.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSharePdfWhatsApp = async () => {
    if (!sale) return;
    try {
      setIsGeneratingPdf(true);
      const res = await shareSalePdfViaWhatsApp({ sale, settings, customerPhone });
      if (res.method === 'native-share') {
        showToast('Comprovante em PDF compartilhado no WhatsApp!', 'success');
      } else {
        showToast('PDF baixado e WhatsApp aberto para anexar o comprovante!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao preparar envio do PDF pelo WhatsApp.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  useEffect(() => {
    if (sale && isOpen) {
      if (barcodeRef.current) {
        renderBarcodeToSvg(barcodeRef.current, sale.saleNumber, { width: 1.8, height: 35 });
      }

      // Pre-fill phone if customer has WhatsApp
      if (sale.customerId) {
        const found = customers.find((c) => c.id === sale.customerId);
        if (found?.whatsapp) {
          setCustomerPhone(found.whatsapp);
        } else {
          setCustomerPhone('');
        }
      } else {
        setCustomerPhone('');
      }
    }
  }, [sale, isOpen, customers]);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppReceipt = () => {
    const text = generateSaleWhatsAppReceipt(
      sale,
      settings.storeName,
      settings.phone,
      settings.pixKey,
      settings.pixKeyType
    );
    openWhatsApp(customerPhone, text);
    showToast(
      settings.pixKey
        ? 'Comprovante com Chave PIX gerado no WhatsApp!'
        : 'Comprovante gerado no WhatsApp! (Cadastre sua chave PIX nas configurações)',
      'success'
    );
  };

  const handleCopyPixKey = () => {
    if (!settings.pixKey) return;
    navigator.clipboard.writeText(settings.pixKey);
    setCopiedPix(true);
    showToast(`Chave PIX copiada: ${settings.pixKey}`, 'success');
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleCopyReceiptText = () => {
    const text = generateSaleWhatsAppReceipt(
      sale,
      settings.storeName,
      settings.phone,
      settings.pixKey,
      settings.pixKeyType
    );
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    showToast('Texto do comprovante copiado com sucesso!', 'success');
    setTimeout(() => setCopiedText(false), 3000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comprovante de Venda / Pagamento" maxWidth="sm">
      <div className="flex flex-col items-center space-y-3">
        {/* Automatic PIX Notice Banner */}
        {settings.pixKey ? (
          <div className="w-full p-2.5 rounded-xl bg-[#D8B059]/10 border border-[#C99F3B]/40 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#9D7320] dark:text-[#E6BE65] flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#C99F3B]" strokeWidth={1.75} />
                <span>Chave PIX Inclusa Automaticamente:</span>
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
        ) : (
          <div className="w-full p-2.5 rounded-xl bg-[#F5EFEB] dark:bg-[#201B17] border border-[#E8DFC8] dark:border-[#3A302A] text-xs text-[#7E7062] dark:text-[#B5A796] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#C99F3B]" strokeWidth={1.75} />
              <span>Nenhuma Chave PIX cadastrada na loja.</span>
            </div>
            <button
              onClick={() => {
                onClose();
                setActiveTab('settings');
              }}
              className="font-bold text-[#9D7320] dark:text-[#E6BE65] underline text-[11px] shrink-0 cursor-pointer"
            >
              Cadastrar Agora
            </button>
          </div>
        )}

        {/* Thermal / Receipt Card */}
        <div
          id="printable-receipt"
          className="w-full p-4 sm:p-5 bg-[#FFFDF9] text-[#2C241E] border border-[#E8DFC8] rounded-2xl shadow-2xs font-mono text-xs leading-relaxed"
        >
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-[#E8DFC8]">
            <h3 className="font-extrabold text-sm tracking-tight uppercase text-[#2C241E]">
              {settings.storeName}
            </h3>
            {settings.cnpjCpf && <p className="text-[10px] text-[#7E7062]">CNPJ: {settings.cnpjCpf}</p>}
            {settings.address && <p className="text-[10px] text-[#7E7062]">{settings.address}</p>}
            {settings.phone && <p className="text-[10px] text-[#7E7062]">Tel: {settings.phone}</p>}
          </div>

          {/* Sale details */}
          <div className="py-2.5 border-b border-dashed border-[#E8DFC8] space-y-0.5 text-[11px] text-[#554639]">
            <div className="flex justify-between">
              <span>VENDA: #{sale.saleNumber}</span>
              <span>{formatDateTime(sale.date)}</span>
            </div>
            <div>
              <span>CLIENTE: {sale.customerName}</span>
            </div>
            <div>
              <span>VENDEDOR: {sale.userName}</span>
            </div>
          </div>

          {/* Items */}
          <div className="py-2.5 border-b border-dashed border-[#E8DFC8] space-y-1">
            <div className="flex justify-between font-bold text-[10px] uppercase text-[#7E7062] pb-1">
              <span>Item / Qtd</span>
              <span>Total</span>
            </div>
            {sale.items.map((item, idx) => (
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
              <span>{formatBRL(sale.subtotal)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Desconto:</span>
                <span>-{formatBRL(sale.discountAmount)}</span>
              </div>
            )}
            {sale.shipping > 0 && (
              <div className="flex justify-between text-[#7E7062]">
                <span>Frete:</span>
                <span>+{formatBRL(sale.shipping)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black pt-1 border-t border-[#E8DFC8]">
              <span>TOTAL PAGO:</span>
              <span className="text-[#9D7320] text-base font-black">{formatBRL(sale.total)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="pt-2 text-[11px] space-y-0.5 text-[#554639]">
            <div className="flex justify-between">
              <span>FORMA:</span>
              <span className="font-bold uppercase text-[#2C241E]">
                {sale.paymentMethod === 'credito_parcelado'
                  ? `Crédito em ${sale.installments || 1}x`
                  : sale.paymentMethod}
              </span>
            </div>
            {sale.amountPaid && sale.amountPaid > sale.total && (
              <>
                <div className="flex justify-between">
                  <span>VALOR RECEBIDO:</span>
                  <span>{formatBRL(sale.amountPaid)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>TROCO:</span>
                  <span>{formatBRL(sale.change || 0)}</span>
                </div>
              </>
            )}
          </div>

          {/* PIX Key on Receipt if configured */}
          {settings.pixKey && (
            <div className="mt-3 p-2.5 rounded-xl bg-[#F5EFEB] border border-[#E8DFC8] text-center space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-[#7E7062] block">
                Chave PIX da Loja ({settings.pixKeyType?.toUpperCase() || 'CHAVE'})
              </span>
              <p className="text-xs font-bold font-mono select-all text-[#2C241E]">
                {settings.pixKey}
              </p>
              <p className="text-[9px] text-[#7E7062] italic">
                Copie a chave acima no seu app bancário
              </p>
            </div>
          )}

          {/* Barcode representation */}
          <div className="mt-3 pt-2.5 border-t border-dashed border-[#E8DFC8] flex flex-col items-center">
            <svg ref={barcodeRef} className="max-w-full h-auto" />
            <p className="text-[10px] text-center text-[#7E7062] mt-1.5">
              Obrigado pela preferência! Volte sempre ✨
            </p>
          </div>
        </div>

        {/* PDF Receipt Card for WhatsApp & Download */}
        <div className="w-full p-3.5 rounded-2xl bg-[#FFFDF9] dark:bg-[#201B17] border border-[#E8DFC8] dark:border-[#3A302A] text-xs space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-1.5 text-xs">
              <FileText className="w-4 h-4 text-[#C99F3B]" strokeWidth={1.75} />
              <span>Comprovante em PDF (Recibo Oficial)</span>
            </span>
            <span className="badge-silver">
              WhatsApp
            </span>
          </div>
          <p className="text-[11px] text-[#7E7062] dark:text-[#B5A796] leading-relaxed">
            Gera um PDF completo com logo, itens, QR Code e chave PIX para envio direto ao cliente no WhatsApp.
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

        {/* Customer WhatsApp Phone Input */}
        <div className="w-full space-y-1">
          <label className="block text-[11px] font-semibold text-[#7E7062] dark:text-[#B5A796]">
            WhatsApp de Envio (Opcional - deixe vazio para escolher o contato):
          </label>
          <div className="relative">
            <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-[#8E8071]" strokeWidth={1.75} />
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Ex: (11) 98765-4321 ou 11987654321"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/50 dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] font-mono focus:outline-hidden focus:ring-2 focus:ring-[#C99F3B]/30"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 w-full">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 btn-silver !py-2.5 !px-3 !text-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#556070] dark:text-[#CBD5E1]" strokeWidth={1.75} />
            <span>Imprimir</span>
          </button>

          <button
            type="button"
            onClick={handleCopyReceiptText}
            className="btn-silver !py-2.5 !px-3 !text-xs cursor-pointer"
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

          <button
            type="button"
            onClick={handleWhatsAppReceipt}
            className="flex-1 btn-gold !py-2.5 !px-4 !text-xs cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" strokeWidth={1.75} />
            <span>Enviar no WhatsApp</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
