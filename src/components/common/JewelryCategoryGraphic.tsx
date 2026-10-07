import React from 'react';

export type JewelryCategoryType =
  | 'todos'
  | 'all'
  | 'aneis'
  | 'colares'
  | 'brincos'
  | 'pulseiras'
  | 'conjuntos'
  | 'acessorios'
  | 'relogios'
  | 'vestidos'
  | 'blusas'
  | 'calcas';

interface JewelryCategoryGraphicProps {
  category: string;
  className?: string;
  size?: number;
  isSelected?: boolean;
}

export const normalizeCategory = (cat: string): JewelryCategoryType => {
  const norm = cat.trim().toLowerCase();
  if (norm === 'all' || norm === 'todos') return 'todos';
  if (norm.includes('anel') || norm.includes('anéis') || norm.includes('aneis')) return 'aneis';
  if (norm.includes('colar') || norm.includes('gargantilha') || norm.includes('choker')) return 'colares';
  if (norm.includes('brinco') || norm.includes('argola')) return 'brincos';
  if (norm.includes('pulseira') || norm.includes('bracelete')) return 'pulseiras';
  if (norm.includes('conjunto') || norm.includes('kit')) return 'conjuntos';
  if (norm.includes('acess')) return 'acessorios';
  if (norm.includes('relog') || norm.includes('relóg')) return 'relogios';
  if (norm.includes('vestid')) return 'vestidos';
  if (norm.includes('blus') || norm.includes('camis')) return 'blusas';
  if (norm.includes('calc') || norm.includes('calç') || norm.includes('jeans')) return 'calcas';
  return 'acessorios';
};

