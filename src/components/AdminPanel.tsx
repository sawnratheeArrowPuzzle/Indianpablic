import React, { useState, useMemo } from 'react';
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
  ArrowUpDown
} from 'lucide-react';
import { AdminRecord, StudentData } from '../types';
import { exportRecordsToCSV, deleteUserRecord } from '../utils/storage';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  records: AdminRecord[];
  onRefreshRecords: () => void;
  onSelectStudent: (student: StudentData) => void;
  onPrintStudent: (student: StudentData) => void;
  onDeleteRecord: (id: string) => void;
  onClearAllRecords?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  records,
  onRefreshRecords,
  onSelectStudent,
  onPrintStudent,
  onDeleteRecord,
  onClearAllRecords,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Check Password: Sawn@1986
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'Sawn@1986') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('गलत पासवर्ड! कृपया सही पासवर्ड दर्ज करें (Incorrect Password).');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
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

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard?.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Search & Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        rec.name.toLowerCase().includes(q) ||
        (rec.phone && rec.phone.includes(q)) ||
        (rec.idNumber && rec.idNumber.toLowerCase().includes(q)) ||
        (rec.place && rec.place.toLowerCase().includes(q)) ||
        (rec.state && rec.state.toLowerCase().includes(q));

      const matchesRole =
        roleFilter === 'ALL' ||
        (roleFilter === 'STUDENT' && rec.role.toLowerCase().includes('student')) ||
        (roleFilter === 'CITIZEN' && rec.role.toLowerCase().includes('citizen')) ||
        (roleFilter === 'STAFF' && (rec.role.toLowerCase().includes('teacher') || rec.role.toLowerCase().includes('staff') || rec.role.toLowerCase().includes('head')));

      return matchesSearch && matchesRole;
    });
  }, [records, searchTerm, roleFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = records.length;
    const now = new Date();
    const todayCount = records.filter((r) => {
      const d = new Date(r.createdAt);
      return d.toDateString() === now.toDateString();
    }).length;
    const totalDownloads = records.reduce((acc, curr) => acc + (curr.downloadCount || 1), 0);
    return { total, todayCount, totalDownloads };
  }, [records]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#F4F6F8] text-slate-900 overflow-y-auto w-full h-full flex flex-col font-poppins selection:bg-amber-500 selection:text-white">
      {/* Top National Accent Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] border-b border-amber-900/10 shrink-0" />

      {/* Top Official National Header (Scrolls naturally with page) */}
      <header className="bg-gradient-to-r from-[#0B1E36] via-[#102A4C] to-[#0B1E36] text-white px-4 sm:px-8 py-5 border-b-2 border-amber-500/80 shadow-md shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400/30 to-amber-600/20 border border-amber-400/50 flex items-center justify-center shadow-inner shrink-0">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-montserrat font-black text-base sm:text-lg tracking-wide text-white">
                  NATIONAL ID CARD & CERTIFICATE REPOSITORY
                </h1>
                <span className="bg-amber-400/20 text-amber-300 text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-400/40 tracking-wider">
                  ADMIN SECURE PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                भारत सरकार • केंद्रीय अभिलेख एवं पहचान पत्र सत्यापन प्रणाली (Central Student & Citizen Database)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-center">
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
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-10">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-700 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="font-montserrat font-black text-xl text-[#0B1E36] mb-1">
              Admin Authentication Required
            </h2>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              यह पैनल केवल अधिकृत एडमिन के लिए सुरक्षित है। सभी पंजीकृत छात्रों और नागरिकों का पूरा विवरण देखने के लिए पासवर्ड दर्ज करें।
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
                  placeholder="Enter Admin Password (Sawn@1986)..."
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
                <span>एडमिन डैशबोर्ड खोलें (Unlock Portal)</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Logged In Full Admin Dashboard - Naturally Scrolling */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
          {/* Top Clean Stat Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-700">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total ID Cards (कुल कार्ड्स)
                </span>
                <span className="font-montserrat font-black text-2xl text-[#0B1E36]">
                  {stats.total}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Issued Today (आज जारी)
                </span>
                <span className="font-montserrat font-black text-2xl text-emerald-700">
                  {stats.todayCount}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Downloads (डाउनलोड)
                </span>
                <span className="font-montserrat font-black text-2xl text-amber-700">
                  {stats.totalDownloads}
                </span>
              </div>
            </div>

            {/* Top Quick Actions: Export CSV + Clear All */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-center gap-2">
              <button
                type="button"
                onClick={() => exportRecordsToCSV(records)}
                disabled={records.length === 0}
                className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition-all active:scale-[0.98]"
                title="Export all records to Excel / CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>एक्सेल शीट डाउनलोड (Export CSV)</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                disabled={records.length === 0}
                className="w-full py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 disabled:opacity-40 text-red-700 border border-red-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                title="Clear All Database Records"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>सभी डेटा साफ़ करें (Clear All)</span>
              </button>
            </div>
          </section>

          {/* Search, Filter & Clean Action Toolbar */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="फोन नंबर, नाम, पहचान संख्या या शहर से खोजें..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white shadow-2xs font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Tabs + Reset Button */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
              <span className="text-xs font-bold text-slate-500 flex items-center mr-1">
                <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" /> फ़िल्टर:
              </span>
              {[
                { label: 'सभी (All)', val: 'ALL' },
                { label: 'विद्यार्थी (Students)', val: 'STUDENT' },
                { label: 'नागरिक (Citizens)', val: 'CITIZEN' },
                { label: 'स्टाफ/शिक्षक (Staff)', val: 'STAFF' },
              ].map((tab) => (
                <button
                  key={tab.val}
                  type="button"
                  onClick={() => setRoleFilter(tab.val)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    roleFilter === tab.val
                      ? 'bg-[#0B1E36] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              {(searchTerm || roleFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('ALL');
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 flex items-center space-x-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>रीसेट</span>
                </button>
              )}
            </div>
          </section>

          {/* Records Table Section */}
          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3 text-amber-700">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">कोई रिकॉर्ड नहीं मिला (No Records Found)</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {records.length === 0
                    ? 'डैशबोर्ड वर्तमान में पूरी तरह साफ़ (Clear) है। मुख्य कार्ड मेकर से कार्ड बनाएं या सबमिट करें।'
                    : 'आपके खोजे गए फोन नंबर या नाम से कोई रिकॉर्ड नहीं मिला। कृपया स्पेलिंग चेक करें अथवा फ़िल्टर रीसेट करें।'}
                </p>
                {records.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setRoleFilter('ALL');
                    }}
                    className="mt-4 px-4 py-2 bg-[#0B1E36] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#1E3A8A] transition-all"
                  >
                    सभी रिकॉर्ड देखें (View All Records)
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">#</th>
                      <th className="py-3.5 px-4">फोटो</th>
                      <th className="py-3.5 px-4">विद्यार्थी / नागरिक नाम</th>
                      <th className="py-3.5 px-4">मोबाइल नंबर (Phone)</th>
                      <th className="py-3.5 px-4">पहचान संख्या (ID Number)</th>
                      <th className="py-3.5 px-4">जन्म तिथि</th>
                      <th className="py-3.5 px-4">पद / कक्षा</th>
                      <th className="py-3.5 px-4">स्थान व राज्य</th>
                      <th className="py-3.5 px-4">दिनांक</th>
                      <th className="py-3.5 px-4 text-right">कार्य (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredRecords.map((rec, index) => (
                      <tr key={rec.id || index} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-400">{index + 1}</td>
                        <td className="py-3.5 px-4">
                          <div className="w-10 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-300 shadow-2xs">
                            <img
                              src={rec.photoUrl}
                              alt={rec.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#0B1E36] block text-sm">{rec.name}</span>
                          <span className="text-[10.5px] text-slate-500 font-mono">
                            {rec.schoolName || 'Government of India'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {rec.phone ? (
                            <button
                              type="button"
                              onClick={() => handleCopyPhone(rec.phone!)}
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 font-mono font-bold hover:bg-blue-100 transition-colors"
                              title="Click to copy phone number"
                            >
                              <Phone className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>{rec.phone}</span>
                              {copiedPhone === rec.phone && (
                                <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1 rounded font-sans">
                                  Copied!
                                </span>
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-400 italic">उपलब्ध नहीं</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-amber-900">
                          <span className="bg-amber-50 px-2 py-0.5 rounded border border-amber-200/70">
                            {rec.idNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">{rec.dob}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold text-[11px]">
                            {rec.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">
                          {rec.place || 'India'}{rec.state ? `, ${rec.state}` : ''}
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-500 font-mono">
                          {new Date(rec.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Load into Card Editor */}
                            <button
                              type="button"
                              onClick={() => {
                                onSelectStudent(rec);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#0B1E36] hover:bg-[#1E3A8A] text-white font-bold text-[11px] flex items-center space-x-1 transition-all shadow-2xs active:scale-95"
                              title="Open in Main Preview to Edit & Download"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>कार्ड लोड करें</span>
                            </button>

                            {/* Print Direct */}
                            <button
                              type="button"
                              onClick={() => onPrintStudent(rec)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
                              title="Print this Card"
                            >
                              <Printer className="w-4 h-4 text-blue-700" />
                            </button>

                            {/* Delete Single Record */}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`क्या आप ${rec.name} का रिकॉर्ड हटाना चाहते हैं?`)) {
                                  onDeleteRecord(rec.id);
                                }
                              }}
                              className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors border border-red-200"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Status Bar */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
              <span className="font-medium">
                दिखाए जा रहे रिकॉर्ड: <strong className="text-slate-900">{filteredRecords.length}</strong> / कुल: <strong className="text-slate-900">{records.length}</strong>
              </span>
              <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>केंद्रीय रिपॉजिटरी सुरक्षित व स्वचालित रूप से सिंक है</span>
              </span>
            </div>
          </section>
        </main>
      )}
    </div>
  );
};
