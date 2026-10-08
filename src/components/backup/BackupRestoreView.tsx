import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  ShieldCheck,
  AlertTriangle,
  FileJson,
  Check,
  Clock,
  RotateCcw,
  Trash2,
  Plus,
  RefreshCw,
  HardDrive,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/indexedDB';
import { ConfirmModal } from '../common/ConfirmModal';
import { formatDate, formatDateTime } from '../../utils/formatters';

export const BackupRestoreView: React.FC = () => {
  const {
    refreshData,
    showToast,
    autoBackups,
    createAutoBackupSnapshot,
    restoreFromAutoBackup,
    deleteAutoBackup,
    settings,
    updateSettings,
  } = useApp();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [backupFileContent, setBackupFileContent] = useState<string | null>(null);
  const [backupFileName, setBackupFileName] = useState('');
  const [validationCounts, setValidationCounts] = useState<Record<string, number> | null>(null);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);

  // Restore snapshot target
  const [snapshotToRestore, setSnapshotToRestore] = useState<string | null>(null);

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const json = await db.exportBackup();
      const dateStr = new Date().toISOString().slice(0, 10);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `minha-loja-backup-${dateStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Arquivo de backup exportado com sucesso!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao exportar backup.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateSnapshot = async () => {
    setIsCreatingSnapshot(true);
    try {
      await createAutoBackupSnapshot('Ponto manual gerado pelo usuário');
      showToast('Ponto de restauração criado com sucesso!', 'success');
    } catch (err: any) {
      showToast('Falha ao criar ponto de restauração.', 'error');
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackupFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const validation = db.validateBackup(content);
        if (validation.valid && validation.counts) {
          setBackupFileContent(content);
          setValidationCounts(validation.counts);
          setShowConfirmRestore(true);
        } else {
          showToast(validation.error || 'Arquivo de backup inválido ou corrompido.', 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!backupFileContent) return;
    setIsImporting(true);
    try {
      await db.importBackup(backupFileContent);
      await refreshData();
      showToast('Backup restaurado com sucesso! Todos os dados foram atualizados.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Falha ao restaurar backup.', 'error');
    } finally {
      setIsImporting(false);
      setBackupFileContent(null);
      setValidationCounts(null);
      setShowConfirmRestore(false);
    }
  };

  const handleConfirmSnapshotRestore = async () => {
    if (!snapshotToRestore) return;
    setIsImporting(true);
    try {
      await restoreFromAutoBackup(snapshotToRestore);
    } finally {
      setIsImporting(false);
      setSnapshotToRestore(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
              <Database className="w-5 h-5 text-[#C99F3B]" />
              <span>Backup / Restauração Segura</span>
            </h2>
            <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
              Seus dados são 100% privados e salvos no seu aparelho (IndexedDB offline com suporte a snapshots periódicos).
            </p>
          </div>

          <button
            onClick={handleCreateSnapshot}
            disabled={isCreatingSnapshot}
            className="btn-silver !py-2 !px-3.5 !text-xs cursor-pointer flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-[#C99F3B]" />
            <span>{isCreatingSnapshot ? 'Criando ponto...' : 'Novo Ponto de Restauração'}</span>
          </button>
        </div>
      </div>

      {/* Backup Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Card */}
        <div className="p-6 rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFD3] dark:border-[#352C24] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-[#C99F3B] flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2C241E] dark:text-[#F3EDE6]">
              Exportar Backup Completo
            </h3>
            <p className="text-xs text-[#7E7062] dark:text-[#B5A796] leading-relaxed">
              Gera um arquivo <strong>.JSON</strong> seguro contendo produtos, vendas, clientes, pedidos, financeiro e movimentações de estoque.
            </p>
          </div>

          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="w-full btn-gold !py-3 rounded-2xl cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exportando dados...' : 'Baixar Arquivo de Backup'}</span>
          </button>
        </div>

        {/* Import Card */}
        <div className="p-6 rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFD3] dark:border-[#352C24] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-[#ECEFF4] dark:bg-[#2B3038] text-[#556070] dark:text-[#CBD5E1] flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2C241E] dark:text-[#F3EDE6]">
              Restaurar Dados Anteriores
            </h3>
            <p className="text-xs text-[#7E7062] dark:text-[#B5A796] leading-relaxed">
              Carregue um arquivo de backup previamente exportado. O sistema valida a integridade antes de aplicar qualquer alteração.
            </p>
          </div>

          <label className="w-full btn-silver !py-3 rounded-2xl cursor-pointer shadow-2xs flex items-center justify-center gap-2 text-center">
            <Upload className="w-4 h-4 text-[#556070] dark:text-[#CBD5E1]" />
            <span>{backupFileName || 'Selecionar Arquivo .JSON para Restaurar'}</span>
            <input type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>
      </div>

      {/* Automatic Snapshots History */}
      <div className="p-5 rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-[#C99F3B]" />
            <div>
              <h3 className="text-sm font-extrabold uppercase text-[#2C241E] dark:text-[#F3EDE6]">
                Pontos de Restauração Automáticos ({autoBackups.length})
              </h3>
              <p className="text-xs text-[#7E7062] dark:text-[#B5A796]">
                Gerados automaticamente no fechamento de caixa ou periodicamente.
              </p>
            </div>
          </div>
        </div>

        {autoBackups.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#F8F5EE] dark:bg-[#25201C] text-center text-xs text-zinc-500">
            Nenhum ponto de restauração gravado ainda. Clique no botão "Novo Ponto de Restauração" acima para criar o primeiro.
          </div>
        ) : (
          <div className="space-y-2">
            {autoBackups.map((snap) => (
              <div
                key={snap.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#25201C] border border-[#E8DFC8] dark:border-[#3A302A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#2C241E] dark:text-[#F3EDE6]">
                      {snap.reason}
                    </span>
                    <span className="badge-silver">{snap.recordsCount} registros</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {formatDateTime(snap.date)} · {(snap.dataSize / 1024).toFixed(1)} KB
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSnapshotToRestore(snap.id)}
                    className="btn-gold !py-1.5 !px-3 !text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar</span>
                  </button>
                  <button
                    onClick={() => deleteAutoBackup(snap.id)}
                    className="p-2 text-zinc-400 hover:text-red-500 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Excluir este snapshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for File Restore */}
      <ConfirmModal
        isOpen={showConfirmRestore}
        onClose={() => {
          setShowConfirmRestore(false);
          setBackupFileContent(null);
          setValidationCounts(null);
        }}
        onConfirm={handleConfirmRestore}
        title="Restaurar Banco de Dados"
        description={`O arquivo "${backupFileName}" contém: ${
          validationCounts
            ? Object.entries(validationCounts)
                .map(([k, v]) => `${v} ${k}`)
                .join(', ')
            : 'dados válidos'
        }. Esta ação substituirá os registros locais. Tem certeza que deseja prosseguir?`}
        confirmText="Sim, restaurar backup"
        variant="warning"
      />

      {/* Confirmation Modal for Snapshot Restore */}
      <ConfirmModal
        isOpen={!!snapshotToRestore}
        onClose={() => setSnapshotToRestore(null)}
        onConfirm={handleConfirmSnapshotRestore}
        title="Restaurar Ponto de Restauração"
        description="Esta ação restaurará a base de dados para o estado deste ponto de recuperação. Tem certeza?"
        confirmText="Sim, restaurar"
        variant="warning"
      />
    </div>
  );
};
