import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  AlertTriangle,
  Plus,
  CheckCircle,
  Clock,
  Check,
  Calendar,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AccountPayable, AccountReceivable, PaymentMethod } from '../../types';
import { formatBRL, formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';

export const FinancialOverview: React.FC = () => {
  const {
    sales,
    accountsPayable,
    accountsReceivable,
    saveAccountPayable,
    markAccountPayablePaid,
    deleteAccountPayable,
    saveAccountReceivable,
    markAccountReceivableReceived,
    deleteAccountReceivable,
    suppliers,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'resumo' | 'pagar' | 'receber'>('resumo');

  // Modals for new payable / receivable
  const [showPayableModal, setShowPayableModal] = useState(false);
  const [showReceivableModal, setShowReceivableModal] = useState(false);

  // New Payable Form
  const [payDesc, setPayDesc] = useState('');
  const [payCategory, setPayCategory] = useState('Mercadoria');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDueDate, setPayDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [paySupplierId, setPaySupplierId] = useState('');

  // New Receivable Form
  const [recDesc, setRecDesc] = useState('');
  const [recCustomer, setRecCustomer] = useState('');
  const [recAmount, setRecAmount] = useState<number>(0);
  const [recDueDate, setRecDueDate] = useState(new Date().toISOString().slice(0, 10));

  // Calculations
  const metrics = useMemo(() => {
    const activeSales = sales.filter((s) => s.status !== 'cancelled');
    const totalRevenue = activeSales.reduce((sum, s) => sum + s.total, 0);
    const totalProfit = activeSales.reduce((sum, s) => sum + s.estimatedProfit, 0);

    const paidPayables = accountsPayable
      .filter((a) => a.status === 'pago')
      .reduce((sum, a) => sum + a.amount, 0);

    const pendingPayables = accountsPayable
      .filter((a) => a.status === 'pendente')
      .reduce((sum, a) => sum + a.amount, 0);

    const receivedReceivables = accountsReceivable
      .filter((a) => a.status === 'recebido')
      .reduce((sum, a) => sum + a.amount, 0);

    const pendingReceivables = accountsReceivable
      .filter((a) => a.status === 'pendente')
      .reduce((sum, a) => sum + a.amount, 0);

    const netBalance = totalRevenue - paidPayables;

    return {
      totalRevenue,
      totalProfit,
      paidPayables,
      pendingPayables,
      receivedReceivables,
      pendingReceivables,
      netBalance,
    };
  }, [sales, accountsPayable, accountsReceivable]);

  const handleCreatePayable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payDesc.trim() || payAmount <= 0) {
      showToast('Preencha os campos obrigatórios.', 'error');
      return;
    }
    const sup = suppliers.find((s) => s.id === paySupplierId);
    await saveAccountPayable({
      id: `ap_${Date.now()}`,
      description: payDesc.trim(),
      category: payCategory,
      supplierId: paySupplierId || undefined,
      supplierName: sup?.name,
      amount: Number(payAmount),
      dueDate: payDueDate,
      status: 'pendente',
      createdAt: new Date().toISOString(),
    });
    setShowPayableModal(false);
    setPayDesc('');
    setPayAmount(0);
  };

  const handleCreateReceivable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recDesc.trim() || recAmount <= 0) {
      showToast('Preencha os campos obrigatórios.', 'error');
      return;
    }
    await saveAccountReceivable({
      id: `ar_${Date.now()}`,
      description: recDesc.trim(),
      customerName: recCustomer.trim() || 'Cliente',
      amount: Number(recAmount),
      dueDate: recDueDate,
      status: 'pendente',
      createdAt: new Date().toISOString(),
    });
    setShowReceivableModal(false);
    setRecDesc('');
    setRecAmount(0);
    setRecCustomer('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
            <span>Financeiro / Fluxo de Caixa</span>
          </h2>
          <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
            Controle de entradas, saídas, contas a pagar a fornecedores e contas a receber de clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPayableModal(true)}
            className="btn-silver !py-2 !px-3.5 !text-xs cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-rose-500" strokeWidth={1.75} />
            <span>+ Conta a Pagar</span>
          </button>
          <button
            onClick={() => setShowReceivableModal(true)}
            className="btn-gold !py-2 !px-4 !text-xs cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>+ Conta a Receber</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Entradas */}
        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
          <span className="text-xs font-semibold text-[#8E8071] dark:text-[#AFA292] block mb-1">
            Total de Entradas
          </span>
          <p className="text-xl font-extrabold text-[#9D7320] dark:text-[#E6BE65] font-mono">
            {formatBRL(metrics.totalRevenue)}
          </p>
          <span className="text-[11px] text-[#7E7062] dark:text-[#B5A796] mt-1 block">
            Vendas e recebimentos
          </span>
        </div>

        {/* Saídas */}
        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
          <span className="text-xs font-semibold text-[#8E8071] dark:text-[#AFA292] block mb-1">
            Total de Saídas Pagas
          </span>
          <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
            {formatBRL(metrics.paidPayables)}
          </p>
          <span className="text-[11px] text-[#7E7062] dark:text-[#B5A796] mt-1 block">
            Despesas e fornecedores quitados
          </span>
        </div>

        {/* Saldo Líquido */}
        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
          <span className="text-xs font-semibold text-[#8E8071] dark:text-[#AFA292] block mb-1">
            Saldo em Caixa / Líquido
          </span>
          <p className="text-xl font-extrabold text-[#2C241E] dark:text-[#F3EDE6] font-mono">
            {formatBRL(metrics.netBalance)}
          </p>
          <span className="text-[11px] text-[#9D7320] dark:text-[#E6BE65] font-semibold mt-1 block font-mono">
            Lucro est.: {formatBRL(metrics.totalProfit)}
          </span>
        </div>

        {/* A Pagar Pendente */}
        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
          <span className="text-xs font-semibold text-[#8E8071] dark:text-[#AFA292] block mb-1">
            A Pagar (Pendente)
          </span>
          <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
            {formatBRL(metrics.pendingPayables)}
          </p>
          <span className="text-[11px] text-[#9D7320] dark:text-[#E6BE65] font-semibold mt-1 block font-mono">
            A Receber: {formatBRL(metrics.pendingReceivables)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-2xl bg-[#F5EFEB] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] w-fit gap-1">
        <button
          onClick={() => setActiveTab('resumo')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'resumo'
              ? 'bg-[#FFFDF9] dark:bg-[#2B241F] text-[#9D7320] dark:text-[#E6BE65] shadow-2xs border border-[#C99F3B]/40'
              : 'text-[#635649] dark:text-[#CBD5E1] hover:text-[#2C241E] dark:hover:text-[#F3EDE6]'
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('pagar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pagar'
              ? 'bg-[#FFFDF9] dark:bg-[#2B241F] text-rose-600 dark:text-rose-400 shadow-2xs border border-rose-500/40'
              : 'text-[#635649] dark:text-[#CBD5E1] hover:text-[#2C241E] dark:hover:text-[#F3EDE6]'
          }`}
        >
          Contas a Pagar ({accountsPayable.length})
        </button>
        <button
          onClick={() => setActiveTab('receber')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'receber'
              ? 'bg-[#FFFDF9] dark:bg-[#2B241F] text-[#9D7320] dark:text-[#E6BE65] shadow-2xs border border-[#C99F3B]/40'
              : 'text-[#635649] dark:text-[#CBD5E1] hover:text-[#2C241E] dark:hover:text-[#F3EDE6]'
          }`}
        >
          Contas a Receber ({accountsReceivable.length})
        </button>
      </div>

      {/* Tab: Contas a Pagar */}
      {activeTab === 'pagar' && (
        <div className="bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] rounded-2xl overflow-hidden shadow-2xs">
          {accountsPayable.length === 0 ? (
            <p className="text-xs text-[#8E8071] py-12 text-center">Nenhuma conta a pagar cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F5EFEB] dark:bg-[#28211C] border-b border-[#E8DFC8] dark:border-[#3A302A] text-[#7E7062] dark:text-[#B5A796] font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Descrição</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Fornecedor</th>
                    <th className="p-3">Vencimento</th>
                    <th className="p-3 text-right">Valor</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A]">
                  {accountsPayable.map((item) => {
                    const isOverdue = item.status === 'pendente' && new Date(item.dueDate) < new Date();
                    return (
                      <tr key={item.id} className="hover:bg-[#F5EFEB]/60 dark:hover:bg-[#251E19]/60 transition-colors">
                        <td className="p-3 font-semibold text-[#2C241E] dark:text-[#F3EDE6]">{item.description}</td>
                        <td className="p-3 text-[#7E7062] dark:text-[#B5A796]">{item.category}</td>
                        <td className="p-3 text-[#7E7062] dark:text-[#B5A796]">{item.supplierName || '-'}</td>
                        <td className="p-3 font-mono text-[#2C241E] dark:text-[#F3EDE6]">
                          {formatDate(item.dueDate)}
                          {isOverdue && (
                            <span className="text-[10px] text-rose-500 font-bold block">Vencido!</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-rose-600">
                          {formatBRL(item.amount)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`badge-silver ${
                              item.status === 'pago'
                                ? '!border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                : isOverdue
                                ? '!border-rose-500/40 text-rose-700 dark:text-rose-300'
                                : '!border-[#C99F3B]/40 text-[#9D7320] dark:text-[#E6BE65]'
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          {item.status === 'pendente' && (
                            <button
                              onClick={() => markAccountPayablePaid(item.id)}
                              className="btn-silver !py-1 !px-2.5 !text-xs cursor-pointer shadow-2xs"
                            >
                              Pagar
                            </button>
                          )}
                          <button
                            onClick={() => deleteAccountPayable(item.id)}
                            className="p-1.5 text-[#8E8071] hover:text-rose-500 ml-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Contas a Receber */}
      {activeTab === 'receber' && (
        <div className="bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] rounded-2xl overflow-hidden shadow-2xs">
          {accountsReceivable.length === 0 ? (
            <p className="text-xs text-[#8E8071] py-12 text-center">Nenhuma conta a receber cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F5EFEB] dark:bg-[#28211C] border-b border-[#E8DFC8] dark:border-[#3A302A] text-[#7E7062] dark:text-[#B5A796] font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Descrição</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Vencimento</th>
                    <th className="p-3 text-right">Valor</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A]">
                  {accountsReceivable.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F5EFEB]/60 dark:hover:bg-[#251E19]/60 transition-colors">
                      <td className="p-3 font-semibold text-[#2C241E] dark:text-[#F3EDE6]">{item.description}</td>
                      <td className="p-3 text-[#635649] dark:text-[#CBD5E1]">{item.customerName || 'Cliente'}</td>
                      <td className="p-3 font-mono text-[#2C241E] dark:text-[#F3EDE6]">{formatDate(item.dueDate)}</td>
                      <td className="p-3 text-right font-mono font-bold text-[#9D7320] dark:text-[#E6BE65]">
                        {formatBRL(item.amount)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`badge-silver ${
                            item.status === 'recebido'
                              ? '!border-emerald-500/40 text-emerald-700'
                              : '!border-[#C99F3B]/40 text-[#9D7320] dark:text-[#E6BE65]'
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {item.status === 'pendente' && (
                          <button
                            onClick={() => markAccountReceivableReceived(item.id)}
                            className="btn-gold !py-1 !px-2.5 !text-xs cursor-pointer shadow-xs"
                          >
                            Receber
                          </button>
                        )}
                        <button
                          onClick={() => deleteAccountReceivable(item.id)}
                          className="p-1.5 text-[#8E8071] hover:text-rose-500 ml-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Resumo Geral */}
      {activeTab === 'resumo' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Categorias de despesas */}
          <div className="p-5 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-[#2C241E] dark:text-[#F3EDE6]">
              Categorias de Despesas (Contas a Pagar)
            </h3>
            <div className="space-y-2">
              {[
                'Mercadoria',
                'Embalagem',
                'Frete / Entregas',
                'Marketing / Anúncios',
                'Aluguel / Condomínio',
                'Internet / Energia',
                'Outros',
              ].map((cat) => {
                const totalInCat = accountsPayable
                  .filter((a) => a.category.toLowerCase().includes(cat.toLowerCase().slice(0, 4)))
                  .reduce((sum, a) => sum + a.amount, 0);

                return (
                  <div key={cat} className="flex justify-between items-center text-xs">
                    <span className="text-[#7E7062] dark:text-[#B5A796]">{cat}</span>
                    <strong className="font-mono text-[#2C241E] dark:text-[#F3EDE6]">
                      {formatBRL(totalInCat)}
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Cash Flow Tips */}
          <div className="p-5 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-[#2C241E] dark:text-[#F3EDE6]">
              Dicas Financeiras para Pequenos Negócios
            </h3>
            <ul className="text-xs text-[#7E7062] dark:text-[#B5A796] space-y-2 list-disc list-inside">
              <li>Separe sempre o dinheiro pessoal do dinheiro da loja (pró-labore fixo).</li>
              <li>Mantenha um fundo de reserva para pagamento de mercadorias à vista com desconto de fornecedor.</li>
              <li>Monitore os custos de embalagens e frete para não corroer sua margem de lucro.</li>
              <li>Utilize o PIX sempre que possível para evitar taxas de intermediação de cartão.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Modal: Nova Conta a Pagar */}
      <Modal
        isOpen={showPayableModal}
        onClose={() => setShowPayableModal(false)}
        title="Nova Conta a Pagar"
        maxWidth="md"
      >
        <form onSubmit={handleCreatePayable} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Descrição do Pagamento *</label>
            <input
              type="text"
              value={payDesc}
              onChange={(e) => setPayDesc(e.target.value)}
              placeholder="Ex: Compra de Sacolas Personalizadas"
              className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Categoria *</label>
              <select
                value={payCategory}
                onChange={(e) => setPayCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              >
                <option value="Mercadoria">Mercadoria</option>
                <option value="Embalagem">Embalagem</option>
                <option value="Frete">Frete</option>
                <option value="Marketing">Marketing / Anúncios</option>
                <option value="Aluguel">Aluguel / Condomínio</option>
                <option value="Internet / Energia">Internet / Energia</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Fornecedor (Opcional)</label>
              <select
                value={paySupplierId}
                onChange={(e) => setPaySupplierId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              >
                <option value="">Sem fornecedor específico</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={payAmount || ''}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Data de Vencimento *</label>
              <input
                type="date"
                value={payDueDate}
                onChange={(e) => setPayDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E8DFC8] dark:border-[#3A302A]">
            <button
              type="button"
              onClick={() => setShowPayableModal(false)}
              className="btn-silver !py-2 !px-4 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-danger !py-2 !px-5 cursor-pointer shadow-xs"
            >
              Salvar Conta a Pagar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Nova Conta a Receber */}
      <Modal
        isOpen={showReceivableModal}
        onClose={() => setShowReceivableModal(false)}
        title="Nova Conta a Receber"
        maxWidth="md"
      >
        <form onSubmit={handleCreateReceivable} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Descrição *</label>
            <input
              type="text"
              value={recDesc}
              onChange={(e) => setRecDesc(e.target.value)}
              placeholder="Ex: Parcela 2 - Vestido Linho"
              className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Nome do Cliente</label>
            <input
              type="text"
              value={recCustomer}
              onChange={(e) => setRecCustomer(e.target.value)}
              placeholder="Nome do cliente"
              className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Valor a Receber (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={recAmount || ''}
                onChange={(e) => setRecAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Data de Vencimento *</label>
              <input
                type="date"
                value={recDueDate}
                onChange={(e) => setRecDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E8DFC8] dark:border-[#3A302A]">
            <button
              type="button"
              onClick={() => setShowReceivableModal(false)}
              className="btn-silver !py-2 !px-4 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-gold !py-2 !px-5 cursor-pointer shadow-xs"
            >
              Salvar Conta a Receber
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
