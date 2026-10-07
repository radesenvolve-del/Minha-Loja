import React, { useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  CreditCard,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Users,
  Boxes,
  Instagram,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatBRL, formatDate } from '../../utils/formatters';

interface DashboardOverviewProps {
  onOpenProductModal: () => void;
  onOpenStockMovementModal: () => void;
  onOpenCustomerModal: () => void;
  onOpenOrderModal: () => void;
  onOpenCardGenerator?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onOpenProductModal,
  onOpenStockMovementModal,
  onOpenCustomerModal,
  onOpenOrderModal,
  onOpenCardGenerator,
}) => {
  const {
    sales,
    orders,
    products,
    accountsPayable,
    accountsReceivable,
    setActiveTab,
    setIsFastPDVOpen,
  } = useApp();

  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const thisMonthStr = new Date().toISOString().slice(0, 7);

    // Sales completed
    const activeSales = sales.filter((s) => s.status !== 'cancelled');

    const salesToday = activeSales.filter((s) => s.date.slice(0, 10) === todayStr);
    const salesThisMonth = activeSales.filter((s) => s.date.slice(0, 7) === thisMonthStr);

    const revenueToday = salesToday.reduce((sum, s) => sum + s.total, 0);
    const revenueMonth = salesThisMonth.reduce((sum, s) => sum + s.total, 0);
    const profitMonth = salesThisMonth.reduce((sum, s) => sum + s.estimatedProfit, 0);

    const itemsSoldToday = salesToday.reduce(
      (sum, s) => sum + s.items.reduce((iSum, item) => iSum + item.quantity, 0),
      0
    );
    const itemsSoldMonth = salesThisMonth.reduce(
      (sum, s) => sum + s.items.reduce((iSum, item) => iSum + item.quantity, 0),
      0
    );

    const avgTicket = salesThisMonth.length > 0 ? revenueMonth / salesThisMonth.length : 0;

    // Pending Orders
    const pendingOrders = orders.filter(
      (o) => o.status !== 'entregue' && o.status !== 'cancelado' && o.status !== 'devolvido'
    );

    // Stock alerts
    const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
    const outOfStockProducts = products.filter((p) => p.stock <= 0);

    // Accounts
    const pendingPayable = accountsPayable
      .filter((a) => a.status === 'pendente')
      .reduce((sum, a) => sum + a.amount, 0);

    const pendingReceivable = accountsReceivable
      .filter((a) => a.status === 'pendente')
      .reduce((sum, a) => sum + a.amount, 0);

    // Last 7 days sales
    const last7Days: { dateStr: string; label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayISO = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });

      const dayTotal = activeSales
        .filter((s) => s.date.slice(0, 10) === dayISO)
        .reduce((sum, s) => sum + s.total, 0);

      last7Days.push({ dateStr: dayISO, label: dayLabel, total: dayTotal });
    }

    // Top selling products
    const productSalesMap = new Map<string, { name: string; qty: number; revenue: number }>();
    activeSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const current = productSalesMap.get(item.productId) || {
          name: item.name,
          qty: 0,
          revenue: 0,
        };
        current.qty += item.quantity;
        current.revenue += item.total;
        productSalesMap.set(item.productId, current);
      });
    });

    const topSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Payment methods breakdown
    const paymentMethodsMap: Record<string, number> = {};
    salesThisMonth.forEach((s) => {
      const m = s.paymentMethod;
      paymentMethodsMap[m] = (paymentMethodsMap[m] || 0) + s.total;
    });

    return {
      salesTodayCount: salesToday.length,
      revenueToday,
      itemsSoldToday,
      salesMonthCount: salesThisMonth.length,
      revenueMonth,
      profitMonth,
      avgTicket,
      itemsSoldMonth,
      pendingOrdersCount: pendingOrders.length,
      lowStockProducts,
      outOfStockProducts,
      pendingPayable,
      pendingReceivable,
      last7Days,
      topSellingProducts,
      paymentMethodsMap,
    };
  }, [sales, orders, products, accountsPayable, accountsReceivable]);

  // Max value for 7-day bar chart
  const maxDayTotal = Math.max(1, ...metrics.last7Days.map((d) => d.total));

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
    [products]
  );

  return (
    <div className="space-y-6">
      {/* 1. Smart Summary Speech Box */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#C99F3B]/40 shadow-2xs">
        <div className="flex items-center gap-2 mb-2 text-[#9D7320] dark:text-[#E6BE65] font-extrabold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-[#C99F3B]" strokeWidth={1.75} />
          <span>Resumo do Atelier</span>
        </div>
        <p className="text-sm sm:text-base text-[#2C241E] dark:text-[#F3EDE6] leading-relaxed">
          {metrics.revenueToday > 0 ? (
            <>
              Hoje você vendeu <strong className="text-[#9D7320] dark:text-[#E6BE65] font-mono">{formatBRL(metrics.revenueToday)}</strong> em{' '}
              <strong>{metrics.itemsSoldToday} produtos</strong>.
            </>
          ) : (
            <>Nenhuma venda registrada hoje ainda. Que tal começar abrindo o PDV?</>
          )}{' '}
          {metrics.topSellingProducts[0] && (
            <>
              O item mais vendido do período é{' '}
              <strong>{metrics.topSellingProducts[0].name}</strong> ({metrics.topSellingProducts[0].qty} un).{' '}
            </>
          )}
          {metrics.lowStockProducts.length > 0 && (
            <>
              ⚠️ Atenção:{' '}
              <strong className="text-[#9D7320] dark:text-[#E6BE65]">
                {metrics.lowStockProducts.length} produtos
              </strong>{' '}
              estão com estoque baixo.{' '}
            </>
          )}
          {metrics.pendingReceivable > 0 && (
            <>
              Você possui <strong className="text-[#9D7320] dark:text-[#E6BE65] font-mono">{formatBRL(metrics.pendingReceivable)}</strong> a receber.
            </>
          )}
        </p>
      </div>

      {/* 2. Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          onClick={() => setIsFastPDVOpen(true)}
          className="btn-gold flex-col !p-3.5 !rounded-2xl !text-xs cursor-pointer shadow-xs"
        >
          <CreditCard className="w-5 h-5 mb-1" strokeWidth={1.75} />
          <span>+ Nova Venda</span>
        </button>

        {onOpenCardGenerator && (
          <button
            onClick={onOpenCardGenerator}
            className="btn-gold flex-col !p-3.5 !rounded-2xl !text-xs cursor-pointer shadow-xs"
          >
            <Instagram className="w-5 h-5 mb-1 text-[#1A1306]" strokeWidth={1.75} />
            <span>Card Insta/Zap</span>
          </button>
        )}

        <button
          onClick={onOpenOrderModal}
          className="btn-silver flex-col !p-3.5 !rounded-2xl !text-xs cursor-pointer shadow-2xs"
        >
          <ShoppingBag className="w-5 h-5 mb-1 text-[#C99F3B]" strokeWidth={1.75} />
          <span>+ Novo Pedido</span>
        </button>

        <button
          onClick={onOpenProductModal}
          className="btn-silver flex-col !p-3.5 !rounded-2xl !text-xs cursor-pointer shadow-2xs"
        >
          <Package className="w-5 h-5 mb-1 text-[#556070] dark:text-[#CBD5E1]" strokeWidth={1.75} />
          <span>+ Novo Produto</span>
        </button>

        <button
          onClick={onOpenStockMovementModal}
          className="btn-silver flex-col !p-3.5 !rounded-2xl !text-xs cursor-pointer shadow-2xs"
        >
          <Boxes className="w-5 h-5 mb-1 text-[#556070] dark:text-[#CBD5E1]" strokeWidth={1.75} />
          <span>Entrada Estoque</span>
        </button>

        <button
          onClick={onOpenCustomerModal}
          className="col-span-2 sm:col-span-1 btn-silver flex-col !p-3.5 !rounded-2xl !text-xs cursor-pointer shadow-2xs"
        >
          <Users className="w-5 h-5 mb-1 text-[#556070] dark:text-[#CBD5E1]" strokeWidth={1.75} />
          <span>+ Novo Cliente</span>
        </button>
      </div>

      {/* 3. Main KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Vendas Hoje */}
        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
          <span className="text-xs font-semibold text-[#8E8071] dark:text-[#AFA292] block mb-1">
            Vendas de Hoje
          </span>
          <p className="text-xl sm:text-2xl font-black text-[#9D7320] dark:text-[#E6BE65] font-mono">
            {formatBRL(metrics.revenueToday)}
          </p>
          <p className="text-[11px] text-[#7E7062] dark:text-[#B5A796] mt-1">
            {metrics.salesTodayCount} vendas · {metrics.itemsSoldToday} itens
          </p>
        </div>

        {/* Faturamento do Mês */}
        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
          <span className="text-xs font-semibold text-[#8E8071] dark:text-[#AFA292] block mb-1">
            Faturamento do Mês
          </span>
          <p className="text-xl sm:text-2xl font-black text-[#9D7320] dark:text-[#E6BE65] font-mono">
            {formatBRL(metrics.revenueMonth)}
          </p>
          <p className="text-[11px] text-[#7E7062] dark:text-[#B5A796] mt-1">
            {metrics.salesMonthCount} vendas no mês
          </p>
        </div>

        {/* Lucro Estimado */}
        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
          <span className="text-xs font-semibold text-[#8E8071] dark:text-[#AFA292] block mb-1">
            Lucro Estimado (Mês)
          </span>
          <p className="text-xl sm:text-2xl font-black text-[#9D7320] dark:text-[#E6BE65] font-mono">
            {formatBRL(metrics.profitMonth)}
          </p>
          <p className="text-[11px] text-[#7E7062] dark:text-[#B5A796] mt-1">
            Ticket Médio: {formatBRL(metrics.avgTicket)}
          </p>
        </div>

        {/* Pedidos Pendentes */}
        <div
          onClick={() => setActiveTab('orders')}
          className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs cursor-pointer hover:border-[#C99F3B]/50 transition-colors"
        >
          <span className="text-xs font-semibold text-[#8E8071] dark:text-[#AFA292] block mb-1">
            Pedidos Pendentes
          </span>
          <p className="text-xl sm:text-2xl font-black text-[#9D7320] dark:text-[#E6BE65] font-mono">
            {metrics.pendingOrdersCount}
          </p>
          <p className="text-[11px] text-[#7E7062] dark:text-[#B5A796] mt-1 flex items-center justify-between">
            <span>Instagram / WhatsApp</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#C99F3B]" strokeWidth={1.75} />
          </p>
        </div>
      </div>

      {/* 4. Secondary Row: Financial & Stock Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Contas a Receber */}
        <div
          onClick={() => setActiveTab('financial')}
          className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] cursor-pointer hover:border-[#C99F3B]/50 transition-colors shadow-2xs"
        >
          <span className="text-xs font-semibold text-[#8E8071] dark:text-[#AFA292] block mb-1">
            Contas a Receber
          </span>
          <p className="text-lg font-bold text-[#9D7320] dark:text-[#E6BE65] font-mono">
            {formatBRL(metrics.pendingReceivable)}
          </p>
          <span className="text-[11px] text-[#9D7320] dark:text-[#E6BE65] font-semibold mt-1 inline-block">
            Ver detalhes no financeiro →
          </span>
        </div>

        {/* Contas a Pagar */}
        <div
          onClick={() => setActiveTab('financial')}
          className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] cursor-pointer hover:border-rose-400 dark:hover:border-rose-600 transition-colors shadow-2xs"
        >
          <span className="text-xs font-semibold text-[#8E8071] dark:text-[#AFA292] block mb-1">
            Contas a Pagar
          </span>
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
            {formatBRL(metrics.pendingPayable)}
          </p>
          <span className="text-[11px] text-[#7E7062] dark:text-[#B5A796] mt-1 inline-block">
            Fornecedores e despesas
          </span>
        </div>

        {/* Estoque Baixo */}
        <div
          onClick={() => setActiveTab('stock')}
          className={`p-4 rounded-2xl border transition-colors cursor-pointer shadow-2xs ${
            metrics.lowStockProducts.length > 0
              ? 'bg-[#D8B059]/10 border-[#C99F3B]/40'
              : 'bg-[#FFFDF9] dark:bg-[#1F1A17] border-[#E8DFC8] dark:border-[#3A302A]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-[#8E8071] dark:text-[#AFA292]">
              Estoque Baixo
            </span>
            {metrics.lowStockProducts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#C99F3B] animate-ping" />
            )}
          </div>
          <p className="text-lg font-bold text-[#9D7320] dark:text-[#E6BE65] font-mono">
            {metrics.lowStockProducts.length} itens
          </p>
          <span className="text-[11px] text-[#7E7062] dark:text-[#B5A796] mt-1 inline-block">
            Precisam de reposição
          </span>
        </div>

        {/* Sem Estoque */}
        <div
          onClick={() => setActiveTab('stock')}
          className={`p-4 rounded-2xl border transition-colors cursor-pointer shadow-2xs ${
            metrics.outOfStockProducts.length > 0
              ? 'bg-rose-500/10 border-rose-500/30'
              : 'bg-[#FFFDF9] dark:bg-[#1F1A17] border-[#E8DFC8] dark:border-[#3A302A]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-[#8E8071] dark:text-[#AFA292]">
              Produtos Esgotados
            </span>
            {metrics.outOfStockProducts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </div>
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
            {metrics.outOfStockProducts.length} itens
          </p>
          <span className="text-[11px] text-[#7E7062] dark:text-[#B5A796] mt-1 inline-block">
            Estoque zero na loja
          </span>
        </div>
      </div>

      {/* 5. Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales by day (Last 7 Days) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#2C241E] dark:text-[#F3EDE6]">
                Vendas nos Últimos 7 Dias
              </h3>
              <p className="text-xs text-[#7E7062] dark:text-[#B5A796]">
                Faturamento diário registrado
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#9D7320] dark:text-[#E6BE65]">
              Total: {formatBRL(metrics.last7Days.reduce((s, d) => s + d.total, 0))}
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 h-44 pt-4 border-b border-[#E8DFC8] dark:border-[#3A302A] pb-2">
            {metrics.last7Days.map((day) => {
              const heightPercent = Math.max(8, Math.round((day.total / maxDayTotal) * 100));
              return (
                <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-mono text-[#8E8071] dark:text-[#AFA292] opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatBRL(day.total)}
                  </span>
                  <div className="w-full max-w-[42px] bg-[#F5EFEB] dark:bg-[#28211C] rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        day.total > 0
                          ? 'bg-gradient-to-t from-[#AF8323] to-[#D8B059]'
                          : 'bg-[#EAE2D5] dark:bg-[#332A22]'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-[#7E7062] dark:text-[#B5A796] uppercase">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="p-5 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#2C241E] dark:text-[#F3EDE6]">
              Mais Vendidos
            </h3>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs text-[#9D7320] dark:text-[#E6BE65] hover:underline font-semibold cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-3">
            {metrics.topSellingProducts.length === 0 ? (
              <p className="text-xs text-[#8E8071] py-6 text-center">Nenhuma venda registrada ainda.</p>
            ) : (
              metrics.topSellingProducts.map((p, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-[#F5EFEB] dark:bg-[#28211C] border border-[#E8DFC8] dark:border-[#3A302A] font-bold text-[#9D7320] dark:text-[#E6BE65] text-[11px] shrink-0 font-mono">
                      {index + 1}º
                    </span>
                    <span className="font-medium text-[#2C241E] dark:text-[#F3EDE6] truncate">
                      {p.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0 font-mono pl-2">
                    <span className="font-bold text-[#2C241E] dark:text-[#F3EDE6]">
                      {p.qty} un
                    </span>
                    <span className="text-[10px] text-[#8E8071] dark:text-[#AFA292] block">
                      {formatBRL(p.revenue)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
