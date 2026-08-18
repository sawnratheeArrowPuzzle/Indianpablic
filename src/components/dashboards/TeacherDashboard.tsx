import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  GraduationCap,
  Users,
  Search,
  FileSpreadsheet,
  RefreshCw,
  LogOut,
  X,
  Phone,
  CheckCircle2,
  AlertCircle,
  Eye,
  Building2,
  Calendar,
  Plus,
  IdCard,
  Download,
  Printer,
  RotateCw,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  FileText
} from 'lucide-react';
import { UserProfile, Student, Teacher } from '../../types/school-system';
import { getStudents, saveStudent, subscribeToStudents, getSchools } from '../../services/schoolDataService';
import { createStudentAccountByTeacher } from '../../services/multiRoleAuth';
import { TeacherIdCard, TeacherCardData } from '../cards/TeacherIdCard';
import { downloadCardAsPng, downloadCardAsJpeg, downloadCardAsPdf } from '../cards/CardDownloadUtils';
import { LionEmblemSvg } from '../LionEmblemSvg';
import { AshokaChakraSvg } from '../AshokaChakraSvg';
import { UserProfileModal } from '../auth/UserProfileModal';

interface TeacherDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onClose: () => void;
}

type TeacherTab = 'overview' | 'teacher_card' | 'student_creator' | 'roster';

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser: initialUser,
  onLogout,
  onClose,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialUser);
  const [activeTab, setActiveTab] = useState<TeacherTab>('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolName, setSchoolName] = useState('Staging Model School Alpha');
  const [affiliationCode, setAffiliationCode] = useState('CBSE-DEL-98421');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Teacher ID Card Controls
  const [isCardBack, setIsCardBack] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Student Account Creator Form
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('10');
  const [newStudentSection, setNewStudentSection] = useState('A');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentDob, setNewStudentDob] = useState('2010-05-15');
  const [newStudentBlood, setNewStudentBlood] = useState('O+');
  const [newStudentGuardian, setNewStudentGuardian] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentAddress, setNewStudentAddress] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('Student@2026');
  const [createdStudentSlip, setCreatedStudentSlip] = useState<{
    student: Student;
    password: string;
  } | null>(null);
  const [copiedSlip, setCopiedSlip] = useState(false);

  // Selected Student ID Preview Modal
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);

  const schoolId = currentUser.schoolId || 'SCH-A';
  const assignedClasses = currentUser.assignedClasses || ['10-A', '9-B'];

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4500);
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [stList, scList] = await Promise.all([
        getStudents('teacher', schoolId, assignedClasses),
        getSchools('teacher', schoolId),
      ]);
      setStudents(stList);
      if (scList.length > 0) {
        setSchoolName(scList[0].schoolName);
        setAffiliationCode(scList[0].affiliationCode);
      }
    } catch (err) {
      console.warn('Teacher student load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Subscribe to realtime student updates
    const unsub = subscribeToStudents('teacher', schoolId, assignedClasses, undefined, (updated) => {
      setStudents(updated);
    });

    return () => unsub();
  }, [schoolId]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = searchQuery.toLowerCase();
      const studentClass = `${s.class}-${s.section}`;
      const matchClass = selectedClass === 'ALL' || studentClass === selectedClass || s.class === selectedClass;
      const matchQuery = !q || s.name.toLowerCase().includes(q) || s.rollNumber.includes(q) || s.studentId.toLowerCase().includes(q);
      return matchClass && matchQuery;
    });
  }, [students, searchQuery, selectedClass]);

  // Handle Create Student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentRoll.trim() || !newStudentGuardian.trim()) {
      showNotification('कृपया छात्र का नाम, रोल नंबर एवं अभिभावक का नाम दर्ज करें।', 'error');
      return;
    }

    try {
      const created = await createStudentAccountByTeacher({
        name: newStudentName,
        class: newStudentClass,
        section: newStudentSection,
        rollNumber: newStudentRoll,
        dob: newStudentDob,
        bloodGroup: newStudentBlood,
        guardianName: newStudentGuardian,
        guardianPhone: newStudentPhone,
        address: newStudentAddress,
        tempPassword: newStudentPassword,
      }, currentUser);

      setCreatedStudentSlip({
        student: created,
        password: newStudentPassword,
      });

      // Reset form
      setNewStudentName('');
      setNewStudentRoll('');
      setNewStudentGuardian('');
      setNewStudentPhone('');
      setNewStudentAddress('');
      showNotification(`छात्र ${created.name} (कक्षा ${created.class}-${created.section}) सफलतापूर्वक पंजीकृत हुआ!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'छात्र खाता बनाने में त्रुटि';
      showNotification(msg, 'error');
    }
  };

  // Teacher Card Data
  const teacherCardData: TeacherCardData = {
    teacherId: currentUser.uid.replace('uid-', 'TCH-').toUpperCase(),
    name: currentUser.displayName || 'Faculty Member',
    designation: currentUser.designation || 'Senior TGT & Class Incharge',
    schoolName: schoolName,
    affiliationCode: affiliationCode,
    assignedClasses: assignedClasses,
    phone: currentUser.phone || '+91 98765 00000',
    email: currentUser.email,
    address: currentUser.address,
    photoUrl: currentUser.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    signatoryName: 'Prof. Rajesh Kumar',
    signatoryTitle: 'Principal',
  };

  // Downloads for Teacher ID Card
  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      await downloadCardAsPng(cardRef.current, `Teacher_Card_${currentUser.displayName?.replace(/\s+/g, '_') || 'Teacher'}`);
      showNotification('HD PNG शिक्षक कार्ड सफलतापूर्वक डाउनलोड हुआ!');
    } catch {
      showNotification('डाउनलोड में त्रुटि हुई', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadJpeg = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      await downloadCardAsJpeg(cardRef.current, `Teacher_Card_${currentUser.displayName?.replace(/\s+/g, '_') || 'Teacher'}`);
      showNotification('HD JPEG शिक्षक कार्ड सफलतापूर्वक डाउनलोड हुआ!');
    } catch {
      showNotification('डाउनलोड में त्रुटि हुई', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      await downloadCardAsPdf(cardRef.current, `Teacher_Card_${currentUser.displayName?.replace(/\s+/g, '_') || 'Teacher'}`);
      showNotification('वेक्टर PDF शिक्षक कार्ड सफलतापूर्वक डाउनलोड हुआ!');
    } catch {
      showNotification('PDF डाउनलोड में त्रुटि हुई', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;
    const headers = ['Roll No', 'Name', 'Class', 'Section', 'DOB', 'Blood Group', 'Guardian Name', 'Guardian Phone'];
    const rows = filteredStudents.map(s => [
      s.rollNumber,
      s.name,
      s.class,
      s.section,
      s.dob,
      s.bloodGroup || '',
      s.guardianName,
      s.guardianPhone
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Class_${selectedClass}_Students.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 font-poppins">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#064E3B] via-[#0B1E36] to-[#042F2E] p-4 sm:p-6 border-b border-emerald-400/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 border border-emerald-400/50 flex items-center justify-center shadow-inner shrink-0">
            <BookOpen className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold tracking-widest text-emerald-300 uppercase bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/30">
                TEACHER & FACULTY CONSOLE
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {schoolId}
              </span>
            </div>
            <h1 className="font-montserrat font-black text-lg sm:text-xl text-white leading-tight mt-0.5">
              {currentUser.displayName}
            </h1>
            <p className="text-xs text-slate-300">
              {schoolName} • अधिकृत कक्षाएं: <strong className="text-emerald-300">{assignedClasses.join(', ')}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* User Profile Button */}
          <button
            type="button"
            id="teacher-profile-btn"
            onClick={() => setIsProfileModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-xs font-bold flex items-center space-x-2 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden bg-emerald-400/30 border border-emerald-300 flex items-center justify-center shrink-0">
              {currentUser.photoUrl ? (
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.displayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <BookOpen className="w-3 h-3 text-emerald-300" />
              )}
            </div>
            <span>मेरी प्रोफाइल (Profile)</span>
          </button>

          <button
            onClick={loadInitialData}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer"
            title="रिफ्रेश करें (Refresh)"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>लॉगआउट</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div className={`p-3 text-xs font-bold flex items-center justify-center space-x-2 ${statusMessage.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'}`}>
          {statusMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/60 px-4 sm:px-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-emerald-400 text-emerald-400 bg-emerald-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>संक्षिप्त विवरण (Overview)</span>
        </button>

        <button
          onClick={() => setActiveTab('teacher_card')}
          className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'teacher_card'
              ? 'border-emerald-400 text-emerald-400 bg-emerald-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <IdCard className="w-4 h-4" />
          <span>शिक्षक ID कार्ड (Faculty Pass)</span>
        </button>

        <button
          onClick={() => setActiveTab('student_creator')}
          className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'student_creator'
              ? 'border-emerald-400 text-emerald-400 bg-emerald-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>छात्र नामांकन (New Student)</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'roster'
              ? 'border-emerald-400 text-emerald-400 bg-emerald-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>कक्षा नामावली (Roster) ({students.length})</span>
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80 shadow-lg flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase">आवंटित कक्षाएं</span>
                  <h3 className="font-montserrat font-black text-2xl text-emerald-300 mt-1">{assignedClasses.length}</h3>
                  <span className="text-[11px] text-slate-400">{assignedClasses.join(', ')}</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80 shadow-lg flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase">सक्रिय छात्र</span>
                  <h3 className="font-montserrat font-black text-2xl text-amber-300 mt-1">{students.length}</h3>
                  <span className="text-[11px] text-slate-400">अधिकृत रोस्टर</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <GraduationCap className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80 shadow-lg flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase">संस्थान संबद्धता</span>
                  <h3 className="font-montserrat font-black text-base text-cyan-300 mt-1 truncate max-w-[150px]">
                    {affiliationCode}
                  </h3>
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>सत्यापित संकाय</span>
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setActiveTab('student_creator')}
                className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-slate-800/80 border border-emerald-400/30 hover:border-emerald-400 cursor-pointer transition-all shadow-md group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">नया छात्र पंजीकृत करें (Enroll Student)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  अपनी अधिकृत कक्षा में नया छात्र जोड़ें और त्वरित लॉगिन क्रेडेंशियल स्लिप जनरेट करें।
                </p>
              </div>

              <div
                onClick={() => setActiveTab('teacher_card')}
                className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 to-slate-800/80 border border-amber-400/30 hover:border-amber-400 cursor-pointer transition-all shadow-md group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <IdCard className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">शिक्षक ID कार्ड डाउनलोड करें</h4>
                <p className="text-xs text-slate-400 mt-1">
                  अपना आधिकारिक संकाय पहचान पत्र HD PNG, Vector PDF या सीधे प्रिंट करें।
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. TEACHER ID CARD TAB */}
        {activeTab === 'teacher_card' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center max-w-lg mx-auto mb-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 text-xs font-bold uppercase mb-2">
                <IdCard className="w-3.5 h-3.5" />
                <span>OFFICIAL FACULTY PASS</span>
              </div>
              <h2 className="font-montserrat font-bold text-xl text-white">
                शिक्षक पहचान पत्र (Teacher ID Card)
              </h2>
              <p className="text-xs text-slate-300">
                आधिकारिक मरकत-नील (Emerald & Deep Navy) संकाय ID कार्ड।
              </p>
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Card Component */}
              <div className="shrink-0">
                <div ref={cardRef}>
                  <TeacherIdCard data={teacherCardData} isBackView={isCardBack} />
                </div>

                <div className="mt-3 flex justify-center">
                  <button
                    onClick={() => setIsCardBack(!isCardBack)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold border border-slate-700 transition-colors shadow-md"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>{isCardBack ? 'सामने का भाग देखें (Front View)' : 'पीछे का भाग देखें (Back View)'}</span>
                  </button>
                </div>
              </div>

              {/* Download Controls */}
              <div className="w-full max-w-sm space-y-3">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                  <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>डाउनलोड एवं प्रिंट विकल्प</span>
                  </h4>

                  <button
                    onClick={handleDownloadPng}
                    disabled={isDownloading}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>HD PNG डाउनलोड करें (3.5x High-DPI)</span>
                  </button>

                  <button
                    onClick={handleDownloadJpeg}
                    disabled={isDownloading}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>HD JPEG डाउनलोड करें</span>
                  </button>

                  <button
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    <span>वेक्टर PDF डाउनलोड करें (CR80 Card Standard)</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>सीधे प्रिंट करें (Direct Print)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. STUDENT CREATOR TAB */}
        {activeTab === 'student_creator' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {createdStudentSlip && (
              <div className="p-5 rounded-3xl bg-emerald-950/80 border-2 border-emerald-500/80 shadow-2xl relative animate-fadeIn text-xs">
                <button
                  onClick={() => setCreatedStudentSlip(null)}
                  className="absolute right-4 top-4 p-1 text-emerald-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-2 text-emerald-400 font-black uppercase mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>छात्र खाता सफलतापूर्वक पंजीकृत (Student Credentials Slip)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-black/40 rounded-2xl border border-emerald-500/40 text-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">छात्र का नाम:</span>
                    <strong className="text-white text-sm">{createdStudentSlip.student.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">कक्षा / रोल नं:</span>
                    <strong className="text-amber-300">Class {createdStudentSlip.student.class}-{createdStudentSlip.student.section} (Roll #{createdStudentSlip.student.rollNumber})</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">छात्र ID:</span>
                    <strong className="font-mono text-cyan-300">{createdStudentSlip.student.studentId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">अस्थायी पासवर्ड:</span>
                    <strong className="font-mono text-emerald-300 bg-emerald-900/50 px-2 py-0.5 rounded border border-emerald-500/40">
                      {createdStudentSlip.password}
                    </strong>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[11px] text-slate-300">
                    यह क्रेडेंशियल स्लिप छात्र या अभिभावक को साझा करें।
                  </p>
                  <button
                    onClick={() => {
                      const text = `IndianPublic Student Portal Credentials:\nName: ${createdStudentSlip.student.name}\nClass: ${createdStudentSlip.student.class}-${createdStudentSlip.student.section}\nRoll No: ${createdStudentSlip.student.rollNumber}\nStudent ID: ${createdStudentSlip.student.studentId}\nPassword: ${createdStudentSlip.password}\nPortal URL: ${window.location.origin}`;
                      navigator.clipboard.writeText(text);
                      setCopiedSlip(true);
                      setTimeout(() => setCopiedSlip(false), 3000);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-200 text-xs font-bold border border-emerald-400 flex items-center space-x-1.5 transition-colors"
                  >
                    {copiedSlip ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSlip ? 'कॉपी हो गया!' : 'क्रेडेंशियल कॉपी करें'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase mb-4 border-b border-slate-700/80 pb-3">
                <Plus className="w-4 h-4" />
                <span>नया छात्र खाता व पहचान पत्र नामांकन</span>
              </div>

              <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">छात्र का पूरा नाम *</label>
                  <input
                    type="text"
                    required
                    value={newStudentName}
                    onChange={e => setNewStudentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    placeholder="उदा. Aarav Sharma"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">कक्षा (Class) *</label>
                    <input
                      type="text"
                      required
                      value={newStudentClass}
                      onChange={e => setNewStudentClass(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">सेक्शन (Section) *</label>
                    <input
                      type="text"
                      required
                      value={newStudentSection}
                      onChange={e => setNewStudentSection(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white uppercase focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                      placeholder="A"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">रोल नंबर *</label>
                    <input
                      type="text"
                      required
                      value={newStudentRoll}
                      onChange={e => setNewStudentRoll(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                      placeholder="24"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">जन्म तिथि (DOB) *</label>
                    <input
                      type="date"
                      required
                      value={newStudentDob}
                      onChange={e => setNewStudentDob(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">रक्त समूह (Blood Group)</label>
                    <select
                      value={newStudentBlood}
                      onChange={e => setNewStudentBlood(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">अभिभावक का नाम *</label>
                    <input
                      type="text"
                      required
                      value={newStudentGuardian}
                      onChange={e => setNewStudentGuardian(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                      placeholder="Suresh Sharma"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">अभिभावक का फोन *</label>
                    <input
                      type="text"
                      required
                      value={newStudentPhone}
                      onChange={e => setNewStudentPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">घर का पता (Address) *</label>
                  <input
                    type="text"
                    required
                    value={newStudentAddress}
                    onChange={e => setNewStudentAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    placeholder="Sector 12, Dwarka, New Delhi"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">अस्थायी पासवर्ड *</label>
                  <input
                    type="text"
                    required
                    value={newStudentPassword}
                    onChange={e => setNewStudentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-700 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg transition-all"
                  >
                    छात्र खाता व कार्ड जनरेट करें
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. ROSTER TAB */}
        {activeTab === 'roster' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Filter and Export Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-3xl border border-slate-700/80">
              <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="छात्र का नाम, रोल नंबर खोजें..."
                  className="w-full bg-transparent border-none text-xs text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-bold">कक्षा:</span>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">सभी अधिकृत कक्षाएं</option>
                  {assignedClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CSV निर्यात</span>
                </button>
              </div>
            </div>

            {/* Roster Table */}
            <div className="bg-slate-800/60 rounded-3xl border border-slate-700/80 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-700/80 font-bold">
                    <tr>
                      <th className="p-4">छात्र (Student)</th>
                      <th className="p-4">कक्षा / सेक्शन</th>
                      <th className="p-4">रोल नंबर</th>
                      <th className="p-4">जन्म तिथि & ब्लड ग्रुप</th>
                      <th className="p-4">अभिभावक</th>
                      <th className="p-4 text-right">कार्य (Action)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredStudents.map((st) => (
                      <tr key={st.studentId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 flex items-center space-x-3">
                          <img
                            src={st.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                            alt={st.name}
                            className="w-8 h-8 rounded-xl object-cover border border-slate-600"
                          />
                          <div>
                            <span className="font-bold text-white block">{st.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{st.studentId}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                            {st.class}-{st.section}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-amber-300">{st.rollNumber}</td>
                        <td className="p-4">
                          <span className="text-white block">{st.dob}</span>
                          <span className="text-[10px] text-emerald-400 font-bold">BG: {st.bloodGroup || 'O+'}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-white block">{st.guardianName}</span>
                          <span className="text-[10px] text-slate-400">{st.guardianPhone}</span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setPreviewStudent(st)}
                            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-emerald-300 transition-colors"
                            title="कार्ड देखें"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STUDENT DETAIL MODAL */}
      {previewStudent && (
        <div className="fixed inset-0 z-[140] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl relative text-xs">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold uppercase">
                <IdCard className="w-4 h-4" />
                <span>छात्र पहचान विवरण</span>
              </div>
              <button onClick={() => setPreviewStudent(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-4 mb-4">
              <img
                src={previewStudent.photoUrl}
                alt={previewStudent.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
              />
              <div>
                <h3 className="font-montserrat font-bold text-base text-white">{previewStudent.name}</h3>
                <span className="text-xs text-emerald-300 font-bold">कक्षा {previewStudent.class}-{previewStudent.section} (Roll #{previewStudent.rollNumber})</span>
                <span className="text-[10px] text-slate-400 block font-mono">{previewStudent.studentId}</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">जन्म तिथि:</span>
                <span className="font-semibold">{previewStudent.dob}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">रक्त समूह:</span>
                <span className="font-semibold text-emerald-400">{previewStudent.bloodGroup || 'O+'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">अभिभावक:</span>
                <span className="font-semibold">{previewStudent.guardianName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">संपर्क:</span>
                <span className="font-semibold">{previewStudent.guardianPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">पता:</span>
                <span className="font-semibold">{previewStudent.address}</span>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setPreviewStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(updated) => {
          setCurrentUser(updated);
        }}
      />
    </div>
  );
};
