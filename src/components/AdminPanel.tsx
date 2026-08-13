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
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  records,
  onRefreshRecords,
  onSelectStudent,
  onPrintStudent,
  onDeleteRecord,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [previewRecord, setPreviewRecord] = useState<AdminRecord | null>(null);

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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#FFFDF9] text-slate-900 border border-amber-900/20 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Official National Header */}
        <div className="bg-gradient-to-r from-[#0B1E36] via-[#102A4C] to-[#0B1E36] text-white px-6 py-4 flex items-center justify-between border-b-2 border-amber-500/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-montserrat font-black text-sm sm:text-base tracking-wide text-white">
                  NATIONAL ID CARD & CERTIFICATE REPOSITORY
                </h2>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-400/40">
                  ADMIN SECURE PORTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                भारत सरकार • केंद्रीय अभिलेख एवं पहचान पत्र सत्यापन प्रणाली (Central Student & Citizen Database)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/30 flex items-center space-x-1 transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gateway Screen if Not Authenticated */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-[#FFFBF2] flex-1">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mb-4 text-amber-700 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="font-montserrat font-bold text-xl text-[#0B1E36] mb-1">
              Admin Authentication Required
            </h3>
            <p className="text-xs text-slate-600 max-w-md mb-6 leading-relaxed">
              यह पैनल केवल अधिकृत एडमिन के लिए सुरक्षित है। सभी पंजीकृत छात्रों और नागरिकों का विवरण देखने के लिए पासवर्ड दर्ज करें।
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="Enter Admin Password..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-amber-900/20 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 shadow-sm"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-[#0B1E36] to-[#1E3A8A] hover:from-[#081526] hover:to-[#172554] text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <span>Unlock Admin Portal</span>
              </button>
            </form>
          </div>
        ) : (
          /* Logged In Admin Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden bg-[#FAF7F0]">
            {/* Top Stat Ribbon */}
            <div className="bg-[#FFFDF9] border-b border-amber-900/10 px-6 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 shadow-xs">
              <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-white border border-amber-900/10 shadow-xs">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                    Total ID Cards
                  </span>
                  <span className="font-montserrat font-black text-lg text-[#0B1E36]">
                    {stats.total}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-white border border-amber-900/10 shadow-xs">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                    Issued Today
                  </span>
                  <span className="font-montserrat font-black text-lg text-emerald-700">
                    {stats.todayCount}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-white border border-amber-900/10 shadow-xs">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Downloads
                  </span>
                  <span className="font-montserrat font-black text-lg text-amber-700">
                    {stats.totalDownloads}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => exportRecordsToCSV(records)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
                  title="Export records to Excel CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Excel (CSV)</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="px-6 py-3 bg-[#FFFDF9] border-b border-amber-900/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search by Phone / Name / ID */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-800/60" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="फोन नंबर, नाम या ID से खोजें (Search Phone/Name)..."
                  className="w-full pl-9 pr-8 py-2 bg-white border border-amber-900/20 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 shadow-xs font-medium"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Role filter buttons */}
              <div className="flex items-center space-x-1 self-stretch sm:self-auto overflow-x-auto">
                <span className="text-[11px] font-bold text-slate-500 mr-2 flex items-center">
                  <Filter className="w-3.5 h-3.5 mr-1" /> Filter:
                </span>
                {['ALL', 'STUDENT', 'CITIZEN', 'STAFF'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setRoleFilter(f)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      roleFilter === f
                        ? 'bg-[#0B1E36] text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Records Data Table */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-amber-900/20 p-8">
                  <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-2 opacity-60" />
                  <p className="font-bold text-slate-700 text-sm">कोई रिकॉर्ड नहीं मिला (No Records Found)</p>
                  <p className="text-xs text-slate-500 mt-1">
                    फोन नंबर या नाम की स्पेलिंग चेक करें अथवा सर्च फ़िल्टर रीसेट करें।
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-amber-900/15 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FAF6ED] text-slate-700 font-bold border-b border-amber-900/15 sticky top-0 uppercase text-[10.5px] tracking-wider">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">फोटो</th>
                        <th className="p-3">विद्यार्थी / नागरिक नाम</th>
                        <th className="p-3">मोबाइल नंबर (Phone)</th>
                        <th className="p-3">पहचान संख्या (ID Number)</th>
                        <th className="p-3">जन्म तिथि</th>
                        <th className="p-3">पद / कक्षा (Role)</th>
                        <th className="p-3">स्थान (City/State)</th>
                        <th className="p-3">जारी तिथि</th>
                        <th className="p-3 text-right">कार्य (Actions)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-900/10 text-slate-800">
                      {filteredRecords.map((rec, index) => (
                        <tr key={rec.id || index} className="hover:bg-amber-50/60 transition-colors">
                          <td className="p-3 font-semibold text-slate-400">{index + 1}</td>
                          <td className="p-3">
                            <div className="w-9 h-11 rounded-md overflow-hidden bg-slate-100 border border-slate-300 shadow-xs">
                              <img
                                src={rec.photoUrl}
                                alt={rec.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-[#0B1E36] block text-sm">{rec.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {rec.schoolName || 'Government of India'}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-blue-900">
                            {rec.phone ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                                <Phone className="w-3 h-3 text-blue-600" />
                                <span>{rec.phone}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Not Added</span>
                            )}
                          </td>
                          <td className="p-3 font-mono font-semibold text-amber-900">{rec.idNumber}</td>
                          <td className="p-3">{rec.dob}</td>
                          <td className="p-3">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[10.5px]">
                              {rec.role}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-600">
                            {rec.place || 'India'}{rec.state ? `, ${rec.state}` : ''}
                          </td>
                          <td className="p-3 text-[11px] text-slate-500">
                            {new Date(rec.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Load to Main Card Canvas */}
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectStudent(rec);
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded bg-[#0B1E36] hover:bg-[#1E3A8A] text-white font-semibold text-[11px] flex items-center space-x-1 transition-colors shadow-xs"
                                title="Open in Main Preview to Edit & Download"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Load Card</span>
                              </button>

                              {/* Print Direct */}
                              <button
                                type="button"
                                onClick={() => onPrintStudent(rec)}
                                className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                title="Print this Card"
                              >
                                <Printer className="w-3.5 h-3.5 text-blue-700" />
                              </button>

                              {/* Delete Record */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`क्या आप ${rec.name} का रिकॉर्ड हटाना चाहते हैं?`)) {
                                    onDeleteRecord(rec.id);
                                  }
                                }}
                                className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                                title="Delete Record"
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
              )}
            </div>

            {/* Modal Bottom Bar */}
            <div className="bg-[#FFFDF9] border-t border-amber-900/10 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
              <span>दिखाए जा रहे रिकॉर्ड: {filteredRecords.length} of {records.length}</span>
              <span className="font-semibold text-slate-600">
                🔒 सभी डेटा सुरक्षित और लोकल स्टोरेज में एन्क्रिप्टेड है
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
