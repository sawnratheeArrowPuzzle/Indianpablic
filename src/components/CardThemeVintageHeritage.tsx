import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { StudentData } from '../types';
import { AshokaChakraSvg } from './AshokaChakraSvg';
import { LionEmblemSvg } from './LionEmblemSvg';
import { formatMaskedPhone } from '../utils/storage';

interface CardThemeProps {
  data: StudentData;
  cardRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
  isPrintMode?: boolean;
}

export const CardThemeVintageHeritage: React.FC<CardThemeProps> = ({
  data,
  cardRef,
  className = '',
  isPrintMode = false,
}) => {
  return (
    <div
      ref={cardRef}
      id="independence-id-card-vintage-heritage"
      className={`relative bg-[#FBF7EE] text-[#2C1810] rounded-2xl overflow-hidden border-2 border-[#8C6239] mx-auto select-none ${className}`}
      style={{
        width: '100%',
        maxWidth: '560px',
        aspectRatio: '1 / 1.53',
        boxShadow: isPrintMode
          ? 'none'
          : '0 25px 60px -15px rgba(60, 30, 10, 0.35), 0 0 0 1px rgba(140, 98, 57, 0.25)',
      }}
    >
      {/* Antique Parchment Watermark Texture */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="vintageParchment" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="28" fill="none" stroke="#5C3A21" strokeWidth="0.75" />
              <path d="M0 30 Q 30 0, 60 30 T 120 30" fill="none" stroke="#8C6239" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#vintageParchment)" />
        </svg>
      </div>

      {/* Ornate Double Filigree Frame */}
      <div className="absolute inset-2 border-2 border-[#8C6239]/60 rounded-xl pointer-events-none z-10" />
      <div className="absolute inset-3 border border-[#8C6239]/30 rounded-lg pointer-events-none z-10" />

      {/* Vintage Top Corner Ornaments */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-[#8C6239] z-10 pointer-events-none" />
      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-[#8C6239] z-10 pointer-events-none" />
      <div className="absolute bottom-11 left-4 w-4 h-4 border-b-2 border-l-2 border-[#8C6239] z-10 pointer-events-none" />
      <div className="absolute bottom-11 right-4 w-4 h-4 border-b-2 border-r-2 border-[#8C6239] z-10 pointer-events-none" />

      {/* 1. TOP HEADER SECTION */}
      <div className="relative pt-4 px-6 z-20">
        <div className="flex items-center justify-between border-b border-[#8C6239]/30 pb-2">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded bg-[#EFE6D5] border border-[#8C6239]/50 shadow-xs">
              <LionEmblemSvg size={28} color="#4A2810" />
            </div>
            <div className="text-left">
              <span className="block font-cinzel font-bold text-[9px] sm:text-[10px] tracking-[0.2em] text-[#4A2810] uppercase">
                BHARAT SARKAR
              </span>
              <span className="block font-serif italic text-[7.5px] text-[#784A25]">
                Azadi Ka Swarnim Mahotsav
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-right">
              <span className="block font-cinzel font-bold text-[8.5px] text-[#4A2810] tracking-wider uppercase">
                NATIONAL HERITAGE
              </span>
              <span className="block font-serif font-bold text-[7.5px] text-[#B45309]">
                ANNO DOMINI {data.year || '2026'}
              </span>
            </div>
            <div className="p-0.5 rounded-full bg-[#EFE6D5] border border-[#8C6239]/50">
              <AshokaChakraSvg size={24} color="#000080" />
            </div>
          </div>
        </div>

        {/* Vintage Event Title */}
        <div className="mt-2 text-center">
          <h1 className="font-cinzel font-black text-[15px] sm:text-[18px] text-[#4A2810] tracking-[0.14em] uppercase">
            {data.eventTitle || 'INDEPENDENCE DAY'}
          </h1>
          <div className="flex items-center justify-center space-x-2 mt-0.5">
            <div className="w-10 h-[1px] bg-[#C2410C]" />
            <span className="font-serif italic font-bold text-[9px] sm:text-[10px] text-[#C2410C] tracking-wider">
              {data.eventSubtitle || '15th August'} • {data.year || '2026'}
            </span>
            <div className="w-10 h-[1px] bg-[#15803D]" />
          </div>
        </div>
      </div>

      {/* 2. Middle Section: Photo & Antique Details Sheet */}
      <div className="relative mt-2 px-6 z-20 grid grid-cols-12 gap-3 items-center">
        {/* Photo Box (Cols 1-5) */}
        <div className="col-span-5 flex flex-col items-center">
          <div className="relative p-1 rounded-xl bg-[#E8DCBE] border-2 border-[#8C6239] shadow-md">
            <div className="w-[115px] h-[135px] sm:w-[128px] sm:h-[148px] rounded-lg overflow-hidden bg-[#D8C7A5]">
              <img
                src={data.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'}
                alt={data.name || 'Citizen'}
                className="w-full h-full object-cover sepia-[0.15]"
                crossOrigin="anonymous"
              />
            </div>
          </div>

          {/* Masked Phone Banner */}
          <div className="mt-1.5 px-2 py-0.5 rounded bg-[#EFE6D5] border border-[#8C6239]/40 text-center w-full max-w-[128px]">
            <span className="font-mono text-[8.5px] font-bold text-[#4A2810] tracking-wider block">
              {formatMaskedPhone(data.phone)}
            </span>
          </div>
        </div>

        {/* Citizen Details Block (Cols 6-12) */}
        <div className="col-span-7 space-y-1.5 pl-1">
          {/* NAME */}
          <div className="border-b border-[#8C6239]/30 pb-1">
            <span className="block font-serif text-[7.5px] font-bold tracking-widest text-[#784A25] uppercase">
              HONORED CITIZEN
            </span>
            <div className="font-cinzel font-black text-[15px] sm:text-[17px] text-[#2C1810] tracking-wide truncate">
              {data.name || 'Mr Sawn Kumar'}
            </div>
          </div>

          {/* ID NUMBER */}
          <div className="border-b border-[#8C6239]/30 pb-1">
            <span className="block font-serif text-[7.5px] font-bold tracking-widest text-[#784A25] uppercase">
              CERTIFICATE NUMBER
            </span>
            <div className="font-mono font-bold text-[11px] sm:text-[12px] text-[#854D0E] tracking-wider truncate">
              {data.idNumber || 'IND-15AUG-2026-08765'}
            </div>
          </div>

          {/* DOB & ROLE Grid */}
          <div className="grid grid-cols-2 gap-2 border-b border-[#8C6239]/30 pb-1">
            <div>
              <span className="block font-serif text-[7px] font-bold tracking-widest text-[#784A25] uppercase">
                BORN ON
              </span>
              <div className="font-serif font-bold text-[10px] sm:text-[11px] text-[#2C1810] truncate">
                {data.dob || '01/01/2007'}
              </div>
            </div>
            <div>
              <span className="block font-serif text-[7px] font-bold tracking-widest text-[#784A25] uppercase">
                HONOR ROLE
              </span>
              <div className="font-serif font-bold text-[10px] sm:text-[11px] text-[#15803D] truncate">
                {data.role || 'Proud Citizen'}
              </div>
            </div>
          </div>

          {/* DATE & PLACE */}
          <div className="grid grid-cols-2 gap-2 border-b border-[#8C6239]/30 pb-1">
            <div>
              <span className="block font-serif text-[7px] font-bold tracking-widest text-[#784A25] uppercase">
                DATED
              </span>
              <div className="font-serif font-medium text-[10px] sm:text-[11px] text-[#2C1810] truncate">
                {data.date || '15 August 2026'}
              </div>
            </div>
            <div>
              <span className="block font-serif text-[7px] font-bold tracking-widest text-[#784A25] uppercase">
                DISTRICT / PLACE
              </span>
              <div className="font-serif font-medium text-[10px] sm:text-[11px] text-[#2C1810] truncate">
                {data.place || 'India'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Antique Seal & Signatory Row */}
      <div className="relative mt-2 px-6 z-20 grid grid-cols-12 gap-2 items-center">
        {/* Certificate banner */}
        <div className="col-span-4">
          <div className="bg-[#EFE6D5] border border-[#8C6239]/40 rounded-lg p-1.5 text-center">
            <span className="font-cinzel font-bold text-[7.5px] text-[#4A2810] uppercase block truncate">
              {data.bannerText || 'CERTIFICATE OF PARTICIPATION'}
            </span>
            <span className="font-serif italic text-[6.5px] text-[#784A25] block mt-0.5">
              Official State Seal
            </span>
          </div>
        </div>

        {/* Vintage Wax/Ribbon Seal */}
        <div className="col-span-4 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-[#B91C1C] p-0.5 shadow-md flex items-center justify-center border-2 border-[#7F1D1D]">
            <div className="w-full h-full rounded-full bg-[#991B1B] flex flex-col items-center justify-center text-center p-1 border border-amber-300/40">
              <span className="font-cinzel font-black text-[6.5px] text-amber-200 tracking-widest uppercase leading-tight">
                PROUD
              </span>
              <span className="font-serif italic text-[5px] text-amber-100 uppercase leading-none">
                Indian
              </span>
              <span className="font-cinzel font-black text-[7px] text-white tracking-wider uppercase leading-tight mt-0.5">
                ★ 2026 ★
              </span>
            </div>
          </div>
        </div>

        {/* Signatory */}
        <div className="col-span-4 text-center">
          <div className="font-signature text-[21px] sm:text-[23px] text-[#4A2810] leading-none select-none">
            {data.signatoryName || 'Sawvan'}
          </div>
          <div className="w-full h-[1px] bg-[#8C6239]/40 my-0.5" />
          <span className="font-serif text-[6.5px] font-bold text-[#784A25] uppercase tracking-wider block">
            {data.signatoryTitle || 'AUTHORIZED SIGNATURE'}
          </span>
          <span className="font-serif text-[7.5px] font-semibold text-[#4A2810] block truncate">
            {data.signatoryAuthority || 'Government of India'}
          </span>
        </div>
      </div>

      {/* 4. Bottom Antique Footer Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-9 bg-[#3B1F0B] text-[#FBF7EE] flex items-center justify-between px-3 z-30 border-t border-[#8C6239]">
        <div className="bg-white p-0.5 rounded shadow-sm flex items-center justify-center">
          <QRCodeSVG
            value={
              data.qrData ||
              `https://verify.gov.in/cert/${data.idNumber || 'IND-15AUG-2026-08765'}?name=${encodeURIComponent(
                data.name || 'Sawvan Kumar'
              )}&phone=${data.phone || ''}`
            }
            size={24}
            level="M"
          />
        </div>

        <div className="flex-1 flex items-center justify-center space-x-2 px-2 overflow-hidden">
          <span className="font-cinzel font-black text-[9.5px] text-[#FDE68A] tracking-widest whitespace-nowrap">
            ★ JAI HIND ★
          </span>
          <span className="text-[#8C6239] text-[9px]">|</span>
          <span className="font-serif italic text-[7.5px] tracking-wider text-[#FBF7EE] uppercase truncate">
            {data.mottoText || 'UNITY • DISCIPLINE • UNITY • PROGRESS'}
          </span>
        </div>
      </div>
    </div>
  );
};
