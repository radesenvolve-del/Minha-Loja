import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatBRL, formatDate } from '../../utils/formatters';

type PeriodFilter = 'hoje' | 'ontem' | '7dias' | '30dias' | 'este_mes' | 'mes_anterior';

export const ReportsView: React.FC = () => {
  const { sales, products, accountsPayable, accountsReceivable, purchases, showToast } = useApp();

  const [period, setPeriod] = useState<PeriodFilter>('este_mes');

  // Filter sales by selected period
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const currentYearMonth = now.toISOString().slice(0, 7);

    const prevMonthDate = new Date();
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevYearMonth = prevMonthDate.toISOString().slice(0, 7);

    return sales.filter((s) => {
      if (s.status === 'cancelled') return false;
      const saleDate = s.date.slice(0, 10);

      if (period === 'hoje') return saleDate === todayStr;
      if (period === 'ontem') return saleDate === yesterdayStr;
      if (period === '7dias') return new Date(s.date) >= sevenDaysAgo;
      if (period === '30dias') return new Date(s.date) >= thirtyDaysAgo;
      if (period === 'este_mes') return s.date.slice(0, 7) === currentYearMonth;
      if (period === 'mes_anterior') return s.date.slice(0, 7) === prevYearMonth;
      return true;
    });
  }, [sales, period]);

  // Aggregate metrics
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = filteredSales.reduce((sum, s) => sum + s.estimatedProfit, 0);
  const avgTicket = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
  const totalItemsSold = filteredSales.reduce(
    (sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0),
    0
  );

  // Top products in period
  const productRanking = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    filteredSales.forEach((s) => {
      s.items.forEach((item) => {
        const cur = map.get(item.productId) || { name: item.name, qty: 0, revenue: 0 };
        cur.qty += item.quantity;
        cur.revenue += item.total;
        map.set(item.productId, cur);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [filteredSales]);

  // Payment breakdown in period
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredSales.forEach((s) => {
      map[s.paymentMethod] = (map[s.paymentMethod] || 0) + s.total;
    });
    return map;
  }, [filteredSales]);

  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      showToast('Nenhum dado para exportar no período.', 'info');
      return;
    }
    const header = 'Cupom;Data;Cliente;FormaPagamento;Itens;Total;LucroEstimado\n';
    const rows = filteredSales
      .map(
        (s) =>
          `"${s.saleNumber}";"${s.date}";"${s.customerName}";"${s.paymentMethod}";${s.items.length};${s.total};${s.estimatedProfit}`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio-vendas-${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Relatório exportado em CSV!', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
            <span>Relatórios Gerenciais / Desempenho</span>
          </h2>
          <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
            Acompanhe vendas, lucro líquido, ranking de produtos e formas de pagamento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="btn-silver !py-2 !px-3 !text-xs cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-[#556070] dark:text-[#CBD5E1]" />
            <span>Imprimir</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="btn-gold !py-2 !px-3 !text-xs cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Period Filter Buttons */}
      <div className="flex p-1 rounded-2xl bg-[#F5EFEB] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] overflow-x-auto gap-1">
        {[
          { id: 'hoje', label: 'Hoje' },
          { id: 'ontem', label: 'Ontem' },
          { id: '7dias', label: 'Últimos 7 dias' },
          { id: '30dias', label: 'Últimos 30 dias' },
          { id: 'este_mes', label: 'Este Mês' },
          { id: 'mes_anterior', label: 'Mês Anterior' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setPeriod(f.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              period === f.id
                ? 'bg-[#FFFDF9] dark:bg-[#2B241F] text-[#9D7320] dark:text-[#E6BE65] shadow-2xs border border-[#C99F3B]/40'
                : 'text-[#7E7062] dark:text-[#B5A796] hover:text-[#2C241E] dark:hover:text-[#F3EDE6]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
          <span className="text-xs font-semibold text-[#7E7062] dark:text-[#B5A796] block mb-1">
            Faturamento do Período
          </span>
          <p className="text-xl font-extrabold text-[#9D7320] dark:text-[#E6BE65] font-mono">
            {formatBRL(totalRevenue)}
          </p>
          <span className="text-[11px] text-[#8E8071] dark:text-[#AFA292] mt-1 block">
            {filteredSales.length} vendas realizadas
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
          <span className="text-xs font-semibold text-[#7E7062] dark:text-[#B5A796] block mb-1">
            Lucro Bruto Estimado
          </span>
          <p className="text-xl font-extrabold text-[#9D7320] dark:text-[#E6BE65] font-mono">
            {formatBRL(totalProfit)}
          </p>
          <span className="text-[11px] text-[#8E8071] dark:text-[#AFA292] mt-1 block">
            Margem:{' '}
            {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
          <span className="text-xs font-semibold text-[#7E7062] dark:text-[#B5A796] block mb-1">Ticket Médio</span>
          <p className="text-xl font-extrabold text-[#2C241E] dark:text-[#F3EDE6] font-mono">
            {formatBRL(avgTicket)}
          </p>
          <span className="text-[11px] text-[#8E8071] dark:text-[#AFA292] mt-1 block">Média por venda</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
          <span className="text-xs font-semibold text-[#7E7062] dark:text-[#B5A796] block mb-1">
            Unidades Vendidas
          </span>
          <p className="text-xl font-extrabold text-[#2C241E] dark:text-[#F3EDE6] font-mono">
            {totalItemsSold} un
          </p>
          <span className="text-[11px] text-[#8E8071] dark:text-[#AFA292] mt-1 block">Volume de produtos</span>
        </div>
      </div>

      {/* Tables Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <div className="p-5 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-[#2C241E] dark:text-[#F3EDE6] uppercase tracking-wider">
            Ranking de Produtos no Período
          </h3>
          {productRanking.length === 0 ? (
            <p className="text-xs text-[#8E8071] py-6 text-center">Nenhuma venda no período.</p>
          ) : (
            <div className="space-y-2">
              {productRanking.slice(0, 8).map((p, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="w-5 h-5 rounded-md bg-[#F5EFEB] dark:bg-[#28211C] border border-[#E8DFC8]/60 dark:border-[#3A302A] flex items-center justify-center font-bold text-[10px] text-[#9D7320] dark:text-[#E6BE65]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-[#2C241E] dark:text-[#F3EDE6] truncate">
                      {p.name}
                    </span>
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <span className="font-bold text-[#2C241E] dark:text-[#F3EDE6]">{p.qty} un</span>
                    <span className="text-[11px] text-[#7E7062] dark:text-[#B5A796] ml-2">({formatBRL(p.revenue)})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="p-5 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-[#2C241E] dark:text-[#F3EDE6] uppercase tracking-wider">
            Distribuição por Forma de Pagamento
          </h3>
          {Object.keys(paymentBreakdown).length === 0 ? (
            <p className="text-xs text-[#8E8071] py-6 text-center">Nenhum pagamento registrado.</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(paymentBreakdown).map(([method, amount]) => {
                const percent = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-[#2C241E] dark:text-[#F3EDE6]">
                      <span className="uppercase text-[11px]">{method.replace('_', ' ')}</span>
                      <span className="font-mono text-[#9D7320] dark:text-[#E6BE65]">{formatBRL(amount)} ({percent.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F5EFEB] dark:bg-[#28211C] overflow-hidden border border-[#E8DFC8]/40 dark:border-[#3A302A]">
                      <div className="h-full bg-linear-to-r from-[#D8B059] to-[#AF8323] rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
