import React, { useState, useRef } from 'react';
import {
  User,
  Calendar,
  CreditCard,
  Upload,
  Camera,
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  Phone,
  MapPin,
  Download,
  FileDown,
  ArrowRight,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { StudentData } from '../types';

interface CardEditorProps {
  data: StudentData;
  onChange: (updated: Partial<StudentData>) => void;
  onResetToDefault: () => void;
  onApplyPreset?: (presetType: 'sample' | 'school' | 'republic') => void;
  onSubmitCard: () => void;
  onDownloadPng: () => void;
  onDownloadPdf: () => void;
  isSubmitted: boolean;
  isExporting: boolean;
}

export const CardEditor: React.FC<CardEditorProps> = ({
  data,
  onChange,
  onResetToDefault,
  onSubmitCard,
  onDownloadPng,
  onDownloadPdf,
  isSubmitted,
  isExporting,
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-generate random ID for student
  const generateNewId = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const newId = `IND-15AUG-${data.year || '2026'}-${randomNum}`;
    onChange({ idNumber: newId });
  };

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name || data.name.trim() === '') {
      setValidationError('कृपया नाम दर्ज करें (Please enter Name)');
      return;
    }
    if (!data.phone || data.phone.trim().length < 4) {
      setValidationError('कृपया मोबाइल नंबर दर्ज करें (Please enter Mobile Number)');
      return;
    }

    setValidationError(null);
    onSubmitCard();
  };

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange({ photoUrl: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Camera Capture
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('कैमरा शुरू नहीं हो सका। कृपया फोटो अपलोड करें।');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 480;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        onChange({ photoUrl: dataUrl });
      }
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  return (
    <div className="bg-[#FFFDF9] rounded-2xl border border-amber-900/15 p-5 shadow-lg text-slate-800">
      {/* Form Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-amber-900/10">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-800">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-montserrat font-bold text-sm sm:text-base text-[#0B1E36]">
              ID Card Form (आईडी कार्ड फॉर्म)
            </h2>
            <p className="text-[11px] text-slate-500">विवरण भरें और तुरंत कार्ड बनाएं</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetToDefault}
          className="text-xs flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-100/60 hover:bg-amber-100 text-amber-900 border border-amber-300/60 transition-colors"
          title="Reset to default original card"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Form</span>
        </button>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2">
          <span>⚠️ {validationError}</span>
        </div>
      )}

      {/* Card Style Selector (3 New Premium Looks + Classic) */}
      <div className="mt-3.5 pb-3 border-b border-amber-900/10">
        <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
          <span>Card Style (डिज़ाइन चुनें)</span>
          <span className="text-[10px] font-normal text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-200">
            4 Premium Looks
          </span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => onChange({ theme: 'independence_day' })}
            className={`p-2 rounded-xl border text-left transition-all flex flex-col items-start ${
              !data.theme || data.theme === 'independence_day'
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/50 shadow-xs'
                : 'bg-white border-slate-200 hover:border-amber-300 text-slate-700'
            }`}
          >
            <span className="text-[11px] font-extrabold text-[#0B1E36] flex items-center gap-1">
              🇮🇳 Tiranga
            </span>
            <span className="text-[9.5px] text-slate-500">क्लासिक तिरंगा</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ theme: 'royal_gold' })}
            className={`p-2 rounded-xl border text-left transition-all flex flex-col items-start ${
              data.theme === 'royal_gold'
                ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-[#0B1E36] border-[#D4AF37] ring-2 ring-[#D4AF37]/50 shadow-xs'
                : 'bg-white border-slate-200 hover:border-amber-400 text-slate-700'
            }`}
          >
            <span className="text-[11px] font-extrabold text-[#D97706] flex items-center gap-1">
              👑 Royal Tiranga
            </span>
            <span className="text-[9.5px] text-slate-500">शाही तिरंगा गोल्ड</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ theme: 'modern_digital' })}
            className={`p-2 rounded-xl border text-left transition-all flex flex-col items-start ${
              data.theme === 'modern_digital'
                ? 'bg-blue-50 text-blue-950 border-blue-600 ring-2 ring-blue-400/50 shadow-xs'
                : 'bg-white border-slate-200 hover:border-amber-300 text-slate-700'
            }`}
          >
            <span className="text-[11px] font-extrabold text-blue-800 flex items-center gap-1">
              ⚡ Modern
            </span>
            <span className="text-[9.5px] text-slate-500">डिजिटल तिरंगा</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ theme: 'vintage_khadi' })}
            className={`p-2 rounded-xl border text-left transition-all flex flex-col items-start ${
              data.theme === 'vintage_khadi'
                ? 'bg-[#EFE6D5] text-[#4A2810] border-[#8C6239] ring-2 ring-[#8C6239]/50 shadow-xs'
                : 'bg-white border-slate-200 hover:border-amber-300 text-slate-700'
            }`}
          >
            <span className="text-[11px] font-extrabold text-[#784A25] flex items-center gap-1">
              📜 Vintage
            </span>
            <span className="text-[9.5px] text-slate-500">हेरिटेज खादी</span>
          </button>
        </div>
      </div>

      {/* SINGLE DIRECT FORM - NO TABS (1 2 3 4) */}
      <form onSubmit={handleSubmit} className="mt-3 space-y-3 text-xs">
        {/* 1. NAME & 2. NUMBER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Name */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              1. Name (नाम) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800/60" />
              <input
                type="text"
                required
                value={data.name}
                onChange={(e) => {
                  onChange({ name: e.target.value });
                  setValidationError(null);
                }}
                placeholder="e.g. Sawvan Kumar"
                className="w-full bg-white border border-amber-900/20 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 shadow-xs"
              />
            </div>
          </div>

          {/* Number (Mobile No.) */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              2. Number (मोबाइल नंबर) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800/60" />
              <input
                type="tel"
                required
                value={data.phone || ''}
                onChange={(e) => {
                  onChange({ phone: e.target.value });
                  setValidationError(null);
                }}
                placeholder="e.g. 9876546789"
                maxLength={14}
                className="w-full bg-white border border-amber-900/20 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 shadow-xs"
              />
            </div>
            <span className="block text-[10px] text-slate-500 mt-0.5">
              कार्ड पर <strong>XXXXXX6789</strong> दिखेगा
            </span>
          </div>
        </div>

        {/* 3. ID NUMBER */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-700 font-bold">3. ID Number (पहचान संख्या)</label>
            <button
              type="button"
              onClick={generateNewId}
              className="text-[11px] text-amber-800 hover:text-amber-900 font-bold flex items-center space-x-0.5 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-300/70"
            >
              <Sparkles className="w-3 h-3 mr-0.5 text-amber-600" /> Auto-Gen ID
            </button>
          </div>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800/60" />
            <input
              type="text"
              value={data.idNumber}
              onChange={(e) => onChange({ idNumber: e.target.value })}
              placeholder="e.g. IND-15AUG-2026-08765"
              className="w-full bg-white border border-amber-900/20 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 font-mono font-bold shadow-xs"
            />
          </div>
        </div>

        {/* 4. DOB & 5. ROLE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* DOB */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">4. DOB (जन्म तिथि)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800/60" />
              <input
                type="text"
                value={data.dob}
                onChange={(e) => onChange({ dob: e.target.value })}
                placeholder="e.g. 14 February 2006"
                className="w-full bg-white border border-amber-900/20 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-amber-600 shadow-xs"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">5. Role (पद / कक्षा)</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800/60" />
              <input
                type="text"
                value={data.role}
                onChange={(e) => onChange({ role: e.target.value })}
                placeholder="e.g. Proud Citizen / Student"
                className="w-full bg-white border border-amber-900/20 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-amber-600 shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* 6. DATE & 7. PLACE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Date */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">6. Date (तारीख)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800/60" />
              <input
                type="text"
                value={data.date || '15 August 2026'}
                onChange={(e) => onChange({ date: e.target.value })}
                placeholder="15 August 2026"
                className="w-full bg-white border border-amber-900/20 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-amber-600 shadow-xs"
              />
            </div>
          </div>

          {/* Place */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">7. Place (स्थान / शहर)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800/60" />
              <input
                type="text"
                value={data.place || 'India'}
                onChange={(e) => onChange({ place: e.target.value })}
                placeholder="e.g. India / Delhi"
                className="w-full bg-white border border-amber-900/20 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-amber-600 shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* 8. PHOTO UPLOAD & CAMERA */}
        <div className="pt-2 border-t border-amber-900/10">
          <label className="block text-slate-700 font-bold mb-1.5">
            8. Photo Upload (फोटो अपलोड / कैमरा)
          </label>

          <div className="flex items-center space-x-3 p-2.5 bg-[#FAF6EE] rounded-xl border border-amber-900/15">
            {/* Current photo preview thumbnail */}
            <div className="w-14 h-16 rounded-lg overflow-hidden border-2 border-amber-600 shadow-xs shrink-0">
              <img src={data.photoUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>

            {/* Upload / Camera action buttons */}
            {!isCameraActive ? (
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs transition-colors text-[11px]"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl bg-[#0B1E36] hover:bg-[#1E3A8A] text-white font-bold shadow-xs transition-colors text-[11px]"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Camera</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 space-y-2">
                <div className="relative rounded-xl overflow-hidden border-2 border-amber-600 bg-black">
                  <video ref={videoRef} className="w-full h-32 object-cover" autoPlay playsInline muted />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex-1 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold flex items-center justify-center space-x-1 text-xs shadow-md"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Capture</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="py-1.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Avatar Sample Options */}
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-[10.5px] text-slate-500 font-semibold shrink-0">Sample:</span>
            <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
              {[
                {
                  label: 'Original',
                  url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
                },
                {
                  label: 'Student 1',
                  url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
                },
                {
                  label: 'Student 2',
                  url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
                },
              ].map((avatar, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange({ photoUrl: avatar.url })}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-[#FAF6EE] hover:bg-amber-100 border border-amber-900/15 text-[10.5px] font-semibold text-slate-700"
                >
                  <img src={avatar.url} alt={avatar.label} className="w-4 h-4 rounded-full object-cover" />
                  <span>{avatar.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-3 border-t border-amber-900/10 space-y-2.5">
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0B1E36] via-[#102A4C] to-[#0B1E36] hover:from-[#081526] hover:to-[#172554] text-white font-montserrat font-bold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-lg shadow-blue-950/20 active:scale-[0.99] transition-all cursor-pointer border border-amber-500/30"
          >
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span>सबमिट करें और कार्ड बनाएं (Submit & Generate Card)</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>

          {/* Direct Download Options after Submission */}
          {isSubmitted && (
            <div className="p-3 rounded-xl bg-[#EDF7EE] border-2 border-emerald-500/60 shadow-sm animate-fadeIn space-y-2">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>कार्ड सुरक्षित हो गया है! अब नीचे डाउनलोड करें:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onDownloadPng}
                  disabled={isExporting}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>{isExporting ? 'डाउनलोड हो रहा है...' : 'Download HD PNG (फोटो)'}</span>
                </button>

                <button
                  type="button"
                  onClick={onDownloadPdf}
                  disabled={isExporting}
                  className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs flex items-center justify-center space-x-1.5 border border-emerald-600/40 shadow-xs active:scale-95 transition-all"
                >
                  <FileDown className="w-4 h-4 text-red-600" />
                  <span>Download PDF (दस्तावेज़)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