export const JewelryCategoryGraphic: React.FC<JewelryCategoryGraphicProps> = ({
  category,
  className = '',
  size = 76,
  isSelected = false,
}) => {
  const type = normalizeCategory(category);
  const idPrefix = `jcat_${type}_${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div
      className={`relative flex items-center justify-center select-none transition-transform duration-300 ${
        isSelected ? 'scale-105' : 'hover:scale-102'
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="overflow-visible filter drop-shadow-[0_4px_8px_rgba(180,140,40,0.22)] dark:drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
      >
        <defs>
          {/* Metallic Gold Ring Gradients */}
          <linearGradient id={`${idPrefix}_gold_outer`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fdf3d8" />
            <stop offset="25%" stopColor="#d4af37" />
            <stop offset="50%" stopColor="#8a6114" />
            <stop offset="75%" stopColor="#e8c76b" />
            <stop offset="100%" stopColor="#b3821a" />
          </linearGradient>

          <linearGradient id={`${idPrefix}_gold_inner`} x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#faecd0" />
            <stop offset="30%" stopColor="#cf9f33" />
            <stop offset="70%" stopColor="#8a6114" />
            <stop offset="100%" stopColor="#faecd0" />
          </linearGradient>

          {/* Pearl / Ivory Background */}
          <radialGradient id={`${idPrefix}_pearl_bg`} cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#faf7f0" />
            <stop offset="100%" stopColor="#eee7d7" />
          </radialGradient>

          {/* Pearl Dark Background */}
          <radialGradient id={`${idPrefix}_pearl_bg_dark`} cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#221e1a" />
            <stop offset="70%" stopColor="#151311" />
            <stop offset="100%" stopColor="#0c0b0a" />
          </radialGradient>

          {/* Soft Shadow under the circle */}
          <radialGradient id={`${idPrefix}_ring_shadow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.35)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          {/* Gold Metallic Bevel Filter */}
          <filter id={`${idPrefix}_glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Shadow under ring */}
        <ellipse cx="50" cy="95" rx="34" ry="4.5" fill={`url(#${idPrefix}_ring_shadow)`} opacity="0.6" />

        {/* 1. Double Gold Rim */}
        {/* Outer Rim */}
        <circle
          cx="50"
          cy="48"
          r="45"
          fill="none"
          stroke={`url(#${idPrefix}_gold_outer)`}
          strokeWidth="3.2"
        />

        {/* Gap & Inner Rim */}
        <circle
          cx="50"
          cy="48"
          r="42.2"
          fill="none"
          stroke={`url(#${idPrefix}_gold_inner)`}
          strokeWidth="1.6"
        />

        {/* 2. Inner Circle Background */}
        {type === 'todos' ? (
          // "TODOS" has deep luxurious black background
          <circle cx="50" cy="48" r="41" fill="#09090b" stroke="#221e17" strokeWidth="0.8" />
        ) : (
          // Other categories have warm pearl ivory / luxury neutral background
          <circle
            cx="50"
            cy="48"
            r="41"
            className="fill-[#faf6ed] dark:fill-[#171412]"
            stroke="#e2d2b5"
            strokeWidth="0.5"
          />
        )}

        {/* Active Ring Pulsing Highlight */}
        {isSelected && (
          <circle
            cx="50"
            cy="48"
            r="46.5"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            className="animate-spin"
            style={{ transformOrigin: '50px 48px', animationDuration: '14s' }}
          />
        )}

        {/* 3. High Fidelity Category Graphic Content */}
        {type === 'todos' && (
          // ================= TODOS: 5 multi-color sparkling gems =================
          <g transform="translate(50, 48)">
            {/* Center Yellow Diamond Star */}
            <path
              d="M0,-12 Q0,-2 10,0 Q0,2 0,12 Q0,2 -10,0 Q0,-2 0,-12 Z"
              fill="#ffe066"
              filter={`url(#${idPrefix}_glow)`}
            />
            <circle cx="0" cy="0" r="2.5" fill="#fff" />

            {/* Top Cyan Star */}
            <path
              d="M-0.5,-24 Q-0.5,-17 5,-15 Q-0.5,-13 -0.5,-6 Q-0.5,-13 -6,-15 Q-0.5,-17 -0.5,-24 Z"
              fill="#22d3ee"
            />
            <circle cx="-0.5" cy="-15" r="1.5" fill="#e0f2fe" />

            {/* Left Ice Blue Diamond Star */}
            <path
              d="M-22,-7 Q-17,-7 -14,-2 Q-17,3 -22,3 Q-17,3 -20,8 Q-17,3 -14,-2 Z"
              fill="#60a5fa"
            />
            <path
              d="M-20,-7 Q-15,-7 -14,-1 Q-15,5 -20,5 Q-15,5 -26,-1 Q-15,-7 -20,-7 Z"
              fill="#93c5fd"
            />
            <circle cx="-20" cy="-1" r="1.5" fill="#fff" />

            {/* Right Gold Diamond Star */}
            <path
              d="M20,-7 Q16,-7 15,-1 Q16,5 20,5 Q16,5 25,-1 Q16,-7 20,-7 Z"
              fill="#fbbf24"
            />
            <circle cx="20" cy="-1" r="1.5" fill="#fff" />

            {/* Bottom Left Pink Sapphire Star */}
            <path
              d="M-15,10 Q-15,15 -10,17 Q-15,19 -15,24 Q-15,19 -20,17 Q-15,15 -15,10 Z"
              fill="#f472b6"
            />
            <circle cx="-15" cy="17" r="1.5" fill="#fff" />

            {/* Bottom Right Ruby Red Star */}
            <path
              d="M15,10 Q15,15 20,17 Q15,19 15,24 Q15,19 10,17 Q15,15 15,10 Z"
              fill="#f43f5e"
            />
            <circle cx="15" cy="17" r="1.5" fill="#fff" />

            {/* Tiny accent sparkles */}
            <circle cx="-6" cy="-22" r="0.8" fill="#fff" opacity="0.8" />
            <circle cx="12" cy="-18" r="1" fill="#fff" opacity="0.9" />
            <circle cx="-8" cy="22" r="0.8" fill="#fff" opacity="0.8" />
          </g>
        )}

        {type === 'aneis' && (
          // ================= ANÉIS: Diamond Solitaire Ring =================
          <g transform="translate(50, 48)">
            {/* Ring Shadow */}
            <ellipse cx="0" cy="26" rx="14" ry="2.5" fill="#c4aa7d" opacity="0.4" />

            {/* Gold Ring Band (Bottom/Front) */}
            <circle
              cx="0"
              cy="7"
              r="17"
              fill="none"
              stroke={`url(#${idPrefix}_gold_outer)`}
              strokeWidth="4"
            />
            <circle
              cx="0"
              cy="7"
              r="16.5"
              fill="none"
              stroke="#fffaea"
              strokeWidth="0.8"
              opacity="0.8"
            />

            {/* Ring Prongs Mounting Crown */}
            <path d="M-6,-10 L-8,-14 L8,-14 L6,-10 Z" fill={`url(#${idPrefix}_gold_inner)`} />
            <path d="M-6,-14 L-7,-19 L7,-19 L6,-14 Z" fill={`url(#${idPrefix}_gold_outer)`} />

            {/* Solitaire Diamond Gem */}
            <g transform="translate(0, -21)">
              {/* Crown table / facets */}
              <polygon points="0,-7 8,-2 5,6 -5,6 -8,-2" fill="#ffffff" stroke="#cbe5f7" strokeWidth="0.5" />
              <polygon points="0,-7 4,-2 0,6 -4,-2" fill="#e0f2fe" opacity="0.9" />
              <polygon points="4,-2 8,-2 5,6 0,6" fill="#bae6fd" opacity="0.75" />
              <polygon points="-4,-2 -8,-2 -5,6 0,6" fill="#f0f9ff" opacity="0.8" />
              <polygon points="0,-7 4,-2 0,-3" fill="#ffffff" />
              <polygon points="0,-7 -4,-2 0,-3" fill="#ffffff" />

              {/* Brilliant Sparkle Glint */}
              <path
                d="M-5,-6 L-4,-4 L-2,-5 L-4,-6 Z"
                fill="#ffffff"
                filter={`url(#${idPrefix}_glow)`}
              />
              <circle cx="-3" cy="-4" r="2.2" fill="#ffffff" />
              <line x1="-7" y1="-4" x2="1" y2="-4" stroke="#ffffff" strokeWidth="0.8" />
              <line x1="-3" y1="-8" x2="-3" y2="0" stroke="#ffffff" strokeWidth="0.8" />
            </g>
          </g>
        )}

        {type === 'colares' && (
          // ================= COLARES: Delicate Gold Necklace with Pearl Pendant =================
          <g transform="translate(50, 48)">
            {/* Necklace Chain Loop (Draping down in elegant parabola) */}
            <path
              d="M-22,-24 Q-20,6 0,10 Q20,6 22,-24"
              fill="none"
              stroke={`url(#${idPrefix}_gold_outer)`}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Chain links dotted highlight */}
            <path
              d="M-22,-24 Q-20,6 0,10 Q20,6 22,-24"
              fill="none"
              stroke="#fff9e6"
              strokeWidth="0.8"
              strokeDasharray="1.5 1.5"
            />

            {/* Gold Bail / Cap for pendant */}
            <path d="M-2,10 L2,10 L1.5,14 L-1.5,14 Z" fill={`url(#${idPrefix}_gold_inner)`} />
            <circle cx="0" cy="13.5" r="1.8" fill={`url(#${idPrefix}_gold_outer)`} />

            {/* Round Lustrous Pearl Drop */}
            <g transform="translate(0, 20)">
              {/* Pearl Shadow */}
              <ellipse cx="0" cy="6" rx="4.5" ry="1.5" fill="#baa483" opacity="0.35" />

              {/* Pearl Body */}
              <circle cx="0" cy="0" r="6" fill="#fcfaf2" stroke="#d5c8b2" strokeWidth="0.5" />
              {/* Pearl 3D Gradient / Shading */}
              <radialGradient id={`${idPrefix}_pearl`} cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor="#f7f3e8" />
                <stop offset="80%" stopColor="#e3d6bf" />
                <stop offset="100%" stopColor="#bfae93" />
              </radialGradient>
              <circle cx="0" cy="0" r="5.8" fill={`url(#${idPrefix}_pearl)`} />
              {/* Lustre reflection */}
              <ellipse cx="-1.8" cy="-2" rx="1.8" ry="1.2" fill="#ffffff" opacity="0.9" />
            </g>
          </g>
        )}

        {type === 'brincos' && (
          // ================= BRINCOS: Chandelier / Drop Earrings Pair =================
          <g transform="translate(50, 48)">
            {/* Left Earring */}
            <g transform="translate(-13, 0)">
              {/* Stud on top with gem */}
              <circle cx="0" cy="-21" r="2.8" fill={`url(#${idPrefix}_gold_outer)`} />
              <circle cx="0" cy="-21" r="1.8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.4" />

              {/* Connecting link */}
              <line x1="0" y1="-18" x2="0" y2="-14" stroke={`url(#${idPrefix}_gold_outer)`} strokeWidth="1.2" />

              {/* Chandelier Filigree Body */}
              <path
                d="M0,-14 C-7,-8 -9,2 0,18 C9,2 7,-8 0,-14 Z"
                fill="none"
                stroke={`url(#${idPrefix}_gold_outer)`}
                strokeWidth="1.4"
              />
              <path
                d="M0,-11 C-4,-6 -5,0 0,12 C5,0 4,-6 0,-11 Z"
                fill="none"
                stroke={`url(#${idPrefix}_gold_inner)`}
                strokeWidth="1"
              />
              {/* Diamond drops inside filigree */}
              <circle cx="0" cy="-3" r="1.8" fill="#ffffff" />
              <circle cx="-3.5" cy="4" r="1.4" fill="#ffffff" />
              <circle cx="3.5" cy="4" r="1.4" fill="#ffffff" />
              <circle cx="0" cy="9" r="1.5" fill="#ffffff" />
              {/* Bottom dangling teardrop */}
              <circle cx="0" cy="18" r="1.8" fill={`url(#${idPrefix}_gold_outer)`} />
              <circle cx="0" cy="18" r="1" fill="#fff" />
            </g>

            {/* Right Earring */}
            <g transform="translate(13, 0)">
              {/* Stud on top with gem */}
              <circle cx="0" cy="-21" r="2.8" fill={`url(#${idPrefix}_gold_outer)`} />
              <circle cx="0" cy="-21" r="1.8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.4" />

              {/* Connecting link */}
              <line x1="0" y1="-18" x2="0" y2="-14" stroke={`url(#${idPrefix}_gold_outer)`} strokeWidth="1.2" />

              {/* Chandelier Filigree Body */}
              <path
                d="M0,-14 C-7,-8 -9,2 0,18 C9,2 7,-8 0,-14 Z"
                fill="none"
                stroke={`url(#${idPrefix}_gold_outer)`}
                strokeWidth="1.4"
              />
              <path
                d="M0,-11 C-4,-6 -5,0 0,12 C5,0 4,-6 0,-11 Z"
                fill="none"
                stroke={`url(#${idPrefix}_gold_inner)`}
                strokeWidth="1"
              />
              {/* Diamond drops inside filigree */}
              <circle cx="0" cy="-3" r="1.8" fill="#ffffff" />
              <circle cx="-3.5" cy="4" r="1.4" fill="#ffffff" />
              <circle cx="3.5" cy="4" r="1.4" fill="#ffffff" />
              <circle cx="0" cy="9" r="1.5" fill="#ffffff" />
              {/* Bottom dangling teardrop */}
              <circle cx="0" cy="18" r="1.8" fill={`url(#${idPrefix}_gold_outer)`} />
              <circle cx="0" cy="18" r="1" fill="#fff" />
            </g>
          </g>
        )}

        {type === 'pulseiras' && (
          // ================= PULSEIRAS: Gold Link Charm Bracelet =================
          <g transform="translate(50, 48)">
            {/* Shadow underneath bracelet */}
            <ellipse cx="0" cy="20" rx="19" ry="3.5" fill="#c4aa7d" opacity="0.35" />

            {/* Bracelet Chain Loop - Interlocking gold oval links */}
            <ellipse
              cx="0"
              cy="-2"
              rx="18"
              ry="14"
              fill="none"
              stroke={`url(#${idPrefix}_gold_outer)`}
              strokeWidth="4"
              strokeDasharray="4.5 2.5"
            />
            <ellipse
              cx="0"
              cy="-2"
              rx="18"
              ry="14"
              fill="none"
              stroke="#fffaea"
              strokeWidth="1"
              strokeDasharray="2 5"
            />

            {/* Clasp */}
            <rect x="7" y="-17" width="5" height="3.5" rx="1.5" fill={`url(#${idPrefix}_gold_inner)`} />

            {/* Dangling Charms */}
            {/* Charm 1: Left Diamond bezel charm */}
            <g transform="translate(-12, 10)">
              <line x1="0" y1="-2" x2="0" y2="2" stroke={`url(#${idPrefix}_gold_outer)`} strokeWidth="1" />
              <circle cx="0" cy="4" r="3.2" fill={`url(#${idPrefix}_gold_outer)`} />
              <circle cx="0" cy="4" r="2.2" fill="#ffffff" />
            </g>

            {/* Charm 2: Center Gold Ball / Medallion charm */}
            <g transform="translate(0, 13)">
              <line x1="0" y1="-2" x2="0" y2="2" stroke={`url(#${idPrefix}_gold_outer)`} strokeWidth="1" />
              <circle cx="0" cy="6" r="4.2" fill={`url(#${idPrefix}_gold_inner)`} />
              <circle cx="-1" cy="4.5" r="1.2" fill="#fff" opacity="0.8" />
            </g>

            {/* Charm 3: Right Crystal Charm */}
            <g transform="translate(12, 10)">
              <line x1="0" y1="-2" x2="0" y2="2" stroke={`url(#${idPrefix}_gold_outer)`} strokeWidth="1" />
              <rect x="-2.5" y="1.5" width="5" height="5" rx="1" transform="rotate(45 0 4)" fill="#ffffff" stroke={`url(#${idPrefix}_gold_outer)`} strokeWidth="0.8" />
            </g>
          </g>
        )}

        {type === 'conjuntos' && (
          // ================= CONJUNTOS: Necklace + Matching Earrings Parure =================
          <g transform="translate(50, 48)">
            {/* Center: Delicate Necklace */}
            <path
              d="M-15,-25 Q-14,4 0,8 Q14,4 15,-25"
              fill="none"
              stroke={`url(#${idPrefix}_gold_outer)`}
              strokeWidth="1.5"
            />
            {/* Necklace Pendant (Pearl) */}
            <circle cx="0" cy="9.5" r="1.5" fill={`url(#${idPrefix}_gold_inner)`} />
            <circle cx="0" cy="15" r="4.5" fill="#fcfaf2" stroke="#d5c8b2" strokeWidth="0.5" />
            <ellipse cx="-1" cy="13.5" rx="1.2" ry="0.9" fill="#ffffff" />

            {/* Left Stud Earring */}
            <g transform="translate(-16, -1)">
              <circle cx="0" cy="0" r="3.2" fill={`url(#${idPrefix}_gold_outer)`} />
              <circle cx="0" cy="0" r="2.2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.4" />
              {/* Drop pearl below stud */}
              <line x1="0" y1="3.2" x2="0" y2="6.5" stroke={`url(#${idPrefix}_gold_outer)`} strokeWidth="0.8" />
              <circle cx="0" cy="8.5" r="2.2" fill="#fcfaf2" stroke="#d5c8b2" strokeWidth="0.4" />
            </g>

            {/* Right Stud Earring */}
            <g transform="translate(16, -1)">
              <circle cx="0" cy="0" r="3.2" fill={`url(#${idPrefix}_gold_outer)`} />
              <circle cx="0" cy="0" r="2.2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.4" />
              {/* Drop pearl below stud */}
              <line x1="0" y1="3.2" x2="0" y2="6.5" stroke={`url(#${idPrefix}_gold_outer)`} strokeWidth="0.8" />
              <circle cx="0" cy="8.5" r="2.2" fill="#fcfaf2" stroke="#d5c8b2" strokeWidth="0.4" />
            </g>
          </g>
        )}

        {type === 'acessorios' && (
          // ================= ACESSÓRIOS: Luxury Woven Handbag with Silk Scarf =================
          <g transform="translate(50, 48)">
            {/* Bag Shadow */}
            <ellipse cx="2" cy="22" rx="18" ry="3.5" fill="#c4aa7d" opacity="0.4" />

            {/* Bag Curved Top Handle */}
            <path
              d="M-8,-6 C-8,-18 12,-18 12,-6"
              fill="none"
              stroke={`url(#${idPrefix}_gold_outer)`}
              strokeWidth="2.8"
              strokeLinecap="round"
            />

            {/* Structured Handbag Body (Trapezoid / Rounded Rectangle) */}
            <path
              d="M-15,-2 L19,-2 C22,-2 23,0 23,4 L20,18 C19.5,20 18,21 16,21 L-12,21 C-14,21 -15.5,20 -16,18 L-19,4 C-19,0 -18,-2 -15,-2 Z"
              fill="#ddbe8c"
              stroke={`url(#${idPrefix}_gold_outer)`}
              strokeWidth="1.2"
            />
            {/* Woven / Quilted Crosshatch Pattern on bag */}
            <g opacity="0.3" stroke="#8a5a1f" strokeWidth="0.8">
              <line x1="-15" y1="2" x2="17" y2="18" />
              <line x1="-12" y1="-2" x2="20" y2="14" />
              <line x1="-17" y1="8" x2="10" y2="21" />
              <line x1="15" y1="2" x2="-17" y2="18" />
              <line x1="12" y1="-2" x2="-20" y2="14" />
              <line x1="17" y1="8" x2="-10" y2="21" />
            </g>

            {/* Gold Clasp Lock in Center */}
            <circle cx="2" cy="7" r="3" fill={`url(#${idPrefix}_gold_outer)`} />
            <circle cx="2" cy="7" r="1.5" fill="#8a6114" />

            {/* Silk Scarf / Twilly tied around left handle with elegant knot and tails */}
            <g transform="translate(-10, -6)">
              {/* Knot on handle */}
              <ellipse cx="0" cy="0" rx="3.5" ry="3" fill="#f5ede0" stroke="#b39775" strokeWidth="0.8" />
              <path d="M-2,-2 C0,0 2,-2 1,2" stroke="#8a6114" strokeWidth="0.7" fill="none" />

              {/* Scarf flowing tails (White & Gold/Champagne printed silk) */}
              <path
                d="M-1,1 C-4,6 -7,12 -3,17 C-1,13 -2,8 0,3 Z"
                fill="#f7f1e6"
                stroke="#c4aa82"
                strokeWidth="0.8"
              />
              <path
                d="M-2,6 C-5,10 -4,14 -2,16"
                stroke="#d4af37"
                strokeWidth="1"
                fill="none"
              />
              {/* Second shorter tail */}
              <path
                d="M1,2 C3,6 5,11 3,14 C1,10 0,6 0,2 Z"
                fill="#ebe0ce"
                stroke="#b89a72"
                strokeWidth="0.8"
              />
            </g>
          </g>
        )}

        {type === 'relogios' && (
          // Relógios fallback luxury watch
          <g transform="translate(50, 48)">
            <rect x="-6" y="-24" width="12" height="48" rx="2" fill={`url(#${idPrefix}_gold_outer)`} />
            <circle cx="0" cy="0" r="16" fill="#ffffff" stroke={`url(#${idPrefix}_gold_inner)`} strokeWidth="3" />
            <circle cx="0" cy="0" r="13" fill="#09090b" />
            <line x1="0" y1="0" x2="0" y2="-8" stroke="#d4af37" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="0" y1="0" x2="6" y2="0" stroke="#d4af37" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="1.5" fill="#fff" />
          </g>
        )}

        {type === 'vestidos' && (
          // Vestidos fallback luxury dress
          <g transform="translate(50, 48)">
            <path
              d="M-8,-18 L8,-18 L10,-8 L5,-2 L18,20 L-18,20 L-5,-2 L-10,-8 Z"
              fill={`url(#${idPrefix}_gold_outer)`}
              stroke="#8a6114"
              strokeWidth="0.8"
            />
            <circle cx="0" cy="-2" r="2.5" fill="#ffffff" />
          </g>
        )}

        {type === 'blusas' && (
          // Blusas fallback
          <g transform="translate(50, 48)">
            <path
              d="M-18,-14 L-9,-18 L0,-12 L9,-18 L18,-14 L14,-6 L10,-8 L10,18 L-10,18 L-10,-8 L-14,-6 Z"
              fill={`url(#${idPrefix}_gold_outer)`}
            />
          </g>
        )}

        {type === 'calcas' && (
          // Calças fallback
          <g transform="translate(50, 48)">
            <path
              d="M-12,-18 L12,-18 L11,18 L4,18 L1,-2 L-1,-2 L-4,18 L-11,18 Z"
              fill={`url(#${idPrefix}_gold_outer)`}
            />
          </g>
        )}
      </svg>
    </div>
  );
};
