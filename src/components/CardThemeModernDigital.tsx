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

export const CardThemeModernDigital: React.FC<CardThemeProps> = ({
  data,
  cardRef,
  className = '',
  isPrintMode = false,
}) => {
  return (
    <div
      ref={cardRef}
      id="independence-id-card-modern-digital"
      className={`relative bg-gradient-to-b from-[#F8FAFC] via-[#FFFFFF] to-[#EFF6FF] text-slate-900 rounded-2xl overflow-hidden border-2 border-slate-300 mx-auto select-none ${className}`}
      style={{
        width: '100%',
        maxWidth: '560px',
        aspectRatio: '1 / 1.53',
        boxShadow: isPrintMode
          ? 'none'
          : '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(2, 132, 199, 0.15)',
      }}
    >
      {/* Top Laser Tricolor Bar */}
      <div className="h-2 w-full grid grid-cols-3">
        <div className="bg-[#FF9933]" />
        <div className="bg-[#FFFFFF] border-y border-slate-200" />
        <div className="bg-[#138808]" />
      </div>

      {/* Futuristic Background Watermark Chakra */}
      <div className="absolute right-[-30px] top-[140px] opacity-[0.06] pointer-events-none z-0">
        <AshokaChakraSvg size={280} color="#000080" />
      </div>

      {/* Cyber Grid Lines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cyberGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#000080" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cyberGrid)" />
        </svg>
      </div>

      {/* 1. Header with Modern Gov Seal and Live Security Chip Badge */}
      <div className="relative pt-3 px-5 z-10 flex items-center justify-between border-b border-slate-200/80 pb-2.5">
        <div className="flex items-center space-x-2.5">
          <div className="p-1 rounded-xl bg-slate-100 border border-slate-300 shadow-xs">
            <LionEmblemSvg size={32} color="#0F172A" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-montserrat font-extrabold text-[10px] sm:text-[11px] text-[#0F172A] tracking-wider uppercase">
                DIGITAL INDIA PORTAL
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[7.5px] font-bold">
                VERIFIED
              </span>
            </div>
            <span className="font-mono text-[8px] text-slate-500 font-semibold tracking-wider block">
              NATIONAL IDENTITY CARD • {data.year || '2026'}
            </span>
          </div>
        </div>

        {/* Dynamic Holographic Ashoka Emblem */}
        <div className="flex items-center space-x-1.5 bg-blue-50/80 border border-blue-200 px-2.5 py-1 rounded-xl shadow-2xs">
          <AshokaChakraSvg size={20} color="#000080" />
          <span className="font-cinzel font-bold text-[8.5px] text-blue-900 tracking-wider">
            79th AZADI
          </span>
        </div>
      </div>

      {/* 2. Event Title Ribbon */}
      <div className="relative mt-2 px-5 z-10 text-center">
        <div className="inline-flex items-center justify-center space-x-2 px-4 py-0.5 rounded-full bg-gradient-to-r from-orange-50 via-white to-green-50 border border-slate-200 shadow-2xs">
          <div className="w-2 h-2 rounded-full bg-[#FF9933]" />
          <h1 className="font-montserrat font-black text-[13px] sm:text-[15px] text-[#0F172A] tracking-wider uppercase">
            {data.eventTitle || 'INDEPENDENCE DAY'} - {data.year || '2026'}
          </h1>
          <div className="w-2 h-2 rounded-full bg-[#138808]" />
        </div>
      </div>

      {/* 3. Middle Section: Hologram Photo Box + Clean Spec Sheet */}
      <div className="relative mt-2.5 px-5 z-10 grid grid-cols-12 gap-3.5 items-center">
        {/* Photo Box (Cols 1-5) */}
        <div className="col-span-5 flex flex-col items-center">
          <div className="relative p-1 rounded-2xl bg-gradient-to-tr from-[#FF9933] via-[#000080] to-[#138808] shadow-md">
            <div className="w-[120px] h-[140px] sm:w-[130px] sm:h-[152px] rounded-xl overflow-hidden bg-slate-100 border-2 border-white">
              <img
                src={data.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'}
                alt={data.name || 'Citizen'}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            </div>
            {/* Tech Scan Line Overlay */}
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[7px] font-bold">
              ID PASS
            </div>
          </div>

          {/* Masked Phone Box */}
          <div className="mt-1.5 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-300 text-center w-full max-w-[130px]">
            <span className="font-mono text-[9px] font-bold text-slate-800 tracking-wider block">
              {formatMaskedPhone(data.phone)}
            </span>
          </div>
        </div>

        {/* Right Info Matrix (Cols 6-12) */}
        <div className="col-span-7 space-y-1.5">
          {/* NAME */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1">
            <span className="block font-mono text-[7px] font-bold uppercase tracking-wider text-slate-500">
              NAME OF HOLDER
            </span>
            <div className="font-montserrat font-extrabold text-[14px] sm:text-[16px] text-slate-900 truncate">
              {data.name || 'Mr Sawn Kumar'}
            </div>
          </div>

          {/* ID NUMBER */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1">
            <span className="block font-mono text-[7px] font-bold uppercase tracking-wider text-slate-500">
              UNIQUE CITIZEN ID
            </span>
            <div className="font-mono font-bold text-[11.5px] sm:text-[12.5px] text-[#000080] tracking-wider truncate">
              {data.idNumber || 'IND-15AUG-2026-08765'}
            </div>
          </div>

          {/* DOB & ROLE Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-2 py-1">
              <span className="block font-mono text-[6.5px] font-bold uppercase tracking-wider text-slate-500">
                DATE OF BIRTH
              </span>
              <div className="font-montserrat font-bold text-[10px] sm:text-[11px] text-slate-800 truncate">
                {data.dob || '14 February 2006'}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-2 py-1">
              <span className="block font-mono text-[6.5px] font-bold uppercase tracking-wider text-slate-500">
                DESIGNATION
              </span>
              <div className="font-montserrat font-bold text-[10px] sm:text-[11px] text-emerald-700 truncate">
                {data.role || 'Proud Citizen'}
              </div>
            </div>
          </div>

          {/* DATE & PLACE */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-2 py-1">
              <span className="block font-mono text-[6.5px] font-bold uppercase tracking-wider text-slate-500">
                ISSUE DATE
              </span>
              <div className="font-montserrat font-semibold text-[10px] sm:text-[11px] text-slate-800 truncate">
                {data.date || '15 August 2026'}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-2 py-1">
              <span className="block font-mono text-[6.5px] font-bold uppercase tracking-wider text-slate-500">
                LOCATION
              </span>
              <div className="font-montserrat font-semibold text-[10px] sm:text-[11px] text-slate-800 truncate">
                {data.place || 'India'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Lower Security Badge & Signature */}
      <div className="relative mt-2 px-5 z-10 grid grid-cols-12 gap-2 items-center">
        {/* Certificate banner */}
        <div className="col-span-4">
          <div className="bg-gradient-to-r from-orange-50 to-green-50 border border-slate-200 rounded-xl p-1.5 text-center">
            <span className="font-montserrat font-bold text-[7.5px] text-slate-800 uppercase block truncate">
              {data.bannerText || 'CERTIFICATE OF PARTICIPATION'}
            </span>
            <span className="font-mono text-[6.5px] text-slate-500 font-semibold block mt-0.5">
              OFFICIAL ENTRY
            </span>
          </div>
        </div>

        {/* Star Badge */}
        <div className="col-span-4 flex justify-center">
          <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-orange-500 via-blue-900 to-green-600 p-[1px] shadow-sm">
            <div className="bg-white px-2 py-0.5 rounded-[11px] text-center">
              <span className="font-montserrat font-black text-[7.5px] text-[#000080] tracking-wider block">
                PROUD INDIAN
              </span>
              <span className="font-mono text-[6px] text-slate-500 font-bold block">
                ★ 1947 - 2026 ★
              </span>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="col-span-4 text-center">
          <div className="font-signature text-[21px] sm:text-[23px] text-[#000080] leading-none select-none">
            {data.signatoryName || 'Sawvan'}
          </div>
          <div className="w-full h-[1px] bg-slate-300 my-0.5" />
          <span className="font-mono text-[6.5px] font-bold text-slate-700 uppercase tracking-wider block">
            {data.signatoryTitle || 'AUTHORIZED SIGNATURE'}
          </span>
          <span className="font-montserrat text-[7px] text-slate-500 font-semibold block truncate">
            {data.signatoryAuthority || 'Government of India'}
          </span>
        </div>
      </div>

      {/* 5. Bottom Digital Strip with QR & National Slogan */}
      <div className="absolute bottom-0 left-0 right-0 h-9 bg-slate-900 text-white flex items-center justify-between px-3 z-30">
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
          <span className="font-montserrat font-black text-[9.5px] text-amber-400 tracking-widest whitespace-nowrap">
            VANDE MATARAM
          </span>
          <span className="text-slate-600 text-[9px]">|</span>
          <span className="font-mono font-medium text-[7.5px] tracking-wider text-slate-300 uppercase truncate">
            {data.mottoText || 'UNITY • DISCIPLINE • UNITY • PROGRESS'}
          </span>
        </div>
      </div>
    </div>
  );
};
