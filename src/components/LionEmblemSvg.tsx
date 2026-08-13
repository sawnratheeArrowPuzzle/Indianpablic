import React from 'react';

interface LionEmblemSvgProps {
  className?: string;
  size?: number;
  color?: string;
}

export const LionEmblemSvg: React.FC<LionEmblemSvgProps> = ({
  className = '',
  size = 56,
  color = '#2c3e50'
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <svg
        width={size}
        height={size * 1.15}
        viewBox="0 0 100 115"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-90"
      >
        {/* Stylized Ashoka Lion Capital */}
        <g stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Center Lion Head */}
          <path d="M42 20 C42 12 58 12 58 20 C62 16 68 22 66 30 C72 36 68 45 62 48 C62 55 58 60 50 60 C42 60 38 55 38 48 C32 45 28 36 34 30 C32 22 38 16 42 20 Z" />
          
          {/* Eyes & Mane details */}
          <circle cx="45" cy="30" r="1.5" fill={color} />
          <circle cx="55" cy="30" r="1.5" fill={color} />
          <path d="M47 36 Q50 40 53 36" />
          <path d="M45 42 Q50 46 55 42" />
          <path d="M38 32 C36 40 40 45 42 50" />
          <path d="M62 32 C64 40 60 45 58 50" />
          
          {/* Left Lion Silhouette */}
          <path d="M32 26 C26 22 22 30 24 38 C18 42 22 52 28 54 C30 58 35 60 38 60" />
          <path d="M25 36 Q22 42 26 46" />
          
          {/* Right Lion Silhouette */}
          <path d="M68 26 C74 22 78 30 76 38 C82 42 78 52 72 54 C70 58 65 60 62 60" />
          <path d="M75 36 Q78 42 74 46" />
          
          {/* Abacus / Base Platform */}
          <rect x="20" y="64" width="60" height="12" rx="2" strokeWidth="2" />
          
          {/* Small Chakra in center of abacus */}
          <circle cx="50" cy="70" r="4.5" strokeWidth="1" />
          <line x1="50" y1="65.5" x2="50" y2="74.5" strokeWidth="0.8" />
          <line x1="45.5" y1="70" x2="54.5" y2="70" strokeWidth="0.8" />
          <line x1="47" y1="67" x2="53" y2="73" strokeWidth="0.8" />
          <line x1="53" y1="67" x2="47" y2="73" strokeWidth="0.8" />
          
          {/* Galloping Horse (Left) & Bull (Right) marks */}
          <path d="M26 68 Q30 67 34 71" strokeWidth="1" />
          <path d="M66 71 Q70 67 74 68" strokeWidth="1" />
          
          {/* Lotus Base / Lower pedestal */}
          <path d="M24 76 L76 76 L72 84 L28 84 Z" strokeWidth="1.5" />
          <path d="M32 76 Q50 82 68 76" strokeWidth="1" />
          <rect x="22" y="84" width="56" height="4" rx="1" strokeWidth="1.5" />
        </g>
      </svg>
      <span className="text-[7.5px] font-hindi tracking-wider font-bold text-slate-700 mt-[-2px]">
        सत्यमेव जयते
      </span>
    </div>
  );
};
