import React, { useState, useMemo, useRef } from 'react';
import {
  Shield,
  Search,
  Users,
  Download,
  Printer,
  Trash2,
  Edit,
  Eye,
  FileSpreadsheet,
  Lock,
  LogOut,
  CheckCircle2,
  Calendar,
  Phone,
  CreditCard,
  Building,
  RefreshCw,
  X,
  AlertCircle,
  KeyRound,
  Filter,
  Layers,
  ArrowUpDown,
  FileText,
  BarChart3,
  QrCode,
  Sparkles,
  School,
  Database,
  Sliders,
  CheckCheck,
  Copy,
  ExternalLink,
  ChevronRight,
  Upload,
  HardDrive,
  Cpu,
  Activity,
  Award,
  Globe,
  Radio,
  FileCode,
  ShieldCheck,
  Check
} from 'lucide-react';
import { AdminRecord, StudentData } from '../types';
import { exportRecordsToCSV, exportRecordsToJSON, importRecordsFromJSON, deleteUserRecord } from '../utils/storage';
import { LionEmblemSvg } from './LionEmblemSvg';
import { AshokaChakraSvg } from './AshokaChakraSvg';
import { IndependenceCard } from './IndependenceCard';
import { StagingRbacTestPanel } from './StagingRbacTestPanel';
import { StagingSeedPanel } from './StagingSeedPanel';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  records: AdminRecord[];
  onRefreshRecords: () => void;
  onSelectStudent: (student: StudentData) => void;
  onPrintStudent: (student: StudentData) => void;
  onDeleteRecord: (id: string) => void;
  onClearAllRecords?: () => void;
  onOpenBulkModal?: () => void;
  onOpenQrStudio?: () => void;
}

