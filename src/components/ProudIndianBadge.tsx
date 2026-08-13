import React from 'react';

interface ProudIndianBadgeProps {
  className?: string;
  size?: number;
  badgeTitle?: string;
  badgeSubtitle?: string;
  badgeCategory?: string;
}

export const ProudIndianBadge: React.FC<ProudIndianBadgeProps> = ({
  className = '',
  size = 140,
  badgeTitle = 'PROUD',
  badgeSubtitle = 'TO BE AN',
  badgeCategory = 'INDIAN',
}) => {
  // Generate 24 gold starburst scalloped petals
  const petals = Array.from({ length: 24 }, (_, i) => i * 15);

  return (
    <div
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
      >
        <defs>
          {/* Metallic Gold Gradient for Outer Starburst */}
          <radialGradient id="goldRibbon" cx="50%" cy="50%" r="50%" fx="35%" fy="35%">
            <stop offset="0%" stopColor="#FFF1B8" />
            <stop offset="45%" stopColor="#E5A624" />
            <stop offset="70%" stopColor="#C68612" />
            <stop offset="90%" stopColor="#F9D776" />
            <stop offset="100%" stopColor="#8C5C05" />
          </radialGradient>

          {/* Gold Rim Linear Gradient */}
          <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="35%" stopColor="#D97706" />
            <stop offset="70%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          {/* Deep Navy Inner Disc Gradient */}
          <radialGradient id="navyDisc" cx="50%" cy="50%" r="50%" fx="40%" fy="40%">
            <stop offset="0%" stopColor="#0B2545" />
            <stop offset="75%" stopColor="#051426" />
            <stop offset="100%" stopColor="#020912" />
          </radialGradient>

          <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Outer 24-point Scalloped Starburst */}
        <g filter="url(#badgeShadow)">
          {petals.map((deg) => (
            <g key={deg} transform={`rotate(${deg} 80 80)`}>
              <polygon
                points="80,4 85,22 75,22"
                fill="url(#goldRibbon)"
                stroke="#B45309"
                strokeWidth="0.6"
              />
              <circle cx="80" cy="18" r="6" fill="url(#goldRibbon)" />
            </g>
          ))}
          {/* Main Gold Disc */}
          <circle cx="80" cy="80" r="64" fill="url(#goldRibbon)" stroke="#B45309" strokeWidth="1.2" />
        </g>

        {/* Decorative Golden Beaded Ring */}
        <circle cx="80" cy="80" r="57" fill="none" stroke="url(#goldRim)" strokeWidth="2.5" />
        <circle cx="80" cy="80" r="54" fill="none" stroke="#78350F" strokeWidth="0.8" strokeDasharray="1.5 2.5" />

        {/* Inner Deep Navy Disc */}
        <circle cx="80" cy="80" r="50" fill="url(#navyDisc)" stroke="url(#goldRim)" strokeWidth="1.8" />

        {/* 3 Gold Stars at Top */}
        <g fill="#FBBF24" stroke="#92400E" strokeWidth="0.3">
          {/* Left Star */}
          <path
            d="M62 48 L64 52 L68 52.5 L65 55 L66 59 L62 56.5 L58 59 L59 55 L56 52.5 L60 52 Z"
            transform="scale(0.8) translate(15, 12)"
          />
          {/* Center Star (slightly larger) */}
          <path
            d="M80 43 L82.5 48 L88 48.5 L84 52 L85 57 L80 54 L75 57 L76 52 L72 48.5 L77.5 48 Z"
            transform="scale(0.85) translate(14, 8)"
          />
          {/* Right Star */}
          <path
            d="M98 48 L100 52 L104 52.5 L101 55 L102 59 L98 56.5 L94 59 L95 55 L92 52.5 L96 52 Z"
            transform="scale(0.8) translate(22, 12)"
          />
        </g>

        {/* Text: PROUD */}
        <text
          x="80"
          y="68"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Montserrat, Poppins, sans-serif"
          fontWeight="800"
          fontSize="12.5"
          letterSpacing="1.2"
        >
          {badgeTitle}
        </text>

        {/* Text: TO BE AN */}
        <text
          x="80"
          y="81"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Montserrat, Poppins, sans-serif"
          fontWeight="700"
          fontSize="8"
          letterSpacing="1.5"
        >
          {badgeSubtitle}
        </text>

        {/* Text: INDIAN (Tricolor Styled) */}
        <g>
          {/* IND (Orange/Saffron) */}
          <text
            x="56"
            y="101"
            textAnchor="middle"
            fill="#FF9933"
            fontFamily="Montserrat, Poppins, sans-serif"
            fontWeight="900"
            fontSize="15"
            letterSpacing="0.8"
          >
            IND
          </text>
          {/* I (White) */}
          <text
            x="76"
            y="101"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Montserrat, Poppins, sans-serif"
            fontWeight="900"
            fontSize="15"
            letterSpacing="0.8"
          >
            I
          </text>
          {/* AN (Green) */}
          <text
            x="96"
            y="101"
            textAnchor="middle"
            fill="#138808"
            fontFamily="Montserrat, Poppins, sans-serif"
            fontWeight="900"
            fontSize="15"
            letterSpacing="0.8"
          >
            AN
          </text>
        </g>

        {/* Curved Tricolor Wave ribbon swoosh under INDIAN */}
        <path
          d="M60 108 Q80 114 100 106"
          fill="none"
          stroke="#FF9933"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M60 110.5 Q80 116.5 100 108.5"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M60 112.8 Q80 118.8 100 110.8"
          fill="none"
          stroke="#138808"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
