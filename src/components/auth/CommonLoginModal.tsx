import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  X, 
  Building2, 
  GraduationCap, 
  BookOpen, 
  UserCheck,
  Check,
  Eye,
  EyeOff,
  UserPlus,
  Compass
} from 'lucide-react';
import { loginWithEmailPassword, loginWithGoogle, registerSchoolAdminAccount } from '../../services/multiRoleAuth';
import { UserProfile } from '../../types/school-system';
import { LionEmblemSvg } from '../LionEmblemSvg';

interface CommonLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (profile: UserProfile) => void;
  initialRole?: 'admin' | 'teacher' | 'student' | 'auto';
}

export const CommonLoginModal: React.FC<CommonLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialRole = 'auto',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<'auto' | 'admin' | 'teacher' | 'student'>(initialRole);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDemoPicker, setShowDemoPicker] = useState(false);

  // Register form state
  const [regAdminName, setRegAdminName] = useState('');
  const [regAdminEmail, setRegAdminEmail] = useState('');
  const [regAdminPhone, setRegAdminPhone] = useState('');
  const [regAdminPassword, setRegAdminPassword] = useState('');
  const [regSchoolName, setRegSchoolName] = useState('');
  const [regAffiliation, setRegAffiliation] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('');
  const [regPincode, setRegPincode] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const profile = await loginWithGoogle(selectedRole);
      setIsLoading(false);
      onLoginSuccess(profile);
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Google लॉगिन में त्रुटि हुई';
      setErrorMessage(msg);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('कृपया अपना ईमेल और पासवर्ड दर्ज करें (Please enter email & password).');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const profile = await loginWithEmailPassword(email, password, selectedRole);
      setIsLoading(false);
      onLoginSuccess(profile);
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'लॉगिन में त्रुटि हुई';
      setErrorMessage(msg);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regAdminName.trim() || !regAdminEmail.trim() || !regSchoolName.trim() || !regAffiliation.trim()) {
      setErrorMessage('कृपया सभी आवश्यक विवरण दर्ज करें।');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const { user } = await registerSchoolAdminAccount(
        {
          name: regAdminName,
          email: regAdminEmail,
          phone: regAdminPhone,
          password: regAdminPassword,
        },
        {
          schoolName: regSchoolName,
          affiliationCode: regAffiliation,
          city: regCity,
          state: regState,
          pincode: regPincode,
        }
      );
      setIsLoading(false);
      onLoginSuccess(user);
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'पंजीकरण में त्रुटि हुई';
      setErrorMessage(msg);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string, role: 'auto' | 'admin' | 'teacher' | 'student') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setSelectedRole(role);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-poppins animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto">
        {/* Top Tricolor Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0B1E36] via-[#102A4C] to-[#0B1E36] text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center shadow-inner shrink-0">
              <LionEmblemSvg size={28} color="#FFD700" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">
                  INDIANPUBLIC • INSTITUTIONAL PORTAL
                </span>
              </div>
              <h2 className="font-montserrat font-black text-lg text-white leading-tight">
                केन्द्रीय लॉगिन एवं प्रबंधन प्रणाली
              </h2>
              <p className="text-xs text-slate-300">
                Single Sign-On Authentication & Access Portal
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-900/60 p-1 rounded-xl mt-4 border border-white/10">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              लॉगिन (Sign In)
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMessage(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              नया विद्यालय पंजीकरण (Register School)
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8 space-y-5 max-h-[70vh] overflow-y-auto">
          {mode === 'login' ? (
            <>
              {/* Role Selection Tabs */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  भूमिका चुनें (Select Role Category)
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-[11px] font-bold text-center">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('auto')}
                    className={`py-2 px-1 rounded-xl transition-all ${
                      selectedRole === 'auto'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`py-2 px-1 rounded-xl transition-all ${
                      selectedRole === 'admin'
                        ? 'bg-amber-500 text-white shadow-sm font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('teacher')}
                    className={`py-2 px-1 rounded-xl transition-all ${
                      selectedRole === 'teacher'
                        ? 'bg-emerald-600 text-white shadow-sm font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Teacher
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('student')}
                    className={`py-2 px-1 rounded-xl transition-all ${
                      selectedRole === 'student'
                        ? 'bg-purple-600 text-white shadow-sm font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Student
                  </button>
                </div>
              </div>

              {/* Google Sign-In Button (Primary Provider) */}
              <div className="space-y-3">
                <button
                  type="button"
                  id="google-signin-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-800 font-bold text-sm shadow-xs flex items-center justify-center space-x-3 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google खाते से लॉगिन करें (Sign In with Google)</span>
                </button>

                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                    या क्रेडेंशियल दर्ज करें
                  </span>
                  <div className="border-t border-slate-200 w-full" />
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    ईमेल आईडी (Registered Email)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. your-email@domain.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-all shadow-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    पासवर्ड (Password)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-all shadow-xs font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>पोर्टल में प्रवेश करें (Sign In)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Account Quick Switcher */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDemoPicker(!showDemoPicker)}
                  className="w-full py-1.5 text-xs text-slate-500 hover:text-amber-700 font-semibold flex items-center justify-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{showDemoPicker ? 'परीक्षण खाते छुपाएं' : 'डेमो / परीक्षण खाते देखें (Quick Demo Logins)'}</span>
                </button>

                {showDemoPicker && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 uppercase text-[10px]">त्वरित परीक्षण क्रेडेंशियल:</span>
                      <span className="text-[10px] text-slate-500">Pass: Staging@Test1234</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleFillDemo('superadmin@staging.internal', 'Staging@Test1234', 'admin')}
                        className="p-2 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 text-left font-medium transition-colors"
                      >
                        <span className="font-bold text-amber-900 block">👑 Super Admin</span>
                        <span className="text-[10px] text-slate-500 block truncate">superadmin@...</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFillDemo('admin.scha@staging.internal', 'Staging@Test1234', 'admin')}
                        className="p-2 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 text-left font-medium transition-colors"
                      >
                        <span className="font-bold text-amber-900 block">🏫 School Admin (Alpha)</span>
                        <span className="text-[10px] text-slate-500 block truncate">admin.scha@...</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFillDemo('teacher.a@staging.internal', 'Staging@Test1234', 'teacher')}
                        className="p-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 text-left font-medium transition-colors"
                      >
                        <span className="font-bold text-emerald-900 block">📚 Teacher (TGT)</span>
                        <span className="text-[10px] text-slate-500 block truncate">teacher.a@...</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFillDemo('student.a1@staging.internal', 'Staging@Test1234', 'student')}
                        className="p-2 rounded-xl bg-white hover:bg-purple-50 border border-slate-200 text-left font-medium transition-colors"
                      >
                        <span className="font-bold text-purple-900 block">🎓 Student (Aarav)</span>
                        <span className="text-[10px] text-slate-500 block truncate">student.a1@...</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Register School Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-amber-900 flex items-start space-x-2">
                <Building2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p>
                  <strong>विद्यालय पंजीकरण:</strong> नए स्कूल का पंजीकरण कर एडमिनिस्ट्रेटर आईडी बनाएं और तत्काल शिक्षक व छात्र प्रबंधन शुरू करें।
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">विद्यालय का पूरा नाम *</label>
                <input
                  type="text"
                  required
                  value={regSchoolName}
                  onChange={e => setRegSchoolName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-600"
                  placeholder="उदा. Delhi Public Model School"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">संबद्धता कोड *</label>
                  <input
                    type="text"
                    required
                    value={regAffiliation}
                    onChange={e => setRegAffiliation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-amber-600 uppercase"
                    placeholder="CBSE-DEL-1092"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">प्राचार्य / एडमिन नाम *</label>
                  <input
                    type="text"
                    required
                    value={regAdminName}
                    onChange={e => setRegAdminName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-600"
                    placeholder="Dr. R. K. Sharma"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">एडमिन ईमेल *</label>
                  <input
                    type="email"
                    required
                    value={regAdminEmail}
                    onChange={e => setRegAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-600"
                    placeholder="principal@school.edu.in"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">फोन नंबर *</label>
                  <input
                    type="text"
                    required
                    value={regAdminPhone}
                    onChange={e => setRegAdminPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-600"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">शहर *</label>
                  <input
                    type="text"
                    required
                    value={regCity}
                    onChange={e => setRegCity(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-600"
                    placeholder="New Delhi"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">राज्य *</label>
                  <input
                    type="text"
                    required
                    value={regState}
                    onChange={e => setRegState(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-600"
                    placeholder="Delhi"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">पिनकोड *</label>
                  <input
                    type="text"
                    required
                    value={regPincode}
                    onChange={e => setRegPincode(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-600"
                    placeholder="110001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">एडमिन पासवर्ड *</label>
                <input
                  type="password"
                  required
                  value={regAdminPassword}
                  onChange={e => setRegAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-amber-600"
                  placeholder="कम से कम 6 अक्षर"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>विद्यालय पंजीकृत करें एवं एडमिन आईडी बनाएं</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
