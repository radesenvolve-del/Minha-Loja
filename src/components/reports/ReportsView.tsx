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
  Sparkles,
  Award,
  Users,
  Instagram,
  Layers,
  ArrowUpRight,
  TrendingDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatBRL, formatDate } from '../../utils/formatters';

type PeriodFilter = 'hoje' | 'ontem' | '7dias' | '30dias' | 'este_mes' | 'mes_anterior';
type ReportTab = 'dre' | 'abc' | 'vendedores' | 'canais';

export const ReportsView: React.FC = () => {
  const { sales, products, users, accountsPayable, accountsReceivable, purchases, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<ReportTab>('dre');
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
    const map = new Map<string, { name: string; qty: number; revenue: number; cost: number }>();
    filteredSales.forEach((s) => {
      s.items.forEach((item) => {
        const cur = map.get(item.productId) || { name: item.name, qty: 0, revenue: 0, cost: item.cost * item.quantity };
        cur.qty += item.quantity;
        cur.revenue += item.total;
        map.set(item.productId, cur);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [filteredSales]);

  // Curva ABC Calculation
  const curvaABCData = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sku: string; category: string; qty: number; revenue: number; stock: number }>();
    
    // Seed with all products
    products.forEach((p) => {
      map.set(p.id, {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        qty: 0,
        revenue: 0,
        stock: p.stock,
      });
    });

    // Accumulate sales
    filteredSales.forEach((s) => {
      s.items.forEach((item) => {
        const prod = map.get(item.productId);
        if (prod) {
          prod.qty += item.quantity;
          prod.revenue += item.total;
        } else {
          map.set(item.productId, {
            id: item.productId,
            name: item.name,
            sku: '',
            category: '',
            qty: item.quantity,
            revenue: item.total,
            stock: 0,
          });
        }
      });
    });

    // Sort descending by revenue
    const sorted = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
    const sumRevenue = sorted.reduce((sum, item) => sum + item.revenue, 0);

    let accumulated = 0;
    return sorted.map((item) => {
      accumulated += item.revenue;
      const share = sumRevenue > 0 ? (item.revenue / sumRevenue) * 100 : 0;
      const accumPercent = sumRevenue > 0 ? (accumulated / sumRevenue) * 100 : 100;

      let classification: 'A' | 'B' | 'C' = 'C';
      if (accumPercent <= 80 || (share >= 15 && accumPercent <= 85)) {
        classification = 'A';
      } else if (accumPercent <= 95) {
        classification = 'B';
      } else {
        classification = 'C';
      }

      return {
        ...item,
        share,
        accumPercent,
        classification,
      };
    });
  }, [filteredSales, products]);

  // Sellers Performance & Commissions
  const sellersData = useMemo(() => {
    return users.map((u) => {
      const uSales = filteredSales.filter((s) => s.sellerId === u.id || s.userName === u.name);
      const total = uSales.reduce((acc, s) => acc + s.total, 0);
      const commissionPercent = u.commissionPercent || 0;
      const commissionAmount = Math.round(total * (commissionPercent / 100) * 100) / 100;
      const target = u.monthlySalesTarget || 15000;
      const targetProgress = Math.min(100, Math.round((total / target) * 100));

      return {
        user: u,
        salesCount: uSales.length,
        total,
        commissionPercent,
        commissionAmount,
        target,
        targetProgress,
      };
    });
  }, [users, filteredSales]);

  // Sales Channels Breakdown
  const channelsData = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {
      balcao: { count: 0, total: 0 },
      instagram: { count: 0, total: 0 },
      whatsapp: { count: 0, total: 0 },
      outros: { count: 0, total: 0 },
    };

    filteredSales.forEach((s) => {
      const isOnline = (s.notes && (s.notes.includes('Instagram') || s.notes.includes('WhatsApp'))) || s.customerName.includes('Online');
      const ch = isOnline ? 'instagram' : 'balcao';
      if (!map[ch]) map[ch] = { count: 0, total: 0 };
      map[ch].count += 1;
      map[ch].total += s.total;
    });

    return map;
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
    const header = 'Cupom;Data;Cliente;Vendedor;FormaPagamento;Itens;Total;LucroEstimado\n';
    const rows = filteredSales
      .map(
        (s) =>
          `"${s.saleNumber}";"${s.date}";"${s.customerName}";"${s.sellerName || s.userName}";"${s.paymentMethod}";${s.items.length};${s.total};${s.estimatedProfit}`
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
            <span>Relatórios Gerenciais & Curva ABC</span>
          </h2>
          <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
            DRE gerencial, curva ABC de produtos, desempenho por vendedor, comissões e canais.
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

      {/* Navigation Sub-Tabs */}
      <div className="flex p-1 rounded-2xl bg-[#F5EFEB] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dre')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'dre'
              ? 'bg-white dark:bg-[#2B241F] text-[#9D7320] dark:text-[#E6BE65] shadow-xs'
              : 'text-[#7E7062] dark:text-[#B5A796]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Visão Geral & DRE</span>
        </button>

        <button
          onClick={() => setActiveTab('abc')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'abc'
              ? 'bg-white dark:bg-[#2B241F] text-[#9D7320] dark:text-[#E6BE65] shadow-xs'
              : 'text-[#7E7062] dark:text-[#B5A796]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C99F3B]" />
          <span>Curva ABC (80/15/5)</span>
        </button>

        <button
          onClick={() => setActiveTab('vendedores')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'vendedores'
              ? 'bg-white dark:bg-[#2B241F] text-[#9D7320] dark:text-[#E6BE65] shadow-xs'
              : 'text-[#7E7062] dark:text-[#B5A796]'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span>Vendedores & Comissões</span>
        </button>

        <button
          onClick={() => setActiveTab('canais')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'canais'
              ? 'bg-white dark:bg-[#2B241F] text-[#9D7320] dark:text-[#E6BE65] shadow-xs'
              : 'text-[#7E7062] dark:text-[#B5A796]'
          }`}
        >
          <Instagram className="w-3.5 h-3.5 text-rose-500" />
          <span>Canais de Venda</span>
        </button>
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

      {/* Tab 1: DRE & Visão Geral */}
      {activeTab === 'dre' && (
        <div className="space-y-4">
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
      )}

      {/* Tab 2: Curva ABC */}
      {activeTab === 'abc' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold uppercase text-[#2C241E] dark:text-[#F3EDE6]">
                Análise de Curva ABC (Princípio de Pareto)
              </h3>
              <p className="text-xs text-[#7E7062] dark:text-[#B5A796]">
                Classe A: 80% do faturamento (carro-chefe) · Classe B: 15% · Classe C: 5% (cauda longa / giro lento).
              </p>
            </div>

            <div className="flex gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs border border-emerald-500/30">
                A: {curvaABCData.filter((i) => i.classification === 'A').length} itens
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-extrabold text-xs border border-amber-500/30">
                B: {curvaABCData.filter((i) => i.classification === 'B').length} itens
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 font-extrabold text-xs border border-zinc-500/30">
                C: {curvaABCData.filter((i) => i.classification === 'C').length} itens
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E8DFC8] dark:border-[#3A302A] overflow-hidden bg-white dark:bg-[#1E1916]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F5EFEB] dark:bg-[#28211C] border-b border-[#E8DFC8] dark:border-[#3A302A] text-[10px] uppercase font-bold text-[#7E7062] dark:text-[#B5A796]">
                <tr>
                  <th className="p-3">Classe</th>
                  <th className="p-3">Produto</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3 text-right">Qtd Vendida</th>
                  <th className="p-3 text-right">Faturamento</th>
                  <th className="p-3 text-right">% Participação</th>
                  <th className="p-3 text-center">Saldo em Estoque</th>
                  <th className="p-3">Recomendação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A]">
                {curvaABCData.slice(0, 30).map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/30 dark:hover:bg-zinc-800/40">
                    <td className="p-3">
                      <span
                        className={`inline-block w-6 h-6 rounded-lg text-center leading-6 font-black text-xs ${
                          item.classification === 'A'
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : item.classification === 'B'
                            ? 'bg-amber-500 text-white'
                            : 'bg-zinc-400 text-white'
                        }`}
                      >
                        {item.classification}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-[#2C241E] dark:text-[#F3EDE6]">
                      {item.name}
                    </td>
                    <td className="p-3 text-[#7E7062] dark:text-[#B5A796]">{item.category || '-'}</td>
                    <td className="p-3 text-right font-mono font-bold">{item.qty} un</td>
                    <td className="p-3 text-right font-mono font-bold text-[#9D7320] dark:text-[#E6BE65]">
                      {formatBRL(item.revenue)}
                    </td>
                    <td className="p-3 text-right font-mono">{item.share.toFixed(1)}%</td>
                    <td className="p-3 text-center">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded-lg text-[11px] ${
                          item.stock <= 0
                            ? 'bg-rose-500/10 text-rose-600'
                            : 'bg-[#F5EFEB] dark:bg-[#25201C] text-[#2C241E] dark:text-[#F3EDE6]'
                        }`}
                      >
                        {item.stock} un
                      </span>
                    </td>
                    <td className="p-3 text-[11px]">
                      {item.classification === 'A' && (
                        <span className="text-emerald-600 font-bold">⭐ Alta prioridade: nunca zerar estoque</span>
                      )}
                      {item.classification === 'B' && (
                        <span className="text-amber-600 font-medium">Manter reposição equilibrada</span>
                      )}
                      {item.classification === 'C' && (
                        <span className="text-zinc-500">Avaliar promoção ou queima se estiver parado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Vendedores & Comissões */}
      {activeTab === 'vendedores' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A]">
            <h3 className="text-sm font-extrabold uppercase text-[#2C241E] dark:text-[#F3EDE6]">
              Desempenho da Equipe, Metas & Comissão
            </h3>
            <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
              Acompanhe quanto cada operador vendeu no período e o valor de comissão acumulado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellersData.map((s) => (
              <div
                key={s.user.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-[#C99F3B] flex items-center justify-center font-black text-sm border border-[#C99F3B]/30">
                      {s.user.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#2C241E] dark:text-[#F3EDE6]">{s.user.name}</h4>
                      <p className="text-[10px] uppercase font-bold text-[#A67C1E] dark:text-[#E6BE65]">
                        {s.user.role} · {s.commissionPercent}% comissão
                      </p>
                    </div>
                  </div>
                  <span className="badge-silver">{s.salesCount} vendas</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#7E7062] dark:text-[#B5A796]">Vendido no período:</span>
                    <span className="font-mono font-bold text-[#2C241E] dark:text-[#F3EDE6]">{formatBRL(s.total)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#7E7062] dark:text-[#B5A796]">Meta mensal:</span>
                    <span className="font-mono text-zinc-500">{formatBRL(s.target)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-emerald-600 dark:text-emerald-400">Comissão a pagar:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatBRL(s.commissionAmount)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span>Atingimento da Meta</span>
                    <span>{s.targetProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-amber-500 to-amber-600 rounded-full"
                      style={{ width: `${s.targetProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Canais de Venda */}
      {activeTab === 'canais' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A]">
            <h3 className="text-sm font-extrabold uppercase text-[#2C241E] dark:text-[#F3EDE6]">
              Vendas por Canal (Instagram, Balcão, Zap)
            </h3>
            <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
              Identifique onde sua loja vende mais para direcionar investimentos de divulgação.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-amber-600">
                <ShoppingBag className="w-5 h-5" />
                <h4 className="font-bold text-xs uppercase">Balcão / PDV Físico</h4>
              </div>
              <p className="text-2xl font-black font-mono text-[#2C241E] dark:text-[#F3EDE6]">
                {formatBRL(channelsData.balcao?.total || 0)}
              </p>
              <p className="text-[11px] text-[#7E7062] dark:text-[#B5A796]">
                {channelsData.balcao?.count || 0} vendas diretas no caixa
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-rose-500">
                <Instagram className="w-5 h-5" />
                <h4 className="font-bold text-xs uppercase">Instagram / Direct</h4>
              </div>
              <p className="text-2xl font-black font-mono text-[#2C241E] dark:text-[#F3EDE6]">
                {formatBRL(channelsData.instagram?.total || 0)}
              </p>
              <p className="text-[11px] text-[#7E7062] dark:text-[#B5A796]">
                {channelsData.instagram?.count || 0} pedidos convertidos
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-600">
                <ShoppingBag className="w-5 h-5" />
                <h4 className="font-bold text-xs uppercase">WhatsApp</h4>
              </div>
              <p className="text-2xl font-black font-mono text-[#2C241E] dark:text-[#F3EDE6]">
                {formatBRL(channelsData.whatsapp?.total || 0)}
              </p>
              <p className="text-[11px] text-[#7E7062] dark:text-[#B5A796]">
                {channelsData.whatsapp?.count || 0} vendas fechadas no zap
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-indigo-500">
                <Package className="w-5 h-5" />
                <h4 className="font-bold text-xs uppercase">Outros / Online</h4>
              </div>
              <p className="text-2xl font-black font-mono text-[#2C241E] dark:text-[#F3EDE6]">
                {formatBRL(channelsData.outros?.total || 0)}
              </p>
              <p className="text-[11px] text-[#7E7062] dark:text-[#B5A796]">
                {channelsData.outros?.count || 0} pedidos
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
