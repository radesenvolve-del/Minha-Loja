import React, { useEffect, useRef, useState } from 'react';
import { Printer, Download, QrCode, Barcode as BarcodeIcon } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Product } from '../../types';
import { renderBarcodeToSvg, generateQRCode } from '../../utils/barcodes';
import { formatBRL } from '../../utils/formatters';

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({ isOpen, onClose, product }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [activeMode, setActiveMode] = useState<'barcode' | 'qrcode'>('barcode');

  useEffect(() => {
    if (product && isOpen) {
      // Render barcode
      const codeToUse = product.barcode || product.sku;
      if (svgRef.current && codeToUse) {
        renderBarcodeToSvg(svgRef.current, codeToUse, { width: 2, height: 50 });
      }

      // Generate QR Code containing product payload
      const qrPayload = JSON.stringify({
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
      });

      generateQRCode(qrPayload).then((url) => {
        setQrCodeUrl(url);
      });
    }
  }, [product, isOpen]);

  if (!product) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Código de Barras e QR Code" maxWidth="md">
      <div className="flex flex-col items-center space-y-4">
        {/* Toggle Barcode vs QR Code */}
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <button
            onClick={() => setActiveMode('barcode')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'barcode'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <BarcodeIcon className="w-4 h-4" />
            <span>Código de Barras</span>
          </button>
          <button
            onClick={() => setActiveMode('qrcode')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'qrcode'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Code</span>
          </button>
        </div>

        {/* Display Area (Printable Card) */}
        <div
          id="printable-tag"
          className="w-full max-w-xs p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm text-center flex flex-col items-center text-zinc-900"
        >
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1">
            {product.category}
          </span>
          <h4 className="text-sm font-extrabold line-clamp-2 leading-snug mb-1">
            {product.name}
          </h4>
          <span className="text-xl font-extrabold font-mono text-zinc-900 mb-3">
            {formatBRL(product.price)}
          </span>

          {activeMode === 'barcode' ? (
            <div className="flex flex-col items-center w-full py-2">
              <svg ref={svgRef} className="max-w-full h-auto" />
              <span className="text-[10px] font-mono text-zinc-500 mt-1">
                SKU: {product.sku}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center py-2">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40 object-contain rounded-lg" />
              ) : (
                <div className="w-40 h-40 bg-zinc-100 flex items-center justify-center text-xs text-zinc-400">
                  Gerando...
                </div>
              )}
              <span className="text-[10px] font-mono text-zinc-500 mt-1">
                SKU: {product.sku}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Etiqueta</span>
          </button>
          {activeMode === 'qrcode' && qrCodeUrl && (
            <a
              href={qrCodeUrl}
              download={`qrcode-${product.sku}.png`}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Imagem</span>
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
};
