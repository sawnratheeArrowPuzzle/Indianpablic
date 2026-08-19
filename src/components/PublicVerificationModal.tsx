import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Building2, 
  User, 
  GraduationCap, 
  Calendar, 
  Award,
  Sparkles,
  Search,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Lock,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { LionEmblemSvg } from './LionEmblemSvg';
import { AshokaChakraSvg } from './AshokaChakraSvg';
import { getPublicStudentVerificationByToken } from '../services/schoolDataService';
import { PublicStudentVerification, UserProfile } from '../types/school-system';
import { 
  lookupStudentAccountForQrLogin, 
  activateStudentWithPassword, 
  loginStudentWithTokenAndPassword 
} from '../services/multiRoleAuth';

interface PublicVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialToken?: string;
  onStudentLoginSuccess?: (profile: UserProfile) => void;
}

export const PublicVerificationModal: React.FC<PublicVerificationModalProps> = ({
  isOpen,
  onClose,
  initialToken = '',
  onStudentLoginSuccess
}) => {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationData, setVerificationData] = useState<PublicStudentVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Student Portal Auth Form inside verification modal
  const [showPortalAuth, setShowPortalAuth] = useState(false);
  const [portalMode, setPortalMode] = useState<'loading' | 'activate' | 'login'>('login');
  const [studentLookupInfo, setStudentLookupInfo] = useState<{
    studentId: string;
    name: string;
    email: string;
    isFirstTime: boolean;
  } | null>(null);

  const [portalPassword, setPortalPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  const handleVerify = async (tokenToVerify?: string) => {
    const raw = (tokenToVerify !== undefined ? tokenToVerify : tokenInput).trim();
    if (!raw) {
      setError('कृपया सत्यापन टोकन (Verification Token) दर्ज करें।');
      return;
    }

    // Clean token if a full URL was provided
    let cleanToken = raw;
    if (raw.includes('verify=')) {
      try {
        const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
        cleanToken = url.searchParams.get('verify') || raw;
      } catch {
        const parts = raw.split('verify=');
        cleanToken = parts[1]?.split('&')[0] || raw;
      }
    }

    setIsLoading(true);
    setError(null);
    setVerificationData(null);
    setShowPortalAuth(false);
    setAuthError(null);
    setAuthSuccessMsg(null);

    try {
      const data = await getPublicStudentVerificationByToken(cleanToken);
      if (data) {
        setVerificationData(data);
      } else {
        setError('अमान्य सत्यापन कोड (Invalid or Unregistered Verification Token). कोई मेल खाता रिकॉर्ड नहीं मिला।');
      }
    } catch (err) {
      setError('सत्यापन के दौरान त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPortalAuth = async () => {
    if (!verificationData) return;
    setShowPortalAuth(true);
    setPortalMode('loading');
    setAuthError(null);
    setAuthSuccessMsg(null);

    try {
      const lookup = await lookupStudentAccountForQrLogin(verificationData.token);
      if (lookup) {
        setStudentLookupInfo({
          studentId: lookup.studentId,
          name: lookup.name,
          email: lookup.email,
          isFirstTime: lookup.isFirstTime,
        });
        setPortalMode(lookup.isFirstTime ? 'activate' : 'login');
      } else {
        setPortalMode('login');
      }
    } catch (err) {
      setPortalMode('login');
    }
  };

  const handleStudentAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationData) return;

    setIsAuthenticating(true);
    setAuthError(null);
    setAuthSuccessMsg(null);

    try {
      if (portalMode === 'activate') {
        if (!portalPassword || portalPassword.length < 6) {
          throw new Error('पासवर्ड न्यूनतम 6 अक्षरों का होना चाहिए।');
        }
        if (portalPassword !== confirmPassword) {
          throw new Error('पासवर्ड मेल नहीं खा रहे हैं। कृपया जांचें।');
        }

        const profile = await activateStudentWithPassword(verificationData.token, portalPassword);
        setAuthSuccessMsg('खाता सफलतापूर्वक सक्रिय हुआ! डैशबोर्ड खुल रहा है...');
        setTimeout(() => {
          if (onStudentLoginSuccess) {
            onStudentLoginSuccess(profile);
          }
          onClose();
        }, 1200);
      } else {
        if (!portalPassword) {
          throw new Error('कृपया अपना पासवर्ड दर्ज करें।');
        }
        const profile = await loginStudentWithTokenAndPassword(verificationData.token, portalPassword);
        setAuthSuccessMsg('लॉगिन सफल! डैशबोर्ड खुल रहा है...');
        setTimeout(() => {
          if (onStudentLoginSuccess) {
            onStudentLoginSuccess(profile);
          }
          onClose();
        }, 1000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'प्रमाणीकरण त्रुटि';
      setAuthError(msg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (isOpen && initialToken) {
      setTokenInput(initialToken);
      handleVerify(initialToken);
    } else if (isOpen && !initialToken) {
      setVerificationData(null);
      setError(null);
    }
  }, [initialToken, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col font-poppins relative">
        {/* National Ribbon */}
        <div className="h-1.5 bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0B1E36] to-[#142B4D] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-white/10 border border-white/20">
              <LionEmblemSvg size={24} color="#FFD700" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">
                NATIONAL PUBLIC VERIFICATION PORTAL
              </span>
              <h3 className="font-montserrat font-bold text-sm sm:text-base text-white">
                सार्वजनिक डिजिटल पहचान सत्यापन
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Search / Token Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              सत्यापन संदर्भ / टोकन (Verification Token or Reference):
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  placeholder="e.g. STU-SCH-A-... or Token"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => handleVerify()}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-[#0B1E36] hover:bg-[#142B4D] text-amber-300 text-xs font-bold transition-all disabled:opacity-50 shrink-0 flex items-center space-x-1.5 shadow-md cursor-pointer"
              >
                {isLoading ? (
                  <span>सत्यापित कर रहे...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>सत्यापित करें</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">सत्यापन विफल:</span>
                <p className="mt-0.5 text-[11.5px]">{error}</p>
              </div>
            </div>
          )}

          {/* VERIFIED PASS CARD */}
          {verificationData && (
            <div className="rounded-2xl border-2 border-emerald-500 bg-gradient-to-b from-emerald-50/50 to-white p-5 shadow-lg space-y-4 animate-scaleUp">
              {/* Verified Ribbon */}
              <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-emerald-800 tracking-wider uppercase block">
                      OFFICIALLY VERIFIED RECORD
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      संस्थागत रिकॉर्ड प्रमाणित है
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
                  ACTIVE • 100% VALID
                </span>
              </div>

              {/* Profile Photo & Primary Info */}
              <div className="flex items-center space-x-4">
                <div className="relative shrink-0">
                  <div className="w-20 h-24 rounded-xl overflow-hidden border-2 border-amber-400 shadow-md bg-slate-100">
                    {verificationData.photoUrl ? (
                      <img
                        src={verificationData.photoUrl}
                        alt={verificationData.studentName}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block">
                    छात्र (STUDENT)
                  </span>
                  <h4 className="font-montserrat font-bold text-base text-slate-900 truncate">
                    {verificationData.studentName}
                  </h4>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-semibold truncate">{verificationData.schoolName}</span>
                  </div>
                  <span className="text-[10.5px] font-mono text-slate-500 block">
                    School Code: {verificationData.schoolId}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 block">कक्षा व वर्ग (Class):</span>
                  <span className="font-bold text-slate-800">{verificationData.class} - {verificationData.section}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 block">अनुक्रमांक (Roll No):</span>
                  <span className="font-bold text-slate-800 font-mono">{verificationData.rollNumber}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 block">शैक्षणिक सत्र:</span>
                  <span className="font-bold text-slate-800">{verificationData.academicYear || '2026-2027'}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 block">प्रमाणीकरण स्थिति:</span>
                  <span className="font-bold text-emerald-700">सत्यापित सक्रिय</span>
                </div>
              </div>

              {/* Secure Token Hash */}
              <div className="p-3 rounded-xl bg-slate-900 text-slate-300 text-[11px] font-mono flex items-center justify-between border border-slate-800">
                <div className="truncate mr-2">
                  <span className="text-[9.5px] text-slate-400 block uppercase">CRYPTO TOKEN REFERENCE</span>
                  <span className="text-amber-400 truncate block">{verificationData.token}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(verificationData.token)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy Token"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* STUDENT PORTAL ACCESS / FIRST-TIME ACTIVATION ACTION */}
              <div className="pt-2 border-t border-emerald-200/80">
                {!showPortalAuth ? (
                  <button
                    type="button"
                    onClick={handleOpenPortalAuth}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0B1E36] to-[#142B4D] hover:from-[#081729] hover:to-[#0f223d] text-amber-300 font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>🎓 छात्र पोर्टल में प्रवेश या खाता सक्रिय करें</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2">
                        <KeyRound className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-xs text-white">
                          {portalMode === 'activate' ? 'पहला लॉगिन: नया पासवर्ड बनाएं' : 'छात्र पोर्टल लॉगिन'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPortalAuth(false)}
                        className="text-slate-400 hover:text-white text-xs"
                      >
                        रद्द करें
                      </button>
                    </div>

                    {portalMode === 'loading' ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        छात्र खाता स्थिति जांच रहे हैं...
                      </div>
                    ) : (
                      <form onSubmit={handleStudentAuthSubmit} className="space-y-3 text-xs">
                        <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
                          <span className="text-slate-400 block">संबद्ध छात्र:</span>
                          <strong className="text-white">{verificationData.studentName}</strong> • {verificationData.class}-{verificationData.section}
                        </div>

                        <div>
                          <label className="block text-slate-300 font-bold mb-1">
                            {portalMode === 'activate' ? 'नया सुरक्षित पासवर्ड बनाएं (कम से कम 6 अक्षर) *' : 'पासवर्ड दर्ज करें *'}
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={portalPassword}
                              onChange={(e) => setPortalPassword(e.target.value)}
                              placeholder={portalMode === 'activate' ? 'उदा. Student@2026' : 'अपना पासवर्ड दर्ज करें'}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {portalMode === 'activate' && (
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">
                              पासवर्ड की पुष्टि करें *
                            </label>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="पुनः वही पासवर्ड दर्ज करें"
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        )}

                        {authError && (
                          <div className="p-2 rounded-xl bg-red-950/80 border border-red-500 text-red-300 text-[11px] flex items-center space-x-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{authError}</span>
                          </div>
                        )}

                        {authSuccessMsg && (
                          <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[11px] flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>{authSuccessMsg}</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isAuthenticating}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                        >
                          {isAuthenticating ? (
                            <span>प्रमाणीकरण जारी...</span>
                          ) : (
                            <span>
                              {portalMode === 'activate'
                                ? 'पासवर्ड सुरक्षित करें एवं डैशबोर्ड में प्रवेश करें'
                                : 'लॉगिन करें एवं डैशबोर्ड खोलें'}
                            </span>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Privacy Notice */}
              <p className="text-[10px] text-slate-500 leading-relaxed text-center">
                🔒 <strong>Privacy Assured:</strong> यह प्रमाणन पृष्ठ छात्र की सुरक्षा व गोपनीयता नियमों के अनुसार केवल आवश्यक सार्वजनिक विवरण प्रदर्शित करता है। पासवर्ड कभी भी डेटाबेस में खुला स्टोर नहीं होता।
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            IndianPublic Institutional Security System
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};

