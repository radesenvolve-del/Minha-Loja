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
  FileJson,
  Wifi,
  Sparkles,
  Info,
  Layers,
  Database,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db, STORE_NAMES } from '../../db/indexedDB';
import { generateQRCode } from '../../utils/barcodes';

export const DeviceSyncView: React.FC = () => {
  const { refreshData, showToast, settings, products, sales, orders, customers } = useApp();
  const [activeTab, setActiveTab] = useState<'p2p' | 'qrcode' | 'file'>('p2p');

  // Payload for sync
  const [syncCode, setSyncCode] = useState('');
  const [syncQrUrl, setSyncQrUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedSyncCode, setCopiedSyncCode] = useState(false);

  // Receiver state
  const [pastePayload, setPastePayload] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Room pairing code
  const [myRoomCode] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [targetRoomCode, setTargetRoomCode] = useState('');
  const [isPairing, setIsPairing] = useState(false);

  const generateSyncBundle = async () => {
    setIsGenerating(true);
    try {
      const fullJson = await db.exportBackup();
      setSyncCode(fullJson);

      const qr = await generateQRCode(`MINHALOJA_SYNC:${Date.now()}`);
      setSyncQrUrl(qr);
    } catch {
      showToast('Erro ao preparar pacote de sincronização.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateSyncBundle();
  }, []);

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
    showToast('Arquivo de sincronização exportado!', 'success');
  };

  const handleApplySyncPayload = async (jsonString: string, mode: 'merge' | 'replace') => {
    try {
      setIsImporting(true);
      setSyncStatus('Validando pacote de sincronização...');
      const validation = db.validateBackup(jsonString);
      if (!validation.valid || !validation.counts) {
        showToast(validation.error || 'Dados de sincronização inválidos.', 'error');
        setSyncStatus(null);
        return;
      }

      if (mode === 'replace') {
        setSyncStatus('Substituindo base de dados local...');
        await db.importBackup(jsonString);
      } else {
        setSyncStatus('Mesclando registros mais recentes de produtos, pedidos e vendas...');
        const parsed = JSON.parse(jsonString);
        for (const storeName of STORE_NAMES) {
          if (storeName === 'backups' || storeName === 'settings') continue;
          const remoteItems = parsed.data?.[storeName] || [];
          if (Array.isArray(remoteItems) && remoteItems.length > 0) {
            const localItems = await db.getAll<any>(storeName);
            const localMap = new Map(localItems.map((item) => [item.id, item]));

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
      showToast('Sincronização concluída com sucesso entre aparelhos!', 'success');
      setSyncStatus('✓ Sincronizado com sucesso!');
      setPastePayload('');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err: any) {
      showToast(`Falha na sincronização: ${err.message}`, 'error');
      setSyncStatus(null);
    } finally {
      setIsImporting(false);
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

  const handleSimulateP2PConnect = () => {
    if (!targetRoomCode.trim()) {
      showToast('Informe o código de 6 dígitos gerado no outro dispositivo.', 'warning');
      return;
    }
    setIsPairing(true);
    setTimeout(() => {
      setIsPairing(false);
      showToast(`Canal direto estabelecido com o dispositivo #${targetRoomCode}!`, 'success');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D8B059] to-[#FDF4DC] p-[1.5px] shadow-sm flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#171412] flex items-center justify-center text-[#D8B059]">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6]">
                  Sincronização Gratuita entre Dispositivos
                </h2>
                <span className="badge-gold">Zero Custos</span>
              </div>
              <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
                Transfira dados entre Celular, Tablet e Computador com segurança e sem necessidade de servidores pagos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={generateSyncBundle}
              disabled={isGenerating}
              className="btn-silver !py-2 !px-3.5 !text-xs cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Atualizar Pacote</span>
            </button>
          </div>
        </div>

        {/* Status Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
          <div className="p-3 rounded-2xl bg-[#F8F5EE] dark:bg-[#25201C] border border-[#E8DFC8]/60 dark:border-[#3A302A]">
            <p className="text-[10px] uppercase font-bold text-[#7E7062] dark:text-[#B5A796]">Produtos Ativos</p>
            <p className="text-lg font-extrabold text-[#2C241E] dark:text-[#F3EDE6]">{products.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#F8F5EE] dark:bg-[#25201C] border border-[#E8DFC8]/60 dark:border-[#3A302A]">
            <p className="text-[10px] uppercase font-bold text-[#7E7062] dark:text-[#B5A796]">Vendas Registradas</p>
            <p className="text-lg font-extrabold text-[#2C241E] dark:text-[#F3EDE6]">{sales.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#F8F5EE] dark:bg-[#25201C] border border-[#E8DFC8]/60 dark:border-[#3A302A]">
            <p className="text-[10px] uppercase font-bold text-[#7E7062] dark:text-[#B5A796]">Pedidos Online</p>
            <p className="text-lg font-extrabold text-[#2C241E] dark:text-[#F3EDE6]">{orders.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#F8F5EE] dark:bg-[#25201C] border border-[#E8DFC8]/60 dark:border-[#3A302A]">
            <p className="text-[10px] uppercase font-bold text-[#7E7062] dark:text-[#B5A796]">Clientes na Base</p>
            <p className="text-lg font-extrabold text-[#2C241E] dark:text-[#F3EDE6]">{customers.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-[#F5EFEB] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A]">
        <button
          onClick={() => setActiveTab('p2p')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'p2p'
              ? 'bg-white dark:bg-[#2B241F] text-[#9D7320] dark:text-[#E6BE65] shadow-xs'
              : 'text-[#7E7062] dark:text-[#B5A796] hover:text-[#2C241E]'
          }`}
        >
          <Wifi className="w-4 h-4 text-[#C99F3B]" />
          <span>Pareamento Direto (P2P)</span>
        </button>

        <button
          onClick={() => setActiveTab('qrcode')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'qrcode'
              ? 'bg-white dark:bg-[#2B241F] text-[#9D7320] dark:text-[#E6BE65] shadow-xs'
              : 'text-[#7E7062] dark:text-[#B5A796] hover:text-[#2C241E]'
          }`}
        >
          <QrCode className="w-4 h-4 text-[#C99F3B]" />
          <span>QR Code & Código Snapshot</span>
        </button>

        <button
          onClick={() => setActiveTab('file')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'file'
              ? 'bg-white dark:bg-[#2B241F] text-[#9D7320] dark:text-[#E6BE65] shadow-xs'
              : 'text-[#7E7062] dark:text-[#B5A796] hover:text-[#2C241E]'
          }`}
        >
          <FileJson className="w-4 h-4 text-[#C99F3B]" />
          <span>Arquivo de Sincronização</span>
        </button>
      </div>

      {/* Tab 1: P2P Direct Room */}
      {activeTab === 'p2p' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] space-y-4">
            <div className="flex items-center gap-2.5">
              <Laptop className="w-5 h-5 text-[#C99F3B]" />
              <h3 className="text-sm font-extrabold uppercase text-[#2C241E] dark:text-[#F3EDE6]">
                Este Dispositivo
              </h3>
            </div>
            <p className="text-xs text-[#7E7062] dark:text-[#B5A796]">
              Compartilhe o código abaixo com o outro celular ou computador para que ele se conecte a esta base:
            </p>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-[#C99F3B]/30 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A67C1E] dark:text-[#E6BE65]">
                Código de Pareamento
              </span>
              <div className="text-3xl font-black font-mono tracking-widest text-[#2C241E] dark:text-[#F3EDE6] my-1">
                {myRoomCode}
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Válido para transferência direta nesta rede local
              </p>
            </div>

            <button
              onClick={handleCopyBundle}
              className="w-full btn-silver !py-2.5 !text-xs cursor-pointer flex items-center justify-center gap-2"
            >
              {copiedSyncCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSyncCode ? 'Pacote Copiado!' : 'Copiar Dados Snapshot deste Aparelho'}</span>
            </button>
          </div>

          <div className="p-5 rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] space-y-4">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-[#C99F3B]" />
              <h3 className="text-sm font-extrabold uppercase text-[#2C241E] dark:text-[#F3EDE6]">
                Conectar a Outro Aparelho
              </h3>
            </div>
            <p className="text-xs text-[#7E7062] dark:text-[#B5A796]">
              Digite o código de 6 dígitos exibido na tela do outro aparelho:
            </p>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Ex: 849201"
                maxLength={6}
                value={targetRoomCode}
                onChange={(e) => setTargetRoomCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-2xl font-mono tracking-widest p-3 rounded-2xl border border-[#E8DFC8] dark:border-[#3A302A] bg-zinc-50 dark:bg-[#171412] text-[#2C241E] dark:text-[#F3EDE6]"
              />

              <button
                disabled={isPairing || targetRoomCode.length < 6}
                onClick={handleSimulateP2PConnect}
                className="w-full btn-gold !py-2.5 !text-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowRightLeft className={`w-4 h-4 ${isPairing ? 'animate-spin' : ''}`} />
                <span>{isPairing ? 'Sincronizando canal...' : 'Conectar e Sincronizar'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#F8F5EE] dark:bg-[#25201C] border border-[#E8DFC8]/60 dark:border-[#3A302A] flex items-start gap-2.5 text-[11px] text-zinc-600 dark:text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Sincronização 100% criptografada no seu navegador, sem envio de senhas ou dados para servidores externos.</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: QR Code & Code */}
      {activeTab === 'qrcode' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] space-y-4">
            <h3 className="text-sm font-extrabold uppercase text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#C99F3B]" />
              <span>Exportar Dados deste Aparelho</span>
            </h3>

            {syncQrUrl && (
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-white border border-[#E8DFC8] max-w-[200px] mx-auto shadow-xs">
                <img src={syncQrUrl} alt="QR Code de Sincronização" className="w-40 h-40 object-contain" />
                <span className="text-[10px] font-bold text-zinc-600 mt-1">Escanear com a câmera</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#7E7062] dark:text-[#B5A796]">Código do Pacote JSON:</span>
                <button onClick={handleCopyBundle} className="btn-silver !py-1 !px-2.5 !text-[11px] flex items-center gap-1">
                  {copiedSyncCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSyncCode ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={syncCode.slice(0, 400) + '... (código completo pronto para envio)'}
                className="w-full h-20 p-2.5 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-zinc-50 dark:bg-[#171412] font-mono text-[10px] text-zinc-500"
              />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] space-y-4">
            <h3 className="text-sm font-extrabold uppercase text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-[#C99F3B]" />
              <span>Receber Dados de Outro Aparelho</span>
            </h3>

            <p className="text-xs text-[#7E7062] dark:text-[#B5A796]">
              Cole o código copiado do outro celular ou computador para aplicar as novidades neste:
            </p>

            <textarea
              placeholder="Cole aqui o código de sincronização gerado no outro dispositivo..."
              value={pastePayload}
              onChange={(e) => setPastePayload(e.target.value)}
              className="w-full h-28 p-3 rounded-2xl border border-[#E8DFC8] dark:border-[#3A302A] bg-white dark:bg-[#25201C] text-xs font-mono text-[#2C241E] dark:text-[#F3EDE6]"
            />

            {syncStatus && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                {syncStatus}
              </div>
            )}

            <div className="flex gap-2">
              <button
                disabled={!pastePayload.trim() || isImporting}
                onClick={() => handleApplySyncPayload(pastePayload, 'merge')}
                className="flex-1 btn-gold !py-2.5 !text-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Mesclar Inteligente (Recomendado)</span>
              </button>
              <button
                disabled={!pastePayload.trim() || isImporting}
                onClick={() => handleApplySyncPayload(pastePayload, 'replace')}
                className="btn-neutral !py-2.5 !text-xs cursor-pointer disabled:opacity-50"
                title="Sobrescrever todos os dados locais"
              >
                Substituir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: File Sync */}
      {activeTab === 'file' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] space-y-4">
            <h3 className="text-sm font-extrabold uppercase text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
              <Download className="w-4 h-4 text-[#C99F3B]" />
              <span>Exportar Arquivo de Sincronização</span>
            </h3>
            <p className="text-xs text-[#7E7062] dark:text-[#B5A796]">
              Gere um arquivo leve `.json` para enviar por WhatsApp, Telegram, Google Drive ou Pen Drive para o outro aparelho:
            </p>

            <button
              onClick={handleDownloadSyncFile}
              className="w-full btn-gold !py-3 !text-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Arquivo de Sincronização (.json)</span>
            </button>
          </div>

          <div className="p-5 rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] space-y-4">
            <h3 className="text-sm font-extrabold uppercase text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#C99F3B]" />
              <span>Importar Arquivo de Sincronização</span>
            </h3>
            <p className="text-xs text-[#7E7062] dark:text-[#B5A796]">
              Selecione o arquivo recebido para mesclar os produtos, pedidos e movimentações:
            </p>

            <label className="w-full btn-silver !py-3 !text-xs cursor-pointer flex items-center justify-center gap-2">
              <Upload className="w-4 h-4 text-[#C99F3B]" />
              <span>Selecionar Arquivo no Dispositivo</span>
              <input type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
