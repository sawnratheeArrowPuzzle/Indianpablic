import React, { useState } from 'react';

export const SAVVVN_LOGO_URL = '/assets/aistudio/IMG-20261121-WA2400_eba22879.jpg';

interface BrandLogoProps {
  variant?: 'header' | 'footer' | 'sidebar' | 'wordmark' | 'full' | 'play';
  surface?: 'light' | 'dark';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'header',
  surface = 'light',
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const isDarkSurface = surface === 'dark';

  const sizeClass =
    variant === 'full'
      ? 'h-20 sm:h-24 w-auto'
      : variant === 'footer'
      ? 'h-12 sm:h-14 w-auto'
      : variant === 'sidebar' || variant === 'wordmark'
      ? 'h-10 w-auto'
      : 'h-11 sm:h-12 w-auto';

  if (imgFailed) {
    return (
      <span
        className={`font-display text-xl font-bold tracking-tight whitespace-nowrap shrink-0 ${
          isDarkSurface ? 'text-white' : 'text-[#0B1530]'
        } ${className}`}
      >
        SavvvnLab
      </span>
    );
  }

  if (isDarkSurface) {
    return (
      <span
        className={`inline-flex items-center justify-center bg-white rounded-xl px-2.5 py-1 shadow-xs shrink-0 ${className}`}
      >
        <img
          src={SAVVVN_LOGO_URL}
          alt="SavvvnLab — Learn · Create · Grow"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className={`${sizeClass} object-contain block`}
        />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
      <img
        src={SAVVVN_LOGO_URL}
        alt="SavvvnLab — Learn · Create · Grow"
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`${sizeClass} object-contain block rounded-md`}
      />
    </span>
  );
};
