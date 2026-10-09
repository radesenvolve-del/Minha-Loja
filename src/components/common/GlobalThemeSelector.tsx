import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface GlobalThemeSelectorProps {
  variant?: 'icon' | 'compact' | 'segmented' | 'cards';
  showLabels?: boolean;
  className?: string;
}

export const GlobalThemeSelector: React.FC<GlobalThemeSelectorProps> = ({
  variant = 'icon',
  className = '',
}) => {
  const { settings, updateSettings, showToast } = useApp();
  const currentTheme = settings.theme === 'dark' ? 'dark' : 'light';

  const handleSelectTheme = async (theme: 'light' | 'dark') => {
    if (settings.theme === theme) return;
    await updateSettings({ theme });
    showToast(
      theme === 'dark'
        ? 'Atelier Noturno ativado 🌙'
        : 'Atelier Claro ativado ☀️',
      'info'
    );
  };

  const handleToggle = () => {
    handleSelectTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  // Segmented Variant: Apenas os botões com os ícones (sem texto)
  if (variant === 'segmented') {
    return (
      <div
        role="radiogroup"
        aria-label="Alternar tema da loja (Claro ou Escuro)"
        className={`inline-flex items-center p-1 rounded-xl bg-[#F0EAE4]/90 dark:bg-[#1E1916]/90 border border-[#E0D5BE] dark:border-[#382F28] shadow-2xs backdrop-blur-xs relative ${className}`}
      >
        {/* Botão Tema Claro - Apenas Ícone */}
        <button
          type="button"
          role="radio"
          aria-checked={currentTheme === 'light'}
          onClick={() => handleSelectTheme('light')}
          className={`relative z-10 w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer select-none ${
            currentTheme === 'light'
              ? 'text-[#C99F3B]'
              : 'text-[#8E8071] dark:text-[#AFA292] hover:text-[#2C241E] dark:hover:text-[#F3EDE6]'
          }`}
          title="Atelier Claro (Tema Claro)"
          aria-label="Ativar tema claro"
        >
          <Sun
            className={`w-4 h-4 transition-transform duration-200 ${
              currentTheme === 'light' ? 'scale-110 text-[#C99F3B]' : ''
            }`}
            strokeWidth={1.85}
          />
        </button>

        {/* Botão Tema Escuro - Apenas Ícone */}
        <button
          type="button"
          role="radio"
          aria-checked={currentTheme === 'dark'}
          onClick={() => handleSelectTheme('dark')}
          className={`relative z-10 w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer select-none ${
            currentTheme === 'dark'
              ? 'text-[#E6BE65]'
              : 'text-[#8E8071] dark:text-[#AFA292] hover:text-[#2C241E] dark:hover:text-[#F3EDE6]'
          }`}
          title="Atelier Noturno (Tema Escuro)"
          aria-label="Ativar tema escuro"
        >
          <Moon
            className={`w-4 h-4 transition-transform duration-200 ${
              currentTheme === 'dark' ? 'scale-110 text-[#E6BE65]' : ''
            }`}
            strokeWidth={1.85}
          />
        </button>

        {/* Floating Active Highlight */}
        <motion.div
          layoutId="activeThemeHighlight"
          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
          className={`absolute top-1 bottom-1 rounded-lg border shadow-xs pointer-events-none ${
            currentTheme === 'light'
              ? 'left-1 w-9 bg-[#FFFDF9] border-[#C99F3B]/50'
              : 'left-[44px] w-9 bg-[#2B241F] border-[#E6BE65]/50'
          }`}
        />
      </div>
    );
  }

  // Cards Variant (Settings Page) - Visual minimalista destacando os botões com ícone
  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-2 gap-3 max-w-xs ${className}`}>
        {/* Botão Tema Claro com Ícone */}
        <button
          type="button"
          onClick={() => handleSelectTheme('light')}
          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
            currentTheme === 'light'
              ? 'bg-[#FFFDF9] border-[#C99F3B] ring-2 ring-[#C99F3B]/30 shadow-xs text-[#9D7320]'
              : 'bg-[#FBF9F5] dark:bg-[#1E1916] border-[#E8DFC8] dark:border-[#382F28] text-[#8E8071] hover:text-[#2C241E]'
          }`}
          title="Atelier Claro"
          aria-label="Ativar tema claro"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-[#C99F3B]/40 flex items-center justify-center">
            <Sun className="w-5 h-5 text-[#C99F3B]" strokeWidth={2} />
          </div>
          <span className="text-[11px] font-bold">Claro</span>
        </button>

        {/* Botão Tema Escuro com Ícone */}
        <button
          type="button"
          onClick={() => handleSelectTheme('dark')}
          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
            currentTheme === 'dark'
              ? 'bg-[#1F1A17] border-[#E6BE65] ring-2 ring-[#E6BE65]/30 shadow-xs text-[#E6BE65]'
              : 'bg-[#FBF9F5] dark:bg-[#1E1916] border-[#E8DFC8] dark:border-[#382F28] text-[#8E8071] hover:text-[#F3EDE6]'
          }`}
          title="Atelier Noturno"
          aria-label="Ativar tema escuro"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-[#E6BE65]/40 flex items-center justify-center">
            <Moon className="w-5 h-5 text-[#E6BE65]" strokeWidth={2} />
          </div>
          <span className="text-[11px] font-bold">Escuro</span>
        </button>
      </div>
    );
  }

  // Default / Icon / Compact Variant: Apenas o botão com o ícone
  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`btn-silver !p-2.5 min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl shadow-2xs cursor-pointer group transition-all ${className}`}
      title={
        currentTheme === 'dark'
          ? 'Tema Noturno ativo — Clique para mudar para Tema Claro'
          : 'Tema Claro ativo — Clique para mudar para Tema Noturno'
      }
      aria-label="Alternar tema entre claro e escuro"
    >
      <motion.div
        key={currentTheme}
        initial={{ rotate: -30, scale: 0.85, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center text-[#C99F3B] dark:text-[#E6BE65] group-hover:scale-110 transition-transform"
      >
        {currentTheme === 'dark' ? (
          <Moon className="w-4 h-4" strokeWidth={1.85} />
        ) : (
          <Sun className="w-4 h-4" strokeWidth={1.85} />
        )}
      </motion.div>
    </button>
  );
};
