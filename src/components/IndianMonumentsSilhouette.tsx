import React from 'react';

export const IndianMonumentsSilhouette: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full overflow-hidden select-none pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 800 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto opacity-35"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <linearGradient id="monumentFade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#64748b" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#94a3b8" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        <g fill="url(#monumentFade)" stroke="#64748b" strokeWidth="0.5">
          {/* Base ground line */}
          <rect x="0" y="220" width="800" height="20" />

          {/* Left Monument: India Gate (Amar Jawan Jyoti arch) */}
          <g transform="translate(40, 60)">
            {/* Top crown */}
            <rect x="50" y="10" width="60" height="8" rx="1" />
            <rect x="45" y="18" width="70" height="12" />
            <rect x="35" y="30" width="90" height="14" />
            <polygon points="35,44 125,44 130,52 30,52" />
            {/* Main Pylons */}
            <rect x="32" y="52" width="28" height="108" />
            <rect x="100" y="52" width="28" height="108" />
            {/* Center Arch */}
            <path d="M60 90 C60 66 100 66 100 90 L100 160 L60 160 Z" />
            {/* Arch Cornice details */}
            <line x1="60" y1="90" x2="100" y2="90" strokeWidth="1" />
            <rect x="40" y="60" width="12" height="40" opacity="0.6" />
            <rect x="108" y="60" width="12" height="40" opacity="0.6" />
            {/* Base */}
            <rect x="25" y="155" width="110" height="10" />
          </g>

          {/* Center-Left: Red Fort / Lal Qila Domes & Ramparts */}
          <g transform="translate(180, 45)">
            {/* Lahori gate center tower */}
            <path d="M120 40 C110 30 110 15 120 5 C130 15 130 30 120 40 Z" />
            <rect x="119" y="0" width="2" height="6" />
            <rect x="108" y="40" width="24" height="6" />
            <rect x="102" y="46" width="36" height="30" />
            <path d="M112 62 C112 52 128 52 128 62 L128 76 L112 76 Z" />
            
            {/* Side minars */}
            <rect x="75" y="50" width="14" height="125" />
            <path d="M82 45 C75 38 75 25 82 15 C89 25 89 38 82 45 Z" />
            <rect x="151" y="50" width="14" height="125" />
            <path d="M158 45 C151 38 151 25 158 15 C165 25 165 38 158 45 Z" />
            
            {/* Ramparts */}
            <rect x="60" y="75" width="120" height="100" />
            {/* Battlements / Chhatris */}
            <path d="M60 75 L65 70 L70 75 L75 70 L80 75 L85 70 L90 75 L95 70 L100 75 L140 75 L145 70 L150 75 L155 70 L160 75 L165 70 L170 75 L175 70 L180 75" />
            {/* Main Archway */}
            <path d="M105 120 C105 95 135 95 135 120 L135 175 L105 175 Z" />
          </g>

          {/* Center-Right: Taj Mahal Silhouette */}
          <g transform="translate(360, 30)">
            {/* Main Central Onion Dome */}
            <path d="M100 65 C80 50 78 28 100 2 C122 28 120 50 100 65 Z" />
            <line x1="100" y1="2" x2="100" y2="-10" strokeWidth="1.5" />
            <circle cx="100" cy="-6" r="2" />
            <rect x="85" y="65" width="30" height="15" />

            {/* Side Chhatris / small domes */}
            <path d="M68 65 C58 55 58 42 68 32 C78 42 78 55 68 65 Z" />
            <rect x="62" y="65" width="12" height="15" />
            <path d="M132 65 C122 55 122 42 132 32 C142 42 142 55 132 65 Z" />
            <rect x="126" y="65" width="12" height="15" />

            {/* Main Chamber Structure */}
            <rect x="50" y="80" width="100" height="110" />
            {/* Central Iwan (Large Arch) */}
            <path d="M78 125 C78 95 122 95 122 125 L122 190 L78 190 Z" />
            {/* Side Upper & Lower Arches */}
            <path d="M56 102 C56 90 70 90 70 102 L70 120 L56 120 Z" />
            <path d="M56 142 C56 130 70 130 70 142 L70 160 L56 160 Z" />
            <path d="M130 102 C130 90 144 90 144 102 L144 120 L130 120 Z" />
            <path d="M130 142 C130 130 144 130 144 142 L144 160 L130 160 Z" />

            {/* Outer Minarets */}
            <rect x="10" y="55" width="10" height="135" />
            <path d="M15 55 C10 48 10 38 15 32 C20 38 20 48 15 55 Z" />
            <rect x="8" y="90" width="14" height="4" />
            <rect x="8" y="130" width="14" height="4" />

            <rect x="180" y="55" width="10" height="135" />
            <path d="M185 55 C180 48 180 38 185 32 C190 38 190 48 185 55 Z" />
            <rect x="178" y="90" width="14" height="4" />
            <rect x="178" y="130" width="14" height="4" />
          </g>

          {/* Far Right: Qutub Minar & Historic Pillars */}
          <g transform="translate(580, 20)">
            {/* Fluted tapering minar tower */}
            <polygon points="45,200 65,200 59,40 51,40" />
            <rect x="49" y="32" width="12" height="8" rx="2" />
            <rect x="47" y="70" width="16" height="5" />
            <rect x="45" y="110" width="20" height="5" />
            <rect x="43" y="150" width="24" height="6" />
            
            {/* Secondary arches */}
            <path d="M85 140 C85 110 115 110 115 140 L115 200 L85 200 Z" />
            <path d="M125 150 C125 125 150 125 150 150 L150 200 L125 200 Z" />
            <rect x="80" y="195" width="80" height="10" />
          </g>
        </g>
      </svg>
    </div>
  );
};
