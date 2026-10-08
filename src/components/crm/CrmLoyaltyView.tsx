import React, { useState, useMemo } from 'react';
import {
  Users,
  Sparkles,
  Gift,
  Coins,
  Award,
  TrendingUp,
  MessageCircle,
  Calendar,
  Heart,
  DollarSign,
  UserCheck,
  Search,
  Percent,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatBRL, formatDate, formatPhone } from '../../utils/formatters';
import { openWhatsApp } from '../../utils/whatsapp';
import { Customer } from '../../types';

export const CrmLoyaltyView: React.FC = () => {
  const { customers, sales, settings, users, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'aniversariantes' | 'inativos' | 'cashback' | 'metas'>('aniversariantes');
  const [search, setSearch] = useState('');

  const currentMonth = new Date().getMonth() + 1; // 1-12

  // 1. Birthdays of the Month
  const birthdayCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (!c.birthDate) return false;
      const parts = c.birthDate.split('-');
      if (parts.length >= 2) {
        const month = parseInt(parts[1], 10);
        return month === currentMonth;
      }
      return false;
    });
  }, [customers, currentMonth]);

  // 2. Inactive Customers (> 30 days without purchase)
  const inactiveCustomers = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    return customers.filter((c) => {
      if (!c.lastPurchaseDate) return true;
      return new Date(c.lastPurchaseDate).getTime() < thirtyDaysAgo;
    });
  }, [customers]);

  // 3. Customers with Cashback / Credit Balance
  const cashbackCustomers = useMemo(() => {
    return customers.filter((c) => (c.cashbackBalance && c.cashbackBalance > 0) || (c.creditBalance && c.creditBalance > 0));
  }, [customers]);

  // 4. Sellers Performance & Commission
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const sellersPerformance = useMemo(() => {
    const activeSalesThisMonth = sales.filter(
      (s) => s.status !== 'cancelled' && s.date.slice(0, 7) === currentYearMonth
    );

    return users.map((u) => {
      const userSales = activeSalesThisMonth.filter((s) => s.sellerId === u.id || s.userName === u.name);
      const totalSold = userSales.reduce((acc, s) => acc + s.total, 0);
      const commissionRate = u.commissionPercent ?? (u.role === 'vendedor' ? 5 : 0);
      const commissionEarned = Math.round((totalSold * commissionRate) / 100 * 100) / 100;
      const target = u.monthlySalesTarget || 15000;
      const progressPercent = Math.min(100, Math.round((totalSold / target) * 100));

      return {
        user: u,
        totalSold,
        salesCount: userSales.length,
        commissionEarned,
        target,
        progressPercent,
      };
    });
  }, [users, sales, currentYearMonth]);

  const handleSendBirthdayMessage = (customer: Customer) => {
    const phone = customer.whatsapp || '';
    if (!phone) {
      showToast('Cliente não possui WhatsApp cadastrado.', 'warning');
      return;
    }
    const text = `🎉 *Parabéns pelo seu aniversário, ${customer.name.split(' ')[0]}!* 🎂✨\n\nNós da *${settings.storeName}* desejamos muitas felicidades, saúde e realizações!\n\nPara comemorar este dia especial, preparamos um *mimo exclusivo* para você na nossa loja com 15% de desconto especial em qualquer compra esta semana! ❤️🎁\n\nEsperamos você! Um grande abraço!`;
    openWhatsApp(phone, text);
    showToast(`Mensagem de aniversário aberta para ${customer.name}!`, 'success');
  };

  const handleSendWeMissYouMessage = (customer: Customer) => {
    const phone = customer.whatsapp || '';
    if (!phone) {
      showToast('Cliente não possui WhatsApp cadastrado.', 'warning');
      return;
    }
    const text = `✨ *Olá, ${customer.name.split(' ')[0]}! Sentimos sua falta aqui na ${settings.storeName}!* ❤️\n\nChegaram muitas novidades exclusivas na nossa coleção que você vai adorar ver!\n\nPara o seu retorno, separamos um cupom especial de frete grátis ou 10% de desconto na sua próxima compra. Posso te enviar as novidades do catálogo? 🛍️✨`;
    openWhatsApp(phone, text);
    showToast(`Mensagem de reengajamento aberta para ${customer.name}!`, 'success');
  };

  const handleSendCashbackNotice = (customer: Customer) => {
    const phone = customer.whatsapp || '';
    if (!phone) {
      showToast('Cliente não possui WhatsApp cadastrado.', 'warning');
      return;
    }
    const saldo = formatBRL((customer.cashbackBalance || 0) + (customer.creditBalance || 0));
    const text = `💎 *Olá, ${customer.name.split(' ')[0]}!* Você possui *${saldo}* de cashback/crédito disponível para resgate na *${settings.storeName}*!\n\nAproveite para usar seu saldo acumulado na sua próxima compra hoje mesmo. Venha nos visitar ou confira nosso catálogo digital! ✨🛍️`;
    openWhatsApp(phone, text);
    showToast(`Aviso de saldo de cashback enviado para ${customer.name}!`, 'success');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
            <span>CRM, Fidelidade & Vendedores</span>
            <span className="badge-gold">
              {settings.cashbackEnabled ? `${settings.cashbackPercent || 3}% Cashback Ativo` : 'Fidelidade'}
            </span>
          </h2>
          <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
            Relacionamento com clientes, aniversariantes do mês, recuperação de inativos e acompanhamento de metas da equipe.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-[#F5EFEB] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A]">
        {[
          { id: 'aniversariantes', label: 'Aniversariantes do Mês', icon: Gift, count: birthdayCustomers.length },
          { id: 'inativos', label: 'Clientes Inativos (>30d)', icon: Heart, count: inactiveCustomers.length },
          { id: 'cashback', label: 'Saldo de Cashback & Créditos', icon: Coins, count: cashbackCustomers.length },
          { id: 'metas', label: 'Metas & Comissões', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white dark:bg-[#2B241F] text-[#9D7320] dark:text-[#E6BE65] shadow-xs border border-[#C99F3B]/40'
                  : 'text-[#635649] dark:text-[#CBD5E1] hover:bg-white/60 dark:hover:bg-[#2A231E]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#D8B059]/20 text-[#A67C1E] dark:text-[#E6BE65]">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab: Aniversariantes */}
      {activeTab === 'aniversariantes' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-[#C99F3B]/30 flex items-start gap-3">
            <Gift className="w-5 h-5 text-[#C99F3B] shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-700 dark:text-zinc-300">
              <strong>Parabenize seus clientes e fidelize:</strong> Clientes que recebem mensagem de aniversário têm probabilidade 3x maior de comprar no mês de aniversário. Envie parabéns com 1 clique direto no WhatsApp.
            </div>
          </div>

          {birthdayCustomers.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-[#E8DFC8] dark:border-[#3A302A] text-zinc-500 text-xs">
              Nenhum cliente cadastrado faz aniversário no mês atual ({currentMonth}). Cadastre a data de nascimento nos detalhes do cliente!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {birthdayCustomers.map((cust) => (
                <div
                  key={cust.id}
                  className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#2C241E] dark:text-[#F3EDE6]">
                        {cust.name}
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[#C99F3B]" />
                        <span>Nascimento: {cust.birthDate ? cust.birthDate.split('-').reverse().join('/') : 'S/D'}</span>
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {cust.whatsapp ? formatPhone(cust.whatsapp) : 'Sem WhatsApp'}
                      </p>
                    </div>
                    <span className="p-2 rounded-xl bg-amber-500/10 text-[#C99F3B]">
                      <Gift className="w-4 h-4" />
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#E8DFC8]/60 dark:border-[#3A302A]/60 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">
                      Total gasto: <strong>{formatBRL(cust.totalSpent || 0)}</strong>
                    </span>
                    <button
                      onClick={() => handleSendBirthdayMessage(cust)}
                      className="btn-gold !py-1.5 !px-3 !text-[11px]"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Parabenizar no Zap</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Inativos */}
      {activeTab === 'inativos' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-[#C99F3B]/30 flex items-start gap-3">
            <Heart className="w-5 h-5 text-[#C99F3B] shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-700 dark:text-zinc-300">
              <strong>Recuperação de Clientes:</strong> Estes clientes não compram há mais de 30 dias. Envie uma mensagem carinhosa de "Sentimos sua falta" com uma oferta especial para reativá-los.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {inactiveCustomers.slice(0, 15).map((cust) => (
              <div
                key={cust.id}
                className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <h4 className="font-extrabold text-sm text-[#2C241E] dark:text-[#F3EDE6]">
                    {cust.name}
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Última compra: {cust.lastPurchaseDate ? formatDate(cust.lastPurchaseDate) : 'Nunca comprou'}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    Total já investido: {formatBRL(cust.totalSpent || 0)}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E8DFC8]/60 dark:border-[#3A302A]/60 flex items-center justify-end">
                  <button
                    onClick={() => handleSendWeMissYouMessage(cust)}
                    className="btn-gold !py-1.5 !px-3 !text-[11px]"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Chamar no WhatsApp</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Cashback & Saldo */}
      {activeTab === 'cashback' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
            <Coins className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-700 dark:text-zinc-300">
              <strong>Programa de Fidelidade e Cashback ({settings.cashbackPercent || 3}%):</strong> Clientes acumulam saldo a cada compra finalizada e podem abater o valor no PDV. Avise os clientes que possuem saldo parado para visitarem sua loja!
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {cashbackCustomers.map((cust) => {
              const totalBonus = (cust.cashbackBalance || 0) + (cust.creditBalance || 0);
              return (
                <div
                  key={cust.id}
                  className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#2C241E] dark:text-[#F3EDE6]">
                        {cust.name}
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Cashback: <strong className="text-emerald-600">{formatBRL(cust.cashbackBalance || 0)}</strong>
                        {cust.creditBalance ? ` · Crédito: ${formatBRL(cust.creditBalance)}` : ''}
                      </p>
                    </div>
                    <span className="text-base font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl">
                      {formatBRL(totalBonus)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#E8DFC8]/60 dark:border-[#3A302A]/60 flex items-center justify-end">
                    <button
                      onClick={() => handleSendCashbackNotice(cust)}
                      className="btn-emerald !py-1.5 !px-3 !text-[11px]"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Avisar Saldo Disponível</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Metas & Comissões */}
      {activeTab === 'metas' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] shadow-xs">
            <h3 className="font-extrabold text-sm uppercase text-[#2C241E] dark:text-[#F3EDE6] mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#C99F3B]" />
              <span>Desempenho da Equipe e Comissões (Mês Atual)</span>
            </h3>

            <div className="divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A]/60">
              {sellersPerformance.map((item) => (
                <div key={item.user.id} className="py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
                      <span>{item.user.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {item.user.role.toUpperCase()}
                      </span>
                    </p>
                    <p className="text-xs text-zinc-500">
                      Vendas no mês: <strong>{item.salesCount} vendas</strong> · Total faturado: <strong className="text-[#C99F3B]">{formatBRL(item.totalSold)}</strong>
                    </p>

                    {/* Progress Bar towards Target */}
                    <div className="w-full sm:w-64 space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>Meta: {formatBRL(item.target)}</span>
                        <span>{item.progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#D8B059] to-[#AF8323] rounded-full transition-all duration-500"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:text-right flex sm:flex-col justify-between items-center sm:items-end">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-400">Comissão Acumulada</p>
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {formatBRL(item.commissionEarned)}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        Taxa: {item.user.commissionPercent ?? (item.user.role === 'vendedor' ? 5 : 0)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
