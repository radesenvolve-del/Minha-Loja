import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-[#9D7320] dark:text-[#E6BE65] shrink-0" strokeWidth={1.75} />,
          error: <XCircle className="w-5 h-5 text-rose-500 shrink-0" strokeWidth={1.75} />,
          warning: <AlertTriangle className="w-5 h-5 text-[#9D7320] dark:text-[#E6BE65] shrink-0" strokeWidth={1.75} />,
          info: <Info className="w-5 h-5 text-[#556070] dark:text-[#CBD5E1] shrink-0" strokeWidth={1.75} />,
        };

        const borders = {
          success: 'border-[#C99F3B]/50 bg-[#FFFDF9]/95 dark:bg-[#1F1A17]/95 text-[#2C241E] dark:text-[#F3EDE6]',
          error: 'border-rose-500/40 bg-[#FFFDF9]/95 dark:bg-[#1F1A17]/95 text-rose-700 dark:text-rose-300',
          warning: 'border-[#C99F3B]/40 bg-[#FFFDF9]/95 dark:bg-[#1F1A17]/95 text-[#2C241E] dark:text-[#F3EDE6]',
          info: 'border-[#CBD5E1]/60 dark:border-[#475569]/60 bg-[#FFFDF9]/95 dark:bg-[#1F1A17]/95 text-[#2C241E] dark:text-[#F3EDE6]',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-200 ${borders[toast.type]}`}
          >
            <div className="flex items-center gap-2.5">
              {icons[toast.type]}
              <p className="text-xs sm:text-sm font-semibold leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity text-[#8E8071] cursor-pointer"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
