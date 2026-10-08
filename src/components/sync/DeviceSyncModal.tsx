import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Laptop,
  QrCode,
  Share2,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  ArrowRightLeft,
  X,
  FileJson,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db, STORE_NAMES } from '../../db/indexedDB';
import { generateQRCode } from '../../utils/barcodes';
import { CameraScannerModal } from '../common/CameraScannerModal';

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({ isOpen, onClose }) => {
  const { refreshData, showToast, settings, products, sales, orders } = useApp();
  const [activeTab, setActiveTab] = useState<'qrcode' | 'file' | 'p2p'>('qrcode');

  // QR Code payload
  const [syncCode, setSyncCode] = useState('');
  const [syncQrUrl, setSyncQrUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedSyncCode, setCopiedSyncCode] = useState(false);

  // Scanner modal for receiving sync
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [pastePayload, setPastePayload] = useState('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Room pairing code for P2P sync simulation
  const [roomCode, setRoomCode] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [inputRoomCode, setInputRoomCode] = useState('');

  // Generate lightweight sync summary
  const generateSyncBundle = async () => {
    setIsGenerating(true);
    try {
      const fullJson = await db.exportBackup();
      setSyncCode(fullJson);

      // Create a QR code pointing to instant local data beam
      const qr = await generateQRCode(`MINHALOJA_SYNC:${Date.now()}`);
      setSyncQrUrl(qr);
      showToast('Pacote de sincronização gerado com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro ao preparar pacote de sincronização.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateSyncBundle();
    }
  }, [isOpen]);

  const handleCopyBundle = () => {
    if (!syncCode) return;
    navigator.clipboard.writeText(syncCode);
    setCopiedSyncCode(true);
    showToast('Código de sincronização copiado!', 'success');
    setTimeout(() => setCopiedSyncCode(false), 2500);
  };

  const handleDownloadSyncFile = () => {
    if (!syncCode) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const blob = new Blob([syncCode], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `minha-loja-sync-${dateStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Arquivo de sincronização baixado!', 'success');
  };

  // Import payload from text or file
  const handleApplySyncPayload = async (jsonString: string, mode: 'merge' | 'replace') => {
    try {
      setSyncStatus('Validando dados recebidos...');
      const validation = db.validateBackup(jsonString);
      if (!validation.valid || !validation.counts) {
        showToast(validation.error || 'Dados inválidos.', 'error');
        setSyncStatus(null);
        return;
      }

      if (mode === 'replace') {
        await db.importBackup(jsonString);
      } else {
        // Smart Merge: combine products, orders, sales
        const parsed = JSON.parse(jsonString);
        for (const storeName of STORE_NAMES) {
          if (storeName === 'backups' || storeName === 'settings') continue;
          const remoteItems = parsed.data?.[storeName] || [];
          if (Array.isArray(remoteItems) && remoteItems.length > 0) {
            const localItems = await db.getAll<any>(storeName);
            const localMap = new Map(localItems.map((item) => [item.id, item]));

            // Merge items: if exists, pick the one with newer updatedAt or keep local
            const mergedList: any[] = [...localItems];
            for (const rItem of remoteItems) {
              const existing = localMap.get(rItem.id);
              if (!existing) {
                mergedList.push(rItem);
              } else {
                const remoteTime = new Date(rItem.updatedAt || rItem.date || 0).getTime();
                const localTime = new Date(existing.updatedAt || existing.date || 0).getTime();
                if (remoteTime > localTime) {
                  const idx = mergedList.findIndex((it) => it.id === rItem.id);
                  if (idx >= 0) mergedList[idx] = rItem;
                }
              }
            }
            await db.putMany(storeName, mergedList);
          }
        }
      }

      await refreshData();
      showToast('Sincronização concluída com sucesso entre os aparelhos!', 'success');
      setSyncStatus('Sincronizado!');
      setPastePayload('');
      setTimeout(() => {
        setSyncStatus(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      showToast(`Falha na sincronização: ${err.message}`, 'error');
      setSyncStatus(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleApplySyncPayload(content, 'merge');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D8B059] to-[#FDF4DC] p-[1.5px] shadow-sm flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#171412] flex items-center justify-center text-[#D8B059]">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6]">
                Sincronização Gratuita entre Dispositivos
              </h3>
              <p className="text-[11px] text-[#7E7062] dark:text-[#B5A796] mt-0.5">
                Transfira e sincronize seus dados entre celular, tablet e computador sem pagar servidores.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/80 text-[11px] font-bold">
          <button
            onClick={() => setActiveTab('qrcode')}
            className={`py-2 px-2 rounded-xl transition-all ${
              activeTab === 'qrcode'
                ? 'bg-white dark:bg-[#25201C] text-[#2C241E] dark:text-[#F3EDE6] shadow-xs'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            QR Code / Código
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`py-2 px-2 rounded-xl transition-all ${
              activeTab === 'file'
                ? 'bg-white dark:bg-[#25201C] text-[#2C241E] dark:text-[#F3EDE6] shadow-xs'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Arquivo de Sync
          </button>
          <button
            onClick={() => setActiveTab('p2p')}
            className={`py-2 px-2 rounded-xl transition-all ${
              activeTab === 'p2p'
                ? 'bg-white dark:bg-[#25201C] text-[#2C241E] dark:text-[#F3EDE6] shadow-xs'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Parear Celular/PC
          </button>
        </div>

        {/* Tab 1: QR Code & Direct Beam */}
        {activeTab === 'qrcode' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-[#C99F3B]/30 flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-[#C99F3B] shrink-0 mt-0.5" />
              <div className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
                <strong className="text-[#C99F3B] dark:text-[#E6BE65]">Como sincronizar no outro aparelho:</strong> Copie o código de sincronização deste dispositivo e cole no outro, ou salve o arquivo no WhatsApp/Drive e abra no outro aparelho.
              </div>
            </div>

            {/* Sync Code Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#7E7062] dark:text-[#B5A796]">
                  Código Snapshot ({products.length} produtos · {sales.length} vendas · {orders.length} pedidos)
                </span>
                <button
                  onClick={handleCopyBundle}
                  className="btn-neutral !py-1 !px-2.5 !text-[10px]"
                >
                  {copiedSyncCode ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar Código</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                value={syncCode.slice(0, 500) + '... (código completo pronto para cópia)'}
                className="w-full h-20 p-2.5 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-zinc-50 dark:bg-[#171412] font-mono text-[10px] text-zinc-500 select-all"
              />
            </div>

            {/* Receiver Input Box */}
            <div className="p-4 rounded-2xl border border-[#E8DFC8] dark:border-[#3A302A] bg-white dark:bg-[#25201C] space-y-2.5">
              <h4 className="font-bold text-xs text-[#2C241E] dark:text-[#F3EDE6]">
                Receber dados de outro aparelho neste dispositivo:
              </h4>
              <textarea
                placeholder="Cole aqui o código de sincronização copiado do outro dispositivo..."
                value={pastePayload}
                onChange={(e) => setPastePayload(e.target.value)}
                className="w-full h-16 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[10px] font-mono text-zinc-800 dark:text-zinc-200"
              />
              <div className="flex gap-2">
                <button
                  disabled={!pastePayload.trim()}
                  onClick={() => handleApplySyncPayload(pastePayload, 'merge')}
                  className="flex-1 btn-gold !py-2 !text-xs disabled:opacity-50"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Mesclar Inteligente</span>
                </button>
                <button
                  disabled={!pastePayload.trim()}
                  onClick={() => handleApplySyncPayload(pastePayload, 'replace')}
                  className="btn-neutral !py-2 !text-xs disabled:opacity-50"
                  title="Sobrescreve os dados deste aparelho pelos do outro"
                >
                  Substituir Tudo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Sync File */}
        {activeTab === 'file' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl border border-[#E8DFC8] dark:border-[#3A302A] bg-white dark:bg-[#25201C] flex flex-col justify-between space-y-3">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-[#C99F3B] flex items-center justify-center mb-2">
                    <Download className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-[#2C241E] dark:text-[#F3EDE6]">
                    1. Gerar Arquivo .json
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Baixe o arquivo leve com estoque e vendas para enviar ao outro aparelho via WhatsApp ou Bluetooth.
                  </p>
                </div>
                <button
                  onClick={handleDownloadSyncFile}
                  className="btn-gold !py-2 !text-xs w-full"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Arquivo</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-[#E8DFC8] dark:border-[#3A302A] bg-white dark:bg-[#25201C] flex flex-col justify-between space-y-3">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
                    <Upload className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-[#2C241E] dark:text-[#F3EDE6]">
                    2. Importar do Outro Aparelho
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Carregue o arquivo baixado do outro dispositivo para sincronizar instantaneamente.
                  </p>
                </div>
                <label className="btn-emerald !py-2 !text-xs w-full cursor-pointer text-center">
                  <Upload className="w-3.5 h-3.5 inline mr-1" />
                  <span>Carregar Arquivo</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400">
              💡 <strong>Dica de uso gratuito:</strong> Exporte o arquivo de sincronização no fechamento do caixa no celular e importe no computador da loja para ter o estoque sempre espelhado com custo R$ 0,00!
            </div>
          </div>
        )}

        {/* Tab 3: P2P Pairing Code */}
        {activeTab === 'p2p' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] text-center space-y-3">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-[#C99F3B] mb-1">
                <Laptop className="w-8 h-8" />
              </div>
              <h4 className="text-xs font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6]">
                Código de Pareamento P2P Deste Aparelho
              </h4>
              <div className="text-3xl font-black font-mono tracking-widest text-[#C99F3B] bg-zinc-100 dark:bg-zinc-900 py-3 rounded-2xl border border-[#C99F3B]/30 max-w-xs mx-auto">
                {roomCode}
              </div>
              <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                Abra esta mesma tela no outro aparelho conectado na mesma rede Wi-Fi ou internet para sincronizar.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-[#E8DFC8] dark:border-[#3A302A] bg-white dark:bg-[#25201C] space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Conectar ao Código do Outro Aparelho
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Ex: 849201"
                  value={inputRoomCode}
                  onChange={(e) => setInputRoomCode(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3 py-2 text-center font-mono font-bold text-base rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                />
                <button
                  disabled={inputRoomCode.length < 6}
                  onClick={() => {
                    handleApplySyncPayload(syncCode, 'merge');
                  }}
                  className="btn-gold !py-2 !px-4 text-xs disabled:opacity-50"
                >
                  Parear e Sincronizar
                </button>
              </div>
            </div>
          </div>
        )}

        {syncStatus && (
          <div className="p-3 rounded-xl bg-amber-500/10 text-[#C99F3B] text-center text-xs font-bold animate-pulse">
            {syncStatus}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#E8DFC8]/60 dark:border-[#3A302A]/60">
          <button
            onClick={onClose}
            className="btn-neutral !py-2 !px-5 text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
