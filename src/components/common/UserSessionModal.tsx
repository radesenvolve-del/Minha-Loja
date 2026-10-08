import React, { useState } from 'react';
import { UserCheck, Lock, LogOut, Check, X, Shield, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppUser } from '../../types';

interface UserSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLockScreen?: boolean;
}

export const UserSessionModal: React.FC<UserSessionModalProps> = ({
  isOpen,
  onClose,
  isLockScreen = false,
}) => {
  const { currentUser, setCurrentUser, users, showToast } = useApp();
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  const targetUser = users.find((u) => u.id === selectedUserId) || currentUser;

  const handleSwitchUser = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    // If target user has a PIN configured, verify it
    if (targetUser.pin && targetUser.pin.trim()) {
      if (pin.trim() !== targetUser.pin.trim()) {
        setError('PIN incorreto para este operador.');
        return;
      }
    }

    setCurrentUser(targetUser);
    showToast(`Sessão iniciada como "${targetUser.name}" (${targetUser.role.toUpperCase()})`, 'success');
    setPin('');
    setError('');
    onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFC8] dark:border-[#3A302A] p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-[#C99F3B] flex items-center justify-center shrink-0 border border-[#C99F3B]/30">
              {isLockScreen ? <Lock className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6]">
                {isLockScreen ? 'Terminal Bloqueado' : 'Trocar Operador / Sessão'}
              </h3>
              <p className="text-[11px] text-[#7E7062] dark:text-[#B5A796] mt-0.5">
                {isLockScreen
                  ? 'Digite o PIN para desbloquear o sistema.'
                  : 'Selecione o operador e confirme o PIN.'}
              </p>
            </div>
          </div>
          {!isLockScreen && (
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User Selection */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#7E7062] dark:text-[#B5A796]">
            Operador do Sistema
          </label>
          <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto">
            {users
              .filter((u) => u.active !== false)
              .map((u) => {
                const isSelected = u.id === selectedUserId;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setPin('');
                      setError('');
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#C99F3B] bg-[#FDF4DC]/50 dark:bg-[#C99F3B]/10 text-[#2C241E] dark:text-[#F3EDE6] ring-1 ring-[#C99F3B]'
                        : 'border-[#E8DFC8] dark:border-[#3A302A] bg-white dark:bg-[#25201C] text-zinc-600 dark:text-zinc-400 hover:border-[#C99F3B]/50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold leading-tight flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {u.id === currentUser.id && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-extrabold uppercase">
                            Atual
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {u.role === 'admin'
                          ? 'Administrador Total'
                          : u.role === 'gerente'
                          ? 'Gerente'
                          : 'Vendedor / Operador'}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#C99F3B]" />}
                  </button>
                );
              })}
          </div>
        </div>

        {/* PIN Entry */}
        <form onSubmit={handleSwitchUser} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#7E7062] dark:text-[#B5A796] mb-1">
              PIN do Operador {targetUser.pin ? '*' : '(Opcional)'}
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
                className="w-full text-center tracking-[0.4em] font-mono text-xl py-2 px-3 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-white dark:bg-[#25201C] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-2 focus:ring-[#C99F3B]"
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

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleKeyClick(n)}
                className="py-2 text-sm font-extrabold rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 hover:bg-[#C99F3B]/20 active:scale-95 transition-all"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-2 text-[10px] font-bold rounded-xl bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('0')}
              className="py-2 text-sm font-extrabold rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 hover:bg-[#C99F3B]/20 active:scale-95 transition-all"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-2 text-[10px] font-bold rounded-xl bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
            >
              ⌫
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#E8DFC8]/60 dark:border-[#3A302A]/60">
            {!isLockScreen && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-neutral !py-2.5 !text-xs"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="flex-1 btn-gold !py-2.5 !text-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isLockScreen ? 'Desbloquear' : 'Entrar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
