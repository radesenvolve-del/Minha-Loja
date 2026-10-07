import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { JewelryCategoryGraphic } from './JewelryCategoryGraphic';

interface CircularCategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts?: Record<string, number>;
  customCategories?: string[];
  className?: string;
  showAllOption?: boolean;
}

export const CORE_JEWELRY_CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'TODOS' },
  { id: 'Anéis', label: 'ANÉIS' },
  { id: 'Colares', label: 'COLARES' },
  { id: 'Brincos', label: 'BRINCOS' },
  { id: 'Pulseiras', label: 'PULSEIRAS' },
  { id: 'Conjuntos', label: 'CONJUNTOS' },
  { id: 'Acessórios', label: 'ACESSÓRIOS' },
];

export const getCategoryEmoji = (categoryName: string): string => {
  const norm = categoryName.trim().toLowerCase();
  if (norm === 'all' || norm === 'todos') return '✨';
  if (norm.includes('anel') || norm.includes('anéis') || norm.includes('aneis')) return '💍';
  if (norm.includes('colar') || norm.includes('gargantilha') || norm.includes('choker')) return '📿';
  if (norm.includes('brinco') || norm.includes('argola')) return '💎';
  if (norm.includes('pulseira') || norm.includes('bracelete')) return '✨';
  if (norm.includes('conjunto') || norm.includes('kit')) return '👑';
  if (norm.includes('relogio') || norm.includes('relógio')) return '⌚';
  if (norm.includes('acess')) return '👜';
  if (norm.includes('vestid')) return '👗';
  if (norm.includes('blus') || norm.includes('camis')) return '👚';
  if (norm.includes('calc') || norm.includes('calç') || norm.includes('jeans')) return '👖';
  return '🏷️';
};

export const CircularCategoryBar: React.FC<CircularCategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts = {},
  customCategories = [],
  className = '',
  showAllOption = true,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Core items matching the user's reference image
  const categoryList: { id: string; label: string }[] = [];

  if (showAllOption) {
    categoryList.push({ id: 'all', label: 'TODOS' });
  }

  categoryList.push(
    { id: 'Anéis', label: 'ANÉIS' },
    { id: 'Colares', label: 'COLARES' },
    { id: 'Brincos', label: 'BRINCOS' },
    { id: 'Pulseiras', label: 'PULSEIRAS' },
    { id: 'Conjuntos', label: 'CONJUNTOS' },
    { id: 'Acessórios', label: 'ACESSÓRIOS' }
  );

  // 2. Append any extra categories from user's custom products not in core
  const coreIds = new Set(['all', 'todos', 'anéis', 'colares', 'brincos', 'pulseiras', 'conjuntos', 'acessórios']);
  customCategories.forEach((cat) => {
    if (cat && !coreIds.has(cat.trim().toLowerCase())) {
      categoryList.push({
        id: cat,
        label: cat.toUpperCase(),
      });
    }
  });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className={`relative group/bar ${className}`}>
      {/* Scroll Left Button */}
      <button
        onClick={() => scroll('left')}
        className="hidden md:flex absolute -left-2 top-10 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 dark:bg-zinc-800/95 border border-amber-300 dark:border-amber-700/60 shadow-md items-center justify-center text-amber-900 dark:text-amber-200 hover:scale-105 transition-all opacity-0 group-hover/bar:opacity-100 cursor-pointer"
        aria-label="Rolar categorias para esquerda"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollContainerRef}
        className="flex items-start gap-3 sm:gap-7 overflow-x-auto py-1 sm:py-2 px-1 no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categoryList.map((cat) => {
          const isSelected =
            (cat.id === 'all' && (selectedCategory === 'all' || !selectedCategory)) ||
            selectedCategory.toLowerCase() === cat.id.toLowerCase();

          // Calculate counts
          let count = 0;
          if (cat.id === 'all') {
            count = Object.values(categoryCounts).reduce((acc, c) => acc + c, 0);
          } else {
            // Find count matching this category
            const matchKey = Object.keys(categoryCounts).find(
              (k) => k.toLowerCase() === cat.id.toLowerCase()
            );
            count = matchKey ? categoryCounts[matchKey] : 0;
          }

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id === 'all' ? 'all' : cat.id)}
              className="flex flex-col items-center gap-1.5 sm:gap-2 shrink-0 group/item focus:outline-hidden transition-all active:scale-95 cursor-pointer"
            >
              {/* Luxury Circular Graphic (Responsive size for mobile vs desktop) */}
              <div className="relative">
                <JewelryCategoryGraphic
                  category={cat.id}
                  size={isMobile ? 54 : 76}
                  isSelected={isSelected}
                />

                {/* Counter Badge if > 0 */}
                {count > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 min-w-[18px] sm:min-w-[20px] h-4.5 sm:h-5 px-1 sm:px-1.5 rounded-full text-[9px] sm:text-[10px] font-mono font-extrabold flex items-center justify-center shadow-md transition-colors ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#D8B059] to-[#AF8323] text-[#1A1306] ring-2 ring-[#FFFDF9] dark:ring-[#1F1A17] font-black'
                        : 'bg-[#F5EFEB] dark:bg-[#201B17] text-[#9D7320] dark:text-[#E6BE65] border border-[#E8DFC8] dark:border-[#3A302A]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </div>

              {/* Luxury Serif Category Label */}
              <div className="flex flex-col items-center">
                <span
                  className={`text-[10px] sm:text-xs font-serif tracking-[0.1em] sm:tracking-[0.14em] uppercase transition-all text-center max-w-[72px] sm:max-w-[96px] truncate ${
                    isSelected
                      ? 'text-[#9D7320] dark:text-[#E6BE65] font-black scale-105 border-b-2 border-[#C99F3B] pb-0.5'
                      : 'text-[#7E7062] dark:text-[#B5A796] font-bold group-hover/item:text-[#9D7320] dark:group-hover/item:text-[#F3EDE6]'
                  }`}
                >
                  {cat.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute -right-2 top-10 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#FFFDF9]/95 dark:bg-[#1F1A17]/95 border border-[#E8DFC8] dark:border-[#3A302A] shadow-md items-center justify-center text-[#9D7320] dark:text-[#E6BE65] hover:scale-105 transition-all opacity-0 group-hover/bar:opacity-100 cursor-pointer"
        aria-label="Rolar categorias para direita"
      >
        <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
      </button>
      {/* Active Filter Feedback & Reset */}
      {selectedCategory && selectedCategory !== 'all' && (
        <div className="flex items-center justify-between gap-2 mt-2 px-3 py-1.5 rounded-xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#C99F3B]/40 text-xs shadow-2xs">
          <div className="flex items-center gap-2 text-[#2C241E] dark:text-[#F3EDE6]">
            <span className="w-2 h-2 rounded-full bg-[#C99F3B] animate-pulse" />
            <span>
              Filtrando categoria: <strong className="uppercase font-serif font-black tracking-wider text-[#9D7320] dark:text-[#E6BE65]">{selectedCategory}</strong>
            </span>
          </div>
          <button
            onClick={() => onSelectCategory('all')}
            className="text-[11px] font-bold text-[#9D7320] dark:text-[#E6BE65] hover:underline cursor-pointer"
          >
            Limpar filtro (Ver Todos)
          </button>
        </div>
      )}
    </div>
  );
};
