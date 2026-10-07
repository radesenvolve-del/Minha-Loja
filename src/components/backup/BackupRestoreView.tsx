import React, { useState } from 'react';
import { Database, Download, Upload, ShieldCheck, AlertTriangle, FileJson, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/indexedDB';
import { ConfirmModal } from '../common/ConfirmModal';

export const BackupRestoreView: React.FC = () => {
  const { refreshData, showToast } = useApp();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupFileContent, setBackupFileContent] = useState<string | null>(null);
  const [backupFileName, setBackupFileName] = useState('');
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackupFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          if (parsed && parsed.data) {
            setBackupFileContent(content);
            setShowConfirmRestore(true);
          } else {
            showToast('Arquivo de backup inválido ou corrompido.', 'error');
          }
        } catch {
          showToast('Formato JSON inválido no arquivo.', 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!backupFileContent) return;
    setIsImporting(true);
    try {
      const result = await db.importBackup(backupFileContent);
      await refreshData();
      showToast('Backup restaurado com sucesso! Todos os dados foram atualizados.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Falha ao restaurar backup.', 'error');
    } finally {
      setIsImporting(false);
      setBackupFileContent(null);
      setShowConfirmRestore(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
          <span>Backup / Restauração de Dados</span>
        </h2>
        <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
          Seus dados são 100% seus e ficam salvos no seu próprio aparelho (IndexedDB offline). Exporte cópias de segurança a qualquer momento.
        </p>
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
              Gera um arquivo <strong>.JSON</strong> seguro contendo todos os produtos, vendas, clientes, pedidos, financeiro e movimentações de estoque. Você pode salvar no seu computador, Google Drive ou pen drive.
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
              Carregue um arquivo de backup previamente exportado para recuperar sua loja ou migrar para outro computador ou celular.
            </p>
          </div>

          <label className="w-full btn-silver !py-3 rounded-2xl cursor-pointer shadow-2xs flex items-center justify-center gap-2 text-center">
            <Upload className="w-4 h-4 text-[#556070] dark:text-[#CBD5E1]" />
            <span>{backupFileName || 'Selecionar Arquivo .JSON para Restaurar'}</span>
            <input type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>
      </div>

      {/* Security & Reliability Advice */}
      <div className="p-5 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] flex items-start gap-3 text-xs text-[#7E7062] dark:text-[#B5A796]">
        <ShieldCheck className="w-5 h-5 text-[#C99F3B] shrink-0 mt-0.5" strokeWidth={1.75} />
        <div className="space-y-1">
          <h4 className="font-bold text-[#2C241E] dark:text-[#F3EDE6]">
            Armazenamento Seguro e 100% Privado
          </h4>
          <p className="leading-relaxed">
            Seus dados nunca são enviados para servidores de terceiros. Eles ficam gravados no banco de dados local do seu navegador. Recomendamos exportar um arquivo de backup semanalmente para garantir que suas informações estejam sempre guardadas em caso de troca ou limpeza do aparelho.
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmRestore}
        onClose={() => {
          setShowConfirmRestore(false);
          setBackupFileContent(null);
        }}
        onConfirm={handleConfirmRestore}
        title="Restaurar Banco de Dados"
        description={`Você selecionou o arquivo "${backupFileName}". Esta ação substituirá os registros locais pelos dados contidos no backup. Tem certeza que deseja prosseguir?`}
        confirmText="Sim, restaurar backup"
        variant="warning"
      />
    </div>
  );
};
