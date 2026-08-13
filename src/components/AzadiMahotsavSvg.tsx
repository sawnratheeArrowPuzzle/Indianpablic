import React from 'react';

interface AzadiMahotsavSvgProps {
  className?: string;
  size?: number;
  yearNumber?: string | number;
}

export const AzadiMahotsavSvg: React.FC<AzadiMahotsavSvgProps> = ({
  className = '',
  size = 80,
  yearNumber = '80',
}) => {
  const numStr = String(yearNumber || '80');

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        width={size}
        height={size * 0.72}
        viewBox="0 0 115 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Number 8 (or first digit) */}
        <text
          x="8"
          y="48"
          fill="#475569"
          fontSize="44"
          fontFamily="Cinzel, serif"
          fontWeight="800"
          letterSpacing="-1"
        >
          {numStr[0] || '8'}
        </text>

        {/* Tricolor flag ribbon flowing from top right of number */}
        <path
          d="M52 18 C66 12 78 22 92 16 C100 12 106 16 110 18 L108 24 C102 21 96 18 88 22 C76 28 64 20 52 24 Z"
          fill="#FF9933"
        />
        <path
          d="M52 24 C64 20 76 28 88 22 C96 18 102 21 108 24 L106 30 C100 27 94 24 86 28 C74 34 62 26 52 30 Z"
          fill="#FFFFFF"
          stroke="#CBD5E1"
          strokeWidth="0.5"
        />
        <path
          d="M52 30 C62 26 74 34 86 28 C94 24 100 27 106 30 L104 36 C98 33 92 30 84 34 C72 40 60 32 52 36 Z"
          fill="#138808"
        />

        {/* Number 0 (or second digit) */}
        <text
          x="38"
          y="48"
          fill="#475569"
          fontSize="44"
          fontFamily="Cinzel, serif"
          fontWeight="800"
        >
          {numStr[1] || '0'}
        </text>

        {/* "Azadi Ka Amrit Mahotsav" text */}
        <text
          x="10"
          y="62"
          fill="#1E293B"
          fontSize="9.5"
          fontFamily="Cinzel, sans-serif"
          fontWeight="800"
          letterSpacing="0.5"
        >
          Azadi Ka
        </text>
        <text
          x="10"
          y="74"
          fill="#1E293B"
          fontSize="8.5"
          fontFamily="Cinzel, sans-serif"
          fontWeight="700"
          letterSpacing="0.2"
        >
          Amrit Mahotsav
        </text>
      </svg>
    </div>
  );
};
