import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { Modal } from './Modal';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Escanear Código com a Câmera',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setErrorMsg(null);
    setIsScanning(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada pelo navegador.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setupBarcodeDetector();
      }
    } catch (err: unknown) {
      console.warn('Camera error:', err);
      setHasCamera(false);
      setErrorMsg('Não foi possível acessar a câmera. Você pode digitar o código abaixo.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const setupBarcodeDetector = () => {
    // Check if BarcodeDetector is supported natively in browser
    if ('BarcodeDetector' in window) {
      try {
        // @ts-expect-error native BarcodeDetector API
        const barcodeDetector = new window.BarcodeDetector({
          formats: ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a'],
        });

        const scanFrame = async () => {
          if (!videoRef.current || !isOpen) return;
          try {
            if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const detectedCode = barcodes[0].rawValue;
                if (detectedCode) {
                  stopCamera();
                  onScan(detectedCode);
                  onClose();
                  return;
                }
              }
            }
          } catch {}
          animationFrameId.current = requestAnimationFrame(scanFrame);
        };

        animationFrameId.current = requestAnimationFrame(scanFrame);
      } catch {
        // Barcode detector failed to init
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      stopCamera();
      onScan(manualCode.trim());
      setManualCode('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex flex-col items-center">
        {hasCamera && !errorMsg ? (
          <div className="relative w-full aspect-4/3 bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-inner flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder Target */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-36 border-2 border-[#C99F3B] rounded-xl relative shadow-lg">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#FDF4DC] -mt-1 -ml-1 rounded-tl" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#FDF4DC] -mt-1 -mr-1 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#FDF4DC] -mb-1 -ml-1 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#FDF4DC] -mb-1 -mr-1 rounded-br" />
                <div className="w-full h-0.5 bg-[#D8B059] absolute top-1/2 -translate-y-1/2 opacity-90 shadow-sm animate-pulse" />
              </div>
            </div>
            <div className="absolute bottom-3 bg-[#171412]/80 backdrop-blur-xs px-3 py-1 rounded-full text-[#F3EDE6] text-xs border border-[#C99F3B]/30">
              Aponte para o código de barras ou QR Code
            </div>
          </div>
        ) : (
          <div className="w-full p-4 rounded-xl bg-[#D8B059]/10 border border-[#C99F3B]/40 text-[#9D7320] dark:text-[#E6BE65] text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#C99F3B]" />
            <span>{errorMsg || 'Câmera não disponível.'}</span>
          </div>
        )}

        {/* Manual Code Input Form */}
        <form onSubmit={handleManualSubmit} className="w-full mt-4 flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Ou digite o código de barras / SKU..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#8E8071] text-sm focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            autoFocus
          />
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="btn-gold !py-2.5 !px-5 !text-xs cursor-pointer shadow-xs disabled:opacity-50"
          >
            Buscar
          </button>
        </form>
      </div>
    </Modal>
  );
};
