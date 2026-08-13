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

export const CardThemeRoyalGold: React.FC<CardThemeProps> = ({
  data,
  cardRef,
  className = '',
  isPrintMode = false,
}) => {
  return (
    <div
      ref={cardRef}
      id="independence-id-card-royal-gold"
      className={`relative bg-gradient-to-b from-[#FFF5EB] via-[#FFFFFF] to-[#EBF9ED] text-slate-900 rounded-2xl overflow-hidden border-3 border-[#D4AF37] mx-auto select-none ${className}`}
      style={{
        width: '100%',
        maxWidth: '560px',
        aspectRatio: '1 / 1.53',
        boxShadow: isPrintMode
          ? 'none'
          : '0 25px 60px -15px rgba(212, 175, 55, 0.45), 0 0 0 2px rgba(212, 175, 55, 0.35)',
      }}
    >
      {/* 1. TOP SAFFRON TRICOLOR HEADER BAND */}
      <div className="absolute top-0 left-0 right-0 h-[105px] bg-gradient-to-b from-[#FF7700] via-[#FF9933] to-[#FFA74D] border-b-2 border-[#D4AF37] shadow-sm z-0">
        {/* Decorative Wave Saffron Flow */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* 2. BOTTOM GREEN TRICOLOR FOOTER BAND */}
      <div className="absolute bottom-0 left-0 right-0 h-[85px] bg-gradient-to-t from-[#0A5C05] via-[#138808] to-[#1E9B12] border-t-2 border-[#D4AF37] shadow-sm z-0">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* Outer Royal Gold Filigree Inset */}
      <div className="absolute inset-1.5 border border-[#D4AF37]/50 rounded-xl pointer-events-none z-10" />
      <div className="absolute inset-2.5 border border-[#D4AF37]/30 rounded-lg pointer-events-none z-10" />

      {/* Top Luxury Tricolor Header */}
      <div className="relative pt-3.5 px-5 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded-lg bg-white/95 border-2 border-[#D4AF37] shadow-md">
              <LionEmblemSvg size={30} color="#0B1E36" />
            </div>
            <div className="text-left">
              <span className="block font-cinzel font-black text-[9.5px] sm:text-[10.5px] tracking-[0.22em] text-[#0B1E36] uppercase drop-shadow-xs">
                GOVERNMENT OF INDIA
              </span>
              <span className="block font-montserrat font-bold text-[7.5px] text-[#0B1E36]/90 tracking-wider">
                NATIONAL CITIZEN IDENTIFICATION
              </span>
            </div>
          </div>

          {/* Ashoka Chakra Center/Right Seal */}
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <span className="block font-cinzel font-bold text-[8.5px] text-[#0B1E36] tracking-widest uppercase">
                AZADI MAHOTSAV
              </span>
              <span className="block font-montserrat font-extrabold text-[7.5px] text-[#0B1E36] tracking-wider">
                {data.year || '2026'}
              </span>
            </div>
            <div className="p-1 rounded-full bg-white border-2 border-[#000080] shadow-md">
              <AshokaChakraSvg size={24} color="#000080" />
            </div>
          </div>
        </div>

        {/* Card Title Banner */}
        <div className="mt-2 text-center">
          <div className="inline-block px-5 py-0.5 rounded-full bg-white/95 border border-[#D4AF37] shadow-sm">
            <h1 className="font-cinzel font-black text-[15px] sm:text-[18px] text-[#0B1E36] tracking-[0.14em] uppercase">
              {data.eventTitle || 'INDEPENDENCE DAY'}
            </h1>
          </div>
          <div className="flex items-center justify-center gap-2 mt-1">
            <div className="w-12 h-[2px] bg-[#FF9933]" />
            <span className="font-montserrat font-black text-[9px] sm:text-[10px] text-[#0B1E36] tracking-[0.2em] uppercase">
              {data.eventSubtitle || '15TH AUGUST'} {data.year || '2026'}
            </span>
            <div className="w-12 h-[2px] bg-[#138808]" />
          </div>
        </div>
      </div>

      {/* Middle Section: Photo on Left, Details on Right (Over White Middle Canvas) */}
      <div className="relative mt-2.5 px-5 z-20 grid grid-cols-12 gap-3.5 items-center bg-white/90 py-2 rounded-xl border border-slate-200/80 shadow-xs mx-1">
        {/* Photo Box (Cols 1-5) */}
        <div className="col-span-5 flex flex-col items-center">
          <div className="relative p-1 rounded-xl bg-gradient-to-br from-[#FF9933] via-[#D4AF37] to-[#138808] shadow-md">
            <div className="w-[115px] h-[135px] sm:w-[130px] sm:h-[150px] rounded-lg overflow-hidden bg-slate-100 border-2 border-white">
              <img
                src={data.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'}
                alt={data.name || 'Citizen'}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            </div>
            {/* Corner Gold Accents */}
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#D4AF37]" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#D4AF37]" />
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#D4AF37]" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#D4AF37]" />
          </div>

          {/* Masked Phone Ribbon */}
          <div className="mt-1.5 px-2.5 py-0.5 rounded bg-slate-50 border border-slate-300 text-center w-full max-w-[130px]">
            <span className="font-mono text-[9px] font-bold text-[#0B1E36] tracking-wider block">
              {formatMaskedPhone(data.phone)}
            </span>
          </div>
        </div>

        {/* Citizen Details Block (Cols 6-12) */}
        <div className="col-span-7 space-y-1.5 pl-1">
          {/* NAME */}
          <div className="border-b border-[#FF9933]/50 pb-1">
            <span className="block font-montserrat text-[7.5px] font-bold tracking-widest text-[#FF7700] uppercase">
              CITIZEN NAME
            </span>
            <div className="font-cinzel font-black text-[15px] sm:text-[17px] text-[#0B1E36] tracking-wide truncate">
              {data.name || 'Mr Sawn Kumar'}
            </div>
          </div>

          {/* ID NUMBER */}
          <div className="border-b border-[#138808]/50 pb-1">
            <span className="block font-montserrat text-[7.5px] font-bold tracking-widest text-[#0D6B04] uppercase">
              OFFICIAL ID NUMBER
            </span>
            <div className="font-mono font-bold text-[11px] sm:text-[12px] text-[#0F172A] tracking-wider truncate">
              {data.idNumber || 'IND-15AUG-2026-08765'}
            </div>
          </div>

          {/* DOB & ROLE Grid */}
          <div className="grid grid-cols-2 gap-2 border-b border-[#FF9933]/40 pb-1">
            <div>
              <span className="block font-montserrat text-[7px] font-bold tracking-widest text-[#FF7700] uppercase">
                DOB
              </span>
              <div className="font-montserrat font-bold text-[10px] sm:text-[11px] text-slate-800 truncate">
                {data.dob || '01/01/2007'}
              </div>
            </div>
            <div>
              <span className="block font-montserrat text-[7px] font-bold tracking-widest text-[#0D6B04] uppercase">
                ROLE / STATUS
              </span>
              <div className="font-montserrat font-bold text-[10px] sm:text-[11px] text-[#138808] truncate">
                {data.role || 'Proud Citizen'}
              </div>
            </div>
          </div>

          {/* DATE & PLACE */}
          <div className="grid grid-cols-2 gap-2 border-b border-[#138808]/40 pb-1">
            <div>
              <span className="block font-montserrat text-[7px] font-bold tracking-widest text-[#FF7700] uppercase">
                ISSUE DATE
              </span>
              <div className="font-montserrat font-medium text-[10px] sm:text-[11px] text-slate-800 truncate">
                {data.date || '15 August 2026'}
              </div>
            </div>
            <div>
              <span className="block font-montserrat text-[7px] font-bold tracking-widest text-[#0D6B04] uppercase">
                PLACE
              </span>
              <div className="font-montserrat font-medium text-[10px] sm:text-[11px] text-slate-800 truncate">
                {data.place || 'India'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Authority & Starburst Badge Row */}
      <div className="relative mt-2 px-5 z-20 grid grid-cols-12 gap-2 items-center">
        {/* Left: Certificate Text */}
        <div className="col-span-4 text-left">
          <div className="p-1.5 rounded-lg bg-white/95 border border-[#D4AF37]/60 shadow-xs">
            <span className="block font-cinzel font-bold text-[7.5px] text-[#0B1E36] uppercase">
              {data.bannerText || 'CERTIFICATE OF PARTICIPATION'}
            </span>
            <span className="block font-montserrat text-[7px] text-slate-600 mt-0.5">
              Verified Official Entry
            </span>
          </div>
        </div>

        {/* Center: Gold Starburst Seal */}
        <div className="col-span-4 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#B45309] via-[#F59E0B] to-[#FEF3C7] p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#0B1E36] flex flex-col items-center justify-center text-center p-1 border border-[#D4AF37]">
              <span className="font-cinzel font-black text-[6.5px] text-[#FF9933] tracking-widest uppercase leading-tight">
                PROUD
              </span>
              <span className="font-montserrat text-[5px] text-white uppercase leading-none">
                TO BE AN
              </span>
              <span className="font-cinzel font-black text-[7.5px] text-[#22C55E] tracking-wider uppercase leading-tight mt-0.5">
                INDIAN
              </span>
            </div>
          </div>
        </div>

        {/* Right: Signature & Authority */}
        <div className="col-span-4 flex flex-col items-center text-center">
          <div className="font-signature text-[20px] sm:text-[22px] text-white leading-none select-none drop-shadow-sm">
            {data.signatoryName || 'Sawvan'}
          </div>
          <div className="w-full h-[1.5px] bg-white/70 my-0.5" />
          <span className="font-montserrat text-[6.5px] font-bold text-white uppercase tracking-wider">
            {data.signatoryTitle || 'AUTHORIZED SIGNATURE'}
          </span>
          <span className="font-montserrat text-[7.5px] text-emerald-100 font-semibold truncate">
            {data.signatoryAuthority || 'Government of India'}
          </span>
        </div>
      </div>

      {/* Bottom Tricolor Footer Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-9 bg-gradient-to-r from-[#0B1E36] via-[#102A4C] to-[#0B1E36] border-t-2 border-[#D4AF37] text-white flex items-center justify-between px-3 z-30">
        <div className="bg-white p-0.5 rounded shadow-sm flex items-center justify-center">
          <QRCodeSVG
            value={
              data.qrData ||
              `https://verify.gov.in/cert/${data.idNumber || 'IND-15AUG-2026-08765'}?name=${encodeURIComponent(
                data.name || 'Mr Sawn Kumar'
              )}&phone=${data.phone || ''}`
            }
            size={24}
            level="M"
          />
        </div>

        <div className="flex-1 flex items-center justify-center space-x-2 px-2 overflow-hidden">
          <span className="font-cinzel font-black text-[9.5px] text-[#FF9933] tracking-widest whitespace-nowrap">
            ★ JAI HIND ★
          </span>
          <span className="text-white/40 text-[9px]">|</span>
          <span className="font-montserrat font-medium text-[7.5px] tracking-[0.18em] text-white/90 uppercase truncate">
            {data.mottoText || 'UNITY • DISCIPLINE • UNITY • PROGRESS'}
          </span>
        </div>
      </div>
    </div>
  );
};

