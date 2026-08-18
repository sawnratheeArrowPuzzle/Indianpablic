import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  User,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Shield,
  Building2,
  CheckCircle2,
  AlertCircle,
  Save,
  Trash2,
  Sparkles,
  RefreshCw,
  Eye,
  Lock
} from 'lucide-react';
import { UserProfile, Student, Teacher, School } from '../../types/school-system';
import { updateUserProfile } from '../../services/multiRoleAuth';
import { getStudents, saveStudent, getTeachers, saveTeacher, getSchools, saveSchool } from '../../services/schoolDataService';
import { LionEmblemSvg } from '../LionEmblemSvg';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onProfileUpdated: (updatedUser: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}) => {
  const [displayName, setDisplayName] = useState(currentUser.displayName || '');
  const [photoUrl, setPhotoUrl] = useState(currentUser.photoUrl || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [address, setAddress] = useState(currentUser.address || '');
  const [dob, setDob] = useState(currentUser.dob || '2000-01-01');
  const [bloodGroup, setBloodGroup] = useState(currentUser.bloodGroup || 'O+');
  const [guardianName, setGuardianName] = useState(currentUser.guardianName || '');
  const [guardianPhone, setGuardianPhone] = useState(currentUser.guardianPhone || '');
  const [designation, setDesignation] = useState(currentUser.designation || '');

  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or currentUser changes
  useEffect(() => {
    if (isOpen) {
      setDisplayName(currentUser.displayName || '');
      setPhotoUrl(currentUser.photoUrl || '');
      setPhone(currentUser.phone || '');
      setAddress(currentUser.address || '');
      setDob(currentUser.dob || '2000-01-01');
      setBloodGroup(currentUser.bloodGroup || 'O+');
      setGuardianName(currentUser.guardianName || '');
      setGuardianPhone(currentUser.guardianPhone || '');
      setDesignation(currentUser.designation || '');
      setErrorMessage('');
      setSaveSuccess(false);

      // Preload role-specific data if available
      loadRoleSpecificDetails();
    } else {
      stopCamera();
    }
  }, [isOpen, currentUser]);

  const loadRoleSpecificDetails = async () => {
    try {
      if (currentUser.role === 'student' && currentUser.schoolId) {
        const students = await getStudents('student', currentUser.schoolId, undefined, currentUser.uid);
        if (students.length > 0) {
          const s = students[0];
          if (!currentUser.photoUrl && s.photoUrl) setPhotoUrl(s.photoUrl);
          if (!currentUser.phone && s.guardianPhone) setPhone(s.guardianPhone);
          if (!currentUser.guardianName && s.guardianName) setGuardianName(s.guardianName);
          if (!currentUser.guardianPhone && s.guardianPhone) setGuardianPhone(s.guardianPhone);
          if (!currentUser.address && s.address) setAddress(s.address);
          if (!currentUser.dob && s.dob) setDob(s.dob);
          if (!currentUser.bloodGroup && s.bloodGroup) setBloodGroup(s.bloodGroup);
        }
      } else if (currentUser.role === 'teacher' && currentUser.schoolId) {
        const teachers = await getTeachers('teacher', currentUser.schoolId);
        const match = teachers.find(t => t.email.toLowerCase() === currentUser.email.toLowerCase() || t.authUid === currentUser.uid);
        if (match) {
          if (!currentUser.photoUrl && (match as any).photoUrl) setPhotoUrl((match as any).photoUrl);
          if (!currentUser.phone && match.phone) setPhone(match.phone);
          if (!currentUser.designation && match.designation) setDesignation(match.designation);
        }
      } else if (currentUser.role === 'school_admin' && currentUser.schoolId) {
        const schools = await getSchools('school_admin', currentUser.schoolId);
        if (schools.length > 0) {
          const sc = schools[0];
          if (!currentUser.phone && sc.contact.phone) setPhone(sc.contact.phone);
          if (!currentUser.address && sc.address) {
            setAddress(sc.address.street || `${sc.address.city}, ${sc.address.state}`);
          }
        }
      }
    } catch (err) {
      console.warn('Load role details notice:', err);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn('Camera error:', err);
      setCameraError('कैमरा शुरू नहीं किया जा सका। कृपया कैमरा अनुमति (Permission) की जांच करें या फ़ाइल अपलोड का उपयोग करें।');
      setIsCameraActive(false);
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Crop square center
      const v = videoRef.current;
      const minDim = Math.min(v.videoWidth, v.videoHeight);
      const startX = (v.videoWidth - minDim) / 2;
      const startY = (v.videoHeight - minDim) / 2;
      ctx.drawImage(v, startX, startY, minDim, minDim, 0, 0, 400, 400);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setPhotoUrl(dataUrl);
    }
    stopCamera();
  };

  // Handle file picker upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('कृपया केवल मान्य चित्र फ़ाइल (JPEG/PNG) चुनें।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoUrl(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Remove photo
  const handleRemovePhoto = () => {
    setPhotoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMessage('कृपया अपना पूरा नाम दर्ज करें।');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      // 1. Update central user profile via multiRoleAuth
      const updated = await updateUserProfile(
        currentUser.uid,
        {
          displayName: displayName.trim(),
          photoUrl: photoUrl || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          dob: dob || undefined,
          bloodGroup: bloodGroup || undefined,
          guardianName: guardianName.trim() || undefined,
          guardianPhone: guardianPhone.trim() || undefined,
          designation: designation.trim() || undefined,
        },
        currentUser
      );

      // 2. Synchronize with role-specific record to update ID Cards instantly
      if (currentUser.role === 'student' && currentUser.schoolId) {
        const students = await getStudents('student', currentUser.schoolId, undefined, currentUser.uid);
        if (students.length > 0) {
          const s = students[0];
          await saveStudent({
            ...s,
            name: displayName.trim(),
            photoUrl: photoUrl || s.photoUrl,
            guardianName: guardianName.trim() || s.guardianName,
            guardianPhone: (phone || guardianPhone).trim() || s.guardianPhone,
            address: address.trim() || s.address,
            dob: dob || s.dob,
            bloodGroup: bloodGroup || s.bloodGroup,
            updatedAt: Date.now()
          }, updated);
        }
      } else if (currentUser.role === 'teacher' && currentUser.schoolId) {
        const teachers = await getTeachers('teacher', currentUser.schoolId);
        const match = teachers.find(t => t.email.toLowerCase() === currentUser.email.toLowerCase() || t.authUid === currentUser.uid);
        if (match) {
          await saveTeacher({
            ...match,
            name: displayName.trim(),
            phone: phone.trim() || match.phone,
            designation: designation.trim() || match.designation,
            updatedAt: Date.now()
          }, updated);
        }
      }

      setSaveSuccess(true);
      onProfileUpdated(updated);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      console.error('Profile update error:', err);
      const msg = err instanceof Error ? err.message : 'प्रोफाइल सहेजने में विफल।';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const roleLabel = {
    super_admin: 'SUPER ADMIN • केंद्रीय प्रशासनिक नियंत्रक',
    school_admin: 'SCHOOL ADMIN • संस्थान प्रशासक',
    teacher: 'FACULTY • अध्यापक / प्राध्यापक',
    student: 'STUDENT • पंजीकृत विद्यार्थी'
  }[currentUser.role];

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn font-poppins">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-6 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* National Top Gradient Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] shrink-0" />

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0B1E36] via-[#102A4C] to-[#0B1E36] text-white px-6 py-4 flex items-center justify-between border-b-2 border-amber-400 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase block font-montserrat">
                INDIANPUBLIC USER IDENTITY
              </span>
              <h2 className="font-montserrat font-black text-lg text-white leading-tight">
                व्यक्तिगत प्रोफाइल एवं सेटिंग्स (User Profile)
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Status Notifications */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-bold">प्रोफाइल सफलतापूर्वक अपडेट कर दी गई है! ID कार्ड पर नया विवरण तुरंत लागू हो गया है।</span>
            </div>
          )}

          {/* 1. Identity & Security Badge (Immutable Verified Header) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="bg-amber-500/15 text-amber-900 border border-amber-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {roleLabel}
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>सत्यापित खाता (Verified)</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentUser.schoolId ? `संस्थान: ${currentUser.schoolId}` : 'केंद्रीय प्रशासनिक संकाय'}</span>
                <span>•</span>
                <span className="text-slate-400">UID: {currentUser.uid.slice(0, 10)}...</span>
              </p>
            </div>

            <div className="text-right text-[11px] text-slate-400 flex items-center space-x-1 self-end sm:self-center">
              <Lock className="w-3 h-3 text-amber-600" />
              <span className="text-[10px] font-medium text-slate-500">सुरक्षित RBAC प्रमाणीकरण</span>
            </div>
          </div>

          {/* 2. Profile Photo Section */}
          <div className="p-4.5 rounded-3xl bg-gradient-to-br from-amber-50/60 via-white to-slate-50 border border-amber-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-600" />
                <span>प्रोफाइल फोटो (ID Card Photo)</span>
              </span>
              <span className="text-[11px] text-slate-500">ID कार्ड पर प्रदर्शित फोटो</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Photo Preview Circle */}
              <div className="relative group">
                <div className="w-28 h-28 rounded-2xl overflow-hidden border-3 border-amber-400 shadow-md bg-slate-100 flex items-center justify-center">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      <User className="w-10 h-10 mx-auto text-slate-300" />
                      <span className="text-[9px] font-bold block mt-1">फोटो नहीं है</span>
                    </div>
                  )}
                </div>

                {photoUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    title="फोटो हटाएं"
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md transition-all active:scale-95"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Upload / Camera Action Buttons */}
              <div className="flex-1 space-y-2.5 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition-all active:scale-98 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    <span>गैलरी / फ़ाइल चुनें</span>
                  </button>

                  <button
                    type="button"
                    onClick={isCameraActive ? stopCamera : startCamera}
                    className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition-all active:scale-98 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-700" />
                    <span>{isCameraActive ? 'कैमरा बंद करें' : 'कैमरे से फोटो लें'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">
                  JPG / PNG फाइल समर्थित है। फोटो बदलते ही आपके सभी ID कार्ड्स में तुरंत अपडेट हो जाएगी।
                </p>
              </div>
            </div>

            {/* Live Camera View Box if active */}
            {isCameraActive && (
              <div className="p-3 bg-slate-900 rounded-2xl border border-amber-400 space-y-3">
                <div className="relative aspect-square max-w-[280px] mx-auto rounded-xl overflow-hidden bg-black flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-amber-400/60 rounded-xl pointer-events-none" />
                </div>

                <div className="flex items-center justify-center space-x-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-md active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>फोटो खींचें (Capture)</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  >
                    रद्द करें
                  </button>
                </div>
              </div>
            )}

            {cameraError && (
              <p className="text-[11px] text-red-600 font-medium">{cameraError}</p>
            )}
          </div>

          {/* 3. Personal Editable Information Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>व्यक्तिगत विवरण (Personal Details)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">केवल अनुमत फ़ील्ड्स संपादन योग्य हैं</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  पूरा नाम (Full Display Name) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    placeholder="आपका नाम दर्ज करें"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-purple-600 focus:bg-white rounded-xl text-sm font-semibold outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Email (Read Only Authenticated Identifier) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                  <span>पंजीकृत ईमेल (Registered Email)</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> अपरिवर्तनीय (Read-Only)
                  </span>
                </label>
                <input
                  type="text"
                  value={currentUser.email}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs font-mono cursor-not-allowed"
                />
              </div>

              {/* Phone / Mobile */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  मोबाइल / संपर्क नंबर (Mobile No.)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-purple-600 focus:bg-white rounded-xl text-sm font-semibold outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Date of Birth (If Applicable) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  जन्म तिथि (Date of Birth)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-purple-600 focus:bg-white rounded-xl text-sm font-semibold outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Student-specific fields: Guardian Name & Blood Group */}
              {currentUser.role === 'student' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      अभिभावक का नाम (Guardian Full Name)
                    </label>
                    <input
                      type="text"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="अभिभावक का नाम"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-purple-600 focus:bg-white rounded-xl text-sm font-semibold outline-hidden transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      रक्त समूह (Blood Group)
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-purple-600 focus:bg-white rounded-xl text-sm font-semibold outline-hidden transition-all"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Teacher/Admin Designation */}
              {(currentUser.role === 'teacher' || currentUser.role === 'school_admin' || currentUser.role === 'super_admin') && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    पदनाम / पदवी (Official Designation / Title)
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder={currentUser.role === 'teacher' ? 'e.g. Senior TGT Mathematics' : 'e.g. Principal & Head of Institution'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-purple-600 focus:bg-white rounded-xl text-sm font-semibold outline-hidden transition-all"
                  />
                </div>
              )}

              {/* Full Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  निवास / पत्राचार का पता (Residential Address)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="मकान संख्या, मार्ग, क्षेत्र, शहर, पिनकोड"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 focus:border-purple-600 focus:bg-white rounded-xl text-sm font-semibold outline-hidden transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                बंद करें
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center space-x-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>सहेजा जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>प्रोफाइल सहेजें (Save Changes)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
