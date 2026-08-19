import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BookOpen, Award, Building2, Phone, Mail, MapPin, CheckCircle2, GraduationCap } from 'lucide-react';
import { LionEmblemSvg } from '../LionEmblemSvg';
import { AshokaChakraSvg } from '../AshokaChakraSvg';

export interface TeacherCardData {
  teacherId: string;
  name: string;
  designation: string; // e.g. "TGT Science"
  schoolName: string;
  affiliationCode: string;
  assignedClasses: string[];
  phone: string;
  email: string;
  address?: string;
  photoUrl: string;
  signatoryName?: string;
  signatoryTitle?: string;
}

interface TeacherIdCardProps {
  data: TeacherCardData;
  isBackView?: boolean;
}

export const TeacherIdCard: React.FC<TeacherIdCardProps> = ({ data, isBackView = false }) => {
  const assignedList = Array.isArray(data.assignedClasses) ? data.assignedClasses : [];
  const qrData = JSON.stringify({
    type: 'INDIANPUBLIC_TEACHER_CREDENTIAL',
    id: data.teacherId || '',
    name: data.name || '',
    designation: data.designation || '',
    school: data.schoolName || '',
    classes: assignedList,
    verified: true,
  });

  if (isBackView) {
    return (
      <div className="w-[330px] sm:w-[350px] h-[520px] rounded-3xl bg-gradient-to-b from-[#064E3B] via-[#0B1E36] to-[#042F2E] text-white p-5 flex flex-col justify-between relative overflow-hidden border-2 border-emerald-400/60 shadow-2xl font-poppins selection:bg-emerald-400 selection:text-slate-900">
        {/* Top National Colors Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

        {/* Watermark Emblem */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <LionEmblemSvg size={280} color="#34D399" />
        </div>

        {/* Back Header */}
        <div className="pt-2 text-center border-b border-emerald-400/30 pb-2.5 relative z-10">
          <span className="text-[9px] font-extrabold tracking-widest text-emerald-300 uppercase">
            FACULTY DIRECTORY & CAMPUS INFORMATION
          </span>
          <h4 className="font-montserrat font-bold text-xs text-slate-200 mt-0.5">
            संस्थान संपर्क एवं सेवा शर्तें
          </h4>
        </div>

        {/* Details Card */}
        <div className="space-y-3 my-auto relative z-10 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="flex items-start space-x-2 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-emerald-300 block uppercase">विद्यालय (School)</span>
                <span className="font-bold text-white text-[11px]">{data.schoolName}</span>
                <span className="text-[10px] text-slate-300 block">Affiliation: {data.affiliationCode}</span>
              </div>
            </div>

            <div className="flex items-start space-x-2 text-slate-300 pt-1 border-t border-white/10">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-emerald-300 block uppercase">असाइन कक्षाएं (Assigned Classes)</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {assignedList.map(c => (
                    <span key={c} className="bg-emerald-500/20 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-400/30">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-slate-300 pt-1 border-t border-white/10">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-200">{data.phone}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-slate-300">
              <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-200 truncate max-w-[240px] block">{data.email}</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-[9.5px] text-slate-300 leading-relaxed">
            <p className="font-semibold text-emerald-300">संस्थागत निर्देश (INSTITUTIONAL NOTICE):</p>
            <p className="mt-0.5 text-slate-300">
              यह कार्ड शिक्षक की आधिकारिक पहचान हेतु जारी किया गया है। विद्यालय परिसर एवं शैक्षणिक गतिविधियों के दौरान इसे धारण करना अनिवार्य है।
            </p>
          </div>
        </div>

        {/* Back Footer: Principal Signature */}
        <div className="pt-2 border-t border-emerald-400/30 flex items-center justify-between relative z-10">
          <div className="text-left">
            <span className="text-[9px] text-slate-400 block uppercase">प्राचार्य अनुमोदन</span>
            <span className="text-[10px] font-bold text-emerald-300 font-montserrat">
              {data.signatoryName || 'Principal'}
            </span>
          </div>

          <div className="text-center">
            <div className="w-14 h-5 border-b border-emerald-400/80 mx-auto mb-0.5 flex items-end justify-center">
              <span className="font-serif italic text-xs text-emerald-200 font-bold">
                {data.signatoryName ? data.signatoryName.split(' ')[0] : 'Principal'}
              </span>
            </div>
            <span className="text-[8.5px] font-bold text-slate-300 uppercase tracking-wider block">
              {data.signatoryTitle || 'Head of Institution'}
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
    <div className="w-[330px] sm:w-[350px] h-[520px] rounded-3xl bg-gradient-to-b from-[#064E3B] via-[#0B1E36] to-[#042F2E] text-white p-5 flex flex-col justify-between relative overflow-hidden border-2 border-emerald-400 shadow-2xl font-poppins selection:bg-emerald-400 selection:text-slate-900">
      {/* Top National Colors Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

      {/* Decorative Corner Accents */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400/80" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400/80" />

      {/* Watermark Emblem */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <AshokaChakraSvg size={280} color="#34D399" />
      </div>

      {/* 1. Header Banner */}
      <div className="pt-2 text-center relative z-10 border-b border-emerald-400/40 pb-2.5">
        <div className="flex items-center justify-center space-x-2 mb-1">
          <LionEmblemSvg size={24} color="#34D399" />
          <span className="text-[10px] font-extrabold tracking-widest text-emerald-300 uppercase">
            शिक्षक एवं संकाय पहचान पत्र
          </span>
        </div>
        <h3 className="font-montserrat font-black text-xs sm:text-[13px] text-white tracking-wide leading-tight px-1">
          {data.schoolName}
        </h3>
        <span className="text-[9.5px] font-semibold text-emerald-300 block mt-0.5 tracking-wider font-mono">
          AFFILIATION CODE: {data.affiliationCode}
        </span>
      </div>

      {/* 2. Middle: Photo & Teacher Identity */}
      <div className="flex flex-col items-center space-y-3 relative z-10 my-auto">
        {/* Photo with Emerald/Gold Frame */}
        <div className="relative">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-1 bg-gradient-to-br from-emerald-300 via-teal-500 to-emerald-700 shadow-xl">
            <img
              src={data.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
              alt={data.name}
              className="w-full h-full rounded-xl object-cover"
            />
          </div>
          <div className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-700 to-teal-900 border border-emerald-300 text-emerald-100 text-[8.5px] font-black tracking-widest uppercase shadow-md flex items-center space-x-1">
            <BookOpen className="w-2.5 h-2.5" />
            <span>TEACHER / FACULTY</span>
          </div>
        </div>

        {/* Teacher Name & Designation */}
        <div className="text-center pt-1.5 space-y-0.5 w-full">
          <h2 className="font-montserrat font-black text-base sm:text-lg text-white tracking-wide leading-tight">
            {data.name}
          </h2>
          <span className="text-[11px] font-bold text-emerald-300 block">
            {data.designation}
          </span>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span className="text-[9.5px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
              ID: {data.teacherId}
            </span>
            <span className="text-[9.5px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/30">
              Class: {assignedList.join(', ')}
            </span>
          </div>
        </div>

        {/* Verification QR & Summary Strip */}
        <div className="w-full p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2.5">
          <div className="p-1 rounded-xl bg-white shadow-md shrink-0">
            <QRCodeSVG value={qrData} size={50} level="M" />
          </div>

          <div className="text-left text-[10px] space-y-0.5 flex-1 min-w-0">
            <div className="flex items-center space-x-1 text-emerald-300 font-bold">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span className="truncate">OFFICIAL FACULTY PASS</span>
            </div>
            <div className="text-slate-300 truncate">
              <span className="text-slate-400">Phone:</span> {data.phone}
            </div>
            <div className="text-slate-300 text-[9px]">
              <span className="text-slate-400">Academic:</span> 2026-2027
            </div>
          </div>
        </div>
      </div>

      {/* 3. Front Footer */}
      <div className="pt-2 border-t border-emerald-400/40 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-1.5">
          <AshokaChakraSvg size={20} color="#34D399" />
          <div>
            <span className="text-[8.5px] font-black tracking-widest text-emerald-300 block uppercase">
              INDIANPUBLIC
            </span>
            <span className="text-[7.5px] text-slate-400 block">FACULTY REGISTRY</span>
          </div>
        </div>

        <div className="text-center">
          <div className="w-16 h-5 border-b border-emerald-400/80 mx-auto flex items-end justify-center">
            <span className="font-serif italic text-[11px] text-emerald-200 font-bold">
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
