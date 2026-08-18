import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Award, Building2, Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react';
import { LionEmblemSvg } from '../LionEmblemSvg';
import { AshokaChakraSvg } from '../AshokaChakraSvg';

export interface AdminCardData {
  adminId: string;
  name: string;
  roleTitle: string; // e.g. "Principal & Chief Administrator"
  schoolName: string;
  affiliationCode: string;
  phone: string;
  email: string;
  address: string;
  photoUrl: string;
  issueDate?: string;
  validTill?: string;
  signatoryName?: string;
  signatoryTitle?: string;
}

interface AdminIdCardProps {
  data: AdminCardData;
  isBackView?: boolean;
}

export const AdminIdCard: React.FC<AdminIdCardProps> = ({ data, isBackView = false }) => {
  const qrData = JSON.stringify({
    type: 'INDIANPUBLIC_ADMIN_CREDENTIAL',
    id: data.adminId,
    name: data.name,
    school: data.schoolName,
    role: data.roleTitle,
    code: data.affiliationCode,
    verified: true,
  });

  if (isBackView) {
    return (
      <div className="w-[330px] sm:w-[350px] h-[520px] rounded-3xl bg-gradient-to-b from-[#0B1E36] via-[#102A4C] to-[#081526] text-white p-5 flex flex-col justify-between relative overflow-hidden border-2 border-amber-400/60 shadow-2xl font-poppins selection:bg-amber-400 selection:text-slate-900">
        {/* Top National Colors Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

        {/* Watermark Emblem */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <LionEmblemSvg size={280} color="#FFD700" />
        </div>

        {/* Back Header */}
        <div className="pt-2 text-center border-b border-amber-400/30 pb-2.5 relative z-10">
          <span className="text-[9px] font-extrabold tracking-widest text-amber-400 uppercase">
            INSTITUTIONAL ADMINISTRATION DIRECTORY
          </span>
          <h4 className="font-montserrat font-bold text-xs text-slate-200 mt-0.5">
            प्रशासनिक कार्यालय एवं संपर्क विवरण
          </h4>
        </div>

        {/* Address & Contact Details */}
        <div className="space-y-3 my-auto relative z-10 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="flex items-start space-x-2 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-amber-400 block uppercase">संस्था (Institution)</span>
                <span className="font-bold text-white text-[11px]">{data.schoolName}</span>
                <span className="text-[10px] text-slate-300 block">Affiliation: {data.affiliationCode}</span>
              </div>
            </div>

            <div className="flex items-start space-x-2 text-slate-300 pt-1 border-t border-white/10">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-amber-400 block uppercase">पता (Address)</span>
                <span className="text-[11px] text-slate-200">{data.address || 'Institutional Campus, New Delhi'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-slate-300 pt-1 border-t border-white/10">
              <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-200">{data.phone}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-slate-300">
              <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-200 truncate max-w-[240px] block">{data.email}</span>
              </div>
            </div>
          </div>

          {/* Terms & Regulations */}
          <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-[9.5px] text-slate-300 leading-relaxed">
            <p className="font-semibold text-amber-300">नियम एवं शर्तें (TERMS OF ISSUANCE):</p>
            <p className="mt-0.5 text-slate-300">
              यह कार्ड संस्थागत प्रशासनिक उपयोग के लिए मान्य है। स्थानांतरण या सेवानिवृत्ति पर इसे संस्था को लौटाना अनिवार्य है।
            </p>
          </div>
        </div>

        {/* Back Footer: Authority & Official Seal */}
        <div className="pt-2 border-t border-amber-400/30 flex items-center justify-between relative z-10">
          <div className="text-left">
            <span className="text-[9px] text-slate-400 block uppercase">जारीकर्ता प्राधिकरण</span>
            <span className="text-[10px] font-bold text-amber-300 font-montserrat">INDIANPUBLIC</span>
          </div>

          <div className="text-center">
            <div className="w-12 h-6 border-b border-amber-400/80 mx-auto mb-0.5 flex items-end justify-center">
              <span className="font-serif italic text-xs text-amber-200 font-bold">
                {data.signatoryName || 'Registrar'}
              </span>
            </div>
            <span className="text-[8.5px] font-bold text-slate-300 uppercase tracking-wider block">
              {data.signatoryTitle || 'Governing Authority'}
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
    <div className="w-[330px] sm:w-[350px] h-[520px] rounded-3xl bg-gradient-to-b from-[#0B1E36] via-[#102A4C] to-[#081526] text-white p-5 flex flex-col justify-between relative overflow-hidden border-2 border-amber-400 shadow-2xl font-poppins selection:bg-amber-400 selection:text-slate-900">
      {/* Top National Colors Ribbon */}
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
        <div className="flex items-center justify-center space-x-2 mb-1">
          <LionEmblemSvg size={24} color="#FFD700" />
          <span className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">
            केन्द्रीय संस्थागत प्रशासनिक पहचान पत्र
          </span>
        </div>
        <h3 className="font-montserrat font-black text-xs sm:text-[13px] text-white tracking-wide leading-tight px-1">
          {data.schoolName}
        </h3>
        <span className="text-[9.5px] font-semibold text-amber-300 block mt-0.5 tracking-wider font-mono">
          AFFILIATION CODE: {data.affiliationCode}
        </span>
      </div>

      {/* 2. Middle Section: Photo & Admin Identity */}
      <div className="flex flex-col items-center space-y-3 relative z-10 my-auto">
        {/* Profile Image with Golden Shield Frame */}
        <div className="relative">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-1 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-xl">
            <img
              src={data.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
              alt={data.name}
              className="w-full h-full rounded-xl object-cover"
            />
          </div>
          {/* Security Badge Ribbon */}
          <div className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-800 border border-amber-300 text-amber-100 text-[8.5px] font-black tracking-widest uppercase shadow-md flex items-center space-x-1">
            <Shield className="w-2.5 h-2.5" />
            <span>ADMINISTRATOR</span>
          </div>
        </div>

        {/* Admin Name & Role */}
        <div className="text-center pt-1.5 space-y-0.5 w-full">
          <h2 className="font-montserrat font-black text-base sm:text-lg text-white tracking-wide leading-tight">
            {data.name}
          </h2>
          <span className="text-[11px] font-bold text-amber-300 block">
            {data.roleTitle || 'Principal & Administrator'}
          </span>
          <span className="text-[10px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded-md inline-block mt-0.5 border border-white/10">
            ID: {data.adminId}
          </span>
        </div>

        {/* Verification QR & Quick Credentials Strip */}
        <div className="w-full p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2.5">
          <div className="p-1 rounded-xl bg-white shadow-md shrink-0">
            <QRCodeSVG value={qrData} size={50} level="M" />
          </div>

          <div className="text-left text-[10px] space-y-0.5 flex-1 min-w-0">
            <div className="flex items-center space-x-1 text-emerald-300 font-bold">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span className="truncate">VERIFIED CREDENTIAL</span>
            </div>
            <div className="text-slate-300 truncate">
              <span className="text-slate-400">Phone:</span> {data.phone}
            </div>
            <div className="text-slate-300 text-[9px]">
              <span className="text-slate-400">Valid:</span> 2026 - 2029
            </div>
          </div>
        </div>
      </div>

      {/* 3. Front Footer: Signatures & Hologram */}
      <div className="pt-2 border-t border-amber-400/40 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-1.5">
          <AshokaChakraSvg size={20} color="#FFD700" />
          <div>
            <span className="text-[8.5px] font-black tracking-widest text-amber-400 block uppercase">
              INDIANPUBLIC
            </span>
            <span className="text-[7.5px] text-slate-400 block">SECURE CREDENTIAL</span>
          </div>
        </div>

        <div className="text-center">
          <div className="w-16 h-5 border-b border-amber-400/80 mx-auto flex items-end justify-center">
            <span className="font-serif italic text-[11px] text-amber-200 font-bold">
              {data.name.split(' ')[0]}
            </span>
          </div>
          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wider block mt-0.5">
            हस्ताक्षर (SIGNATURE)
          </span>
        </div>
      </div>

      {/* Bottom National Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />
    </div>
  );
};
