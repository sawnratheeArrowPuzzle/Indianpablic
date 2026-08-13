import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { StudentData } from '../types';
import { AshokaChakraSvg } from './AshokaChakraSvg';
import { LionEmblemSvg } from './LionEmblemSvg';
import { AzadiMahotsavSvg } from './AzadiMahotsavSvg';
import { ProudIndianBadge } from './ProudIndianBadge';
import { IndianMonumentsSilhouette } from './IndianMonumentsSilhouette';
import { formatMaskedPhone } from '../utils/storage';
import { CardThemeRoyalGold } from './CardThemeRoyalGold';
import { CardThemeModernDigital } from './CardThemeModernDigital';
import { CardThemeVintageHeritage } from './CardThemeVintageHeritage';

interface IndependenceCardProps {
  data: StudentData;
  cardRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
  isPrintMode?: boolean;
}

export const IndependenceCard: React.FC<IndependenceCardProps> = ({
  data,
  cardRef,
  className = '',
  isPrintMode = false,
}) => {
  if (data.theme === 'royal_gold') {
    return <CardThemeRoyalGold data={data} cardRef={cardRef} className={className} isPrintMode={isPrintMode} />;
  }

  if (data.theme === 'modern_digital') {
    return <CardThemeModernDigital data={data} cardRef={cardRef} className={className} isPrintMode={isPrintMode} />;
  }

  if (data.theme === 'vintage_khadi') {
    return <CardThemeVintageHeritage data={data} cardRef={cardRef} className={className} isPrintMode={isPrintMode} />;
  }

  return (
    <div
      ref={cardRef}
      id="independence-id-card"
      className={`relative bg-gradient-to-b from-[#FFFFFF] via-[#FAF9F5] to-[#F3EFE6] text-slate-800 rounded-2xl overflow-hidden border-2 border-amber-800/20 mx-auto select-none ${className}`}
      style={{
        width: '100%',
        maxWidth: '560px',
        aspectRatio: '1 / 1.53',
        boxShadow: isPrintMode
          ? 'none'
          : '0 25px 60px -15px rgba(11, 30, 54, 0.35), 0 0 0 1px rgba(180, 83, 9, 0.15)',
      }}
    >
      {/* Subtle Security Guilloche Background Weave */}
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="guillochePattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 20 Q 10 0, 20 20 T 40 20" fill="none" stroke="#0B1E36" strokeWidth="0.75" />
              <path d="M0 20 Q 10 40, 20 20 T 40 20" fill="none" stroke="#B45309" strokeWidth="0.75" />
              <circle cx="20" cy="20" r="12" fill="none" stroke="#138808" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#guillochePattern)" />
        </svg>
      </div>

      {/* 1. TOP-LEFT & LEFT SWEEPING TRICOLOR FLAG RIBBON */}
      <div className="absolute top-0 left-0 w-44 h-72 pointer-events-none z-10 overflow-hidden">
        <svg
          viewBox="0 0 200 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          {/* Deep Flag Wave - Saffron */}
          <path
            d="M-10,-10 L130,-10 C95,45 60,85 45,140 C30,195 10,250 -10,290 Z"
            fill="url(#saffronWaveTop)"
          />
          {/* White Stripe Wave */}
          <path
            d="M-10,40 C30,60 55,100 42,165 C30,220 5,270 -10,305 L-10,290 C10,250 30,195 45,140 C60,85 95,45 130,-10 L155,-10 C120,50 80,95 62,160 C46,225 15,280 -10,320 Z"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="0.4"
          />
          {/* Green Lower Stripe */}
          <path
            d="M-10,120 C18,140 40,185 28,245 C18,290 2,320 -10,335 L-10,320 C15,280 46,225 62,160 C80,95 120,50 155,-10 L175,-10 C140,55 95,105 76,175 C56,245 22,305 -10,350 Z"
            fill="url(#greenWaveTop)"
          />

          <defs>
            <linearGradient id="saffronWaveTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF7A00" />
              <stop offset="60%" stopColor="#FF9933" />
              <stop offset="100%" stopColor="#FFB366" />
            </linearGradient>
            <linearGradient id="greenWaveTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B6623" />
              <stop offset="60%" stopColor="#138808" />
              <stop offset="100%" stopColor="#2EBD1E" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 2. TOP HEADER SECTION */}
      <div className="relative pt-2.5 px-6 z-20">
        {/* Top Header Row: Center Emblem + Right Azadi Ka Amrit Mahotsav Logo */}
        <div className="flex items-start justify-between relative pl-8">
          {/* Invisible spacer for left balance */}
          <div className="w-12 h-4"></div>

          {/* Center: Tricolor Ribbon Wings with Ashoka Chakra in Center */}
          <div className="flex flex-col items-center justify-center -mt-1.5">
            <div className="relative flex items-center justify-center">
              <svg width="140" height="38" viewBox="0 0 150 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Saffron Arch Wings */}
                <path
                  d="M10 24 C35 6 60 14 75 18 C90 14 115 6 140 24 C120 12 95 18 75 22 C55 18 30 12 10 24 Z"
                  fill="#FF9933"
                />
                {/* White Center Arch */}
                <path
                  d="M14 26 C38 12 62 18 75 22 C88 18 112 12 136 26 C118 17 93 22 75 25 C57 22 32 17 14 26 Z"
                  fill="#FFFFFF"
                  stroke="#E2E8F0"
                  strokeWidth="0.5"
                />
                {/* Green Lower Arch */}
                <path
                  d="M18 28 C41 18 64 22 75 25 C86 22 109 18 132 28 C115 22 92 25 75 28 C58 25 35 22 18 28 Z"
                  fill="#138808"
                />
              </svg>
              {/* Blue Ashoka Chakra in Center */}
              <div className="absolute top-0.5 left-1/2 -translate-x-1/2">
                <AshokaChakraSvg size={21} color="#000080" />
              </div>
            </div>
          </div>

          {/* Right: 80 Azadi Ka Amrit Mahotsav Logo */}
          <div className="flex justify-end -mt-1.5">
            <AzadiMahotsavSvg size={76} yearNumber="80" />
          </div>
        </div>

        {/* 3. HEADLINE: 15TH AUGUST INDEPENDENCE DAY */}
        <div className="text-center -mt-0.5">
          {/* "15TH AUGUST" */}
          <h1 className="font-cinzel text-[30px] sm:text-[34px] font-black tracking-wide text-[#0B1E36] leading-none flex items-center justify-center">
            <span>15</span>
            <span className="text-[18px] sm:text-[20px] font-bold align-super -mt-2.5 mx-0.5 font-cinzel">TH</span>
            <span className="ml-1.5">AUGUST</span>
          </h1>

          {/* "INDEPENDENCE DAY" */}
          <h2 className="font-montserrat text-[15px] sm:text-[17px] font-extrabold tracking-[0.22em] text-[#065F46] mt-0.5 uppercase">
            {data.eventTitle || 'INDEPENDENCE DAY'}
          </h2>

          {/* Decorative Divider with YEAR (e.g. 2026) */}
          <div className="flex items-center justify-center gap-3 my-1 px-10">
            <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-[#FF9933] to-[#FF9933] rounded-full"></div>
            <span className="font-cinzel font-black text-[19px] sm:text-[21px] text-[#FF8500] tracking-wider px-1 leading-none">
              {data.year || '2026'}
            </span>
            <div className="flex-1 h-[2px] bg-gradient-to-r from-[#138808] via-[#138808] to-transparent rounded-full"></div>
          </div>

          {/* Navy Blue Banner Ribbon: CERTIFICATE OF PARTICIPATION */}
          <div className="relative inline-block w-[92%] my-0.5">
            <div className="relative bg-[#0D254C] text-white py-0.5 px-6 shadow-md mx-3">
              {/* Swallowtail cut on Left */}
              <div
                className="absolute top-0 -left-3 w-3 h-full bg-[#0D254C]"
                style={{
                  clipPath: 'polygon(100% 0, 100% 100%, 0 50%)',
                }}
              />
              {/* Swallowtail cut on Right */}
              <div
                className="absolute top-0 -right-3 w-3 h-full bg-[#0D254C]"
                style={{
                  clipPath: 'polygon(0 0, 0 100%, 100% 50%)',
                }}
              />
              <p className="font-montserrat font-bold text-[10px] sm:text-[11.5px] tracking-[0.2em] text-white uppercase text-center">
                {data.bannerText || 'CERTIFICATE OF PARTICIPATION'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MAIN BODY: STUDENT PHOTO & DATA FIELDS - POSITIONED HIGHER UP */}
      <div className="relative px-6 pt-1 pb-1 z-20 grid grid-cols-12 gap-4 items-center">
        {/* Left Column (Cols 1-5): Student Photo Card */}
        <div className="col-span-5 flex flex-col items-center">
          <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 border-2 border-white/90 shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
            <img
              src={data.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'}
              alt={data.name || 'Citizen'}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                (e.target as HTMLElement).setAttribute(
                  'src',
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'
                );
              }}
            />
            {/* Subtle inner highlight */}
            <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl pointer-events-none" />
          </div>
        </div>

        {/* Right Column (Cols 6-12): Metadata Fields exactly matching the photo */}
        <div className="col-span-7 flex flex-col justify-between space-y-1.5 pt-0">
          {/* FIELD 1: NAME */}
          <div className="relative">
            <span className="block font-montserrat text-[8.5px] sm:text-[9px] font-extrabold tracking-wider text-[#065F46] uppercase leading-tight">
              NAME
            </span>
            <div className="font-montserrat font-bold text-[15px] sm:text-[17px] text-[#0B1E36] leading-tight tracking-tight truncate">
              {data.name || 'Mr Sawn Kumar'}
            </div>
            {/* Decorative Underline with Orange Dot at Right */}
            <div className="relative w-full h-[1.5px] bg-slate-300 mt-0.5">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#FF9933] shadow-xs" />
            </div>
          </div>

          {/* FIELD 2: MOBILE / PHONE NUMBER */}
          <div className="relative">
            <span className="block font-montserrat text-[8.5px] sm:text-[9px] font-extrabold tracking-wider text-[#065F46] uppercase leading-tight">
              MOBILE NO.
            </span>
            <div className="font-montserrat font-bold text-[11.5px] sm:text-[13px] text-[#0F172A] tracking-wider font-mono truncate">
              {formatMaskedPhone(data.phone)}
            </div>
            {/* Decorative Underline with Green Dot at Right */}
            <div className="relative w-full h-[1.5px] bg-slate-300 mt-0.5">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#138808] shadow-xs" />
            </div>
          </div>

          {/* FIELD 3: ID NUMBER */}
          <div className="relative">
            <span className="block font-montserrat text-[8.5px] sm:text-[9px] font-extrabold tracking-wider text-[#065F46] uppercase leading-tight">
              ID NUMBER
            </span>
            <div className="font-montserrat font-bold text-[11.5px] sm:text-[13px] text-[#0F172A] tracking-wider truncate">
              {data.idNumber || 'IND-15AUG-2026-08765'}
            </div>
            {/* Decorative Underline with Orange Dot at Right */}
            <div className="relative w-full h-[1.5px] bg-slate-300 mt-0.5">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#FF9933] shadow-xs" />
            </div>
          </div>

          {/* FIELD 4: DOB */}
          <div className="relative">
            <span className="block font-montserrat text-[8.5px] sm:text-[9px] font-extrabold tracking-wider text-[#065F46] uppercase leading-tight">
              DOB
            </span>
            <div className="font-montserrat font-medium text-[11.5px] sm:text-[12.5px] text-[#0F172A] truncate">
              {data.dob || '01/01/2007'}
            </div>
            {/* Decorative Underline with Green Dot at Right */}
            <div className="relative w-full h-[1.5px] bg-slate-300 mt-0.5">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#138808] shadow-xs" />
            </div>
          </div>

          {/* FIELD 5: ROLE */}
          <div className="relative">
            <span className="block font-montserrat text-[8.5px] sm:text-[9px] font-extrabold tracking-wider text-[#065F46] uppercase leading-tight">
              ROLE
            </span>
            <div className="font-montserrat font-semibold text-[11.5px] sm:text-[12.5px] text-[#0F172A] truncate">
              {data.role || 'Proud Citizen'}
            </div>
            {/* Decorative Underline with Orange Dot at Right */}
            <div className="relative w-full h-[1.5px] bg-slate-300 mt-0.5">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#FF9933] shadow-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* 5. MONUMENTS BACKGROUND SILHOUETTE (Historic monuments of India) */}
      <div className="absolute bottom-9 left-0 right-0 z-0 pointer-events-none">
        <IndianMonumentsSilhouette className="w-full" />
      </div>

      {/* 6. LOWER INFO ROW: DATE/PLACE + GOLD STARBURST MEDAL BADGE + SIGNATURE/EMBLEM */}
      <div className="relative px-6 pt-1 pb-1 z-20 grid grid-cols-12 items-center gap-2">
        {/* Left (Cols 1-4): DATE & PLACE */}
        <div className="col-span-4 space-y-2">
          {/* DATE */}
          <div className="relative">
            <span className="block font-montserrat text-[9.5px] font-extrabold tracking-wider text-[#065F46] uppercase leading-none">
              DATE
            </span>
            <div className="font-montserrat font-medium text-[12px] sm:text-[13px] text-[#0F172A] mt-0.5">
              {data.date || '15 August 2026'}
            </div>
            <div className="relative w-full h-[1.5px] bg-slate-300 mt-0.5">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#FF9933]" />
            </div>
          </div>

          {/* PLACE */}
          <div className="relative">
            <span className="block font-montserrat text-[9.5px] font-extrabold tracking-wider text-[#065F46] uppercase leading-none">
              PLACE
            </span>
            <div className="font-montserrat font-semibold text-[12px] sm:text-[13px] text-[#0F172A] mt-0.5">
              {data.place || 'India'}
            </div>
            <div className="relative w-full h-[1.5px] bg-slate-300 mt-0.5">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#138808]" />
            </div>
          </div>
        </div>

        {/* Center (Cols 5-8): PROUD TO BE AN INDIAN GOLD STARBURST BADGE */}
        <div className="col-span-4 flex justify-center -my-2">
          <ProudIndianBadge
            size={120}
            badgeTitle={data.badgeTitle || 'PROUD'}
            badgeSubtitle={data.badgeSubtitle || 'TO BE AN'}
            badgeCategory={data.badgeCategory || 'INDIAN'}
          />
        </div>

        {/* Right (Cols 9-12): SIGNATURE & AUTHORIZED GOVT/SCHOOL EMBLEM */}
        <div className="col-span-4 flex flex-col items-center text-center">
          {/* Signature */}
          <div className="w-full flex flex-col items-center">
            <div className="font-signature text-[22px] sm:text-[25px] text-[#0B1E36] leading-none select-none tracking-wide -mb-1">
              {data.signatoryName || 'Sawvan'}
            </div>
            <div className="w-full h-[1px] bg-slate-400 my-0.5" />
            <span className="font-montserrat text-[7.5px] font-extrabold tracking-wider text-[#065F46] uppercase leading-tight">
              {data.signatoryTitle || 'AUTHORIZED SIGNATURE'}
            </span>
            <span className="font-montserrat text-[9px] font-bold text-[#0B1E36] leading-tight">
              {data.signatoryAuthority || 'Government of India'}
            </span>
          </div>

          {/* Lion Capital State Emblem */}
          <div className="mt-1">
            <LionEmblemSvg size={38} color="#1E293B" />
          </div>
        </div>
      </div>

      {/* 7. BOTTOM-RIGHT SWEEPING TRICOLOR FLAG WAVE & ASHOKA CHAKRA */}
      <div className="absolute bottom-8 right-0 w-48 h-36 pointer-events-none z-10 overflow-hidden">
        <svg
          viewBox="0 0 240 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Saffron lower wave */}
          <path
            d="M240,40 C170,80 110,130 60,180 L240,180 Z"
            fill="url(#saffronWaveBottom)"
          />
          {/* White middle wave */}
          <path
            d="M240,75 C180,105 130,145 90,180 L240,180 Z"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="0.5"
          />
          {/* Green bottom wave */}
          <path
            d="M240,110 C190,130 150,158 120,180 L240,180 Z"
            fill="url(#greenWaveBottom)"
          />

          <defs>
            <linearGradient id="saffronWaveBottom" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF9933" />
              <stop offset="100%" stopColor="#FF7700" />
            </linearGradient>
            <linearGradient id="greenWaveBottom" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#138808" />
            </linearGradient>
          </defs>
        </svg>

        {/* Ashoka Chakra positioned on top of the bottom-right flag wave */}
        <div className="absolute bottom-2 right-9 z-20">
          <AshokaChakraSvg size={38} color="#000080" />
        </div>
      </div>

      {/* 8. SOLID NAVY BOTTOM FOOTER BAR */}
      <div className="absolute bottom-0 left-0 right-0 h-9 bg-[#0B1E36] text-white flex items-center justify-between px-3 z-30 shadow-lg">
        {/* Left: Scannable QR Code */}
        <div className="bg-white p-0.5 rounded shadow-sm flex items-center justify-center">
          <QRCodeSVG
            value={
              data.qrData ||
              `https://verify.gov.in/cert/${data.idNumber || 'IND-15AUG-2026-08765'}?name=${encodeURIComponent(
                data.name || 'Mr Sawn Kumar'
              )}&phone=${data.phone || ''}&dob=${encodeURIComponent(data.dob || '')}`
            }
            size={24}
            level="M"
          />
        </div>

        {/* Center / Right: Motto & Slogan */}
        <div className="flex-1 flex items-center justify-center space-x-2 pl-2 overflow-hidden text-center">
          <span className="font-cinzel font-black text-[10px] sm:text-[11px] text-[#FF9933] tracking-widest whitespace-nowrap">
            JAI HIND
          </span>
          <span className="text-slate-400 text-[10px]">|</span>
          <span className="font-montserrat font-medium text-[7.5px] sm:text-[8.5px] tracking-[0.18em] text-slate-200 uppercase truncate">
            {data.mottoText || 'UNITY • DISCIPLINE • UNITY • PROGRESS'}
          </span>
        </div>
      </div>
    </div>
  );
};

