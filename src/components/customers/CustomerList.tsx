import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  MessageCircle,
  Instagram,
  Mail,
  MapPin,
  ShoppingBag,
  Edit2,
  Trash2,
  Eye,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import { formatBRL, formatDate, formatPhone, formatCpfCnpj } from '../../utils/formatters';
import { openWhatsApp } from '../../utils/whatsapp';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { SwipeableRow, SwipeAction } from '../common/SwipeableRow';

interface CustomerListProps {
  onOpenCreate: () => void;
  onOpenEdit: (customer: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ onOpenCreate, onOpenEdit }) => {
  const { customers, sales, orders, deleteCustomer } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Customer statistics map (Total comprado, compras count, ticket médio)
  const customerStats = useMemo(() => {
    const map = new Map<
      string,
      { totalSpent: number; purchasesCount: number; lastPurchaseDate?: string }
    >();

    sales.forEach((s) => {
      if (s.status !== 'cancelled' && s.customerId) {
        const cur = map.get(s.customerId) || { totalSpent: 0, purchasesCount: 0 };
        cur.totalSpent += s.total;
        cur.purchasesCount += 1;
        if (!cur.lastPurchaseDate || new Date(s.date) > new Date(cur.lastPurchaseDate)) {
          cur.lastPurchaseDate = s.date;
        }
        map.set(s.customerId, cur);
      }
    });

    return map;
  }, [sales]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      return (
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.whatsapp && c.whatsapp.includes(search)) ||
        (c.instagram && c.instagram.toLowerCase().includes(search.toLowerCase())) ||
        (c.cpf && c.cpf.includes(search)) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [customers, search]);

  const customerHistory = useMemo(() => {
    if (!selectedCustomerForHistory) return [];
    return sales
      .filter((s) => s.customerId === selectedCustomerForHistory.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, selectedCustomerForHistory]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
            <span>Clientes Cadastrados</span>
            <span className="badge-silver">
              {filteredCustomers.length}
            </span>
          </h2>
          <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
            Histórico completo de compras, contato no WhatsApp, Instagram e ticket médio de cada cliente.
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="btn-gold !py-2 !px-4 !text-xs sm:!text-sm cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={1.75} />
          <span>+ Novo Cliente</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#8E8071]" strokeWidth={1.75} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, WhatsApp, Instagram, CPF ou e-mail..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#F5EFEB]/50 dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] placeholder:text-[#8E8071] focus:outline-hidden focus:ring-2 focus:ring-[#C99F3B]/30"
          />
        </div>
      </div>

      {/* Customer Cards Grid (Desktop Multi-column) & Stacked List with Swipe (Mobile) */}
      {filteredCustomers.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#8E8071] border border-dashed border-[#E8DFC8] dark:border-[#3A302A] rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17]/50">
          Nenhum cliente encontrado. Cadastre um novo cliente acima!
        </div>
      ) : (
        <div className="space-y-3 pb-16 sm:pb-0">
          {/* Mobile Stacked List with Swipeable Rows */}
          <div className="flex md:hidden flex-col space-y-2.5">
            <div className="flex items-center justify-between px-1 text-[11px] text-[#8E8071] dark:text-[#AFA292]">
              <span className="flex items-center gap-1 font-medium">
                <span>👈 Deslize para Ações Rápidas (Editar/Excluir/WhatsApp)</span>
              </span>
              <span className="font-mono text-[10px]">
                {filteredCustomers.length} clientes
              </span>
            </div>

            {filteredCustomers.map((customer) => {
              const stats = customerStats.get(customer.id) || {
                totalSpent: 0,
                purchasesCount: 0,
              };

              const rightActions: SwipeAction[] = [
                {
                  id: 'edit',
                  label: 'Editar',
                  icon: Edit2,
                  variant: 'primary',
                  onClick: () => onOpenEdit(customer),
                },
                {
                  id: 'delete',
                  label: 'Excluir',
                  icon: Trash2,
                  variant: 'danger',
                  onClick: () => setCustomerToDelete(customer),
                },
              ];

              const leftActions: SwipeAction[] = [];
              if (customer.whatsapp) {
                leftActions.push({
                  id: 'whatsapp',
                  label: 'WhatsApp',
                  icon: MessageCircle,
                  className: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                  onClick: () =>
                    openWhatsApp(
                      customer.whatsapp || '',
                      `Olá ${customer.name}! Tudo bem?`
                    ),
                });
              }
              leftActions.push({
                id: 'history',
                label: 'Histórico',
                icon: Eye,
                variant: 'neutral',
                onClick: () => setSelectedCustomerForHistory(customer),
              });

              return (
                <SwipeableRow
                  key={`mobile-${customer.id}`}
                  rightActions={rightActions}
                  leftActions={leftActions}
                  className="border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#201B17] shadow-2xs hover:border-[#C99F3B]/50 transition-all rounded-2xl"
                >
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#D8B059]/15 text-[#9D7320] dark:text-[#E6BE65] border border-[#C99F3B]/40 font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                          {customer.name.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-[#2C241E] dark:text-[#F3EDE6] truncate">
                            {customer.name}
                          </h3>
                          {customer.cpf && (
                            <p className="text-[10px] text-[#8E8071] dark:text-[#AFA292] font-mono truncate">
                              CPF: {formatCpfCnpj(customer.cpf)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Contacts Strip */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
                        {customer.whatsapp && (
                          <span className="badge-silver">
                            <MessageCircle className="w-3 h-3 text-[#C99F3B]" strokeWidth={1.75} />
                            <span>{formatPhone(customer.whatsapp)}</span>
                          </span>
                        )}
                        {customer.instagram && (
                          <span className="badge-gold">
                            <Instagram className="w-3 h-3 text-[#C99F3B]" strokeWidth={1.75} />
                            <span>{customer.instagram}</span>
                          </span>
                        )}
                        {customer.city && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#8E8071] dark:text-[#AFA292]">
                            <MapPin className="w-3 h-3 text-[#8E8071]" strokeWidth={1.75} />
                            <span className="truncate max-w-[120px]">{customer.city}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats & Totals */}
                    <div className="flex flex-col items-end shrink-0 pl-2 border-l border-[#E8DFC8] dark:border-[#3A302A]">
                      <span className="text-[10px] text-[#8E8071] dark:text-[#AFA292] font-medium">Total</span>
                      <strong className="text-xs sm:text-sm font-mono font-black text-[#9D7320] dark:text-[#E6BE65]">
                        {formatBRL(stats.totalSpent)}
                      </strong>
                      <span className="text-[10px] text-[#8E8071] dark:text-[#AFA292] font-mono">
                        {stats.purchasesCount} {stats.purchasesCount === 1 ? 'pedido' : 'pedidos'}
                      </span>
                    </div>
                  </div>
                </SwipeableRow>
              );
            })}
          </div>

          {/* Desktop Multi-column Grid */}
          <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredCustomers.map((customer) => {
              const stats = customerStats.get(customer.id) || {
                totalSpent: 0,
                purchasesCount: 0,
              };

              return (
                <div
                  key={customer.id}
                  className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#201B17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs hover:border-[#C99F3B]/50 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#D8B059]/15 text-[#9D7320] dark:text-[#E6BE65] border border-[#C99F3B]/40 font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                          {customer.name.slice(0, 2)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#2C241E] dark:text-[#F3EDE6]">
                            {customer.name}
                          </h3>
                          {customer.cpf && (
                            <p className="text-[10px] text-[#8E8071] dark:text-[#AFA292] font-mono">
                              CPF: {formatCpfCnpj(customer.cpf)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onOpenEdit(customer)}
                          className="p-1 rounded-lg text-[#8E8071] hover:text-[#9D7320] dark:hover:text-[#E6BE65] transition-colors cursor-pointer"
                          title="Editar cliente"
                        >
                          <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                        <button
                          onClick={() => setCustomerToDelete(customer)}
                          className="p-1 rounded-lg text-[#8E8071] hover:text-rose-600 transition-colors cursor-pointer"
                          title="Excluir cliente"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>

                    {/* Channels & Contacts */}
                    <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
                      {customer.whatsapp && (
                        <button
                          onClick={() =>
                            openWhatsApp(
                              customer.whatsapp || '',
                              `Olá ${customer.name}! Tudo bem?`
                            )
                          }
                          className="badge-silver hover:border-[#C99F3B] cursor-pointer"
                        >
                          <MessageCircle className="w-3 h-3 text-[#C99F3B]" strokeWidth={1.75} />
                          <span>{formatPhone(customer.whatsapp)}</span>
                        </button>
                      )}

                      {customer.instagram && (
                        <span className="badge-gold">
                          <Instagram className="w-3 h-3 text-[#C99F3B]" strokeWidth={1.75} />
                          <span>{customer.instagram}</span>
                        </span>
                      )}

                      {customer.email && (
                        <span className="flex items-center gap-1 text-[11px] text-[#8E8071] truncate max-w-[180px]">
                          <Mail className="w-3 h-3 text-[#8E8071]" strokeWidth={1.75} />
                          <span className="truncate">{customer.email}</span>
                        </span>
                      )}
                    </div>

                    {/* Address */}
                    {customer.address && (
                      <p className="text-[11px] text-[#8E8071] dark:text-[#AFA292] mt-1.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#8E8071] shrink-0" strokeWidth={1.75} />
                        <span className="truncate">
                          {customer.address}
                          {customer.city ? ` - ${customer.city}/${customer.state}` : ''}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Metrics Footer */}
                  <div className="pt-3 border-t border-[#E8DFC8]/60 dark:border-[#3A302A] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-[#8E8071] dark:text-[#AFA292] block">Total Comprado:</span>
                      <strong className="font-mono text-xs font-black text-[#9D7320] dark:text-[#E6BE65]">
                        {formatBRL(stats.totalSpent)}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#8E8071] dark:text-[#AFA292] block">Pedidos:</span>
                      <strong className="font-mono text-xs text-[#2C241E] dark:text-[#F3EDE6]">
                        {stats.purchasesCount}
                      </strong>
                    </div>

                    <button
                      onClick={() => setSelectedCustomerForHistory(customer)}
                      className="btn-silver !py-1 !px-2.5 !text-[11px] cursor-pointer"
                    >
                      <Eye className="w-3 h-3" strokeWidth={1.75} />
                      <span>Histórico</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Accessible Mobile Bottom Action Bar */}
          <div className="md:hidden sticky bottom-18 z-30 pt-2 flex items-center justify-center pointer-events-none">
            <button
              onClick={onOpenCreate}
              className="pointer-events-auto btn-gold !py-3 !px-5 rounded-2xl shadow-lg !text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Cadastrar Novo Cliente</span>
            </button>
          </div>
        </div>
      )}

      {/* Customer Purchase History Modal */}
      {selectedCustomerForHistory && (
        <Modal
          isOpen={!!selectedCustomerForHistory}
          onClose={() => setSelectedCustomerForHistory(null)}
          title={`Histórico de Compras - ${selectedCustomerForHistory.name}`}
          maxWidth="lg"
        >
          <div className="space-y-3 text-xs">
            {customerHistory.length === 0 ? (
              <p className="py-8 text-center text-[#8E8071] dark:text-[#AFA292]">
                Nenhuma compra associada a este cliente ainda.
              </p>
            ) : (
              <div className="divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A] border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#201B17] rounded-xl overflow-hidden shadow-2xs">
                {customerHistory.map((s) => (
                  <div key={s.id} className="p-3 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="font-mono text-[#2C241E] dark:text-[#F3EDE6]">Venda #{s.saleNumber}</span>
                      <span className="font-mono font-black text-[#9D7320] dark:text-[#E6BE65]">{formatBRL(s.total)}</span>
                    </div>
                    <p className="text-[#8E8071] dark:text-[#AFA292] text-[11px]">
                      {formatDate(s.date)} · Pagamento: {s.paymentMethod}
                    </p>
                    <p className="text-[#554639] dark:text-[#D5C9BA] text-[11px]">
                      {s.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Confirm Deletion */}
      <ConfirmModal
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={async () => {
          if (customerToDelete) {
            await deleteCustomer(customerToDelete.id);
            setCustomerToDelete(null);
          }
        }}
        title="Excluir Cliente"
        description={`Tem certeza que deseja remover o cadastro de "${customerToDelete?.name}"?`}
        confirmText="Sim, excluir"
        variant="danger"
      />
    </div>
  );
};
