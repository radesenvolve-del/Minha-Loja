import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-5xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pt-[max(1.25rem,env(safe-area-inset-top,0px))] pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] p-3.5 sm:p-5 overflow-y-auto bg-black/65 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full ${maxWidthClass} my-auto rounded-3xl bg-[#FDFBF7] dark:bg-[#1C1713] border border-[#E6DDCE] dark:border-[#382E25] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10`}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E6DDCE] dark:border-[#382E25] bg-[#F8F3EA] dark:bg-[#231D18] shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#2C241E] dark:text-[#F3EDE6] leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl text-[#7E7062] hover:text-[#2C241E] dark:text-[#AFA292] dark:hover:text-[#F3EDE6] hover:bg-[#EAE2D5] dark:hover:bg-[#302720] transition-colors min-w-[42px] min-h-[42px] flex items-center justify-center cursor-pointer"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};
