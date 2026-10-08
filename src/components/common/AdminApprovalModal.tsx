import React, { useState } from 'react';
import { ShieldAlert, Check, X, Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppUser } from '../../types';

interface AdminApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApproved: (approver: AppUser) => void;
  title?: string;
  description?: string;
  requiredRole?: 'admin' | 'gerente';
}

export const AdminApprovalModal: React.FC<AdminApprovalModalProps> = ({
  isOpen,
  onClose,
  onApproved,
  title = 'Autorização Administrativa Necessária',
  description = 'Esta operação requer o PIN de um Administrador ou Gerente para ser concluída.',
}) => {
  const { users, showToast } = useApp();
  const [pin, setPin] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Eligible approvers (admins or gerentes)
  const eligibleAdmins = users.filter(
    (u) => u.active !== false && (u.role === 'admin' || u.role === 'gerente')
  );

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const cleanPin = pin.trim();
    if (!cleanPin) {
      setError('Digite o PIN de autorização.');
      return;
    }

    // Check against selected admin or any eligible admin
    let matchingApprover: AppUser | undefined;
    if (selectedAdminId) {
      const target = eligibleAdmins.find((u) => u.id === selectedAdminId);
      if (target && target.pin === cleanPin) {
        matchingApprover = target;
      }
    } else {
      matchingApprover = eligibleAdmins.find((u) => u.pin === cleanPin);
    }

    if (matchingApprover) {
      showToast(`Operação autorizada por ${matchingApprover.name}!`, 'success');
      setPin('');
      setError('');
      onApproved(matchingApprover);
      onClose();
    } else {
      setError('PIN incorreto ou usuário não possui permissão de gerência.');
    }
  };

  const handleKeyClick = (digit: string) => {
    setError('');
    if (pin.length < 8) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setError('');
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError('');
    setPin('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-[#C99F3B] flex items-center justify-center shrink-0 border border-[#C99F3B]/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6]">
                {title}
              </h3>
              <p className="text-[11px] text-[#7E7062] dark:text-[#B5A796] mt-0.5 line-clamp-2">
                {description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-3.5">
          {eligibleAdmins.length > 1 && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#7E7062] dark:text-[#B5A796] mb-1">
                Autorizador (Opcional)
              </label>
              <select
                value={selectedAdminId}
                onChange={(e) => setSelectedAdminId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-white dark:bg-[#25201C] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-2 focus:ring-[#C99F3B]"
              >
                <option value="">Qualquer Administrador / Gerente</option>
                {eligibleAdmins.map((adm) => (
                  <option key={adm.id} value={adm.id}>
                    {adm.name} ({adm.role === 'admin' ? 'Administrador' : 'Gerente'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Masked PIN Display */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#7E7062] dark:text-[#B5A796] mb-1">
              PIN de Autorização *
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setError('');
                  setPin(e.target.value);
                }}
                placeholder="••••"
                autoFocus
                className="w-full text-center tracking-[0.4em] font-mono text-xl py-2.5 px-3 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-white dark:bg-[#25201C] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-2 focus:ring-[#C99F3B]"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-[11px] font-semibold text-rose-500 mt-1 text-center">
                {error}
              </p>
            )}
          </div>

          {/* Touch-Friendly Numeric Keypad for Mobile / POS */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleKeyClick(n)}
                className="py-2.5 text-sm font-extrabold rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 hover:bg-[#C99F3B]/20 active:scale-95 transition-all"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-2.5 text-[11px] font-bold rounded-xl bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('0')}
              className="py-2.5 text-sm font-extrabold rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 hover:bg-[#C99F3B]/20 active:scale-95 transition-all"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-2.5 text-[11px] font-bold rounded-xl bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
            >
              ⌫
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#E8DFC8]/60 dark:border-[#3A302A]/60">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-neutral !py-2.5 !text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!pin}
              className="flex-1 btn-gold !py-2.5 !text-xs disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Autorizar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