type AdminTab = 'overview' | 'records' | 'qr-hub' | 'schools' | 'system' | 'staging-lab';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  records,
  onRefreshRecords,
  onSelectStudent,
  onPrintStudent,
  onDeleteRecord,
  onClearAllRecords,
  onOpenBulkModal,
  onOpenQrStudio,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Search & Filters in Records Tab
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [themeFilter, setThemeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'downloads'>('newest');

  // Interactive QR / ID Verification Tool State
  const [qrVerifyInput, setQrVerifyInput] = useState('');
  const [verifiedResult, setVerifiedResult] = useState<AdminRecord | null | 'NOT_FOUND'>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Quick Preview Modal inside Admin
  const [previewStudent, setPreviewStudent] = useState<StudentData | null>(null);

  // Staging Lab Sub-tab
  const [stagingSubTab, setStagingSubTab] = useState<'rbac' | 'seed'>('rbac');

  // JSON Import File Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Password check
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'Sawn@1986') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('गलत पासवर्ड! कृपया सही एडमिन पासवर्ड दर्ज करें (Incorrect Password).');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        '⚠️ क्या आप वाकई एडमिन डेटाबेस से सभी रिकॉर्ड्स साफ़ (Clear All) करना चाहते हैं?\n\nयह प्रक्रिया वापस नहीं हो सकती।'
      )
    ) {
      if (onClearAllRecords) {
        onClearAllRecords();
      }
    }
  };

  // Handle JSON Backup Import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        importRecordsFromJSON(content);
        onRefreshRecords();
        setImportStatus('✅ डेटा सफलतापूर्वक पुनर्स्थापित (Imported) हो गया!');
        setTimeout(() => setImportStatus(null), 4000);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid JSON file';
        setImportStatus(`❌ आयात विफल (Import Failed): ${msg}`);
        setTimeout(() => setImportStatus(null), 5000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Search & Filter records
  const filteredRecords = useMemo(() => {
    let result = records.filter((rec) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        rec.name.toLowerCase().includes(q) ||
        (rec.phone && rec.phone.includes(q)) ||
        (rec.idNumber && rec.idNumber.toLowerCase().includes(q)) ||
        (rec.schoolName && rec.schoolName.toLowerCase().includes(q)) ||
        (rec.place && rec.place.toLowerCase().includes(q)) ||
        (rec.state && rec.state.toLowerCase().includes(q));

      const matchesRole =
        roleFilter === 'ALL' ||
        (roleFilter === 'STUDENT' && rec.role.toLowerCase().includes('student')) ||
        (roleFilter === 'CITIZEN' && (rec.role.toLowerCase().includes('citizen') || rec.role.toLowerCase().includes('proud'))) ||
        (roleFilter === 'STAFF' && (rec.role.toLowerCase().includes('teacher') || rec.role.toLowerCase().includes('staff') || rec.role.toLowerCase().includes('head')));

      const matchesTheme =
        themeFilter === 'ALL' ||
        (themeFilter === 'tricolor' && (!rec.theme || rec.theme === 'independence_day')) ||
        (themeFilter === 'modern' && rec.theme === 'modern_digital') ||
        (themeFilter === 'vintage' && rec.theme === 'vintage_heritage');

      return matchesSearch && matchesRole && matchesTheme;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'downloads') {
        return (b.downloadCount || 1) - (a.downloadCount || 1);
      }
      return 0;
    });

    return result;
  }, [records, searchTerm, roleFilter, themeFilter, sortBy]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const total = records.length;
    const now = new Date();
    const todayCount = records.filter((r) => {
      const d = new Date(r.createdAt);
      return d.toDateString() === now.toDateString();
    }).length;
    const totalDownloads = records.reduce((acc, curr) => acc + (curr.downloadCount || 1), 0);

    const students = records.filter((r) => r.role.toLowerCase().includes('student')).length;
    const citizens = records.filter((r) => r.role.toLowerCase().includes('citizen') || r.role.toLowerCase().includes('proud')).length;
    const staff = records.filter((r) => r.role.toLowerCase().includes('teacher') || r.role.toLowerCase().includes('staff') || r.role.toLowerCase().includes('head')).length;
    const otherRoles = Math.max(0, total - (students + citizens + staff));

    const tricolorCount = records.filter((r) => !r.theme || r.theme === 'independence_day').length;
    const modernCount = records.filter((r) => r.theme === 'modern_digital').length;
    const vintageCount = records.filter((r) => r.theme === 'vintage_heritage').length;

    // School grouping
    const schoolMap: Record<string, AdminRecord[]> = {};
    records.forEach((r) => {
      const sName = (r.schoolName || 'Kendriya Vidyalaya / Other Institution').trim();
      if (!schoolMap[sName]) schoolMap[sName] = [];
      schoolMap[sName].push(r);
    });

    const schoolsList = Object.entries(schoolMap).map(([schoolName, studentsList]) => ({
      schoolName,
      count: studentsList.length,
      studentsList,
    })).sort((a, b) => b.count - a.count);

    return {
      total,
      todayCount,
      totalDownloads,
      students,
      citizens,
      staff,
      otherRoles,
      tricolorCount,
      modernCount,
      vintageCount,
      schoolsList,
    };
  }, [records]);

  // QR Cross-Verification function
  const handleVerifyPayload = (e: React.FormEvent) => {
    e.preventDefault();
    const query = qrVerifyInput.trim().toLowerCase();
    if (!query) return;

    const matched = records.find((r) => {
      return (
        (r.idNumber && r.idNumber.toLowerCase() === query) ||
        r.id.toLowerCase() === query ||
        (r.phone && r.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''))) ||
        r.name.toLowerCase() === query
      );
    });

    if (matched) {
      setVerifiedResult(matched);
    } else {
      setVerifiedResult('NOT_FOUND');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#F8FAFC] text-slate-900 overflow-y-auto w-full h-full flex flex-col font-poppins selection:bg-amber-500 selection:text-white">
      {/* Top National Accent Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] border-b border-amber-900/10 shrink-0" />

      {/* Top Official National Header */}
      <header className="bg-gradient-to-r from-[#0B1E36] via-[#102A4C] to-[#0B1E36] text-white px-4 sm:px-8 py-4 border-b-2 border-amber-500/80 shadow-md shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/30 to-amber-600/20 border border-amber-400/50 flex items-center justify-center shadow-inner shrink-0">
              <LionEmblemSvg size={28} color="#FFD700" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-montserrat font-bold text-xs text-amber-300 tracking-wider uppercase">
                  भारत सरकार • GOVT OF INDIA
                </span>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded border border-amber-400/40 tracking-wider">
                  CENTRAL REPOSITORY & ADMIN
                </span>
              </div>
              <h1 className="font-montserrat font-black text-base sm:text-lg tracking-wide text-white leading-tight">
                National ID Card & Certificate Management Dashboard
              </h1>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                केंद्रीय पहचान पत्र अभिलेख, सत्यापन एवं विद्यालय सहभागिता प्रणाली
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 self-end md:self-center shrink-0">
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-200 border border-red-500/40 flex items-center space-x-1.5 transition-colors font-medium"
                title="Logout from Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-md transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
              <span>कार्ड मेकर पर वापस जाएं (Exit)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Auth Gateway Screen if Not Authenticated */}
      {!isAuthenticated ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center my-auto">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 sm:p-10 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-2 border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-700 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="font-montserrat font-black text-xl text-[#0B1E36] mb-1">
              Admin Authentication Required
            </h2>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              यह प्रशासनिक डैशबोर्ड केवल अधिकृत एडमिन के लिए सुरक्षित है। सभी पंजीकृत छात्रों, डाउनलोड्स एवं सत्यापन टूल्स के लिए पासवर्ड दर्ज करें।
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative text-left">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="दर्ज करें एडमिन पासवर्ड (Enter Admin Password)..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-all shadow-xs"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-[#0B1E36] to-[#1E3A8A] hover:from-[#081526] hover:to-[#172554] text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>प्रशासनिक डैशबोर्ड अनलॉक करें (Unlock Dashboard)</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Authenticated Full Premium Admin Dashboard */
        <div className="flex-1 flex flex-col">
          {/* Modern Tab Bar Strip */}
          <div className="bg-[#0B1E36] border-b border-amber-900/20 px-4 sm:px-8 py-2 sticky top-0 z-30 shadow-md">
            <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-2">
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
                    activeTab === 'overview'
                      ? 'bg-amber-500 text-slate-950 shadow-md scale-100'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>डैशबोर्ड ओवरव्यू (Overview)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('records')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
                    activeTab === 'records'
                      ? 'bg-amber-500 text-slate-950 shadow-md scale-100'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>आईडी कार्ड रिकॉर्ड्स ({records.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('qr-hub')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
                    activeTab === 'qr-hub'
                      ? 'bg-amber-500 text-slate-950 shadow-md scale-100'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>QR सत्यापन हब (Verification)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('schools')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
                    activeTab === 'schools'
                      ? 'bg-amber-500 text-slate-950 shadow-md scale-100'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <School className="w-4 h-4" />
                  <span>स्कूल व संस्थान ({stats.schoolsList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('system')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
                    activeTab === 'system'
                      ? 'bg-amber-500 text-slate-950 shadow-md scale-100'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>सिस्टम व बैकअप</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('staging-lab')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 border ${
                    activeTab === 'staging-lab'
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                      : 'text-indigo-200 bg-indigo-950/40 hover:bg-indigo-900/60 border-indigo-700/50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-300" />
                  <span>स्टेजिंग व RBAC लैब (Dev)</span>
                </button>
              </div>

              <div className="hidden lg:flex items-center space-x-2 text-[11px] text-amber-300/80 font-mono shrink-0">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>DB ACTIVE • 2026 REPOSITORY</span>
              </div>
            </div>
          </div>

          {/* Main Dashboard View Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
            {/* 1. OVERVIEW & ANALYTICS TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 4 Core Metric KPI Cards */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Total ID Cards (कुल जारी)
                      </span>
                      <span className="font-montserrat font-black text-3xl text-[#0B1E36] mt-1 block">
                        {stats.total}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Registered in permanent DB
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
                      <Users className="w-7 h-7" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Issued Today (आज जारी)
                      </span>
                      <span className="font-montserrat font-black text-3xl text-emerald-700 mt-1 block">
                        {stats.todayCount}
                      </span>
                      <span className="text-[11px] text-emerald-600 font-semibold mt-1 block flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Live Activity Recorded
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <Calendar className="w-7 h-7" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Downloads / Exports
                      </span>
                      <span className="font-montserrat font-black text-3xl text-amber-700 mt-1 block">
                        {stats.totalDownloads}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        PNG, HD JPEG & Vector PDF
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100">
                      <Download className="w-7 h-7" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Registered Schools
                      </span>
                      <span className="font-montserrat font-black text-3xl text-indigo-800 mt-1 block">
                        {stats.schoolsList.length}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Institutions participating
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <School className="w-7 h-7" />
                    </div>
                  </div>
                </section>

                {/* Middle Row: Theme Distribution + Quick Action Hub */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Theme Usage Breakdown */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-montserrat font-bold text-sm text-[#0B1E36] flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span>थीम उपयोग विवरण (Themes Breakdown)</span>
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">3 Themes</span>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            Tricolor Independence Theme
                          </span>
                          <span className="font-mono">{stats.tricolorCount} ({stats.total > 0 ? Math.round((stats.tricolorCount / stats.total) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                            style={{ width: `${stats.total > 0 ? (stats.tricolorCount / stats.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                            Modern Digital Dark/Cyan
                          </span>
                          <span className="font-mono">{stats.modernCount} ({stats.total > 0 ? Math.round((stats.modernCount / stats.total) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-cyan-600 rounded-full"
                            style={{ width: `${stats.total > 0 ? (stats.modernCount / stats.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                            Vintage Khadi Heritage
                          </span>
                          <span className="font-mono">{stats.vintageCount} ({stats.total > 0 ? Math.round((stats.vintageCount / stats.total) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-emerald-700 rounded-full"
                            style={{ width: `${stats.total > 0 ? (stats.vintageCount / stats.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Total Registered: {stats.total}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('records');
                          setThemeFilter('ALL');
                        }}
                        className="text-amber-700 font-bold hover:underline"
                      >
                        रिकॉर्ड्स देखें →
                      </button>
                    </div>
                  </div>

                  {/* Category Classification */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-montserrat font-bold text-sm text-[#0B1E36] flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>श्रेणी वितरण (User Categories)</span>
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">Live Sync</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60">
                        <span className="text-[10.5px] font-bold text-blue-900 uppercase">छात्र (Students)</span>
                        <span className="block font-montserrat font-black text-xl text-blue-950 mt-0.5">{stats.students}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60">
                        <span className="text-[10.5px] font-bold text-amber-900 uppercase">नागरिक (Citizens)</span>
                        <span className="block font-montserrat font-black text-xl text-amber-950 mt-0.5">{stats.citizens}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
                        <span className="text-[10.5px] font-bold text-emerald-900 uppercase">स्टाफ / शिक्षक</span>
                        <span className="block font-montserrat font-black text-xl text-emerald-950 mt-0.5">{stats.staff}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                        <span className="text-[10.5px] font-bold text-slate-700 uppercase">अन्य / विशेष</span>
                        <span className="block font-montserrat font-black text-xl text-slate-900 mt-0.5">{stats.otherRoles}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Centralized Repository</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('schools')}
                        className="text-blue-700 font-bold hover:underline"
                      >
                        स्कूल सूची देखें →
                      </button>
                    </div>
                  </div>

                  {/* Administrative Quick Actions Hub */}
                  <div className="bg-gradient-to-br from-[#0B1E36] to-[#172554] text-white rounded-2xl p-5 shadow-lg space-y-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                        <Sparkles className="w-4 h-4" />
                        <span>Administrative Tools</span>
                      </div>
                      <h3 className="font-montserrat font-bold text-base text-white">
                        क्विक एक्शन व रिपोर्ट एक्सपोर्ट
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">
                        केंद्रीय डेटाबेस से एक-क्लिक में एक्सेल, बैकअप या बल्क जेनरेटर टूल खोलें।
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={() => exportRecordsToCSV(records)}
                        disabled={records.length === 0}
                        className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-all"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>एक्सेल शीट डाउनलोड (Export CSV)</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenBulkModal) {
                              onClose();
                              onOpenBulkModal();
                            }
                          }}
                          className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors border border-white/15"
                        >
                          <Users className="w-3.5 h-3.5 text-amber-300" />
                          <span>बल्क बैच मेकर</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenQrStudio) {
                              onClose();
                              onOpenQrStudio();
                            }
                          }}
                          className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors border border-white/15"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-300" />
                          <span>QR Studio</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Recent Issuances Feed */}
                <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-montserrat font-bold text-sm text-[#0B1E36]">
                        हाल ही में जारी किए गए कार्ड्स (Recent Registrations)
                      </h3>
                      <p className="text-xs text-slate-500">
                        नवीनतम 5 पंजीकृत नागरिकों और विद्यार्थियों का त्वरित विवरण
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('records')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-800 hover:text-amber-900 text-xs font-bold transition-colors"
                    >
                      सभी रिकॉर्ड्स देखें ({records.length}) →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {records.slice(0, 6).map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-white transition-all flex items-start space-x-3 group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                          {rec.photoUrl ? (
                            <img src={rec.photoUrl} alt={rec.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Users className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-[#0B1E36] truncate group-hover:text-amber-700">
                            {rec.name}
                          </h4>
                          <span className="block text-[11px] text-slate-500 font-mono truncate">
                            {rec.idNumber}
                          </span>
                          <span className="block text-[10.5px] text-slate-600 truncate mt-0.5">
                            {rec.schoolName || rec.role}
                          </span>
                          <div className="mt-2 flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setPreviewStudent(rec)}
                              className="text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-0.5"
                            >
                              <Eye className="w-3 h-3" /> व्यू कार्ड
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                              type="button"
                              onClick={() => {
                                onSelectStudent(rec);
                                onClose();
                              }}
                              className="text-[10px] font-bold text-amber-700 hover:underline flex items-center gap-0.5"
                            >
                              <Edit className="w-3 h-3" /> एडिट करें
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* 2. ID CARD RECORDS TAB */}
            {activeTab === 'records' && (
              <div className="space-y-4">
                {/* Search & Filter Toolbar */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="नाम, मोबाइल, ID या स्कूल खोजें..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-all"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Role Filter */}
                    <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
                      <button
                        type="button"
                        onClick={() => setRoleFilter('ALL')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                          roleFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        सभी ({records.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoleFilter('STUDENT')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                          roleFilter === 'STUDENT' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        छात्र
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoleFilter('CITIZEN')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                          roleFilter === 'CITIZEN' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        नागरिक
                      </button>
                    </div>

                    {/* Theme Filter */}
                    <select
                      value={themeFilter}
                      onChange={(e) => setThemeFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-600"
                    >
                      <option value="ALL">सभी थीम्स (All Themes)</option>
                      <option value="tricolor">Tricolor Theme</option>
                      <option value="modern">Modern Digital</option>
                      <option value="vintage">Vintage Khadi</option>
                    </select>

                    {/* Sort Options */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name' | 'downloads')}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-600"
                    >
                      <option value="newest">नवीनतम पहले (Newest)</option>
                      <option value="oldest">पुराने पहले (Oldest)</option>
                      <option value="name">नाम (A to Z)</option>
                      <option value="downloads">डाउनलोड्स (Most Downloaded)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => exportRecordsToCSV(filteredRecords)}
                      disabled={filteredRecords.length === 0}
                      className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-all"
                      title="Export filtered records to CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Export ({filteredRecords.length})</span>
                    </button>
                  </div>
                </div>

                {/* Records Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10.5px] tracking-wider">
                          <th className="py-3 px-4">फोटो व छात्र / नागरिक</th>
                          <th className="py-3 px-4">पहचान संख्या (ID No)</th>
                          <th className="py-3 px-4">मोबाइल नंबर</th>
                          <th className="py-3 px-4">स्कूल / संस्थान</th>
                          <th className="py-3 px-4">स्थान / राज्य</th>
                          <th className="py-3 px-4">जारी तिथि</th>
                          <th className="py-3 px-4 text-center">क्रियाएँ (Actions)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRecords.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400">
                              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                              <p className="font-semibold">कोई रिकॉर्ड नहीं मिला (No Records Found)</p>
                              <span className="text-[11px]">कृपया सर्च शब्द बदलें या नया कार्ड बनाएं।</span>
                            </td>
                          </tr>
                        ) : (
                          filteredRecords.map((rec) => (
                            <tr key={rec.id} className="hover:bg-amber-50/40 transition-colors group">
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                    {rec.photoUrl ? (
                                      <img src={rec.photoUrl} alt={rec.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <Users className="w-5 h-5" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-900 block leading-tight group-hover:text-amber-800">
                                      {rec.name}
                                    </span>
                                    <span className="text-[10.5px] text-slate-500 font-medium">{rec.role}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    {rec.idNumber || 'IND-XXXXX'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(rec.idNumber || '', `id-${rec.id}`)}
                                    className="text-slate-400 hover:text-amber-600 p-1"
                                    title="Copy ID"
                                  >
                                    {copiedText === `id-${rec.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-1.5 font-mono text-slate-700">
                                  <span>{rec.phone || '—'}</span>
                                  {rec.phone && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(rec.phone || '', `ph-${rec.id}`)}
                                      className="text-slate-400 hover:text-amber-600 p-1"
                                      title="Copy Phone"
                                    >
                                      {copiedText === `ph-${rec.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4 text-slate-700 max-w-[180px] truncate">
                                {rec.schoolName || 'Kendriya Vidyalaya'}
                              </td>

                              <td className="py-3 px-4 text-slate-600">
                                {rec.place || 'India'}, {rec.state || 'Delhi'}
                              </td>

                              <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                                {new Date(rec.createdAt || Date.now()).toLocaleDateString('en-IN')}
                              </td>

                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewStudent(rec)}
                                    className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                                    title="View Full Card"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      onSelectStudent(rec);
                                      onClose();
                                    }}
                                    className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                                    title="Edit in Main Card Creator"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onPrintStudent(rec)}
                                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
                                    title="Instant Print"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`क्या आप ${rec.name} का रिकॉर्ड हटाना चाहते हैं?`)) {
                                        onDeleteRecord(rec.id);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors"
                                    title="Delete Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. QR VERIFICATION HUB TAB */}
            {activeTab === 'qr-hub' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-montserrat font-bold text-base text-[#0B1E36] flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-emerald-700" />
                      <span>QR कोड एवं पहचान पत्र सत्यापन केंद्र (Verification Engine)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      पहचान पत्र की प्रामाणिकता जांचने के लिए कार्ड संख्या (ID Number जैसे <code>IND-15AUG-2026-XXXXX</code>), नाम या पंजीकृत मोबाइल नंबर दर्ज करें।
                    </p>
                  </div>

                  <form onSubmit={handleVerifyPayload} className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={qrVerifyInput}
                        onChange={(e) => setQrVerifyInput(e.target.value)}
                        placeholder="दर्ज करें ID No या फोन नंबर (e.g. IND-15AUG-2026-08765)..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-600 focus:bg-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-900 hover:to-teal-950 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shrink-0"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-300" />
                      <span>सत्यापित करें (Verify ID)</span>
                    </button>
                  </form>

                  {/* Verification Results Display */}
                  {verifiedResult === 'NOT_FOUND' && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-xs">सत्यापन विफल (Verification Failed - Record Not Found)</h4>
                        <p className="text-[11px] text-red-700 mt-0.5">
                          दर्ज की गई पहचान संख्या या फोन नंबर केंद्रीय डेटाबेस में पंजीकृत नहीं है।
                        </p>
                      </div>
                    </div>
                  )}

                  {verifiedResult && verifiedResult !== 'NOT_FOUND' && (
                    <div className="p-5 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 text-slate-900 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span>सत्यापित आधिकारिक रिकॉर्ड (Verified Official Issuance)</span>
                        </div>
                        <span className="bg-emerald-200 text-emerald-950 text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-400">
                          MATCH 100%
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-emerald-200 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">विद्यार्थी / नागरिक का नाम</span>
                          <span className="font-bold text-slate-900 text-sm">{verifiedResult.name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">पहचान संख्या (ID No)</span>
                          <span className="font-mono font-bold text-emerald-800">{verifiedResult.idNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">विद्यालय / संस्था</span>
                          <span className="font-semibold text-slate-800 truncate block">{verifiedResult.schoolName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">पंजीकृत मोबाइल</span>
                          <span className="font-mono font-semibold text-slate-800">{verifiedResult.phone || '—'}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => setPreviewStudent(verifiedResult)}
                          className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center space-x-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>आईडी कार्ड देखें (Preview Card)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onPrintStudent(verifiedResult)}
                          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-300 flex items-center space-x-1.5"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>प्रिंट करें (Print)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. SCHOOLS & BATCH ROSTERS TAB */}
            {activeTab === 'schools' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-montserrat font-bold text-base text-[#0B1E36]">
                      विद्यालय व संस्थान अनुसार अभिलेख (School Rosters)
                    </h3>
                    <p className="text-xs text-slate-500">
                      सभी पंजीकृत विद्यालयों की सूची एवं संबंधित छात्र कार्ड्स
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.schoolsList.map((sch) => (
                    <div
                      key={sch.schoolName}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-400 transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                            <School className="w-5 h-5" />
                          </div>
                          <span className="bg-slate-100 text-slate-800 text-xs font-mono font-bold px-2.5 py-1 rounded-full border border-slate-200">
                            {sch.count} {sch.count === 1 ? 'छात्र' : 'छात्र'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#0B1E36] mt-3 leading-snug line-clamp-2">
                          {sch.schoolName}
                        </h4>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('records');
                            setSearchTerm(sch.schoolName);
                          }}
                          className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
                        >
                          छात्र सूची देखें ({sch.count}) →
                        </button>

                        <button
                          type="button"
                          onClick={() => exportRecordsToCSV(sch.studentsList)}
                          className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                          title="Export school students CSV"
                        >
                          <FileSpreadsheet className="w-3 h-3" /> Export
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. SYSTEM & BACKUP TAB */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                {/* Production Isolation & Health Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-montserrat font-bold text-sm text-[#0B1E36] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <span>Production Environment Status</span>
                    </h3>
                    <span className="bg-emerald-100 text-emerald-900 text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                      LIVE & PROTECTED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Project</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">gen-lang-client-0627643856</span>
                      <span className="text-[10.5px] text-emerald-600 block mt-1">Default Production Config</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Firestore Rules</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">Strict Security Active</span>
                      <span className="text-[10.5px] text-emerald-600 block mt-1">Production 100% Intact</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Local DB Engine</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">IndexedDB + LocalStorage</span>
                      <span className="text-[10.5px] text-blue-600 block mt-1">{records.length} Records Stored</span>
                    </div>
                  </div>
                </div>

                {/* Database Backup & Restore */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-montserrat font-bold text-sm text-[#0B1E36] flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      <span>डेटाबेस बैकअप व पुनर्स्थापना (Backup & Restore)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      संपूर्ण डेटाबेस का सुरक्षित JSON बैकअप डाउनलोड करें या बैकअप फ़ाइल से डेटा पुनर्स्थापित करें।
                    </p>
                  </div>

                  {importStatus && (
                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800">
                      {importStatus}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => exportRecordsToJSON(records)}
                      disabled={records.length === 0}
                      className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-2 shadow-xs transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>JSON बैकअप डाउनलोड करें (Export JSON)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center space-x-2 border border-slate-300 transition-colors"
                    >
                      <Upload className="w-4 h-4 text-slate-600" />
                      <span>JSON बैकअप अपलोड करें (Import JSON)</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileImport}
                      accept=".json"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={handleClearAll}
                      disabled={records.length === 0}
                      className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 disabled:opacity-40 text-red-700 border border-red-200 font-bold text-xs flex items-center space-x-2 transition-colors ml-auto"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span>डेटाबेस साफ़ करें (Clear Database)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. STAGING & RBAC LAB TAB (DEV ONLY - STRICTLY ISOLATED TO web-1e643) */}
            {activeTab === 'staging-lab' && (
              <div className="space-y-4">
                <div className="bg-indigo-950/80 border border-indigo-800/80 rounded-2xl p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-indigo-800/70 border border-indigo-600 shrink-0">
                      <ShieldCheck className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <h3 className="font-montserrat font-black text-sm text-white flex items-center gap-2">
                        <span>Staging & RBAC Lab (Isolated Environment)</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/30 text-indigo-200 rounded border border-indigo-400/40">
                          web-1e643
                        </span>
                      </h3>
                      <p className="text-[11px] text-indigo-200/80 mt-0.5">
                        यह लैब केवल Staging प्रोजेक्ट <code>web-1e643</code> पर टेस्ट चलाती है। Production प्रोजेक्ट (<code>gen-lang-client-0627643856</code>) पर कोई प्रभाव नहीं पड़ता।
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 bg-indigo-900/60 p-1 rounded-xl border border-indigo-700/60 shrink-0">
                    <button
                      type="button"
                      onClick={() => setStagingSubTab('rbac')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        stagingSubTab === 'rbac'
                          ? 'bg-indigo-500 text-white shadow-xs'
                          : 'text-indigo-200 hover:text-white'
                      }`}
                    >
                      🛡️ RBAC Isolation Tests
                    </button>
                    <button
                      type="button"
                      onClick={() => setStagingSubTab('seed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        stagingSubTab === 'seed'
                          ? 'bg-indigo-500 text-white shadow-xs'
                          : 'text-indigo-200 hover:text-white'
                      }`}
                    >
                      🌱 Staging Demo Seeder
                    </button>
                  </div>
                </div>

                {stagingSubTab === 'rbac' && (
                  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl text-slate-100">
                    <StagingRbacTestPanel />
                  </div>
                )}

                {stagingSubTab === 'seed' && (
                  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl text-slate-100">
                    <StagingSeedPanel />
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      )}

      {/* Quick Preview Card Modal inside Admin */}
      {previewStudent && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-slate-200 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <LionEmblemSvg size={24} color="#0B1E36" />
                <h3 className="font-montserrat font-black text-sm text-[#0B1E36]">
                  {previewStudent.name} • आईडी कार्ड पूर्वावलोकन
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewStudent(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center p-4 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
              <IndependenceCard data={previewStudent} isPrintMode={false} />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onPrintStudent(previewStudent);
                  setPreviewStudent(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>प्रिंट करें (Print)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectStudent(previewStudent);
                  setPreviewStudent(null);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-[#0B1E36] hover:bg-[#102A4C] text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs"
              >
                <Edit className="w-3.5 h-3.5 text-amber-400" />
                <span>मुख्य कार्ड मेकर में संपादित करें</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
