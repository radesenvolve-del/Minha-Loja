import React from 'react';
import { AlertTriangle, Info, Check } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  inputReason?: boolean;
  reasonPlaceholder?: string;
  reasonValue?: string;
  onReasonChange?: (val: string) => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  inputReason = false,
  reasonPlaceholder = 'Informe o motivo...',
  reasonValue = '',
  onReasonChange,
}) => {
  const icon = {
    danger: <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" strokeWidth={1.75} />,
    warning: <AlertTriangle className="w-6 h-6 text-[#9D7320] dark:text-[#E6BE65]" strokeWidth={1.75} />,
    primary: <Info className="w-6 h-6 text-[#9D7320] dark:text-[#E6BE65]" strokeWidth={1.75} />,
  }[variant];

  const buttonStyle = {
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs',
    warning: 'btn-gold shadow-xs',
    primary: 'btn-gold shadow-xs',
  }[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#F5EFEB] dark:bg-[#201B17] border border-[#E8DFC8] dark:border-[#3A302A] shrink-0">
            {icon}
          </div>
          <p className="text-sm text-[#2C241E] dark:text-[#F3EDE6] leading-relaxed pt-1">
            {description}
          </p>
        </div>

        {inputReason && (
          <div className="mt-1">
            <label className="block text-xs font-semibold text-[#2C241E] dark:text-[#F3EDE6] mb-1.5">
              Motivo obrigatório:
            </label>
            <textarea
              value={reasonValue}
              onChange={(e) => onReasonChange?.(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#8E8071] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              required
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[#E8DFC8] dark:border-[#3A302A]">
          <button
            type="button"
            onClick={onClose}
            className="btn-silver !py-2 !px-4 !text-xs cursor-pointer shadow-2xs"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={inputReason && !reasonValue.trim()}
            className={`px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonStyle}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
