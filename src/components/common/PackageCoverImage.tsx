import React, { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface PackageCoverImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackMode?: 'branded' | 'empty';
}

export const PackageCoverImage: React.FC<PackageCoverImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover block',
  fallbackMode = 'branded',
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const cleanSrc = (src || '').trim();

  if (cleanSrc && !failed) {
    return (
      <img
        src={cleanSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={className}
      />
    );
  }

  if (fallbackMode === 'empty') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
        <ImageIcon className="w-6 h-6" />
        <span>{cleanSrc && failed ? 'Cover Image Unavailable' : 'No Cover Uploaded'}</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-[#0B1530] via-[#1E293B] to-[#4F1CEB] flex items-center justify-center p-4 text-center">
      <span className="font-display text-base font-bold text-white">{alt}</span>
    </div>
  );
};
