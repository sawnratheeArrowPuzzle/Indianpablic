import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  CreditCard,
  User,
  QrCode,
  FileText,
  Download,
  Share2,
  RotateCw,
  HelpCircle,
  Bell,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  BookOpen,
  Calendar,
  Phone,
  Mail,
  Building,
  MapPin,
  ChevronRight,
  Edit3,
  Folder,
  Trophy,
  CheckCircle2,
  Printer,
  Sparkles,
  Copy,
  Check,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { UserProfile, Student } from '../../types/school-system';
import { getStudents, getSchools } from '../../services/schoolDataService';
import { StudentData } from '../../types';
import { LionEmblemSvg } from '../LionEmblemSvg';
import { AshokaChakraSvg } from '../AshokaChakraSvg';
import { IndependenceCard } from '../IndependenceCard';
import { downloadCardAsPng } from '../cards/CardDownloadUtils';
import { UserProfileModal } from '../auth/UserProfileModal';

interface StudentDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onClose: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser: initialUser,
  onLogout,
  onClose,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialUser);
  const [student, setStudent] = useState<Student | null>(null);
  const [schoolName, setSchoolName] = useState('Sunrise Public School');
  const [affiliationCode, setAffiliationCode] = useState('CBSE-DEL-98421');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Modals & Navigation states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isFullIdModalOpen, setIsFullIdModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'idcard' | 'profile' | 'qrcode' | 'documents'>('dashboard');
  const [copySuccess, setCopySuccess] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const schoolId = currentUser.schoolId || 'SCH-A';

  // Load real student profile from database
  const loadStudentData = async () => {
    try {
      const [list, scList] = await Promise.all([
        getStudents('student', schoolId, undefined, currentUser.uid),
        getSchools('student', schoolId),
      ]);
      if (list.length > 0) {
        setStudent(list[0]);
      }
      if (scList.length > 0) {
        setSchoolName(scList[0].schoolName);
        setAffiliationCode(scList[0].affiliationCode);
      }
    } catch (err) {
      console.warn('Student profile load notice (offline fallback active):', err);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [schoolId, currentUser.uid]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileUpdated = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    if (student) {
      setStudent({
        ...student,
        name: updatedUser.displayName,
        photoUrl: updatedUser.photoUrl || student.photoUrl,
        guardianName: updatedUser.guardianName || student.guardianName,
        guardianPhone: updatedUser.guardianPhone || updatedUser.phone || student.guardianPhone,
        address: updatedUser.address || student.address,
        dob: updatedUser.dob || student.dob,
        bloodGroup: updatedUser.bloodGroup || student.bloodGroup
      });
    }
  };

  // Student details with high-fidelity formatting matching the reference image
  const studentName = student?.name || currentUser.displayName || 'Aarav Kumar';
  const firstName = studentName.split(' ')[0] || 'Aarav';
  const studentClass = student?.class ? (student.class.includes('th') ? student.class : `${student.class}th`) : '10th';
  const studentRollNo = student?.rollNumber || '23';
  const studentDob = student?.dob || currentUser.dob || '14/02/2006';
  const guardianName = student?.guardianName || currentUser.guardianName || 'Rajesh Kumar';
  const studentPhone = student?.guardianPhone || currentUser.phone || '+91 98765 43210';
  const studentEmail = currentUser.email || 'aarav.kumar@example.com';
  const studentIdNumber = student?.studentId || 'STU202500123';
  const studentPhotoUrl = currentUser.photoUrl || student?.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80';
  const studentAddress = student?.address || currentUser.address || 'New Delhi, Delhi';

  // Construct standard StudentData for rendering IndependenceCard
  const studentCardData: StudentData = {
    id: studentIdNumber,
    name: studentName,
    phone: studentPhone,
    idNumber: studentIdNumber,
    dob: studentDob,
    role: `Student • Class ${studentClass}`,
    className: `Class ${studentClass}`,
    rollNo: studentRollNo,
    guardianName: guardianName,
    date: '15 August 2026',
    place: 'New Delhi',
    state: 'Delhi',
    photoUrl: studentPhotoUrl,
    schoolName: schoolName,
    eventTitle: 'INDIANPUBLIC',
    eventSubtitle: 'STUDENT IDENTITY CARD',
    bannerText: 'राष्ट्रीय छात्र पहचान पत्र • CERTIFIED STUDENT ID',
    badgeTitle: 'OFFICIAL',
    badgeSubtitle: 'VERIFIED',
    badgeCategory: 'STUDENT',
    signatoryName: 'Principal',
    signatoryTitle: 'Authorised Sign.',
    signatoryAuthority: affiliationCode,
    mottoText: 'विद्या ददाति विनयं • Knowledge Gives Humility',
    theme: 'independence_day',
    year: '2025-26',
    createdAt: new Date().toISOString()
  };

  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      await downloadCardAsPng(cardRef.current, `IndianPublic_ID_${studentName.replace(/\s+/g, '_')}`);
    } catch {
      console.error('PNG download error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareId = async () => {
    const shareData = {
      title: `${studentName} - IndianPublic Student ID`,
      text: `Official Verified Student ID Card of ${studentName} (${studentClass}, Roll: ${studentRollNo}) at ${schoolName}.`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        handleCopyVerificationLink();
      }
    } else {
      handleCopyVerificationLink();
    }
  };

  const handleCopyVerificationLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#F8FAFC] text-slate-900 overflow-hidden flex flex-col font-poppins selection:bg-amber-500 selection:text-white">
      {/* 1. TOP HEADER (White with IndianPublic branding & User Avatar) */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between z-30 shrink-0 shadow-2xs">
        {/* Left: Branding & Mobile Menu Toggle */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            type="button"
            onClick={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors md:hidden cursor-pointer"
            title="Toggle Sidebar Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <LionEmblemSvg size={28} color="#0B1E36" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-montserrat font-black text-base sm:text-lg text-[#0B1E36] tracking-tight leading-none">
                  Indian<span className="text-[#0B1E36]">Public</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              </div>
              <p className="text-[9.5px] sm:text-[10px] text-slate-500 font-medium tracking-tight leading-tight">
                Digital Identity, Empowering India
              </p>
            </div>
          </div>
        </div>

        {/* Right: Notifications Bell & User Avatar Profile Button */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Notification Bell */}
          <button
            type="button"
            onClick={() => setIsHelpModalOpen(true)}
            className="relative p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-700" />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-white text-[9.5px] font-bold rounded-full flex items-center justify-center border border-white">
              3
            </span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              id="student-profile-dropdown-btn"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center space-x-2.5 p-1 sm:pr-2.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 shrink-0 shadow-2xs">
                <img
                  src={studentPhotoUrl}
                  alt={studentName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="text-left hidden sm:block">
                <p className="font-montserrat font-bold text-xs text-[#0B1E36] leading-tight">
                  {studentName}
                </p>
                <p className="text-[10.5px] text-slate-500 leading-tight">
                  Student
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="font-bold text-xs text-[#0B1E36] truncate">{studentName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{studentEmail}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    Verified Student
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserDropdownOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 cursor-pointer font-medium"
                >
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>My Profile (मेरी प्रोफाइल)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserDropdownOpen(false);
                    setIsFullIdModalOpen(true);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 cursor-pointer font-medium"
                >
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>View Full ID Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserDropdownOpen(false);
                    setIsQrModalOpen(true);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 cursor-pointer font-medium"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>My QR Code</span>
                </button>

                <div className="border-t border-slate-100 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setIsUserDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2.5 cursor-pointer font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout (लॉगआउट)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. BODY LAYOUT: DARK NAVY SIDEBAR + MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT SIDEBAR (Dark Navy) */}
        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#0B1E36] text-white flex flex-col justify-between transition-transform duration-200 ease-in-out border-r border-slate-800 shrink-0
            ${isSidebarOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          {/* Top Section */}
          <div className="p-4 space-y-5 overflow-y-auto">
            {/* Active Dashboard Tab */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('dashboard');
                setIsSidebarOpenMobile(false);
              }}
              className="w-full bg-gradient-to-r from-[#D9A05B] to-[#C88A3E] text-white font-montserrat font-bold text-xs rounded-xl px-4 py-3 flex items-center space-x-3 shadow-md cursor-pointer transition-all active:scale-98"
            >
              <Home className="w-4 h-4 text-white shrink-0" />
              <span>Dashboard</span>
            </button>

            {/* MAIN Section */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 block">
                MAIN
              </span>

              <button
                type="button"
                onClick={() => {
                  setIsFullIdModalOpen(true);
                  setIsSidebarOpenMobile(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 text-xs font-medium flex items-center space-x-3 transition-colors cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                <span>My ID Card</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(true);
                  setIsSidebarOpenMobile(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 text-xs font-medium flex items-center space-x-3 transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span>My Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQrModalOpen(true);
                  setIsSidebarOpenMobile(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 text-xs font-medium flex items-center space-x-3 transition-colors cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-slate-400 shrink-0" />
                <span>My QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDocsModalOpen(true);
                  setIsSidebarOpenMobile(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 text-xs font-medium flex items-center space-x-3 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <span>My Documents</span>
              </button>
            </div>

            {/* QUICK ACTIONS Section */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 block">
                QUICK ACTIONS
              </span>

              <button
                type="button"
                onClick={() => {
                  handleDownloadPng();
                  setIsSidebarOpenMobile(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 text-xs font-medium flex items-center space-x-3 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-400 shrink-0" />
                <span>ID Card Download</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQrModalOpen(true);
                  setIsSidebarOpenMobile(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 text-xs font-medium flex items-center space-x-3 transition-colors cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-slate-400 shrink-0" />
                <span>QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsHelpModalOpen(true);
                  setIsSidebarOpenMobile(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 text-xs font-medium flex items-center space-x-3 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Help & Support</span>
              </button>
            </div>
          </div>

          {/* Bottom Sidebar Motivation & Watermark Section */}
          <div className="p-4 relative overflow-hidden shrink-0 border-t border-white/10 bg-[#081526]">
            {/* Monument Silhouette + Indian Flag */}
            <div className="flex flex-col items-center text-center space-y-2 relative z-10">
              <div className="w-12 h-10 flex items-center justify-center relative">
                <div className="text-xl">🇮🇳</div>
              </div>

              <div className="space-y-0.5">
                <p className="font-montserrat font-bold text-xs text-white leading-tight">
                  Proud to be Indian.
                </p>
                <p className="font-montserrat font-bold text-xs text-white leading-tight">
                  Proud to be a Student.
                </p>
              </div>

              {/* Tricolor line */}
              <div className="w-12 h-0.5 bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] rounded-full my-1" />

              <p className="text-[10px] text-slate-300 italic leading-relaxed px-1">
                “Education is the most powerful weapon which you can use to change the world.”
              </p>
              <p className="text-[9.5px] text-slate-400 font-medium">
                — Dr. A.P.J. Abdul Kalam
              </p>
            </div>

            {/* Subtle Ashoka Chakra watermark in background */}
            <div className="absolute -bottom-8 -right-8 opacity-10 pointer-events-none">
              <AshokaChakraSvg size={140} color="#FFFFFF" />
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {isSidebarOpenMobile && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-xs"
            onClick={() => setIsSidebarOpenMobile(false)}
          />
        )}

        {/* MAIN CONTENT CANVAS */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6 md:p-8 space-y-6 pb-20 md:pb-8">
          {/* Top Greeting Row & Inspirational Quote Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-montserrat font-extrabold text-2xl sm:text-3xl text-[#0B1E36] tracking-tight leading-tight flex items-center space-x-2">
                <span>Hello, {firstName}!</span>
                <span className="text-2xl">👋</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Welcome back to your dashboard
              </p>
            </div>

            {/* Motivational Quote Banner */}
            <div className="bg-[#FFFDF7] border border-amber-200/80 rounded-2xl p-3.5 sm:px-5 sm:py-3.5 shadow-2xs flex items-center justify-between border-l-4 border-l-emerald-600 max-w-md w-full">
              <p className="text-xs sm:text-[12.5px] font-medium text-slate-800 leading-snug">
                Keep learning, keep growing, and keep shining.
              </p>
              <span className="font-serif font-black text-2xl text-amber-500 leading-none pl-3 select-none">
                ”
              </span>
            </div>
          </div>

          {/* MAIN SECTION: "My Official ID Card" */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
            {/* Header: Shield + Title + View Full ID button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-700 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-montserrat font-bold text-sm sm:text-base text-[#0B1E36] leading-tight">
                    My Official ID Card
                  </h2>
                  <span className="text-[11px] font-semibold text-emerald-600 block">
                    Verified Student
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="view-full-id-btn"
                onClick={() => setIsFullIdModalOpen(true)}
                className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#0B1E36] hover:bg-[#102A4C] text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                View Full ID
              </button>
            </div>

            {/* ID CARD VISUAL CANVAS (Exact 1:1 Rendering of IndianPublic Student ID Card) */}
            <div className="flex justify-center py-2 overflow-hidden">
              <div
                ref={cardRef}
                className="w-full max-w-md transform transition-all duration-300 rounded-3xl shadow-lg border border-slate-200/80 overflow-hidden bg-white"
              >
                <IndependenceCard
                  data={studentCardData}
                  isBackView={isFlipped}
                  showNationalHeader={true}
                />
              </div>
            </div>

            {/* ACTION BUTTONS: Download HD / Share ID / Flip Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                id="download-hd-btn"
                onClick={handleDownloadPng}
                disabled={isDownloading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#D9A05B] hover:bg-[#C88A3E] text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'डाउनलोड हो रहा है...' : 'Download HD'}</span>
              </button>

              <button
                type="button"
                id="share-id-btn"
                onClick={handleShareId}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center space-x-2 shadow-2xs transition-all active:scale-98 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-slate-600" />
                <span>Share ID</span>
              </button>

              <button
                type="button"
                id="flip-card-btn"
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center space-x-2 shadow-2xs transition-all active:scale-98 cursor-pointer"
              >
                <RotateCw className="w-4 h-4 text-slate-600" />
                <span>{isFlipped ? 'Show Front' : 'Flip Card'}</span>
              </button>
            </div>
          </div>

          {/* QUICK OVERVIEW SECTION (4 BENTO CARDS) */}
          <div className="space-y-3">
            <h3 className="font-montserrat font-bold text-sm sm:text-base text-[#0B1E36]">
              Quick Overview
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* 1. Class */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Class
                  </span>
                  <p className="font-montserrat font-extrabold text-base text-[#0B1E36] leading-tight">
                    {studentClass}
                  </p>
                  <span className="text-[10.5px] text-slate-500 font-medium">
                    Current Class
                  </span>
                </div>
              </div>

              {/* 2. Roll No. */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Roll No.
                  </span>
                  <p className="font-montserrat font-extrabold text-base text-[#0B1E36] leading-tight font-mono">
                    {studentRollNo}
                  </p>
                  <span className="text-[10.5px] text-slate-500 font-medium">
                    Your Roll Number
                  </span>
                </div>
              </div>

              {/* 3. DOB */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    DOB
                  </span>
                  <p className="font-montserrat font-extrabold text-sm sm:text-base text-[#0B1E36] leading-tight truncate">
                    {studentDob}
                  </p>
                  <span className="text-[10.5px] text-slate-500 font-medium">
                    Date of Birth
                  </span>
                </div>
              </div>

              {/* 4. Status */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Status
                  </span>
                  <p className="font-montserrat font-extrabold text-base text-emerald-600 leading-tight">
                    Active
                  </p>
                  <span className="text-[10.5px] text-slate-500 font-medium">
                    Student Status
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TWO COLUMNS: QUICK ACTIONS & MY PROFILE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {/* LEFT: Quick Actions Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
              <h3 className="font-montserrat font-bold text-sm sm:text-base text-[#0B1E36]">
                Quick Actions
              </h3>

              <div className="space-y-2.5">
                {/* 1. View / Download ID Card */}
                <button
                  type="button"
                  onClick={() => setIsFullIdModalOpen(true)}
                  className="w-full p-3 rounded-2xl border border-slate-200/80 hover:border-amber-400/80 hover:bg-amber-50/30 flex items-center justify-between transition-all group cursor-pointer text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0 group-hover:bg-blue-100 transition-colors">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span className="font-montserrat font-bold text-xs text-[#0B1E36]">
                      View / Download ID Card
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition-colors" />
                </button>

                {/* 2. My QR Code */}
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="w-full p-3 rounded-2xl border border-slate-200/80 hover:border-amber-400/80 hover:bg-amber-50/30 flex items-center justify-between transition-all group cursor-pointer text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 group-hover:bg-emerald-100 transition-colors">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <span className="font-montserrat font-bold text-xs text-[#0B1E36]">
                      My QR Code
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition-colors" />
                </button>

                {/* 3. Edit My Profile */}
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="w-full p-3 rounded-2xl border border-slate-200/80 hover:border-amber-400/80 hover:bg-amber-50/30 flex items-center justify-between transition-all group cursor-pointer text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0 group-hover:bg-amber-100 transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <span className="font-montserrat font-bold text-xs text-[#0B1E36]">
                      Edit My Profile
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition-colors" />
                </button>

                {/* 4. My Documents */}
                <button
                  type="button"
                  onClick={() => setIsDocsModalOpen(true)}
                  className="w-full p-3 rounded-2xl border border-slate-200/80 hover:border-amber-400/80 hover:bg-amber-50/30 flex items-center justify-between transition-all group cursor-pointer text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shrink-0 group-hover:bg-purple-100 transition-colors">
                      <Folder className="w-4 h-4" />
                    </div>
                    <span className="font-montserrat font-bold text-xs text-[#0B1E36]">
                      My Documents
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition-colors" />
                </button>
              </div>
            </div>

            {/* RIGHT: My Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
              <h3 className="font-montserrat font-bold text-sm sm:text-base text-[#0B1E36]">
                My Profile
              </h3>

              {/* Profile Header */}
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 shrink-0 shadow-2xs">
                  <img
                    src={studentPhotoUrl}
                    alt={studentName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h4 className="font-montserrat font-bold text-sm text-[#0B1E36] leading-tight">
                    {studentName}
                  </h4>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs text-slate-500">Student</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Details List */}
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-700 truncate">{studentPhone}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-700 truncate">{studentEmail}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <Building className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-700 truncate">{schoolName}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-700 truncate">{studentAddress}</span>
                </div>
              </div>

              {/* Edit Profile Button */}
              <button
                type="button"
                id="edit-profile-btn"
                onClick={() => setIsProfileModalOpen(true)}
                className="w-full py-2.5 rounded-xl border border-amber-300 hover:border-amber-400 bg-white hover:bg-amber-50/50 text-amber-900 font-montserrat font-bold text-xs transition-all active:scale-98 cursor-pointer text-center"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* BOTTOM MOTIVATION BANNER */}
          <div className="bg-[#FFFDF7] border border-amber-200/80 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100/70 border border-amber-300/80 flex items-center justify-center text-amber-700 shrink-0">
                <Trophy className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="font-montserrat font-bold text-sm sm:text-base text-[#0B1E36]">
                  Keep going, {firstName}!
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your future is bright. Stay focused and keep achieving your goals.
                </p>
              </div>
            </div>

            {/* Graduation Cap & Books Graphic Illustration */}
            <div className="shrink-0 flex items-center justify-center">
              <div className="relative w-28 h-14 flex items-center justify-center">
                <GraduationCap className="w-10 h-10 text-[#0B1E36] drop-shadow-sm" />
                <BookOpen className="w-8 h-8 text-emerald-600 absolute -bottom-1 -right-2" />
                <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -left-1 animate-pulse" />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 3. BOTTOM MOBILE NAVIGATION (Visible only on mobile screens) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#0B1E36] text-white border-t border-slate-800 px-6 py-2 flex items-center justify-around z-40 shadow-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center space-y-1 text-[10px] font-bold ${
            activeTab === 'dashboard' ? 'text-[#D9A05B]' : 'text-slate-400'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => setIsFullIdModalOpen(true)}
          className="flex flex-col items-center space-y-1 text-[10px] font-bold text-slate-400 hover:text-white"
        >
          <CreditCard className="w-4 h-4" />
          <span>ID Card</span>
        </button>

        <button
          type="button"
          onClick={() => setIsQrModalOpen(true)}
          className="flex flex-col items-center space-y-1 text-[10px] font-bold text-slate-400 hover:text-white"
        >
          <QrCode className="w-4 h-4" />
          <span>QR Code</span>
        </button>

        <button
          type="button"
          onClick={() => setIsProfileModalOpen(true)}
          className="flex flex-col items-center space-y-1 text-[10px] font-bold text-slate-400 hover:text-white"
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </nav>

      {/* 4. MODALS */}

      {/* MODAL 1: VIEW FULL ID MODAL */}
      {isFullIdModalOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 border border-slate-200 shadow-2xl relative my-auto">
            <button
              type="button"
              onClick={() => setIsFullIdModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-montserrat font-bold text-base text-[#0B1E36]">
                  Official Student Identity Card (सम्पूर्ण पहचान पत्र)
                </h3>
                <p className="text-xs text-slate-500">
                  Government Affiliated School Student ID Card
                </p>
              </div>
            </div>

            <div className="flex justify-center py-2">
              <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <IndependenceCard
                  data={studentCardData}
                  isBackView={isFlipped}
                  showNationalHeader={true}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={isDownloading}
                className="py-2 px-3 rounded-xl bg-[#D9A05B] hover:bg-[#C88A3E] text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>HD PNG</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFlipped(!isFlipped)}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Flip</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={handleShareId}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MY QR CODE MODAL */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl relative my-auto text-center">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-montserrat font-bold text-base text-[#0B1E36]">
                Digital Verification QR Pass
              </h3>
              <p className="text-xs text-slate-500">
                Scan with any standard QR scanner to verify student authenticity
              </p>
            </div>

            {/* QR Card Presentation */}
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col items-center space-y-3">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `INDIANPUBLIC-VERIFY|STU:${studentIdNumber}|NAME:${studentName}|SCHOOL:${schoolName}|CLASS:${studentClass}|ROLL:${studentRollNo}`
                  )}`}
                  alt="Student QR Verification"
                  className="w-44 h-44 object-contain"
                />
              </div>

              <div className="space-y-1">
                <p className="font-bold text-sm text-[#0B1E36]">{studentName}</p>
                <p className="text-xs text-slate-500 font-mono">ID: {studentIdNumber}</p>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Officially Verified</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyVerificationLink}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                {copySuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copySuccess ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0B1E36] hover:bg-[#102A4C] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print QR Pass</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MY DOCUMENTS MODAL */}
      {isDocsModalOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-2xl relative my-auto">
            <button
              type="button"
              onClick={() => setIsDocsModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-montserrat font-bold text-base text-[#0B1E36]">
                  My Official Documents (प्रमाणपत्र व दस्तावेज)
                </h3>
                <p className="text-xs text-slate-500">
                  Digital Certificates & Verified Records
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    PDF
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#0B1E36]">Student Identity Certificate 2025-26</p>
                    <p className="text-[11px] text-slate-500">Issued by {schoolName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 flex items-center space-x-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    VER
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#0B1E36]">Independence Day Participation Certificate</p>
                    <p className="text-[11px] text-slate-500">Government of India Digital Portal</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 flex items-center space-x-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: HELP & SUPPORT MODAL */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl relative my-auto">
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-montserrat font-bold text-base text-[#0B1E36]">
                  Help & Support (सहायता केंद्र)
                </h3>
                <p className="text-xs text-slate-500">
                  Student Assistance & Identity Verification Support
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">ID कार्ड में विवरण सुधार:</p>
                <p className="text-slate-600">
                  यदि नाम, कक्षा या फोटो में कोई त्रुटि है, तो आप <strong>Edit Profile</strong> बटन से सुधार सकते हैं या अपने विद्यालय के कक्षा अध्यापक से संपर्क कर सकते हैं।
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">हेल्पलाइन संपर्क:</p>
                <p className="text-slate-600">Email: support@indianpublic.gov.in</p>
                <p className="text-slate-600">Toll Free: 1800-11-2026</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsHelpModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#0B1E36] hover:bg-[#102A4C] text-white font-bold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: DEDICATED USER PROFILE MODAL */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
};
