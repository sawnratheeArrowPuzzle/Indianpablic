import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  GraduationCap, 
  Calendar, 
  Award,
  BookOpen,
  User
} from 'lucide-react';
import { LionEmblemSvg } from '../LionEmblemSvg';
import { AshokaChakraSvg } from '../AshokaChakraSvg';

export interface StudentIdCardData {
  studentId: string;
  name: string;
  className: string;
  section: string;
  rollNumber: string;
  dob: string;
  bloodGroup?: string;
  photoUrl?: string;
  schoolName: string;
  affiliationCode: string;
  schoolLogoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  guardianName?: string;
  qrVerificationToken?: string;
  academicYear?: string;
  signatoryTitle?: string;
  signatoryName?: string;
}

interface StudentIdCardProps {
  data: StudentIdCardData;
  isBackView?: boolean;
  onFlip?: () => void;
  isPrintMode?: boolean;
}

export const StudentIdCard: React.FC<StudentIdCardProps> = ({ 
  data, 
  isBackView = false,
  onFlip,
  isPrintMode = false
}) => {
  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?verify=${encodeURIComponent(data.qrVerificationToken || data.studentId)}`
    : `https://indianpublic.netlify.app/?verify=${encodeURIComponent(data.qrVerificationToken || data.studentId)}`;

  if (isBackView) {
    return (
      <div 
        id="student-id-card-back" 
        className="w-[330px] sm:w-[350px] h-[520px] rounded-3xl bg-gradient-to-b from-[#081526] via-[#0E2442] to-[#06101E] text-white p-5 flex flex-col justify-between relative overflow-hidden border-2 border-amber-400 shadow-2xl font-poppins selection:bg-amber-400 selection:text-slate-900"
      >
        {/* Top National Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

        {/* Watermark Emblem */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <AshokaChakraSvg size={280} color="#FFD700" />
        </div>

        {/* Back Header */}
        <div className="pt-2 text-center border-b border-amber-400/30 pb-2.5 relative z-10">
          <span className="text-[9px] font-extrabold tracking-widest text-amber-400 uppercase">
            STUDENT IDENTITY & GUARDIAN DIRECTORY
          </span>
          <h4 className="font-montserrat font-bold text-xs text-slate-200 mt-0.5">
            संस्थागत छात्र नियमावली एवं आपातकालीन संपर्क
          </h4>
        </div>

        {/* Address & Emergency Info */}
        <div className="space-y-3 my-auto relative z-10 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-start space-x-2 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-amber-400 block uppercase">विद्यालय (Institution)</span>
                <span className="font-bold text-white text-[11px] leading-tight block">{data.schoolName}</span>
                <span className="text-[9.5px] text-slate-300 block font-mono">Code: {data.affiliationCode}</span>
              </div>
            </div>

            <div className="flex items-start space-x-2 text-slate-300 pt-1.5 border-t border-white/10">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-amber-400 block uppercase">परिसर पता (Campus)</span>
                <span className="text-[10.5px] text-slate-200 line-clamp-2">{data.address || 'Central School Campus, New Delhi'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-slate-300 pt-1 border-t border-white/10">
              <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10.5px] text-slate-200">{data.phone || '+91 11 2345 6789'}</span>
              </div>
            </div>
          </div>

          {/* Student Rules & Notice */}
          <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-[9.5px] text-slate-300 leading-relaxed">
            <p className="font-semibold text-amber-300">महत्वपूर्ण निर्देश (STUDENT INSTRUCTIONS):</p>
            <p className="mt-0.5 text-slate-300">
              1. यह पहचान पत्र विद्यालय परिसर में सदैव धारण करना अनिवार्य है।
            </p>
            <p className="text-slate-300">
              2. कार्ड खो जाने पर तत्काल विद्यालय प्रशासन को सूचित करें।
            </p>
          </div>
        </div>

        {/* Back Footer: Authority Signature */}
        <div className="pt-2 border-t border-amber-400/30 flex items-center justify-between relative z-10">
          <div className="text-left">
            <span className="text-[8.5px] text-slate-400 block uppercase">अधिकृत प्रमाणन</span>
            <span className="text-[9.5px] font-bold text-amber-300 font-montserrat">INDIANPUBLIC ID</span>
          </div>

          <div className="text-center">
            <div className="w-16 h-6 border-b border-amber-400/80 mx-auto mb-0.5 flex items-end justify-center">
              <span className="font-serif italic text-xs text-amber-200 font-bold">
                {data.signatoryName || 'Principal'}
              </span>
            </div>
            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wider block">
              {data.signatoryTitle || 'Principal / Issuing Authority'}
            </span>
          </div>
        </div>

        {/* Bottom National Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />
      </div>
    );
  }

  // Front View
  return (
    <div 
      id="student-id-card-front" 
      className="w-[330px] sm:w-[350px] h-[520px] rounded-3xl bg-gradient-to-b from-[#0A1B30] via-[#102948] to-[#071322] text-white p-5 flex flex-col justify-between relative overflow-hidden border-2 border-amber-400 shadow-2xl font-poppins selection:bg-amber-400 selection:text-slate-900"
    >
      {/* Top National Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

      {/* Decorative Gold Header Corner Accents */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-400/80" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-400/80" />

      {/* Watermark Emblem */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <AshokaChakraSvg size={280} color="#FFD700" />
      </div>

      {/* 1. Header Banner */}
      <div className="pt-2 text-center relative z-10 border-b border-amber-400/40 pb-2.5">
        <div className="flex items-center justify-center space-x-1.5 mb-1">
          <LionEmblemSvg size={22} color="#FFD700" />
          <span className="text-[9.5px] font-extrabold tracking-widest text-amber-400 uppercase">
            आधिकारिक छात्र पहचान पत्र
          </span>
        </div>
        <h3 className="font-montserrat font-black text-xs sm:text-[13px] text-white tracking-wide leading-tight px-1 truncate">
          {data.schoolName}
        </h3>
        <span className="text-[9px] font-semibold text-amber-300 block mt-0.5 tracking-wider font-mono">
          AFFILIATION: {data.affiliationCode}
        </span>
      </div>

      {/* 2. Middle Section: Photo & Details */}
      <div className="flex items-center space-x-3.5 my-auto relative z-10 py-1">
        {/* Photo with Gold Frame */}
        <div className="relative shrink-0">
          <div className="w-24 h-32 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl bg-slate-800 relative group">
            {data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt={data.name}
                className="w-full h-full object-cover object-top"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400">
                <User className="w-10 h-10 text-slate-500 mb-1" />
                <span className="text-[9px] font-bold text-slate-400">No Photo</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Verified Student Badge */}
          <div className="absolute -bottom-2 -right-1 bg-emerald-600 text-white rounded-full p-1 border border-white shadow-md">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Identity Details */}
        <div className="flex-1 min-w-0 space-y-1.5 text-left">
          <div>
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block">छात्र (STUDENT)</span>
            <h2 className="font-montserrat font-black text-sm sm:text-base text-white tracking-wide truncate">
              {data.name}
            </h2>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
              <span className="text-slate-400 text-[10.5px]">कक्षा (Class):</span>
              <span className="font-bold text-amber-300 text-[11px]">{data.className} - {data.section}</span>
            </div>

            <div className="flex items-center justify-between bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
              <span className="text-slate-400 text-[10.5px]">अनुक्रमांक (Roll):</span>
              <span className="font-bold text-white text-[11px] font-mono">{data.rollNumber}</span>
            </div>

            <div className="flex items-center justify-between bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
              <span className="text-slate-400 text-[10.5px]">जन्म तिथि (DOB):</span>
              <span className="font-semibold text-slate-200 text-[10.5px]">{data.dob}</span>
            </div>

            {data.bloodGroup && (
              <div className="flex items-center justify-between bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                <span className="text-slate-400 text-[10.5px]">रक्त समूह (Blood):</span>
                <span className="font-bold text-red-300 text-[10.5px] font-mono">{data.bloodGroup}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Barcode/QR & Verification Footer */}
      <div className="pt-2 border-t border-amber-400/40 relative z-10 flex items-center justify-between gap-2">
        <div className="space-y-1">
          <div>
            <span className="text-[8.5px] font-bold text-slate-400 block uppercase">छात्र ID (STUDENT ID)</span>
            <span className="font-mono font-bold text-xs text-amber-300 tracking-wider">
              {data.studentId}
            </span>
          </div>

          <div className="flex items-center space-x-1 text-[9px] text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>सत्यापित पहचान (VERIFIED)</span>
          </div>

          <div className="text-[8px] text-slate-400">
            सत्र: {data.academicYear || '2026-2027'}
          </div>
        </div>

        {/* Unique Verification QR Code */}
        <div className="p-1.5 bg-white rounded-xl shadow-lg border border-amber-400 shrink-0">
          <QRCodeSVG
            value={verificationUrl}
            size={56}
            level="M"
            includeMargin={false}
            fgColor="#0A1B30"
          />
        </div>
      </div>

      {/* Bottom National Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />
    </div>
  );
};
