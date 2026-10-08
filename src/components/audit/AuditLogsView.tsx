import React, { useState, useMemo } from 'react';
import {
  Shield,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  ArrowUpDown,
  FileText,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTime } from '../../utils/formatters';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useApp();
  const [search, setSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  const entities = useMemo(() => {
    const set = new Set(auditLogs.map((l) => l.entity).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [auditLogs]);

  const userNames = useMemo(() => {
    const set = new Set(auditLogs.map((l) => l.userName).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((l) => {
      const matchSearch =
        !search ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.details.toLowerCase().includes(search.toLowerCase()) ||
        l.userName.toLowerCase().includes(search.toLowerCase());
      const matchEntity = selectedEntity === 'all' || l.entity === selectedEntity;
      const matchUser = selectedUser === 'all' || l.userName === selectedUser;
      return matchSearch && matchEntity && matchUser;
    });
  }, [auditLogs, search, selectedEntity, selectedUser]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
          <span>Auditoria & Histórico de Alterações</span>
          <span className="badge-silver">{filteredLogs.length} registros</span>
        </h2>
        <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
          Rastreabilidade completa de todas as operações administrativas: cancelamentos, alterações de preços, movimentações de estoque e acessos.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 p-3 rounded-2xl bg-white dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Pesquisar por ação, detalhes ou operador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-zinc-50 dark:bg-[#171412] text-xs"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-zinc-50 dark:bg-[#171412] text-xs font-semibold"
          >
            <option value="all">Todos os Módulos</option>
            {entities.filter((e) => e !== 'all').map((ent) => (
              <option key={ent} value={ent}>{ent}</option>
            ))}
          </select>

          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-zinc-50 dark:bg-[#171412] text-xs font-semibold"
          >
            <option value="all">Todos os Operadores</option>
            {userNames.filter((u) => u !== 'all').map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Log Entries List */}
      <div className="rounded-2xl border border-[#E8DFC8] dark:border-[#3A302A] bg-white dark:bg-[#1E1916] divide-y divide-[#E8DFC8]/50 dark:divide-[#3A302A]/50 overflow-hidden shadow-xs">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            Nenhum registro de auditoria encontrado com os filtros aplicados.
          </div>
        ) : (
          filteredLogs.slice(0, 100).map((log) => {
            const isCritical =
              log.action.toLowerCase().includes('cancel') ||
              log.action.toLowerCase().includes('exclu') ||
              log.action.toLowerCase().includes('sangria') ||
              log.action.toLowerCase().includes('perda');

            return (
              <div key={log.id} className="p-3.5 hover:bg-zinc-50 dark:hover:bg-[#25201C] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isCritical
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-900'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-[10px] font-bold text-[#A67C1E] dark:text-[#E6BE65]">
                      [{log.entity}]
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                    {log.details}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between text-[11px] text-zinc-500 shrink-0">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-[#C99F3B]" />
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">{log.userName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatDateTime(log.date)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
