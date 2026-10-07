import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface SwipeAction {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  onClick: (e: React.MouseEvent) => void;
  className?: string; // e.g. "bg-rose-600 text-white"
  variant?: 'danger' | 'primary' | 'success' | 'neutral';
}

interface SwipeableRowProps {
  children: ReactNode;
  rightActions?: SwipeAction[]; // Revealed on swipe left (e.g. Edit, Delete)
  leftActions?: SwipeAction[]; // Revealed on swipe right (e.g. WhatsApp, Action)
  className?: string;
  disabled?: boolean;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  rightActions = [],
  leftActions = [],
  className = '',
  disabled = false,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isOpenSide, setIsOpenSide] = useState<'left' | 'right' | null>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const isHorizontalScrollRef = useRef<boolean | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const rightWidth = rightActions.length * 70; // 70px per action
  const leftWidth = leftActions.length * 70;

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    isDraggingRef.current = true;
    startXRef.current = clientX;
    startYRef.current = clientY;
    currentXRef.current = clientX;
    isHorizontalScrollRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current || disabled) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const diffX = clientX - startXRef.current;
    const diffY = clientY - startYRef.current;

    // Determine direction on first significant movement
    if (isHorizontalScrollRef.current === null) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        isHorizontalScrollRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    // If it's a vertical scroll, do not prevent default or swipe
    if (isHorizontalScrollRef.current === false) {
      return;
    }

    currentXRef.current = clientX;
    let baseOffset = 0;
    if (isOpenSide === 'right') baseOffset = -rightWidth;
    if (isOpenSide === 'left') baseOffset = leftWidth;

    let target = baseOffset + diffX;

    // Limit boundaries with resistance
    if (target < -rightWidth) {
      const over = -target - rightWidth;
      target = -rightWidth - over * 0.2;
    } else if (target > leftWidth) {
      const over = target - leftWidth;
      target = leftWidth + over * 0.2;
    }

    // If no actions in that direction, clamp to 0
    if (rightActions.length === 0 && target < 0) target = 0;
    if (leftActions.length === 0 && target > 0) target = 0;

    setOffsetX(target);
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current || disabled) return;
    isDraggingRef.current = false;

    const threshold = 40;

    if (offsetX < -threshold && rightActions.length > 0) {
      setOffsetX(-rightWidth);
      setIsOpenSide('right');
    } else if (offsetX > threshold && leftActions.length > 0) {
      setOffsetX(leftWidth);
      setIsOpenSide('left');
    } else {
      setOffsetX(0);
      setIsOpenSide(null);
    }
  };

  const closeSwipe = () => {
    setOffsetX(0);
    setIsOpenSide(null);
  };

  const getVariantStyles = (variant?: SwipeAction['variant']) => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white';
      case 'success':
        return 'bg-[#9D7320] hover:bg-[#8C6418] text-white';
      case 'neutral':
        return 'bg-[#556070] hover:bg-[#434D5B] text-white';
      case 'primary':
      default:
        return 'bg-gradient-to-b from-[#FDF4DC] via-[#D8B059] to-[#AF8323] text-[#1A1306] font-extrabold shadow-sm';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl select-none group/swipe ${className}`}
    >
      {/* 1. Left Action Buttons (Revealed when swiped right) */}
      {leftActions.length > 0 && (
        <div
          className="absolute inset-y-0 left-0 flex z-0"
          style={{ width: `${leftWidth}px` }}
        >
          {leftActions.map((action) => {
            const Icon = action.icon;
            const customOrVariant = action.className || getVariantStyles(action.variant);
            return (
              <button
                key={action.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(e);
                  closeSwipe();
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-transform active:scale-95 cursor-pointer ${customOrVariant}`}
                style={{ width: '70px' }}
                title={action.label}
              >
                <Icon className="w-4 h-4 stroke-[2.2]" />
                <span className="truncate max-w-[65px] px-0.5">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Right Action Buttons (Revealed when swiped left) */}
      {rightActions.length > 0 && (
        <div
          className="absolute inset-y-0 right-0 flex z-0 justify-end"
          style={{ width: `${rightWidth}px` }}
        >
          {rightActions.map((action) => {
            const Icon = action.icon;
            const customOrVariant = action.className || getVariantStyles(action.variant);
            return (
              <button
                key={action.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(e);
                  closeSwipe();
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-transform active:scale-95 cursor-pointer ${customOrVariant}`}
                style={{ width: '70px' }}
                title={action.label}
              >
                <Icon className="w-4 h-4 stroke-[2.2]" />
                <span className="truncate max-w-[65px] px-0.5">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Foreground Main Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onClick={() => {
          if (isOpenSide) closeSwipe();
        }}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDraggingRef.current ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative z-10 bg-white dark:bg-zinc-900 w-full h-full touch-pan-y"
      >
        {children}

        {/* Small subtle visual indicator for touch users when idle */}
        {(leftActions.length > 0 || rightActions.length > 0) && offsetX === 0 && (
          <div className="md:hidden absolute right-1.5 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none text-zinc-400 text-[10px] flex items-center">
            <ChevronLeft className="w-3.5 h-3.5 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};
