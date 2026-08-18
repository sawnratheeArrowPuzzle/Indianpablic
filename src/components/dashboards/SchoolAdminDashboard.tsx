import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  LogOut,
  X,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Printer,
  Sparkles,
  Download,
  Copy,
  Check,
  RotateCw,
  IdCard,
  CreditCard,
  KeyRound,
  FileText
} from 'lucide-react';
import { UserProfile, School, Teacher, Student } from '../../types/school-system';
import { 
  getSchools, 
  saveSchool, 
  getTeachers, 
  saveTeacher, 
  getStudents, 
  saveStudent, 
  softDeleteStudent,
  subscribeToTeachers,
  subscribeToStudents
} from '../../services/schoolDataService';
import { createTeacherAccountByAdmin } from '../../services/multiRoleAuth';
import { AdminIdCard, AdminCardData } from '../cards/AdminIdCard';
import { downloadCardAsPng, downloadCardAsJpeg, downloadCardAsPdf } from '../cards/CardDownloadUtils';
import { LionEmblemSvg } from '../LionEmblemSvg';
import { UserProfileModal } from '../auth/UserProfileModal';

interface SchoolAdminDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onClose: () => void;
}

type SchoolTab = 'overview' | 'profile' | 'admin_card' | 'teachers' | 'students';

