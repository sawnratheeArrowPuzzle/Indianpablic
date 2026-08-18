import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  LogOut,
  QrCode,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  BarChart3,
  Layers,
  Phone,
  Mail,
  MapPin,
  X,
  Eye,
  Check,
  Award
} from 'lucide-react';
import { 
  UserProfile, 
  School, 
  Teacher, 
  Student, 
  AuditLog 
} from '../../types/school-system';
import { AdminRecord, StudentData } from '../../types';
import { 
  getSchools, 
  saveSchool, 
  getTeachers, 
  saveTeacher, 
  getStudents, 
  saveStudent, 
  softDeleteStudent, 
  getAuditLogs, 
  logAuditAction 
} from '../../services/schoolDataService';
import { exportRecordsToCSV } from '../../utils/storage';
import { LionEmblemSvg } from '../LionEmblemSvg';
import { StagingRbacTestPanel } from '../StagingRbacTestPanel';
import { StagingSeedPanel } from '../StagingSeedPanel';
import { UserProfileModal } from '../auth/UserProfileModal';

interface SuperAdminDashboardProps {
  currentUser: UserProfile;
  records: AdminRecord[];
  onLogout: () => void;
  onClose: () => void;
  onPreviewStudentCard?: (student: StudentData) => void;
}

type SuperTab = 'overview' | 'schools' | 'admins' | 'teachers' | 'students' | 'idcards' | 'audit' | 'staging';

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  currentUser: initialUser,
  records,
  onLogout,
  onClose,
  onPreviewStudentCard,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialUser);
  const [activeTab, setActiveTab] = useState<SuperTab>('overview');
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Staging subtab
  const [stagingSubTab, setStagingSubTab] = useState<'rbac' | 'seed'>('rbac');

  // Edit/Add School Modal
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [isAddingSchool, setIsAddingSchool] = useState(false);

  // Edit/Add Teacher Modal
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);

  // Edit/Add Student Modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // Delete Confirmation
  const [deleteTargetStudent, setDeleteTargetStudent] = useState<Student | null>(null);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [s, t, st, a] = await Promise.all([
        getSchools('super_admin', null),
        getTeachers('super_admin', null),
        getStudents('super_admin', null),
        getAuditLogs(currentUser),
      ]);
      setSchools(s);
      setTeachers(t);
      setStudents(st);
      setAuditLogs(a);
    } catch (err) {
      console.warn('Data load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Filtered lists
  const filteredSchools = useMemo(() => {
    return schools.filter(s => {
      const q = searchQuery.toLowerCase();
      return !q || s.schoolName.toLowerCase().includes(q) || s.schoolId.toLowerCase().includes(q) || s.principalName.toLowerCase().includes(q);
    });
  }, [schools, searchQuery]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const q = searchQuery.toLowerCase();
      const matchSchool = schoolFilter === 'ALL' || t.schoolId === schoolFilter;
      const matchQuery = !q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.designation.toLowerCase().includes(q);
      return matchSchool && matchQuery;
    });
  }, [teachers, searchQuery, schoolFilter]);

  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      const q = searchQuery.toLowerCase();
      const matchSchool = schoolFilter === 'ALL' || st.schoolId === schoolFilter;
      const matchQuery = !q || st.name.toLowerCase().includes(q) || st.rollNumber.includes(q) || st.studentId.toLowerCase().includes(q);
      return matchSchool && matchQuery;
    });
  }, [students, searchQuery, schoolFilter]);

  // Handle Save School
  const handleSaveSchoolSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const schoolId = (formData.get('schoolId') as string) || `SCH-${Date.now().toString(36).toUpperCase()}`;
    const newSchool: School = {
      schoolId,
      schoolName: formData.get('schoolName') as string,
      affiliationCode: formData.get('affiliationCode') as string,
      logoUrl: (formData.get('logoUrl') as string) || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=120&auto=format&fit=crop&q=80',
      principalName: formData.get('principalName') as string,
      contact: {
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
      },
      address: {
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        pincode: formData.get('pincode') as string,
      },
      status: 'active',
      createdAt: editingSchool?.createdAt || Date.now(),
    };

    try {
      await saveSchool(newSchool, currentUser);
      await loadAllData();
      setEditingSchool(null);
      setIsAddingSchool(false);
      showNotification(`✅ विद्यालय '${newSchool.schoolName}' सफलतापूर्वक सुरक्षित किया गया!`);
    } catch (err: unknown) {
      showNotification(`❌ त्रुटि: ${err instanceof Error ? err.message : 'Save error'}`);
    }
  };

  // Handle Save Teacher
  const handleSaveTeacherSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const teacherId = (formData.get('teacherId') as string) || `TCH-${Date.now().toString(36).toUpperCase()}`;
    const assignedClassesStr = formData.get('assignedClasses') as string;
    const assignedClasses = assignedClassesStr.split(',').map(c => c.trim()).filter(Boolean);

    const newTeacher: Teacher = {
      teacherId,
      authUid: editingTeacher?.authUid || `uid-${teacherId.toLowerCase()}`,
      schoolId: formData.get('schoolId') as string,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      designation: formData.get('designation') as string,
      assignedClasses: assignedClasses.length > 0 ? assignedClasses : ['10-A'],
      status: 'active',
      createdAt: editingTeacher?.createdAt || Date.now(),
    };

    try {
      await saveTeacher(newTeacher, currentUser);
      await loadAllData();
      setEditingTeacher(null);
      setIsAddingTeacher(false);
      showNotification(`✅ शिक्षक '${newTeacher.name}' का रिकॉर्ड सुरक्षित हो गया!`);
    } catch (err: unknown) {
      showNotification(`❌ त्रुटि: ${err instanceof Error ? err.message : 'Save error'}`);
    }
  };

  // Handle Save Student
  const handleSaveStudentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const studentId = (formData.get('studentId') as string) || `STU-${Date.now().toString(36).toUpperCase()}`;

    const newStudent: Student = {
      studentId,
      authUid: editingStudent?.authUid || `uid-${studentId.toLowerCase()}`,
      schoolId: formData.get('schoolId') as string,
      name: formData.get('name') as string,
      class: formData.get('class') as string,
      section: formData.get('section') as string,
      rollNumber: formData.get('rollNumber') as string,
      dob: formData.get('dob') as string,
      bloodGroup: formData.get('bloodGroup') as string,
      guardianName: formData.get('guardianName') as string,
      guardianPhone: formData.get('guardianPhone') as string,
      address: formData.get('address') as string,
      photoUrl: editingStudent?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      qrVerificationToken: editingStudent?.qrVerificationToken || `TOKEN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      status: 'active',
      createdAt: editingStudent?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    try {
      await saveStudent(newStudent, currentUser);
      await loadAllData();
      setEditingStudent(null);
      setIsAddingStudent(false);
      showNotification(`✅ विद्यार्थी '${newStudent.name}' का रिकॉर्ड सुरक्षित किया गया!`);
    } catch (err: unknown) {
      showNotification(`❌ त्रुटि: ${err instanceof Error ? err.message : 'Save error'}`);
    }
  };

  // Handle Soft Delete Student
  const handleConfirmDeleteStudent = async () => {
    if (!deleteTargetStudent) return;
    try {
      await softDeleteStudent(deleteTargetStudent.studentId, currentUser);
      await loadAllData();
      setDeleteTargetStudent(null);
      showNotification(`✅ विद्यार्थी '${deleteTargetStudent.name}' का स्टेटस निष्कासित/स्थानांतरित (Archived) कर दिया गया।`);
    } catch (err: unknown) {
      showNotification(`❌ त्रुटि: ${err instanceof Error ? err.message : 'Delete error'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#F8FAFC] text-slate-900 overflow-y-auto flex flex-col font-poppins selection:bg-amber-500 selection:text-white">
      {/* Top National Accent Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] border-b border-amber-900/10 shrink-0" />

      {/* Top Official Header */}
      <header className="bg-gradient-to-r from-[#0B1E36] via-[#102A4C] to-[#0B1E36] text-white px-4 sm:px-8 py-4 border-b-2 border-amber-500/80 shadow-md shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center shadow-inner shrink-0">
              <LionEmblemSvg size={28} color="#FFD700" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-montserrat font-bold text-xs text-amber-300 tracking-wider uppercase">
                  सर्वोच्च प्रशासनिक नियंत्रक • SUPER ADMIN
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-500/40">
                  GLOBAL MASTER ACCESS
                </span>
              </div>
              <h1 className="font-montserrat font-black text-base sm:text-lg tracking-wide text-white leading-tight">
                IndianPublic Central Multi-School Enterprise Console
              </h1>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                अभिलेख, विद्यालय प्रबंधन, शिक्षक संवर्ग, पहचान पत्र एवं सुरक्षा लेखा परीक्षा
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 self-end md:self-center shrink-0">
            {/* User Profile Button */}
            <button
              type="button"
              id="superadmin-profile-btn"
              onClick={() => setIsProfileModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 text-xs font-bold flex items-center space-x-2 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-amber-400/30 border border-amber-300 flex items-center justify-center shrink-0">
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
              <span className="font-montserrat">मेरी प्रोफाइल (Profile)</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="text-xs px-3.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-200 border border-red-500/40 flex items-center space-x-1.5 transition-colors font-medium cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>लॉगआउट</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>कार्ड मेकर पर वापस जाएं</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tab Bar */}
      <div className="bg-[#0B1E36] border-b border-amber-900/20 px-4 sm:px-8 py-2 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-2">
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>डैशबोर्ड ओवरव्यू</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('schools')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
                activeTab === 'schools'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>विद्यालय ({schools.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('teachers')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
                activeTab === 'teachers'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>शिक्षक संवर्ग ({teachers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
                activeTab === 'students'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>विद्यार्थी मास्टर ({students.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('idcards')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
                activeTab === 'idcards'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>आईडी कार्ड रिकॉर्ड्स ({records.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
                activeTab === 'audit'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>सुरक्षा ऑडिट लॉग्स</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('staging')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 border ${
                activeTab === 'staging'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                  : 'text-indigo-200 bg-indigo-950/40 hover:bg-indigo-900/60 border-indigo-700/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span>स्टेजिंग व RBAC लैब</span>
            </button>
          </div>

          <button
            type="button"
            onClick={loadAllData}
            disabled={isLoading}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center space-x-1 shrink-0"
            title="Refresh All Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">रीफ्रेश</span>
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {statusMessage && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 mt-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold shadow-sm flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)}><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    कुल पंजीकृत विद्यालय (Schools)
                  </span>
                  <span className="font-montserrat font-black text-3xl text-[#0B1E36] mt-1 block">
                    {schools.length}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                    100% Active Multi-Tenant
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
                  <Building2 className="w-7 h-7" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    कुल शिक्षक संवर्ग (Teachers)
                  </span>
                  <span className="font-montserrat font-black text-3xl text-emerald-700 mt-1 block">
                    {teachers.length}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Class Incharge Assigned
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <BookOpen className="w-7 h-7" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    कुल नामांकित विद्यार्थी (Students)
                  </span>
                  <span className="font-montserrat font-black text-3xl text-amber-700 mt-1 block">
                    {students.length}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    With Verified ID Records
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100">
                  <GraduationCap className="w-7 h-7" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    जारी आईडी कार्ड्स (Total Issued)
                  </span>
                  <span className="font-montserrat font-black text-3xl text-indigo-800 mt-1 block">
                    {records.length}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Digital + QR Verified
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <Users className="w-7 h-7" />
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Schools */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-montserrat font-bold text-sm text-[#0B1E36] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>संबद्ध विद्यालयों की सूची (Affiliated Schools)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSchool(null);
                      setIsAddingSchool(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>नया विद्यालय जोड़ें</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {schools.map(s => (
                    <div key={s.schoolId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-mono">
                            {s.schoolId}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 mt-1 leading-snug">{s.schoolName}</h4>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" title="Active"></span>
                      </div>
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <strong>Principal:</strong> {s.principalName}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {s.address.city}, {s.address.state}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Audit Snapshot */}
              <div className="bg-gradient-to-br from-[#0B1E36] to-[#1E3A8A] text-white rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Security Audit Trail</span>
                  </div>
                  <h3 className="font-montserrat font-bold text-base text-white">
                    हालिया प्रशासनिक गतिविधियां
                  </h3>
                  <div className="space-y-2 mt-4 max-h-56 overflow-y-auto pr-1">
                    {auditLogs.slice(0, 4).map(log => (
                      <div key={log.logId} className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-amber-300">
                          <span className="font-mono font-bold">{log.action}</span>
                          <span className="text-[10px] text-slate-300">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[11px] text-slate-200 truncate">{log.targetResource}</p>
                        <p className="text-[10px] text-slate-400">By: {log.actorEmail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors text-center"
                >
                  पूरा ऑडिट लॉग देखें ({auditLogs.length}) →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. SCHOOLS MANAGEMENT TAB */}
        {activeTab === 'schools' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="विद्यालय नाम या ID खोजें..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingSchool(null);
                  setIsAddingSchool(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>नया विद्यालय जोड़ें (Add School)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSchools.map(s => (
                <div key={s.schoolId} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-amber-400 transition-all space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
                        {s.schoolId}
                      </span>
                      <h3 className="font-montserrat font-bold text-base text-slate-900 mt-1.5">
                        {s.schoolName}
                      </h3>
                      <span className="text-[11px] text-slate-500 font-medium">Code: {s.affiliationCode}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-b border-slate-100 py-3">
                    <p className="flex items-center gap-1.5">
                      <strong className="text-slate-800">प्राचार्य:</strong> {s.principalName}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {s.contact.phone}
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {s.contact.email}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {s.address.city}, {s.address.state} ({s.address.pincode})
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSchool(s);
                        setIsAddingSchool(true);
                      }}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" /> विवरण संपादित करें (Edit)
                    </button>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Active Tenant
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. TEACHERS MASTER TAB */}
        {activeTab === 'teachers' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="शिक्षक का नाम खोजें..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400"
                  />
                </div>

                <select
                  value={schoolFilter}
                  onChange={e => setSchoolFilter(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  <option value="ALL">सभी विद्यालय (All Schools)</option>
                  {schools.map(s => (
                    <option key={s.schoolId} value={s.schoolId}>{s.schoolName}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingTeacher(null);
                  setIsAddingTeacher(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>नया शिक्षक जोड़ें (Add Teacher)</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10.5px]">
                      <th className="py-3 px-4">शिक्षक विवरण</th>
                      <th className="py-3 px-4">संबद्ध विद्यालय (School)</th>
                      <th className="py-3 px-4">पदनाम (Designation)</th>
                      <th className="py-3 px-4">असाइन कक्षाएं (Assigned Classes)</th>
                      <th className="py-3 px-4">ईमेल व संपर्क</th>
                      <th className="py-3 px-4 text-center">क्रिया</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTeachers.map(t => (
                      <tr key={t.teacherId} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{t.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{t.teacherId}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {schools.find(s => s.schoolId === t.schoolId)?.schoolName || t.schoolId}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{t.designation}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {t.assignedClasses.map(c => (
                              <span key={c} className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded">
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="block truncate">{t.email}</span>
                          <span className="block text-[10px] text-slate-400">{t.phone || 'N/A'}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTeacher(t);
                              setIsAddingTeacher(true);
                            }}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold transition-colors"
                            title="Edit Teacher"
                          >
                            <Edit className="w-3.5 h-3.5" />
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

        {/* 4. STUDENTS MASTER TAB */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="विद्यार्थी नाम या रोल नंबर खोजें..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400"
                  />
                </div>

                <select
                  value={schoolFilter}
                  onChange={e => setSchoolFilter(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  <option value="ALL">सभी विद्यालय (All Schools)</option>
                  {schools.map(s => (
                    <option key={s.schoolId} value={s.schoolId}>{s.schoolName}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingStudent(null);
                  setIsAddingStudent(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>नया विद्यार्थी जोड़ें (Add Student)</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10.5px]">
                      <th className="py-3 px-4">विद्यार्थी का नाम</th>
                      <th className="py-3 px-4">विद्यालय</th>
                      <th className="py-3 px-4">कक्षा व सेक्शन</th>
                      <th className="py-3 px-4">रोल नंबर</th>
                      <th className="py-3 px-4">अभिभावक व संपर्क</th>
                      <th className="py-3 px-4">स्थिति (Status)</th>
                      <th className="py-3 px-4 text-center">क्रियाएं</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map(st => (
                      <tr key={st.studentId} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2.5">
                            <img src={st.photoUrl} alt={st.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                            <div>
                              <span className="font-bold text-slate-900 block">{st.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{st.studentId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {schools.find(s => s.schoolId === st.schoolId)?.schoolName || st.schoolId}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">कक्षा {st.class}-{st.section}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">#{st.rollNumber}</td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="block font-medium">{st.guardianName}</span>
                          <span className="block text-[10px] text-slate-400">{st.guardianPhone}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${
                            st.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {st.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStudent(st);
                                setIsAddingStudent(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-amber-800 font-bold transition-colors"
                              title="Edit Student"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTargetStudent(st)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold transition-colors"
                              title="Archive/Deactivate Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. ID CARDS REPOSITORY TAB */}
        {activeTab === 'idcards' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ID कार्ड नंबर या नाम खोजें..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400"
                />
              </div>

              <button
                type="button"
                onClick={() => exportRecordsToCSV(records)}
                disabled={records.length === 0}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>एक्सेल शीट डाउनलोड (Export CSV)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {records.map(rec => (
                <div key={rec.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2 hover:border-amber-400 transition-all">
                  <div className="flex items-center space-x-3">
                    <img src={rec.photoUrl} alt={rec.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{rec.name}</h4>
                      <span className="block text-xs font-mono text-slate-500">{rec.idNumber}</span>
                      <span className="block text-[11px] text-slate-600 truncate">{rec.schoolName || rec.role}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{rec.date}</span>
                    <span className="font-bold text-amber-700 font-mono">Downloads: {rec.downloadCount || 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. AUDIT LOGS TAB */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Immutable Security & Operations Audit Logs</span>
              </div>
              <p className="text-xs text-slate-600">
                सिस्टम में की गई सभी प्रशासनिक कार्यवाहियों का अपरिवर्तनीय डिजिटल रिकॉर्ड (Tamper-proof Log)
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10.5px]">
                      <th className="py-3 px-4">समय (Timestamp)</th>
                      <th className="py-3 px-4">क्रिया (Action)</th>
                      <th className="py-3 px-4">संसाधन (Resource)</th>
                      <th className="py-3 px-4">प्रशासक (Actor Email)</th>
                      <th className="py-3 px-4">भूमिका (Role)</th>
                      <th className="py-3 px-4 text-center">स्थिति</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {auditLogs.map(log => (
                      <tr key={log.logId} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-3 px-4 font-bold text-amber-800">{log.action}</td>
                        <td className="py-3 px-4 text-slate-700">{log.targetResource}</td>
                        <td className="py-3 px-4 text-slate-600">{log.actorEmail}</td>
                        <td className="py-3 px-4 font-bold text-blue-900">{log.actorRole}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                            {log.status}
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

        {/* 7. STAGING & RBAC DEV LAB TAB */}
        {activeTab === 'staging' && (
          <div className="space-y-4">
            <div className="bg-indigo-950 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-indigo-800">
              <div>
                <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Authorized Super Admin Development & Staging Lab</span>
                </div>
                <h3 className="font-montserrat font-bold text-base text-white">
                  Staging Project `web-1e643` Isolation & RBAC Test Suite
                </h3>
                <p className="text-xs text-indigo-200 mt-1">
                  यह टूल केवल अधिकृत सुपर एडमिन के लिए सक्रिय है। सामान्य पब्लिक यूजर्स के लिए यह पूरी तरह से अगोचर (Hidden) है।
                </p>
              </div>

              <div className="flex items-center space-x-2 bg-indigo-900/60 p-1 rounded-xl border border-indigo-700/60 text-xs">
                <button
                  type="button"
                  onClick={() => setStagingSubTab('rbac')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    stagingSubTab === 'rbac' ? 'bg-indigo-500 text-white shadow-xs' : 'text-indigo-200 hover:text-white'
                  }`}
                >
                  RBAC 9-Test Suite
                </button>
                <button
                  type="button"
                  onClick={() => setStagingSubTab('seed')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    stagingSubTab === 'seed' ? 'bg-indigo-500 text-white shadow-xs' : 'text-indigo-200 hover:text-white'
                  }`}
                >
                  Staging Seed Setup
                </button>
              </div>
            </div>

            {stagingSubTab === 'rbac' ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <StagingRbacTestPanel />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <StagingSeedPanel />
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: Add / Edit School */}
      {isAddingSchool && (
        <div className="fixed inset-0 z-[130] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0B1E36] text-white p-5 flex items-center justify-between">
              <h3 className="font-montserrat font-bold text-sm">
                {editingSchool ? 'विद्यालय विवरण संपादित करें' : 'नया संबद्ध विद्यालय जोड़ें'}
              </h3>
              <button onClick={() => setIsAddingSchool(false)}><X className="w-5 h-5 text-slate-300 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSaveSchoolSubmit} className="p-6 space-y-4 text-xs">
              <input type="hidden" name="schoolId" defaultValue={editingSchool?.schoolId || ''} />
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">विद्यालय का नाम (School Name)</label>
                <input
                  name="schoolName"
                  defaultValue={editingSchool?.schoolName || ''}
                  required
                  placeholder="e.g. Kendriya Vidyalaya No. 1"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">संबद्धता कोड (Affiliation Code)</label>
                  <input
                    name="affiliationCode"
                    defaultValue={editingSchool?.affiliationCode || ''}
                    placeholder="CBSE-DEL-101"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">प्राचार्य का नाम (Principal)</label>
                  <input
                    name="principalName"
                    defaultValue={editingSchool?.principalName || ''}
                    required
                    placeholder="Dr. S. K. Sharma"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">संपर्क फोन</label>
                  <input
                    name="phone"
                    defaultValue={editingSchool?.contact.phone || ''}
                    placeholder="011-23456789"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">ईमेल</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={editingSchool?.contact.email || ''}
                    placeholder="principal@school.edu.in"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">शहर (City)</label>
                  <input
                    name="city"
                    defaultValue={editingSchool?.address.city || ''}
                    placeholder="New Delhi"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">राज्य (State)</label>
                  <input
                    name="state"
                    defaultValue={editingSchool?.address.state || ''}
                    placeholder="Delhi"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">पिनकोड</label>
                  <input
                    name="pincode"
                    defaultValue={editingSchool?.address.pincode || ''}
                    placeholder="110001"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors"
              >
                सुरक्षित करें (Save School Record)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Teacher */}
      {isAddingTeacher && (
        <div className="fixed inset-0 z-[130] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0B1E36] text-white p-5 flex items-center justify-between">
              <h3 className="font-montserrat font-bold text-sm">
                {editingTeacher ? 'शिक्षक विवरण संपादित करें' : 'नया शिक्षक जोड़ें'}
              </h3>
              <button onClick={() => setIsAddingTeacher(false)}><X className="w-5 h-5 text-slate-300 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSaveTeacherSubmit} className="p-6 space-y-4 text-xs">
              <input type="hidden" name="teacherId" defaultValue={editingTeacher?.teacherId || ''} />
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">शिक्षक का नाम (Teacher Name)</label>
                <input
                  name="name"
                  defaultValue={editingTeacher?.name || ''}
                  required
                  placeholder="e.g. Smt. Neha Sharma"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">संबद्ध विद्यालय (School)</label>
                  <select
                    name="schoolId"
                    defaultValue={editingTeacher?.schoolId || schools[0]?.schoolId || 'SCH-A'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  >
                    {schools.map(s => (
                      <option key={s.schoolId} value={s.schoolId}>{s.schoolName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">पदनाम (Designation)</label>
                  <input
                    name="designation"
                    defaultValue={editingTeacher?.designation || ''}
                    required
                    placeholder="TGT Mathematics / Class 10-A Incharge"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">ईमेल आईडी</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={editingTeacher?.email || ''}
                    required
                    placeholder="teacher@school.edu.in"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">मोबाइल नंबर</label>
                  <input
                    name="phone"
                    defaultValue={editingTeacher?.phone || ''}
                    placeholder="9876543210"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  असाइन कक्षाएं (Comma separated: 10-A, 9-B)
                </label>
                <input
                  name="assignedClasses"
                  defaultValue={editingTeacher?.assignedClasses.join(', ') || '10-A'}
                  placeholder="10-A, 10-B, 9-A"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors"
              >
                सुरक्षित करें (Save Teacher Record)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Student */}
      {isAddingStudent && (
        <div className="fixed inset-0 z-[130] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0B1E36] text-white p-5 flex items-center justify-between">
              <h3 className="font-montserrat font-bold text-sm">
                {editingStudent ? 'विद्यार्थी विवरण संपादित करें' : 'नया विद्यार्थी नामांकित करें'}
              </h3>
              <button onClick={() => setIsAddingStudent(false)}><X className="w-5 h-5 text-slate-300 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSaveStudentSubmit} className="p-6 space-y-4 text-xs">
              <input type="hidden" name="studentId" defaultValue={editingStudent?.studentId || ''} />
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">विद्यार्थी का नाम (Student Name)</label>
                <input
                  name="name"
                  defaultValue={editingStudent?.name || ''}
                  required
                  placeholder="e.g. Aarav Sharma"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-600"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">विद्यालय</label>
                  <select
                    name="schoolId"
                    defaultValue={editingStudent?.schoolId || schools[0]?.schoolId || 'SCH-A'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    {schools.map(s => (
                      <option key={s.schoolId} value={s.schoolId}>{s.schoolName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">कक्षा (Class)</label>
                  <input
                    name="class"
                    defaultValue={editingStudent?.class || '10'}
                    required
                    placeholder="10"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">सेक्शन</label>
                  <input
                    name="section"
                    defaultValue={editingStudent?.section || 'A'}
                    required
                    placeholder="A"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">रोल नंबर</label>
                  <input
                    name="rollNumber"
                    defaultValue={editingStudent?.rollNumber || '24'}
                    required
                    placeholder="24"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">जन्म तिथि (DOB)</label>
                  <input
                    name="dob"
                    type="date"
                    defaultValue={editingStudent?.dob || '2010-08-15'}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">ब्लड ग्रुप</label>
                  <input
                    name="bloodGroup"
                    defaultValue={editingStudent?.bloodGroup || 'O+'}
                    placeholder="O+"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">अभिभावक का नाम</label>
                  <input
                    name="guardianName"
                    defaultValue={editingStudent?.guardianName || ''}
                    required
                    placeholder="Shri Rajesh Sharma"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">अभिभावक फोन</label>
                  <input
                    name="guardianPhone"
                    defaultValue={editingStudent?.guardianPhone || ''}
                    required
                    placeholder="9876543210"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">पता (Address)</label>
                <input
                  name="address"
                  defaultValue={editingStudent?.address || ''}
                  placeholder="Plot 45, Sector 12, Dwarka, New Delhi"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-colors"
              >
                सुरक्षित करें (Save Student Record)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: Archive Student */}
      {deleteTargetStudent && (
        <div className="fixed inset-0 z-[140] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="font-montserrat font-bold text-lg text-slate-900">
              विद्यार्थी रिकॉर्ड निष्क्रिय (Archive) करें?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              क्या आप वाकई विद्यार्थी <strong>{deleteTargetStudent.name}</strong> (Roll #{deleteTargetStudent.rollNumber}) का रिकॉर्ड निष्कासित/स्थानांतरित स्थिति में बदलना चाहते हैं?
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetStudent(null)}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStudent}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
              >
                हाँ, आर्काइव करें
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
