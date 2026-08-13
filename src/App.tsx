import React, { useState, useRef, useEffect } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';
import {
  Download,
  Printer,
  FileDown,
  Sparkles,
  Users,
  Image as ImageIcon,
  Check,
  Award,
  Layers,
  ZoomIn,
  RefreshCw,
  Share2,
  Lock,
  Search,
  Shield,
  Building,
  CheckCircle2,
  Phone,
  Calendar,
  CreditCard,
  MapPin,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

import { StudentData, AdminRecord } from './types';
import { IndependenceCard } from './components/IndependenceCard';
import { CardEditor } from './components/CardEditor';
import { BulkStudentGenerator } from './components/BulkStudentGenerator';
import { AdminPanel } from './components/AdminPanel';
import { LionEmblemSvg } from './components/LionEmblemSvg';
import { AshokaChakraSvg } from './components/AshokaChakraSvg';
import { getSavedRecords, saveUserRecord, deleteUserRecord, syncRecordsWithServer } from './utils/storage';

// Default exact 1:1 data matching user reference image
const DEFAULT_CARD_DATA: StudentData = {
  id: 'default-sawvan-kumar',
  name: 'Sawvan Kumar',
  phone: '9876543210',
  idNumber: 'IND-15AUG-2025-08765',
  dob: '14 February 2006',
  role: 'Proud Citizen',
  date: '15 August 2025',
  place: 'India',
  state: 'Delhi',
  year: '2025',
  photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
  schoolName: 'Kendriya Vidyalaya / Government High School',
  eventTitle: 'INDEPENDENCE DAY',
  eventSubtitle: '15TH AUGUST',
  bannerText: 'CERTIFICATE OF PARTICIPATION',
  badgeTitle: 'PROUD',
  badgeSubtitle: 'TO BE AN',
  badgeCategory: 'INDIAN',
  signatoryName: 'Sawvan',
  signatoryTitle: 'AUTHORIZED SIGNATURE',
  signatoryAuthority: 'Government of India',
  mottoText: 'UNITY • DISCIPLINE • UNITY • PROGRESS',
  theme: 'independence_day',
  createdAt: new Date().toISOString(),
};

export default function App() {
  const [cardData, setCardData] = useState<StudentData>(DEFAULT_CARD_DATA);
  const [isExporting, setIsExporting] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [printAllList, setPrintAllList] = useState<StudentData[] | null>(null);
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const cardRef = useRef<HTMLDivElement | null>(null);

  // Load records on start & sync with backend persistent disk store
  useEffect(() => {
    setRecords(getSavedRecords());
    syncRecordsWithServer().then((synced) => {
      if (synced && synced.length > 0) {
        setRecords(synced);
      }
    });
  }, []);

  const refreshRecords = () => {
    setRecords(getSavedRecords());
  };

  // Trigger celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 75,
      spread: 65,
      origin: { y: 0.6 },
      colors: ['#FF9933', '#FFFFFF', '#138808', '#000080', '#D97706'],
    });
  };

  // Update card fields
  const handleUpdate = (updated: Partial<StudentData>) => {
    setCardData((prev) => ({ ...prev, ...updated }));
  };

  // Auto-Save current card details into Admin database & Server Store
  const handleSaveToAdmin = (showToast = true) => {
    const saved = saveUserRecord(cardData);
    refreshRecords();
    if (showToast) {
      setSaveSuccessMsg(`विवरण सुरक्षित हो गया! ID: ${saved.idNumber || cardData.name}`);
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    }
    return saved;
  };

  // Submit Handler: Validates, saves automatically to persistent DB, and marks as submitted
  const handleSubmitCard = () => {
    // Generate ID number if missing
    let finalCard = { ...cardData };
    if (!finalCard.idNumber || finalCard.idNumber.trim() === '') {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      finalCard.idNumber = `IND-15AUG-${finalCard.year || '2025'}-${randomNum}`;
      setCardData(finalCard);
    }

    const saved = saveUserRecord(finalCard);
    refreshRecords();
    setIsSubmitted(true);
    triggerConfetti();

    setSaveSuccessMsg(`✅ ${saved.name} का विवरण सफलतापूर्वक सबमिट व सुरक्षित हो गया है! अब आप कार्ड डाउनलोड कर सकते हैं।`);
    setTimeout(() => setSaveSuccessMsg(null), 5000);
  };

  // Reset to original 100% exact sample
  const handleResetToDefault = () => {
    setCardData(DEFAULT_CARD_DATA);
    setIsSubmitted(false);
  };

  // Presets
  const handleApplyPreset = (presetType: 'sample' | 'school' | 'republic') => {
    if (presetType === 'sample') {
      setCardData(DEFAULT_CARD_DATA);
    } else if (presetType === 'school') {
      setCardData((prev) => ({
        ...prev,
        eventTitle: 'INDEPENDENCE DAY & ANNUAL DAY',
        bannerText: 'STUDENT IDENTITY & MERIT CARD',
        role: 'Student - Class 10-A (Roll: 14)',
        signatoryAuthority: 'Kendriya Vidyalaya / School Principal',
        signatoryName: 'Principal',
        mottoText: 'VIDYA DADATI VINAYAM • KNOWLEDGE IS POWER',
      }));
    } else if (presetType === 'republic') {
      setCardData((prev) => ({
        ...prev,
        eventTitle: 'REPUBLIC DAY CELEBRATION',
        eventSubtitle: '26TH JANUARY',
        year: '2026',
        bannerText: 'HONORARY CITIZEN BADGE',
        role: 'Patriotic Citizen / Volunteer',
        mottoText: 'SATYAMEVA JAYATE • JAI HIND • VANDE MATARAM',
      }));
    }
  };

  // Export to High Resolution PNG with automatic save to Admin DB
  const downloadPng = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      // Auto-save user data into permanent admin database
      handleSaveToAdmin(false);

      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 3.5, // 3.5x crystal clear ultra-HD resolution
        cacheBust: true,
      });

      const link = document.createElement('a');
      const filename = `${cardData.name.replace(/\s+/g, '_')}_Govt_ID_Card.png`;
      link.download = filename;
      link.href = dataUrl;
      link.click();
      triggerConfetti();

      setSaveSuccessMsg('फुल क्वालिटी कार्ड डाउनलोड हो गया और एडमिन में सुरक्षित है!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error generating PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF with automatic save to Admin DB
  const downloadPdf = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      handleSaveToAdmin(false);

      const dataUrl = await toJpeg(cardRef.current, {
        quality: 1.0,
        pixelRatio: 3.5,
        cacheBust: true,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Standard ID card proportions on A4 sheet
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = 135; // mm
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      const x = (210 - pdfWidth) / 2;
      const y = (297 - pdfHeight) / 2;

      pdf.addImage(dataUrl, 'JPEG', x, y, pdfWidth, pdfHeight);
      pdf.save(`${cardData.name.replace(/\s+/g, '_')}_Govt_ID_Card.pdf`);
      triggerConfetti();

      setSaveSuccessMsg('PDF डाउनलोड हो गई और एडमिन रिकॉर्ड में सुरक्षित है!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Print Direct
  const handlePrint = () => {
    handleSaveToAdmin(false);
    window.print();
  };

  // Bulk Print All Students
  const handlePrintAll = (students: StudentData[]) => {
    // Save all to storage
    students.forEach((s) => saveUserRecord(s));
    refreshRecords();

    setPrintAllList(students);
    setIsBulkOpen(false);
    setTimeout(() => {
      window.print();
      setPrintAllList(null);
    }, 400);
  };

  const handleDeleteRecord = (id: string) => {
    deleteUserRecord(id);
    refreshRecords();
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-slate-900 flex flex-col selection:bg-amber-500 selection:text-white font-poppins">
      {/* 1. NATIONAL TRICOLOR TOP ACCENT LINE */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] border-b border-amber-900/10 no-print" />

      {/* 2. OFFICIAL GOVERNMENT PORTAL HEADER */}
      <header className="no-print bg-[#FFFDF9] border-b border-amber-900/15 shadow-xs">
        {/* Top Official National Emblem Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* National Lion Capital Emblem */}
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded-lg bg-[#FAF6EE] border border-amber-900/20 shadow-2xs">
                <LionEmblemSvg size={36} color="#0B1E36" />
              </div>
            </div>

            <div className="border-l border-amber-900/20 pl-3 sm:pl-4">
              <div className="flex items-center space-x-2">
                <span className="font-montserrat font-bold text-xs sm:text-sm text-[#0B1E36] tracking-wide uppercase">
                  भारत सरकार • GOVERNMENT OF INDIA
                </span>
                <span className="hidden sm:inline-block bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300">
                  आधिकारिक पोर्टल
                </span>
              </div>
              <h1 className="font-cinzel font-black text-sm sm:text-base text-[#0B1E36] leading-tight tracking-tight">
                NATIONAL ID CARD & CERTIFICATE ISSUING SYSTEM
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 hidden md:block">
                स्वतंत्रता दिवस एवं विद्यालय छात्र सहभागिता पहचान पत्र निर्माण प्रणाली
              </p>
            </div>
          </div>

          {/* Top Right Controls: Discreet Mini Admin Login + School Batch */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsBulkOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-100/70 hover:bg-amber-200/70 text-amber-950 text-xs font-bold flex items-center space-x-1.5 border border-amber-300/80 transition-colors shadow-2xs"
            >
              <Users className="w-3.5 h-3.5 text-amber-800" />
              <span className="hidden sm:inline">School Batch (बैच)</span>
              <span className="sm:hidden">Batch</span>
            </button>

            {/* MINI ADMIN BUTTON (Discreet & small) */}
            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-300 hover:border-amber-400 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-2xs"
              title="Admin Panel"
            >
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden md:inline text-[11px]">Admin</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Strip */}
        <div className="bg-[#FAF4E6] border-t border-amber-900/10 px-4 sm:px-6 py-1.5 text-xs text-amber-950 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <span className="flex items-center space-x-2 text-[11px] font-semibold text-slate-700">
              <AshokaChakraSvg size={14} color="#000080" />
              <span>डिजिटल भारत • 15 अगस्त स्वतंत्रता दिवस अमृत महोत्सव पहचान पत्र</span>
            </span>
            <div className="flex items-center space-x-3 text-[11px]">
              <button
                onClick={() => setIsAdminOpen(true)}
                className="text-amber-900 font-bold hover:underline flex items-center space-x-1"
              >
                <Search className="w-3 h-3 text-amber-700" />
                <span className="hidden sm:inline">पंजीकृत फोन नंबर / नाम खोजें (Search DB)</span>
                <span className="sm:hidden">Search</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Save Notification Banner */}
      {saveSuccessMsg && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-800 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-600 text-xs font-bold flex items-center space-x-2.5 animate-bounce max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="leading-snug">{saveSuccessMsg}</span>
        </div>
      )}

      {/* 3. MAIN APP CONTENT AREA */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Top Action Ribbon for Immediate Quality Downloads */}
        <div className="bg-[#FFFDF9] border border-amber-900/15 rounded-2xl p-3.5 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-800">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-montserrat font-bold text-sm text-[#0B1E36]">
                15th August High-Definition ID Card Generator
              </h2>
              <p className="text-[11px] text-slate-500">
                ओरिजिनल जैसा 100% हूबहू फुल क्वालिटी आईडी कार्ड व प्रमाण पत्र तैयार करें
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadPng}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0B1E36] to-[#1E3A8A] hover:from-[#081526] hover:to-[#172554] text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>{isExporting ? 'Generating HD...' : 'Download HD PNG (फुल क्वालिटी)'}</span>
            </button>

            <button
              type="button"
              onClick={downloadPdf}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center space-x-1.5 border border-amber-900/20 shadow-2xs transition-all active:scale-95"
            >
              <FileDown className="w-4 h-4 text-red-600" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center space-x-1.5 border border-amber-900/20 shadow-2xs transition-all active:scale-95"
            >
              <Printer className="w-4 h-4 text-blue-700" />
              <span>Print (प्रिंट)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Live Preview Card Display (Cols 1-7 on desktop) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {/* Header above Preview */}
            <div className="w-full flex items-center justify-between mb-2.5 px-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#0B1E36] uppercase tracking-wider flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 mr-2 animate-pulse" />
                  Live ID Card Preview (मूल प्रतिरूप)
                </span>
              </div>

              <div className="text-[11px] font-medium text-slate-500">
                Scale: 100% (High Res 300+ DPI)
              </div>
            </div>

            {/* THE ID CARD DISPLAY (Pixel-perfect replica of reference image) */}
            <div className="w-full flex justify-center p-3 sm:p-5 bg-gradient-to-b from-[#FFFDF9] to-[#F5EFE4] rounded-3xl border-2 border-amber-900/15 shadow-xl">
              <IndependenceCard data={cardData} cardRef={cardRef} />
            </div>

            {/* Quick Government Verification Badges */}
            <div className="mt-4 w-full bg-[#FFFDF9] border border-amber-900/15 rounded-2xl p-3 grid grid-cols-3 gap-2 text-center text-xs text-slate-700 shadow-2xs">
              <div className="flex flex-col items-center justify-center p-1 border-r border-amber-900/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 mb-1" />
                <span className="font-bold text-[11px] text-[#0B1E36]">300 DPI Ultra HD</span>
                <span className="text-[10px] text-slate-500">प्रिंट योग्य रिज़ॉल्यूशन</span>
              </div>
              <div className="flex flex-col items-center justify-center p-1 border-r border-amber-900/10">
                <Shield className="w-4 h-4 text-blue-800 mb-1" />
                <span className="font-bold text-[11px] text-[#0B1E36]">National Security QR</span>
                <span className="text-[10px] text-slate-500">स्कैन व सत्यापन समर्थित</span>
              </div>
              <div className="flex flex-col items-center justify-center p-1">
                <Building className="w-4 h-4 text-amber-800 mb-1" />
                <span className="font-bold text-[11px] text-[#0B1E36]">Admin Recorded</span>
                <span className="text-[10px] text-slate-500">डेटाबेस में सुरक्षित</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Editor & Customization Panel (Cols 8-12 on desktop) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Card Editor with Phone Input, Auto-Save on Submit & Quick Download */}
            <CardEditor
              data={cardData}
              onChange={handleUpdate}
              onResetToDefault={handleResetToDefault}
              onApplyPreset={handleApplyPreset}
              onSubmitCard={handleSubmitCard}
              onDownloadPng={downloadPng}
              onDownloadPdf={downloadPdf}
              isSubmitted={isSubmitted}
              isExporting={isExporting}
            />

            {/* Hindi / English Usage Notice */}
            <div className="bg-[#FFFDF9] border border-amber-900/15 rounded-2xl p-4 text-xs text-slate-600 space-y-2 shadow-2xs">
              <h3 className="font-bold text-[#0B1E36] flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>महत्वपूर्ण निर्देश एवं उपयोग (Important Instructions):</span>
              </h3>
              <ul className="space-y-1.5 list-disc pl-4 text-slate-700 text-[11.5px] leading-relaxed">
                <li>
                  <strong className="text-amber-900">विवरण सबमिट करें:</strong> फॉर्म भरने के बाद <strong>"सबमिट करें और कार्ड बनाएं"</strong> पर क्लिक करते ही डेटा सुरक्षित हो जाता है।
                </li>
                <li>
                  <strong className="text-amber-900">सुरक्षित मोबाइल नंबर:</strong> कार्ड पर नंबर <strong>XXXXXX6789</strong> के रूप में मास्क दिखेगा, जबकि एडमिन पैनल में पूरा नंबर सुरक्षित रहेगा।
                </li>
                <li>
                  <strong className="text-amber-900">एडमिन रिकॉर्ड्स:</strong> <strong>"Admin"</strong> बटन पर क्लिक करके पंजीकृत नाम या फोन नंबर से कभी भी डेटा खोज व डाउनलोड कर सकते हैं।
                </li>
                <li>
                  <strong className="text-amber-900">फुल क्वालिटी डाउनलोड:</strong> <strong>"Download HD PNG"</strong> बटन से 3.5x हाई रेजोल्यूशन में कार्ड प्राप्त करें।
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* 4. ADMIN SECURE MANAGEMENT PANEL MODAL */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        records={records}
        onRefreshRecords={refreshRecords}
        onSelectStudent={(student) => {
          setCardData(student);
          setIsSubmitted(true);
          triggerConfetti();
        }}
        onPrintStudent={(student) => {
          setPrintAllList([student]);
          setTimeout(() => {
            window.print();
            setPrintAllList(null);
          }, 300);
        }}
        onDeleteRecord={handleDeleteRecord}
      />

      {/* 5. BULK MULTI-STUDENT MODAL */}
      <BulkStudentGenerator
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        baseCardData={cardData}
        onSelectStudent={(student) => {
          setCardData(student);
          setIsSubmitted(true);
          triggerConfetti();
        }}
        onPrintAll={handlePrintAll}
      />

      {/* 6. DEDICATED PRINT CONTAINER (Hidden in web, visible when printing) */}
      <div className="hidden print:block print-only bg-white text-black p-0 m-0">
        {printAllList && printAllList.length > 0 ? (
          printAllList.map((stu, idx) => (
            <div key={stu.id || idx} className="print-page-break p-4 flex items-center justify-center min-h-[90vh]">
              <IndependenceCard data={stu} isPrintMode={true} />
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center p-4 min-h-[90vh]">
            <IndependenceCard data={cardData} isPrintMode={true} />
          </div>
        )}
      </div>

      {/* 7. GOVERNMENT REPOSITORIES FOOTER */}
      <footer className="no-print border-t border-amber-900/15 bg-[#FAF4E6] py-5 text-center text-xs text-slate-600 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <LionEmblemSvg size={24} color="#0B1E36" />
            <span className="font-semibold text-slate-700">
              राष्ट्रीय सूचना विज्ञान केंद्र एवं स्वतंत्र भारत सहभागिता मिशन
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            15th August Independence Day Certificate & School Student ID Card Portal • Jai Hind 🇮🇳
          </p>
        </div>
      </footer>
    </div>
  );
}
