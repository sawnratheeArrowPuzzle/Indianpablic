import React, { useEffect, useState } from 'react';

interface UserAvatarProps {
  src?: string | null;
  name: string;
  className?: string;
  fallbackClassName?: string;
  onImageError?: () => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  className = 'w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0',
  fallbackClassName = 'w-8 h-8 rounded-full bg-[#0B1E36] text-white text-xs font-bold flex items-center justify-center shrink-0',
  onImageError,
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const cleanSrc = (src || '').trim();
  const initial = (name || 'U').trim().slice(0, 1).toUpperCase() || 'U';

  if (cleanSrc && !failed) {
    return (
      <img
        src={cleanSrc}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => {
          setFailed(true);
          onImageError?.();
        }}
        className={className}
      />
    );
  }

  return <div className={fallbackClassName}>{initial}</div>;
};