export const SchoolAdminDashboard: React.FC<SchoolAdminDashboardProps> = ({
  currentUser: initialUser,
  onLogout,
  onClose,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialUser);
  const [activeTab, setActiveTab] = useState<SchoolTab>('overview');
  const [school, setSchool] = useState<School | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Admin ID Card Controls
  const [isCardBack, setIsCardBack] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Teacher Creation & Credentials Slip State
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  const [newTeacherDesignation, setNewTeacherDesignation] = useState('TGT Science');
  const [newTeacherClasses, setNewTeacherClasses] = useState('10-A, 9-B');
  const [newTeacherPassword, setNewTeacherPassword] = useState('Teacher@2026');
  const [createdTeacherSlip, setCreatedTeacherSlip] = useState<{
    teacher: Teacher;
    password: string;
  } | null>(null);
  const [copiedSlip, setCopiedSlip] = useState(false);

  // Edit Teacher Modal
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Edit School Profile Form State
  const [profileSchoolName, setProfileSchoolName] = useState('');
  const [profileAffiliation, setProfileAffiliation] = useState('');
  const [profilePrincipal, setProfilePrincipal] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profileState, setProfileState] = useState('');
  const [profilePincode, setProfilePincode] = useState('');
  const [profileAddress, setProfileAddress] = useState('');

  const schoolId = currentUser.schoolId || 'SCH-A';

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4500);
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [sList, tList, stList] = await Promise.all([
        getSchools('school_admin', schoolId),
        getTeachers('school_admin', schoolId),
        getStudents('school_admin', schoolId),
      ]);
      if (sList.length > 0) {
        const sc = sList[0];
        setSchool(sc);
        setProfileSchoolName(sc.schoolName);
        setProfileAffiliation(sc.affiliationCode);
        setProfilePrincipal(sc.principalName);
        setProfilePhone(sc.contact.phone);
        setProfileEmail(sc.contact.email);
        setProfileCity(sc.address.city);
        setProfileState(sc.address.state);
        setProfilePincode(sc.address.pincode);
        setProfileAddress(sc.address.street || `${sc.address.city}, ${sc.address.state}`);
      }
      setTeachers(tList);
      setStudents(stList);
    } catch (err) {
      console.warn('Error loading school admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Subscribe to real-time updates
    const unsubTeachers = subscribeToTeachers('school_admin', schoolId, (updatedTeachers) => {
      setTeachers(updatedTeachers);
    });

    const unsubStudents = subscribeToStudents('school_admin', schoolId, undefined, undefined, (updatedStudents) => {
      setStudents(updatedStudents);
    });

    return () => {
      unsubTeachers();
      unsubStudents();
    };
  }, [schoolId]);

  // Distinct classes in this school
  const distinctClasses = useMemo(() => {
    const set = new Set<string>();
    students.forEach(st => set.add(`${st.class}-${st.section}`));
    return Array.from(set).sort();
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      const q = searchQuery.toLowerCase();
      const studentClass = `${st.class}-${st.section}`;
      const matchClass = classFilter === 'ALL' || studentClass === classFilter || st.class === classFilter;
      const matchQuery = !q || st.name.toLowerCase().includes(q) || st.rollNumber.includes(q) || st.studentId.toLowerCase().includes(q);
      return matchClass && matchQuery;
    });
  }, [students, searchQuery, classFilter]);

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const q = searchQuery.toLowerCase();
      return !q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.designation.toLowerCase().includes(q);
    });
  }, [teachers, searchQuery]);

  // Handle Save School Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileSchoolName.trim() || !profileAffiliation.trim()) {
      showNotification('कृपया विद्यालय का नाम एवं संबद्धता कोड दर्ज करें।', 'error');
      return;
    }

    const updatedSchool: School = {
      schoolId,
      schoolName: profileSchoolName.trim(),
      affiliationCode: profileAffiliation.trim(),
      logoUrl: school?.logoUrl || '',
      principalName: profilePrincipal.trim(),
      contact: {
        phone: profilePhone.trim(),
        email: profileEmail.trim(),
      },
      address: {
        street: profileAddress.trim(),
        city: profileCity.trim(),
        state: profileState.trim(),
        pincode: profilePincode.trim(),
      },
      status: 'active',
      createdAt: school?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await saveSchool(updatedSchool, currentUser);
      setSchool(updatedSchool);
      showNotification('विद्यालय प्रोफाइल सफलतापूर्वक अपडेट हो गई!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'प्रोफाइल सेव करने में त्रुटि';
      showNotification(msg, 'error');
    }
  };

  // Handle Create Teacher Account
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim() || !newTeacherEmail.trim()) {
      showNotification('कृपया शिक्षक का नाम और ईमेल दर्ज करें।', 'error');
      return;
    }

    const classArray = newTeacherClasses.split(',').map(c => c.trim()).filter(Boolean);

    try {
      const created = await createTeacherAccountByAdmin({
        name: newTeacherName,
        email: newTeacherEmail,
        phone: newTeacherPhone,
        designation: newTeacherDesignation,
        assignedClasses: classArray.length > 0 ? classArray : ['10-A'],
        tempPassword: newTeacherPassword,
      }, currentUser);

      setCreatedTeacherSlip({
        teacher: created,
        password: newTeacherPassword,
      });

      // Reset form
      setNewTeacherName('');
      setNewTeacherEmail('');
      setNewTeacherPhone('');
      setIsAddingTeacher(false);
      showNotification(`शिक्षक खाता ${created.name} सफलतापूर्वक बनाया गया!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'शिक्षक खाता बनाने में त्रुटि';
      showNotification(msg, 'error');
    }
  };

  // Admin Card Data
  const adminCardData: AdminCardData = {
    adminId: currentUser.uid.replace('uid-', 'ADM-').toUpperCase(),
    name: currentUser.displayName || school?.principalName || 'Principal Administrator',
    roleTitle: 'Principal & Chief Administrator',
    schoolName: school?.schoolName || 'Staging Model School Alpha',
    affiliationCode: school?.affiliationCode || 'CBSE-DEL-98421',
    phone: school?.contact.phone || currentUser.email,
    email: currentUser.email,
    address: `${school?.address.city || 'Delhi'}, ${school?.address.state || 'DL'}`,
    photoUrl: currentUser.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    signatoryName: currentUser.displayName?.split(' ')[0] || 'Administrator',
    signatoryTitle: 'Governing Authority',
  };

  // Download Handlers
  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      await downloadCardAsPng(cardRef.current, `Admin_Card_${currentUser.displayName?.replace(/\s+/g, '_') || 'Admin'}`);
      showNotification('HD PNG कार्ड सफलतापूर्वक डाउनलोड हुआ!');
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
      await downloadCardAsJpeg(cardRef.current, `Admin_Card_${currentUser.displayName?.replace(/\s+/g, '_') || 'Admin'}`);
      showNotification('HD JPEG कार्ड सफलतापूर्वक डाउनलोड हुआ!');
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
      await downloadCardAsPdf(cardRef.current, `Admin_Card_${currentUser.displayName?.replace(/\s+/g, '_') || 'Admin'}`);
      showNotification('वेक्टर PDF कार्ड सफलतापूर्वक डाउनलोड हुआ!');
    } catch {
      showNotification('PDF डाउनलोड में त्रुटि हुई', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 font-poppins">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B1E36] via-[#102A4C] to-[#0B1E36] p-4 sm:p-6 border-b border-amber-400/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center shadow-inner shrink-0">
            <LionEmblemSvg size={28} color="#FFD700" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                SCHOOL ADMIN CONSOLE
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {schoolId}
              </span>
            </div>
            <h1 className="font-montserrat font-black text-lg sm:text-xl text-white leading-tight mt-0.5">
              {school?.schoolName || 'विद्यालय प्रशासनिक नियंत्रण कक्ष'}
            </h1>
            <p className="text-xs text-slate-300">
              प्रशासक: <strong className="text-amber-300">{currentUser.displayName}</strong> ({currentUser.email})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* User Profile Button */}
          <button
            type="button"
            id="admin-profile-btn"
            onClick={() => setIsProfileModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 text-xs font-bold flex items-center space-x-2 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden bg-amber-400/30 border border-amber-300 flex items-center justify-center shrink-0">
              {currentUser.photoUrl ? (
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.displayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <LionEmblemSvg size={14} color="#FFD700" />
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
              ? 'border-amber-400 text-amber-400 bg-amber-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>संक्षिप्त विवरण (Overview)</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-amber-400 text-amber-400 bg-amber-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>विद्यालय प्रोफाइल (School Profile)</span>
        </button>

        <button
          onClick={() => setActiveTab('admin_card')}
          className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'admin_card'
              ? 'border-amber-400 text-amber-400 bg-amber-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <IdCard className="w-4 h-4" />
          <span>प्रशासक ID कार्ड (Admin Card)</span>
        </button>

        <button
          onClick={() => setActiveTab('teachers')}
          className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'teachers'
              ? 'border-amber-400 text-amber-400 bg-amber-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>शिक्षक संकाय ({teachers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'students'
              ? 'border-amber-400 text-amber-400 bg-amber-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>नामांकित छात्र ({students.length})</span>
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
                  <span className="text-xs text-slate-400 font-bold uppercase">कुल शिक्षक (Faculty)</span>
                  <h3 className="font-montserrat font-black text-2xl text-amber-300 mt-1">{teachers.length}</h3>
                  <span className="text-[11px] text-slate-400">अधिकृत संकाय सदस्य</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80 shadow-lg flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase">कुल नामांकित छात्र</span>
                  <h3 className="font-montserrat font-black text-2xl text-emerald-300 mt-1">{students.length}</h3>
                  <span className="text-[11px] text-slate-400">{distinctClasses.length} सक्रिय कक्षाएं</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <GraduationCap className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80 shadow-lg flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase">संबद्धता स्थिति</span>
                  <h3 className="font-montserrat font-black text-base text-cyan-300 mt-1 truncate max-w-[150px]">
                    {school?.affiliationCode || 'CBSE-DEL-98421'}
                  </h3>
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>सत्यापित मान्यता</span>
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Quick Actions Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                onClick={() => setActiveTab('admin_card')}
                className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 to-slate-800/80 border border-amber-400/30 hover:border-amber-400 cursor-pointer transition-all shadow-md group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <IdCard className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">प्रशासक ID कार्ड बनाएं व डाउनलोड करें</h4>
                <p className="text-xs text-slate-400 mt-1">
                  अपना आधिकारिक संस्थागत एडमिन पहचान पत्र HD PNG, Vector PDF या सीधे प्रिंट करें।
                </p>
              </div>

              <div 
                onClick={() => { setActiveTab('teachers'); setIsAddingTeacher(true); }}
                className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-slate-800/80 border border-emerald-400/30 hover:border-emerald-400 cursor-pointer transition-all shadow-md group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">नया शिक्षक खाता बनाएं</h4>
                <p className="text-xs text-slate-400 mt-1">
                  संकाय सदस्य जोड़ें, कक्षाएं असाइन करें और त्वरित क्रेडेंशियल स्लिप जनरेट करें।
                </p>
              </div>

              <div 
                onClick={() => setActiveTab('profile')}
                className="p-5 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-slate-800/80 border border-cyan-400/30 hover:border-cyan-400 cursor-pointer transition-all shadow-md group"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-400/20 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">विद्यालय प्रोफाइल संपादित करें</h4>
                <p className="text-xs text-slate-400 mt-1">
                  संस्था का नाम, बोर्ड कोड, प्राचार्य का नाम, संपर्क व पता विवरण अपडेट करें।
                </p>
              </div>
            </div>

            {/* School Master Info Card */}
            <div className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700/80">
              <div className="flex items-center justify-between mb-4 border-b border-slate-700/80 pb-3">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase">
                  <Building2 className="w-4 h-4" />
                  <span>संस्थागत मास्टर रिकॉर्ड</span>
                </div>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>संपादित करें</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">विद्यालय का नाम:</span>
                    <span className="font-bold text-white">{school?.schoolName}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">बोर्ड संबद्धता कोड:</span>
                    <span className="font-mono font-bold text-amber-300">{school?.affiliationCode}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">प्राचार्य / प्रशासक:</span>
                    <span className="font-semibold text-slate-200">{school?.principalName}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">संपर्क फोन:</span>
                    <span className="text-slate-200">{school?.contact.phone}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">आधिकारिक ईमेल:</span>
                    <span className="text-slate-200">{school?.contact.email}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">परिसर का पता:</span>
                    <span className="text-slate-200">{school?.address.street || `${school?.address.city}, ${school?.address.state}`}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. SCHOOL PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase mb-4 border-b border-slate-700/80 pb-3">
              <Building2 className="w-4 h-4" />
              <span>विद्यालय प्रोफाइल सेटअप एवं संशोधन</span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">विद्यालय का पूरा आधिकारिक नाम *</label>
                <input
                  type="text"
                  required
                  value={profileSchoolName}
                  onChange={e => setProfileSchoolName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  placeholder="उदा. केन्द्रीय मॉडल सीनियर सेकेंडरी स्कूल"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">बोर्ड संबद्धता कोड (Affiliation Code) *</label>
                  <input
                    type="text"
                    required
                    value={profileAffiliation}
                    onChange={e => setProfileAffiliation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono uppercase focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    placeholder="CBSE-DEL-98421"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">प्राचार्य का पूरा नाम *</label>
                  <input
                    type="text"
                    required
                    value={profilePrincipal}
                    onChange={e => setProfilePrincipal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    placeholder="Prof. Rajesh Kumar"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">आधिकारिक फोन नंबर *</label>
                  <input
                    type="text"
                    required
                    value={profilePhone}
                    onChange={e => setProfilePhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">आधिकारिक ईमेल *</label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={e => setProfileEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    placeholder="principal@school.edu.in"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">शहर (City) *</label>
                  <input
                    type="text"
                    required
                    value={profileCity}
                    onChange={e => setProfileCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    placeholder="New Delhi"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">राज्य (State) *</label>
                  <input
                    type="text"
                    required
                    value={profileState}
                    onChange={e => setProfileState(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    placeholder="Delhi"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">पिनकोड (Pincode) *</label>
                  <input
                    type="text"
                    required
                    value={profilePincode}
                    onChange={e => setProfilePincode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    placeholder="110001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">पूरा पता (Street Address)</label>
                <input
                  type="text"
                  value={profileAddress}
                  onChange={e => setProfileAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  placeholder="Institutional Area, Sector 4, New Delhi"
                />
              </div>

              <div className="pt-3 border-t border-slate-700 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg transition-all"
                >
                  प्रोफाइल सहेजें (Save Profile)
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. ADMIN ID CARD GENERATOR TAB */}
        {activeTab === 'admin_card' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center max-w-lg mx-auto mb-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold uppercase mb-2">
                <IdCard className="w-3.5 h-3.5" />
                <span>OFFICIAL ADMINISTRATOR CREDENTIAL</span>
              </div>
              <h2 className="font-montserrat font-bold text-xl text-white">
                प्रशासक पहचान पत्र (Admin ID Card)
              </h2>
              <p className="text-xs text-slate-300">
                आधिकारिक स्वर्ण-नील (Royal Navy & Gold) प्रशासनिक ID कार्ड। इसे HD इमेज, PDF में डाउनलोड करें या सीधे प्रिंट करें।
              </p>
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Live Rendered Card Component */}
              <div className="shrink-0">
                <div ref={cardRef}>
                  <AdminIdCard data={adminCardData} isBackView={isCardBack} />
                </div>

                {/* Flip Button */}
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={() => setIsCardBack(!isCardBack)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 transition-colors shadow-md"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>{isCardBack ? 'सामने का भाग देखें (Front View)' : 'पीछे का भाग देखें (Back View)'}</span>
                  </button>
                </div>
              </div>

              {/* Download & Export Controls */}
              <div className="w-full max-w-sm space-y-3">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                  <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>डाउनलोड एवं प्रिंट विकल्प</span>
                  </h4>

                  <button
                    onClick={handleDownloadPng}
                    disabled={isDownloading}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all disabled:opacity-50"
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
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    <span>वेक्टर PDF डाउनलोड करें (CR80 Card Standard)</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>सीधे प्रिंट करें (Direct Print)</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-[11px] text-slate-300">
                  <div className="flex items-center space-x-1.5 text-amber-300 font-bold mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>सत्यापित सुरक्षा मानक</span>
                  </div>
                  <p>
                    इस प्रशासनिक कार्ड में डिजिटल क्रिप्टोग्राफिक QR कोड व राष्ट्रीय प्रतीक चिन्ह एम्बेड किए गए हैं जो आधिकारिक पहचान सुनिश्चित करते हैं।
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. TEACHERS TAB */}
        {activeTab === 'teachers' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header & Add Button */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-montserrat font-bold text-lg text-white">शिक्षक एवं संकाय प्रबंधन</h3>
                <p className="text-xs text-slate-400">विद्यालय के सभी अधिकृत शिक्षक खातों एवं कक्षा आवंटन का नियंत्रण</p>
              </div>

              <button
                onClick={() => setIsAddingTeacher(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>नया शिक्षक खाता जोड़ें</span>
              </button>
            </div>

            {/* Teacher Created Slip Alert */}
            {createdTeacherSlip && (
              <div className="p-5 rounded-3xl bg-emerald-950/80 border-2 border-emerald-500/80 shadow-2xl relative animate-fadeIn text-xs">
                <button
                  onClick={() => setCreatedTeacherSlip(null)}
                  className="absolute right-4 top-4 p-1 text-emerald-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-2 text-emerald-400 font-black uppercase mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>शिक्षक खाता सफलतापूर्वक बनाया गया (Credentials Slip)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-black/40 rounded-2xl border border-emerald-500/40 text-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">शिक्षक का नाम:</span>
                    <strong className="text-white text-sm">{createdTeacherSlip.teacher.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">शिक्षक ID:</span>
                    <strong className="font-mono text-amber-300">{createdTeacherSlip.teacher.teacherId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">लॉगिन ईमेल:</span>
                    <strong className="text-white">{createdTeacherSlip.teacher.email}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">अस्थायी पासवर्ड:</span>
                    <strong className="font-mono text-emerald-300 bg-emerald-900/50 px-2 py-0.5 rounded border border-emerald-500/40">
                      {createdTeacherSlip.password}
                    </strong>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[11px] text-slate-300">
                    यह क्रेडेंशियल स्लिप शिक्षक को साझा करें ताकि वे पोर्टल में लॉगिन कर सकें।
                  </p>
                  <button
                    onClick={() => {
                      const text = `IndianPublic Portal Login Credentials:\nName: ${createdTeacherSlip.teacher.name}\nEmail: ${createdTeacherSlip.teacher.email}\nTemp Password: ${createdTeacherSlip.password}\nPortal URL: ${window.location.origin}`;
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

            {/* Teachers Table / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeachers.map((teacher) => (
                <div
                  key={teacher.teacherId}
                  className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-400/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-sm">
                        {teacher.name.charAt(0)}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                        {teacher.teacherId}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white">{teacher.name}</h4>
                    <span className="text-xs text-emerald-300 font-medium block mt-0.5">{teacher.designation}</span>

                    <div className="mt-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-1 text-xs">
                      <div className="flex items-center space-x-1.5 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                      {teacher.phone && (
                        <div className="flex items-center space-x-1.5 text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{teacher.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">आवंटित कक्षाएं:</span>
                      <div className="flex flex-wrap gap-1">
                        {teacher.assignedClasses.map(c => (
                          <span key={c} className="bg-emerald-500/10 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setEditingTeacher(teacher)}
                      className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>संपादित करें</span>
                    </button>
                    <span className="text-[10px] text-emerald-400 font-bold">● सक्रिय खाता</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-3xl border border-slate-700/80">
              <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="छात्र का नाम, रोल नंबर या ID खोजें..."
                  className="w-full bg-transparent border-none text-xs text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-bold">कक्षा:</span>
                <select
                  value={classFilter}
                  onChange={e => setClassFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">सभी कक्षाएं (All)</option>
                  {distinctClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-slate-800/60 rounded-3xl border border-slate-700/80 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-700/80 font-bold">
                    <tr>
                      <th className="p-4">छात्र (Student)</th>
                      <th className="p-4">कक्षा / सेक्शन</th>
                      <th className="p-4">रोल नंबर</th>
                      <th className="p-4">अभिभावक विवरण</th>
                      <th className="p-4">सत्यापन स्थिति</th>
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
                          <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded font-bold">
                            {st.class}-{st.section}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-amber-300">{st.rollNumber}</td>
                        <td className="p-4">
                          <span className="text-white block">{st.guardianName}</span>
                          <span className="text-[10px] text-slate-400">{st.guardianPhone}</span>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center space-x-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            <ShieldCheck className="w-3 h-3" />
                            <span>सक्रिय (Active)</span>
                          </span>
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

      {/* CREATE TEACHER MODAL */}
      {isAddingTeacher && (
        <div className="fixed inset-0 z-[140] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase">
                <BookOpen className="w-4 h-4" />
                <span>नया शिक्षक खाता बनाएं</span>
              </div>
              <button onClick={() => setIsAddingTeacher(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">शिक्षक का पूरा नाम *</label>
                <input
                  type="text"
                  required
                  value={newTeacherName}
                  onChange={e => setNewTeacherName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="उदा. Ananya Verma"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">लॉगिन ईमेल *</label>
                <input
                  type="email"
                  required
                  value={newTeacherEmail}
                  onChange={e => setNewTeacherEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="teacher.name@school.edu.in"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">पदनाम (Designation) *</label>
                  <input
                    type="text"
                    required
                    value={newTeacherDesignation}
                    onChange={e => setNewTeacherDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="TGT Science"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">फोन नंबर</label>
                  <input
                    type="text"
                    value={newTeacherPhone}
                    onChange={e => setNewTeacherPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">आवंटित कक्षाएं (Classes - comma separated) *</label>
                <input
                  type="text"
                  required
                  value={newTeacherClasses}
                  onChange={e => setNewTeacherClasses(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="10-A, 9-B"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">अस्थायी पासवर्ड (Temporary Password) *</label>
                <input
                  type="text"
                  required
                  value={newTeacherPassword}
                  onChange={e => setNewTeacherPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-700 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTeacher(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg"
                >
                  खाता बनाएं
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEACHER MODAL */}
      {editingTeacher && (
        <div className="fixed inset-0 z-[140] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase">
                <Edit className="w-4 h-4" />
                <span>शिक्षक विवरण संपादित करें</span>
              </div>
              <button onClick={() => setEditingTeacher(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">शिक्षक का नाम</label>
                <input
                  type="text"
                  value={editingTeacher.name}
                  onChange={e => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">पदनाम</label>
                <input
                  type="text"
                  value={editingTeacher.designation}
                  onChange={e => setEditingTeacher({ ...editingTeacher, designation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">आवंटित कक्षाएं (कॉमा से अलग करें)</label>
                <input
                  type="text"
                  value={editingTeacher.assignedClasses.join(', ')}
                  onChange={e => setEditingTeacher({
                    ...editingTeacher,
                    assignedClasses: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                  })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-700 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
                >
                  रद्द करें
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await saveTeacher(editingTeacher, currentUser);
                    setEditingTeacher(null);
                    showNotification('शिक्षक विवरण अपडेट हो गया!');
                  }}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-lg"
                >
                  सहेजें (Save)
                </button>
              </div>
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
