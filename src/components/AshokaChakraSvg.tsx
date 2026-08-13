import React from 'react';

interface AshokaChakraSvgProps {
  className?: string;
  size?: number;
  color?: string;
}

export const AshokaChakraSvg: React.FC<AshokaChakraSvgProps> = ({
  className = '',
  size = 48,
  color = '#000080'
}) => {
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Ring */}
      <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="3" />
      <circle cx="50" cy="50" r="43" fill="none" stroke={color} strokeWidth="1" strokeDasharray="1 3" />
      <circle cx="50" cy="50" r="41" fill="none" stroke={color} strokeWidth="1.5" />
      
      {/* 24 Spokes */}
      <g stroke={color} strokeWidth="1.5">
        {spokes.map((deg) => (
          <g key={deg} transform={`rotate(${deg} 50 50)`}>
            <line x1="50" y1="50" x2="50" y2="9" />
            <polygon points="49.2,20 50,8 50.8,20" fill={color} />
          </g>
        ))}
      </g>

      {/* 24 decorative dots on outer rim */}
      {spokes.map((deg) => (
        <circle
          key={`dot-${deg}`}
          cx="50"
          cy="6"
          r="1.2"
          fill={color}
          transform={`rotate(${deg + 7.5} 50 50)`}
        />
      ))}

      {/* Central Hub */}
      <circle cx="50" cy="50" r="8" fill={color} />
      <circle cx="50" cy="50" r="4" fill="#ffffff" />
      <circle cx="50" cy="50" r="2" fill={color} />
    </svg>
  );
};
