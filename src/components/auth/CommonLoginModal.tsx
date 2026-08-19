import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  X, 
  Building2, 
  UserPlus,
  Eye,
  EyeOff,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  School as SchoolIcon,
  MapPin,
  User,
  Info
} from 'lucide-react';
import { loginWithEmailPassword, loginWithGoogle, registerSchoolAdminAccount, sendPasswordResetLink } from '../../services/multiRoleAuth';
import { UserProfile } from '../../types/school-system';
import { LionEmblemSvg } from '../LionEmblemSvg';

interface CommonLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (profile: UserProfile) => void;
}

export const CommonLoginModal: React.FC<CommonLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot_password'>('login');

  // Login form state
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoNotice, setInfoNotice] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDemoPicker, setShowDemoPicker] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');

  // Register multi-step form state (4 Steps)
  const [regStep, setRegStep] = useState<1 | 2 | 3 | 4>(1);
  const [regAdminName, setRegAdminName] = useState('');
  const [regAdminEmail, setRegAdminEmail] = useState('');
  const [regAdminPhone, setRegAdminPhone] = useState('');
  const [regAdminPassword, setRegAdminPassword] = useState('');
  const [regSchoolName, setRegSchoolName] = useState('');
  const [regAffiliation, setRegAffiliation] = useState('');
  const [regBoard, setRegBoard] = useState('CBSE');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('');
  const [regPincode, setRegPincode] = useState('');
  const [regAddress, setRegAddress] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setInfoNotice('');
    setSuccessMessage('');
    try {
      const profile = await loginWithGoogle();
      setIsLoading(false);
      onLoginSuccess(profile);
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Google लॉगिन में त्रुटि हुई';
      if (msg === 'Google login cancelled.' || msg.includes('cancelled')) {
        setInfoNotice('Google login cancelled.');
      } else {
        setErrorMessage(msg);
      }
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !password) {
      setErrorMessage('कृपया अपना लॉगिन आईडी / ईमेल और पासवर्ड दर्ज करें।');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setInfoNotice('');
    setSuccessMessage('');

    try {
      const profile = await loginWithEmailPassword(loginInput, password);
      setIsLoading(false);
      onLoginSuccess(profile);
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'लॉगिन में त्रुटि हुई';
      setErrorMessage(msg);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMessage('कृपया अपना पंजीकृत ईमेल पता दर्ज करें।');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setInfoNotice('');
    setSuccessMessage('');

    try {
      await sendPasswordResetLink(forgotEmail);
      setIsLoading(false);
      setSuccessMessage('पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है। कृपया अपना इनबॉक्स देखें।');
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'रीसेट लिंक भेजने में त्रुटि हुई';
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
    setInfoNotice('');
    setSuccessMessage('');

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

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setLoginInput(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
    setInfoNotice('');
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-poppins animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto">
        {/* Tricolor Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0B1E36] via-[#102A4C] to-[#0B1E36] text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center shadow-inner shrink-0">
              <LionEmblemSvg size={28} color="#FFD700" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-black tracking-widest text-amber-400 uppercase">
                  IndianPublic
                </span>
                <span className="text-[10px] text-slate-300">•</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase">Official Portal</span>
              </div>
              <h2 className="font-montserrat font-extrabold text-base text-white leading-tight">
                School Digital Identity Portal
              </h2>
              <p className="text-[11px] text-slate-300">
                केन्द्रीय विद्यालय डिजिटल पहचान एवं प्रबंधन प्रणाली
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* VIEW: LOGIN */}
          {view === 'login' && (
            <>
              {/* Primary Universal Login Form (Login ID / Email + Password) */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Login ID / Email (लॉगिन आईडी या ईमेल)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      placeholder="उदा. TCH-SCH-A-... / STU-SCH-A-... / email"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-all shadow-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Password (पासवर्ड)
                    </label>
                    <button
                      type="button"
                      onClick={() => { setView('forgot_password'); setErrorMessage(''); setInfoNotice(''); setSuccessMessage(''); }}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                    >
                      पासवर्ड भूल गए? (Forgot?)
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-all shadow-xs font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {infoNotice && (
                  <div className="p-2.5 bg-slate-100 border border-slate-300 text-slate-700 text-xs rounded-xl flex items-center space-x-2 animate-fadeIn">
                    <Info className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{infoNotice}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start space-x-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center space-x-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>लॉगिन करें (Login)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* School Admin Dedicated Action Area */}
              <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                  केवल स्कूल एडमिन (School Admin Only)
                </div>

                {/* School Admin Google Login Button */}
                <button
                  type="button"
                  id="admin-google-signin-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs shadow-2xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>School Admin Google Login</span>
                </button>

                {/* Register School Button */}
                <button
                  type="button"
                  onClick={() => { setView('register'); setRegStep(1); setErrorMessage(''); setInfoNotice(''); setSuccessMessage(''); }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-slate-800 hover:text-amber-900 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>नया विद्यालय पंजीकृत करें (Register School)</span>
                </button>
              </div>
            </>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === 'forgot_password' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => { setView('login'); setErrorMessage(''); setInfoNotice(''); setSuccessMessage(''); }}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  पासवर्ड रीसेट (Forgot Password)
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                अपना पंजीकृत ईमेल पता दर्ज करें। हम आपको सुरक्षित पासवर्ड रीसेट लिंक भेजेंगे।
              </p>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    पंजीकृत ईमेल (Registered Email)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. your-email@school.edu.in"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all shadow-xs"
                      required
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>रीसेट लिंक भेजें (Send Reset Link)</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setView('login'); setErrorMessage(''); setInfoNotice(''); setSuccessMessage(''); }}
                  className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-900 text-center cursor-pointer"
                >
                  लॉगिन पर वापस जाएं (Back to Login)
                </button>
              </form>
            </div>
          )}

          {/* VIEW: SCHOOL ADMIN REGISTRATION (4 STEPS) */}
          {view === 'register' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Top Navigation & Step Indicator */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (regStep > 1) {
                      setRegStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
                    } else {
                      setView('login');
                    }
                  }}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center space-x-1 text-xs font-bold cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>पीछे</span>
                </button>
                <div className="flex items-center space-x-1.5 text-xs font-bold">
                  <span className="text-amber-700">चरण {regStep} / 4</span>
                  <span className="text-slate-400">
                    {regStep === 1 ? '— खाता विवरण' : regStep === 2 ? '— विद्यालय विवरण' : regStep === 3 ? '— पता एवं संपर्क' : '— समीक्षा'}
                  </span>
                </div>
              </div>

              {/* Progress Dots */}
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all ${
                      s <= regStep ? 'bg-amber-500' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                {/* STEP 1: ADMIN ACCOUNT */}
                {regStep === 1 && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-xl text-amber-950 flex items-start space-x-2 text-[11.5px]">
                      <User className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span><strong>Step 1:</strong> विद्यालय प्रशासक (प्राचार्य/डायरेक्टर) की व्यक्तिगत क्रेडेंशियल दर्ज करें।</span>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">प्राचार्य / एडमिनिस्ट्रेटर का पूरा नाम *</label>
                      <input
                        type="text"
                        required
                        value={regAdminName}
                        onChange={(e) => setRegAdminName(e.target.value)}
                        placeholder="उदा. Dr. Vikramaditya Sharma"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">आधिकारिक ईमेल आईडी (Official Email) *</label>
                      <input
                        type="email"
                        required
                        value={regAdminEmail}
                        onChange={(e) => setRegAdminEmail(e.target.value)}
                        placeholder="principal@school.edu.in"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">मोबाइल नंबर *</label>
                      <input
                        type="tel"
                        required
                        value={regAdminPhone}
                        onChange={(e) => setRegAdminPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">सुरक्षित एडमिन पासवर्ड (Password) *</label>
                      <input
                        type="password"
                        required
                        value={regAdminPassword}
                        onChange={(e) => setRegAdminPassword(e.target.value)}
                        placeholder="कम से कम 6 अक्षर"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-amber-600"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!regAdminName.trim() || !regAdminEmail.trim() || !regAdminPhone.trim() || !regAdminPassword) {
                          setErrorMessage('कृपया सभी आवश्यक फ़ील्ड भरें।');
                          return;
                        }
                        setErrorMessage('');
                        setInfoNotice('');
                        setRegStep(2);
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <span>अगला: विद्यालय विवरण</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* STEP 2: SCHOOL DETAILS */}
                {regStep === 2 && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-xl text-amber-950 flex items-start space-x-2 text-[11.5px]">
                      <SchoolIcon className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span><strong>Step 2:</strong> विद्यालय का नाम एवं मान्यता कोड दर्ज करें।</span>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">विद्यालय का पूरा नाम (School Name) *</label>
                      <input
                        type="text"
                        required
                        value={regSchoolName}
                        onChange={(e) => setRegSchoolName(e.target.value)}
                        placeholder="उदा. Delhi Public Model Senior Secondary School"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">संबद्धता / रजिस्ट्रेशन कोड (Affiliation Code) *</label>
                      <input
                        type="text"
                        required
                        value={regAffiliation}
                        onChange={(e) => setRegAffiliation(e.target.value)}
                        placeholder="उदा. CBSE-DEL-10492 या राज्य कोड"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono uppercase focus:outline-none focus:border-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">बोर्ड / श्रेणी (Board / Category)</label>
                      <select
                        value={regBoard}
                        onChange={(e) => setRegBoard(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-600"
                      >
                        <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                        <option value="ICSE">ICSE / CISCE</option>
                        <option value="STATE">State Education Board</option>
                        <option value="KVS">Kendriya Vidyalaya Sangathan (KVS)</option>
                        <option value="NVS">Navodaya Vidyalaya Samiti (NVS)</option>
                        <option value="OTHER">Other Recognized Institution</option>
                      </select>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setRegStep(1)}
                        className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        पीछे
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!regSchoolName.trim() || !regAffiliation.trim()) {
                            setErrorMessage('कृपया विद्यालय का नाम एवं संबद्धता कोड भरें।');
                            return;
                          }
                          setErrorMessage('');
                          setInfoNotice('');
                          setRegStep(3);
                        }}
                        className="w-2/3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <span>अगला: स्थान विवरण</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: LOCATION & CONTACT */}
                {regStep === 3 && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-xl text-amber-950 flex items-start space-x-2 text-[11.5px]">
                      <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span><strong>Step 3:</strong> विद्यालय का स्थान एवं डाक पता दर्ज करें।</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">शहर / जिला *</label>
                        <input
                          type="text"
                          required
                          value={regCity}
                          onChange={(e) => setRegCity(e.target.value)}
                          placeholder="New Delhi"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-600"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">राज्य / प्रदेश *</label>
                        <input
                          type="text"
                          required
                          value={regState}
                          onChange={(e) => setRegState(e.target.value)}
                          placeholder="Delhi"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">पिनकोड *</label>
                        <input
                          type="text"
                          required
                          value={regPincode}
                          onChange={(e) => setRegPincode(e.target.value)}
                          placeholder="110001"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-600"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">परिसर का पता</label>
                        <input
                          type="text"
                          value={regAddress}
                          onChange={(e) => setRegAddress(e.target.value)}
                          placeholder="Sector 4, Main Road"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-600"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setRegStep(2)}
                        className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        पीछे
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!regCity.trim() || !regState.trim() || !regPincode.trim()) {
                            setErrorMessage('कृपया शहर, राज्य और पिनकोड भरें।');
                            return;
                          }
                          setErrorMessage('');
                          setInfoNotice('');
                          setRegStep(4);
                        }}
                        className="w-2/3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <span>अगला: समीक्षा एवं सक्रियता</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: REVIEW & ACTIVATE */}
                {regStep === 4 && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-950 space-y-1 text-xs">
                      <div className="flex items-center space-x-1.5 font-bold text-emerald-800">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>समीक्षा एवं विद्यालय सक्रियता (Final Review)</span>
                      </div>
                      <p className="text-[11px] text-emerald-700">
                        आपका विद्यालय खाता तुरंत सक्रिय हो जाएगा और आप सीधे शिक्षक एवं छात्र प्रबंधन डैशबोर्ड में प्रवेश करेंगे।
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                      <div><strong>विद्यालय:</strong> {regSchoolName} ({regAffiliation})</div>
                      <div><strong>प्रशासक:</strong> {regAdminName}</div>
                      <div><strong>ईमेल:</strong> {regAdminEmail}</div>
                      <div><strong>स्थान:</strong> {regCity}, {regState} - {regPincode}</div>
                    </div>

                    {errorMessage && (
                      <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setRegStep(3)}
                        className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        पीछे
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            <span>पंजीकरण पूरा करें (Activate)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
