import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { formatBRL } from '../../utils/formatters';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedProductRow {
  name: string;
  sku: string;
  category: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  barcode: string;
  error?: string;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({ isOpen, onClose }) => {
  const { products, saveProduct, showToast } = useApp();
  const [rows, setRows] = useState<ParsedProductRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const existingSkus = new Set(products.map((p) => p.sku.toUpperCase()));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        showToast('Arquivo CSV vazio ou sem linhas de cabeçalho.', 'error');
        return;
      }

      // Check delimiter (comma or semicolon)
      const delimiter = lines[0].includes(';') ? ';' : ',';
      const parsed: ParsedProductRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length < 2) continue;

        const name = cols[0] || '';
        const sku = (cols[1] || '').toUpperCase();
        const category = cols[2] || 'Geral';
        const cost = parseFloat((cols[3] || '0').replace(',', '.')) || 0;
        const price = parseFloat((cols[4] || '0').replace(',', '.')) || 0;
        const stock = parseInt(cols[5] || '0', 10) || 0;
        const minStock = parseInt(cols[6] || '5', 10) || 5;
        const barcode = cols[7] || '';

        let error = '';
        if (!name) error = 'Nome ausente';
        else if (!sku) error = 'SKU ausente';
        else if (price <= 0) error = 'Preço inválido';
        else if (existingSkus.has(sku)) error = 'SKU já cadastrado';

        parsed.push({
          name,
          sku,
          category,
          cost,
          price,
          stock,
          minStock,
          barcode,
          error,
        });
      }

      setRows(parsed);
    };

    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const header = 'Nome;SKU;Categoria;Custo;Preco;Estoque;EstoqueMinimo;CodigoBarras\n';
    const sample = 'Camiseta Algodão Básica;CAM-BAS-01;Camisetas;25.00;59.90;15;5;7891234567890\n';
    const blob = new Blob([header + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo-importacao-produtos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = async () => {
    const validRows = rows.filter((r) => !r.error);
    if (validRows.length === 0) {
      showToast('Nenhum produto válido para importação.', 'warning');
      return;
    }

    setIsProcessing(true);
    let count = 0;

    for (const r of validRows) {
      const newProd: Product = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: r.name,
        sku: r.sku,
        category: r.category,
        cost: r.cost,
        markupMethod: 'margin',
        marginPercent: 40,
        suggestedPrice: r.price,
        minPrice: r.cost,
        price: r.price,
        stock: r.stock,
        minStock: r.minStock,
        barcode: r.barcode || undefined,
        unit: 'UN',
        status: r.stock <= 0 ? 'esgotado' : 'ativo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveProduct(newProd);
      count++;
    }

    setIsProcessing(false);
    showToast(`${count} produtos importados com sucesso!`, 'success');
    onClose();
  };

  const validCount = rows.filter((r) => !r.error).length;
  const invalidCount = rows.filter((r) => !!r.error).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Importação de Produtos via CSV" maxWidth="3xl">
      <div className="space-y-4">
        {/* Header / Template Download */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs">
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              Importe múltiplos produtos de uma só vez usando um arquivo CSV.
            </p>
            <p className="text-zinc-500 mt-0.5">
              Campos: Nome, SKU, Categoria, Custo, Preço, Estoque, Estoque Mínimo, Código de Barras.
            </p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Modelo CSV</span>
          </button>
        </div>

        {/* File Input */}
        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 rounded-2xl cursor-pointer bg-white dark:bg-zinc-850 transition-colors">
          <Upload className="w-8 h-8 text-zinc-400 mb-2" />
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {fileName || 'Clique para selecionar o arquivo CSV do seu computador'}
          </span>
          <span className="text-xs text-zinc-400 mt-1">Formatos suportados: .csv delimitado por vírgula ou ponto-e-vírgula</span>
          <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
        </label>

        {/* Preview Table */}
        {rows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                Prévia da Importação ({rows.length} itens encontrados)
              </span>
              <div className="flex items-center gap-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ {validCount} prontos para importar
                </span>
                {invalidCount > 0 && (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                    ✗ {invalidCount} com erros (serão ignorados)
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Nome</th>
                    <th className="p-2.5">SKU</th>
                    <th className="p-2.5">Preço</th>
                    <th className="p-2.5">Estoque</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className={row.error ? 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300' : ''}
                    >
                      <td className="p-2.5">
                        {row.error ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {row.error}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Válido
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 font-medium truncate max-w-[180px]">{row.name}</td>
                      <td className="p-2.5 font-mono">{row.sku}</td>
                      <td className="p-2.5 font-mono">{formatBRL(row.price)}</td>
                      <td className="p-2.5 font-mono">{row.stock} un</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={validCount === 0 || isProcessing}
            className="px-5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors shadow-md"
          >
            {isProcessing ? 'Importando...' : `Confirmar Importação (${validCount})`}
          </button>
        </div>
      </div>
    </Modal>
  );
};
