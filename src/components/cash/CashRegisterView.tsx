import React, { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  Lock,
  Unlock,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  History,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CashMovementType, CashSession } from '../../types';
import { formatBRL, formatDateTime } from '../../utils/formatters';
import { Modal } from '../common/Modal';

export const CashRegisterView: React.FC = () => {
  const {
    currentCashSession,
    cashSessions,
    cashMovements,
    openCashSession,
    closeCashSession,
    addCashMovement,
    showToast,
  } = useApp();

  // Open modal
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [initialFloat, setInitialFloat] = useState<number>(100);

  // Close modal
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [countedCash, setCountedCash] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState('');

  // Movement modal (Sangria / Suprimento)
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveType, setMoveType] = useState<CashMovementType>('sangria');
  const [moveAmount, setMoveAmount] = useState<number>(0);
  const [moveReason, setMoveReason] = useState('');

  // Closed receipt review modal
  const [selectedClosedSession, setSelectedClosedSession] = useState<CashSession | null>(null);

  const activeSessionMovements = cashMovements.filter(
    (m) => m.sessionId === currentCashSession?.id
  );

  const handleOpenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initialFloat < 0) {
      showToast('O valor inicial não pode ser negativo.', 'error');
      return;
    }
    await openCashSession(Number(initialFloat));
    setShowOpenModal(false);
  };

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countedCash < 0) {
      showToast('O valor contado não pode ser negativo.', 'error');
      return;
    }
    const closed = await closeCashSession(Number(countedCash), closeNotes);
    setShowCloseModal(false);
    setSelectedClosedSession(closed);
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (moveAmount <= 0) {
      showToast('O valor deve ser maior que zero.', 'error');
      return;
    }
    if (!moveReason.trim()) {
      showToast('Informe o motivo da movimentação.', 'error');
      return;
    }
    await addCashMovement(moveType, Number(moveAmount), moveReason.trim());
    setShowMoveModal(false);
    setMoveAmount(0);
    setMoveReason('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
            <span>Controle de Frente de Caixa</span>
            <span
              className={`badge-silver ${
                currentCashSession
                  ? '!border-[#C99F3B]/50 text-[#9D7320] dark:text-[#E6BE65]'
                  : ''
              }`}
            >
              {currentCashSession ? 'Caixa Aberto' : 'Caixa Fechado'}
            </span>
          </h2>
          <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
            Abertura com fundo de troco, sangrias, suprimentos e conferência de fechamento por forma de pagamento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentCashSession ? (
            <>
              <button
                onClick={() => {
                  setMoveType('sangria');
                  setShowMoveModal(true);
                }}
                className="btn-silver !py-2 !px-3 !text-xs cursor-pointer shadow-2xs"
              >
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" strokeWidth={1.75} />
                <span>Sangria</span>
              </button>

              <button
                onClick={() => {
                  setMoveType('suprimento');
                  setShowMoveModal(true);
                }}
                className="btn-silver !py-2 !px-3 !text-xs cursor-pointer shadow-2xs"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-[#9D7320] dark:text-[#E6BE65]" strokeWidth={1.75} />
                <span>Suprimento</span>
              </button>

              <button
                onClick={() => {
                  setCountedCash(currentCashSession.totalCash);
                  setShowCloseModal(true);
                }}
                className="btn-danger !py-2 !px-3.5 !text-xs cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Fechar Caixa</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowOpenModal(true)}
              className="btn-gold !py-2 !px-4 !text-xs sm:!text-sm cursor-pointer shadow-xs"
            >
              <Unlock className="w-4 h-4" strokeWidth={1.75} />
              <span>Abrir Novo Caixa</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Cash Box Summary */}
      {currentCashSession ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
            <span className="text-[11px] font-semibold text-[#8E8071] dark:text-[#AFA292] block mb-1">
              Dinheiro em Gaveta
            </span>
            <p className="text-xl font-extrabold text-[#9D7320] dark:text-[#E6BE65] font-mono">
              {formatBRL(currentCashSession.totalCash)}
            </p>
            <span className="text-[10px] text-[#7E7062] dark:text-[#B5A796]">
              Fundo inicial: {formatBRL(currentCashSession.initialAmount)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
            <span className="text-[11px] font-semibold text-[#8E8071] dark:text-[#AFA292] block mb-1">
              Total em PIX
            </span>
            <p className="text-xl font-extrabold text-[#9D7320] dark:text-[#E6BE65] font-mono">
              {formatBRL(currentCashSession.totalPix)}
            </p>
            <span className="text-[10px] text-[#7E7062] dark:text-[#B5A796]">Transferências diretas</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
            <span className="text-[11px] font-semibold text-[#8E8071] dark:text-[#AFA292] block mb-1">
              Total em Cartões
            </span>
            <p className="text-xl font-extrabold text-[#556070] dark:text-[#CBD5E1] font-mono">
              {formatBRL(currentCashSession.totalCard)}
            </p>
            <span className="text-[10px] text-[#7E7062] dark:text-[#B5A796]">Débito e Crédito</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
            <span className="text-[11px] font-semibold text-[#8E8071] dark:text-[#AFA292] block mb-1">
              Outros Métodos
            </span>
            <p className="text-xl font-extrabold text-[#2C241E] dark:text-[#F3EDE6] font-mono">
              {formatBRL(currentCashSession.totalOther)}
            </p>
            <span className="text-[10px] text-[#7E7062] dark:text-[#B5A796]">Transf. ou boletos</span>
          </div>

          <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-[#171412] dark:bg-[#0D0B0A] border border-[#C99F3B]/40 text-[#F3EDE6] shadow-2xs">
            <span className="text-[11px] font-semibold text-[#B5A796] block mb-1">
              Total Geral Movimentado
            </span>
            <p className="text-xl font-extrabold text-[#E6BE65] font-mono">
              {formatBRL(currentCashSession.grandTotal)}
            </p>
            <span className="text-[10px] text-[#B5A796]">
              Aberto às {formatDateTime(currentCashSession.openedAt)}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl border border-dashed border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1F1A17] text-center space-y-3">
          <Lock className="w-10 h-10 text-[#C99F3B] mx-auto opacity-70" strokeWidth={1.5} />
          <h3 className="text-sm font-bold text-[#2C241E] dark:text-[#F3EDE6]">
            Nenhum caixa aberto no momento
          </h3>
          <p className="text-xs text-[#7E7062] dark:text-[#B5A796] max-w-sm mx-auto">
            Abra o caixa informando o valor inicial (fundo de troco) para registrar vendas em dinheiro e movimentações.
          </p>
          <button
            onClick={() => setShowOpenModal(true)}
            className="btn-gold !py-2.5 !px-5 !text-xs cursor-pointer shadow-xs"
          >
            Abrir Caixa Agora
          </button>
        </div>
      )}

      {/* Movements of Current Session */}
      {currentCashSession && (
        <div className="bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] rounded-2xl overflow-hidden shadow-2xs space-y-2">
          <div className="p-4 border-b border-[#E8DFC8] dark:border-[#3A302A] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#2C241E] dark:text-[#F3EDE6] uppercase tracking-wider">
              Movimentações do Caixa Atual
            </h3>
            <span className="text-xs text-[#8E8071] dark:text-[#AFA292] font-mono">
              {activeSessionMovements.length} lançamentos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F5EFEB] dark:bg-[#28211C] text-[#7E7062] dark:text-[#B5A796] uppercase text-[10px]">
                <tr>
                  <th className="p-3">Horário</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Descrição / Motivo</th>
                  <th className="p-3 text-right">Valor</th>
                  <th className="p-3">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A]">
                {activeSessionMovements.map((m) => {
                  const isPositive = m.type === 'suprimento' || m.type === 'venda';
                  return (
                    <tr key={m.id} className="hover:bg-[#F5EFEB]/50 dark:hover:bg-[#251E19]/50 transition-colors">
                      <td className="p-3 font-mono text-[#8E8071] dark:text-[#AFA292] whitespace-nowrap">
                        {formatDateTime(m.date)}
                      </td>
                      <td className="p-3 uppercase text-[10px] font-bold">
                        <span className="badge-silver">
                          {m.type}
                        </span>
                      </td>
                      <td className="p-3 text-[#2C241E] dark:text-[#F3EDE6] font-medium">
                        {m.reason}
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        <span className={isPositive ? 'text-[#9D7320] dark:text-[#E6BE65]' : 'text-rose-600'}>
                          {isPositive ? `+${formatBRL(m.amount)}` : `-${formatBRL(m.amount)}`}
                        </span>
                      </td>
                      <td className="p-3 text-[#7E7062] dark:text-[#B5A796]">{m.userName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History of Past Sessions */}
      <div className="bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] rounded-2xl overflow-hidden shadow-2xs space-y-2">
        <div className="p-4 border-b border-[#E8DFC8] dark:border-[#3A302A]">
          <h3 className="text-xs font-bold text-[#2C241E] dark:text-[#F3EDE6] uppercase tracking-wider">
            Histórico de Fechamentos Anteriores
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F5EFEB] dark:bg-[#28211C] text-[#7E7062] dark:text-[#B5A796] uppercase text-[10px]">
              <tr>
                <th className="p-3">Abertura</th>
                <th className="p-3">Fechamento</th>
                <th className="p-3 text-right">Esperado</th>
                <th className="p-3 text-right">Contado</th>
                <th className="p-3 text-right">Diferença</th>
                <th className="p-3 text-right">Total Geral</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DFC8]/60 dark:divide-[#3A302A]">
              {cashSessions
                .filter((s) => s.status === 'closed')
                .map((session) => (
                  <tr key={session.id} className="hover:bg-[#F5EFEB]/50 dark:hover:bg-[#251E19]/50 transition-colors">
                    <td className="p-3 font-mono text-[#8E8071] dark:text-[#AFA292] whitespace-nowrap">
                      {formatDateTime(session.openedAt)}
                    </td>
                    <td className="p-3 font-mono text-[#8E8071] dark:text-[#AFA292] whitespace-nowrap">
                      {session.closedAt ? formatDateTime(session.closedAt) : '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-[#7E7062] dark:text-[#B5A796]">
                      {formatBRL(session.expectedCash || 0)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-[#2C241E] dark:text-[#F3EDE6]">
                      {formatBRL(session.countedCash || 0)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      {session.difference && session.difference !== 0 ? (
                        <span className={session.difference > 0 ? 'text-[#9D7320] dark:text-[#E6BE65]' : 'text-rose-600'}>
                          {session.difference > 0 ? `+${formatBRL(session.difference)}` : formatBRL(session.difference)}
                        </span>
                      ) : (
                        <span className="text-[#8E8071]">R$ 0,00</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-extrabold text-[#9D7320] dark:text-[#E6BE65]">
                      {formatBRL(session.grandTotal)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="badge-silver">
                        Fechado
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Abertura de Caixa */}
      <Modal isOpen={showOpenModal} onClose={() => setShowOpenModal(false)} title="Abertura de Caixa" maxWidth="sm">
        <form onSubmit={handleOpenSubmit} className="space-y-4 text-xs">
          <p className="text-[#7E7062] dark:text-[#B5A796]">
            Informe o fundo de troco inicial colocado na gaveta de dinheiro para iniciar o expediente.
          </p>
          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Valor do Fundo de Troco (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={initialFloat}
              onChange={(e) => setInitialFloat(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] font-mono font-bold text-base focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E8DFC8] dark:border-[#3A302A]">
            <button
              type="button"
              onClick={() => setShowOpenModal(false)}
              className="btn-silver !py-2 !px-4 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-gold !py-2 !px-5 cursor-pointer shadow-xs"
            >
              Confirmar Abertura
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Fechamento de Caixa */}
      <Modal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} title="Fechamento de Caixa" maxWidth="md">
        <form onSubmit={handleCloseSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-[#F5EFEB] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] space-y-1.5 text-[#2C241E] dark:text-[#F3EDE6]">
            <div className="flex justify-between">
              <span className="text-[#7E7062] dark:text-[#B5A796]">Dinheiro Calculado pelo Sistema:</span>
              <strong className="font-mono text-[#9D7320] dark:text-[#E6BE65]">
                {formatBRL(currentCashSession?.totalCash)}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7E7062] dark:text-[#B5A796]">Total em PIX:</span>
              <strong className="font-mono">{formatBRL(currentCashSession?.totalPix)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7E7062] dark:text-[#B5A796]">Total em Cartão:</span>
              <strong className="font-mono">{formatBRL(currentCashSession?.totalCard)}</strong>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">
              Dinheiro Físico Contado na Gaveta (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={countedCash}
              onChange={(e) => setCountedCash(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] font-mono font-bold text-base focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              required
            />
          </div>

          {currentCashSession && (
            <div className="p-3 rounded-2xl bg-[#F5EFEB] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] flex justify-between items-center font-bold">
              <span className="text-[#2C241E] dark:text-[#F3EDE6]">Divergência / Diferença:</span>
              <span
                className={`font-mono text-sm ${
                  countedCash - currentCashSession.totalCash === 0
                    ? 'text-[#9D7320] dark:text-[#E6BE65]'
                    : countedCash - currentCashSession.totalCash > 0
                    ? 'text-[#9D7320] dark:text-[#E6BE65]'
                    : 'text-rose-600'
                }`}
              >
                {formatBRL(countedCash - currentCashSession.totalCash)}
              </span>
            </div>
          )}

          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Observações do Fechamento</label>
            <textarea
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              placeholder="Ex: Faltou troco de R$ 0,50, valor entregue ao proprietário..."
              rows={2}
              className="w-full px-3 py-1.5 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E8DFC8] dark:border-[#3A302A]">
            <button
              type="button"
              onClick={() => setShowCloseModal(false)}
              className="btn-silver !py-2 !px-4 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-danger !py-2 !px-5 cursor-pointer shadow-xs"
            >
              Finalizar Fechamento
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Sangria / Suprimento */}
      <Modal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        title={moveType === 'sangria' ? 'Sangria (Retirada de Dinheiro)' : 'Suprimento (Entrada de Dinheiro)'}
        maxWidth="sm"
      >
        <form onSubmit={handleMovementSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Valor (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={moveAmount || ''}
              onChange={(e) => setMoveAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Motivo / Destino *</label>
            <input
              type="text"
              value={moveReason}
              onChange={(e) => setMoveReason(e.target.value)}
              placeholder={moveType === 'sangria' ? 'Ex: Pagamento Motoboy, Depósito...' : 'Ex: Troco adicional'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E8DFC8] dark:border-[#3A302A]">
            <button
              type="button"
              onClick={() => setShowMoveModal(false)}
              className="btn-silver !py-2 !px-4 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-gold !py-2 !px-5 cursor-pointer shadow-xs"
            >
              Registrar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
