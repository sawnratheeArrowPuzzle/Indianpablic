import React from 'react';

interface AzadiMahotsavSvgProps {
  className?: string;
  size?: number;
}

export const AzadiMahotsavSvg: React.FC<AzadiMahotsavSvgProps> = ({
  className = '',
  size = 75
}) => {
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        width={size}
        height={size * 0.72}
        viewBox="0 0 110 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Stylized '75' with tricolor ribbon flourish */}
        <text
          x="12"
          y="48"
          fill="#525252"
          fontSize="44"
          fontFamily="Cinzel, serif"
          fontWeight="700"
          letterSpacing="-1"
        >
          7
        </text>

        {/* Tricolor flag ribbon flowing from number 5 */}
        <path
          d="M48 20 C62 14 74 24 88 18 C96 14 102 18 106 20 L104 26 C98 23 92 20 84 24 C72 30 60 22 48 26 Z"
          fill="#FF9933"
        />
        <path
          d="M48 26 C60 22 72 30 84 24 C92 20 98 23 104 26 L102 32 C96 29 90 26 82 30 C70 36 58 28 48 32 Z"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="0.5"
        />
        <path
          d="M48 32 C58 28 70 36 82 30 C90 26 96 29 102 32 L100 38 C94 35 88 32 80 36 C68 42 56 34 48 38 Z"
          fill="#138808"
        />

        {/* Number '5' */}
        <text
          x="38"
          y="48"
          fill="#525252"
          fontSize="44"
          fontFamily="Cinzel, serif"
          fontWeight="700"
        >
          5
        </text>

        {/* "Azadi Ka Amrit Mahotsav" text */}
        <text
          x="10"
          y="62"
          fill="#334155"
          fontSize="10"
          fontFamily="Cinzel, sans-serif"
          fontWeight="800"
          letterSpacing="0.5"
        >
          Azadi Ka
        </text>
        <text
          x="10"
          y="74"
          fill="#334155"
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
