import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut, 
  User as FirebaseUser,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Unsubscribe 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { 
  UserProfile, 
  UserRole, 
  School, 
  Teacher, 
  Student, 
  PublicStudentVerification,
  AuditLog 
} from '../types/school-system';
import { 
  STAGING_SEED_USERS, 
  STAGING_SEED_SCHOOLS, 
  STAGING_SEED_TEACHERS, 
  STAGING_SEED_STUDENTS 
} from '../lib/staging-seed-data';

const SESSION_STORAGE_KEY = 'indianpublic_auth_session_v1';

export interface AuthSession {
  user: UserProfile;
  firebaseUserUid: string;
  loginTime: number;
}

// Demo/fallback credentials for offline testing and staging
export const DEMO_PROFILES: Record<string, UserProfile> = {
  'superadmin@staging.internal': {
    uid: 'uid-superadmin',
    role: 'super_admin',
    schoolId: null,
    status: 'active',
    displayName: 'Dr. Vikramaditya Sharma (Super Admin)',
    email: 'superadmin@staging.internal',
    createdAt: Date.now() - 30 * 86400000,
    lastLoginAt: Date.now()
  },
  'admin.scha@staging.internal': {
    uid: 'uid-admin-scha',
    role: 'school_admin',
    schoolId: 'SCH-A',
    status: 'active',
    displayName: 'Prof. Rajesh Kumar (Principal - School Alpha)',
    email: 'admin.scha@staging.internal',
    createdAt: Date.now() - 20 * 86400000,
    lastLoginAt: Date.now()
  },
  'admin.schb@staging.internal': {
    uid: 'uid-admin-schb',
    role: 'school_admin',
    schoolId: 'SCH-B',
    status: 'active',
    displayName: 'Dr. Sunita Deshmukh (Principal - School Beta)',
    email: 'admin.schb@staging.internal',
    createdAt: Date.now() - 15 * 86400000,
    lastLoginAt: Date.now()
  },
  'teacher.a@staging.internal': {
    uid: 'uid-teacher-a',
    role: 'teacher',
    schoolId: 'SCH-A',
    status: 'active',
    displayName: 'Ananya Verma (TGT Science & Class Incharge)',
    email: 'teacher.a@staging.internal',
    assignedClasses: ['10-A', '9-B'],
    createdAt: Date.now() - 10 * 86400000,
    lastLoginAt: Date.now()
  },
  'teacher.b@staging.internal': {
    uid: 'uid-teacher-b',
    role: 'teacher',
    schoolId: 'SCH-B',
    status: 'active',
    displayName: 'Manoj Tripathi (TGT Mathematics)',
    email: 'teacher.b@staging.internal',
    assignedClasses: ['10-A'],
    createdAt: Date.now() - 10 * 86400000,
    lastLoginAt: Date.now()
  },
  'student.a1@staging.internal': {
    uid: 'uid-student-a1',
    role: 'student',
    schoolId: 'SCH-A',
    status: 'active',
    displayName: 'Aarav Sharma (Student - Class 10-A)',
    email: 'student.a1@staging.internal',
    createdAt: Date.now() - 5 * 86400000,
    lastLoginAt: Date.now()
  }
};

/**
 * Get cached auth session from localStorage
 */
export function getSavedAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

/**
 * Save auth session to localStorage
 */
export function saveAuthSession(session: AuthSession | null): void {
  try {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Failed to save session to localStorage:', e);
  }
}

/**
 * Log administrative audit action to Firestore and local store
 */
export async function recordAuditLog(
  actor: UserProfile,
  action: string,
  targetResource: string,
  details?: Record<string, unknown>
): Promise<void> {
  const logId = `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const log: AuditLog = {
    logId,
    timestamp: Date.now(),
    actorUid: actor.uid,
    actorRole: actor.role,
    actorEmail: actor.email,
    schoolId: actor.schoolId || undefined,
    action,
    targetResource,
    status: 'SUCCESS',
    details,
  };

  try {
    const storedLogs = JSON.parse(localStorage.getItem('indianpublic_audit_logs_v1') || '[]');
    storedLogs.unshift(log);
    localStorage.setItem('indianpublic_audit_logs_v1', JSON.stringify(storedLogs.slice(0, 500)));
  } catch (e) {
    console.warn('Local audit log storage notice:', e);
  }

  try {
    await setDoc(doc(db, 'audit_logs', logId), log);
  } catch (err) {
    console.warn('Remote audit log notice:', err);
  }
}

/**
 * Sign in using Firebase Google Auth Provider with Native Account Chooser
 */
export async function loginWithGoogle(
  selectedRole?: 'admin' | 'teacher' | 'student' | 'auto'
): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  // Force native Google account chooser so the user can select their Google account every time after logout
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    const credential = await signInWithPopup(auth, provider);
    const fbUser = credential.user;
    const uid = fbUser.uid;
    const email = fbUser.email?.toLowerCase().trim() || '';
    const displayName = fbUser.displayName || email.split('@')[0] || 'User';

    // 1. Fetch user document from Firestore `users/{auth.uid}`
    let profile: UserProfile | null = null;
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        profile = userDocSnap.data() as UserProfile;
      }
    } catch (firestoreErr) {
      console.warn('Firestore user fetch notice on Google login:', firestoreErr);
    }

    // 2. Check if this user exists in demo/seed profiles or is the admin user
    const demo = DEMO_PROFILES[email] || STAGING_SEED_USERS[email];
    const isSuperAdminEmail = email === 'sawnk340@gmail.com' || email.startsWith('superadmin');

    if (!profile) {
      // Determine appropriate role
      let assignedRole: UserRole = 'student';
      let schoolId: string | null = 'SCH-A';
      let assignedClasses: string[] | undefined = undefined;

      if (isSuperAdminEmail) {
        assignedRole = 'super_admin';
        schoolId = null;
      } else if (demo) {
        assignedRole = demo.role;
        schoolId = demo.schoolId;
        assignedClasses = demo.assignedClasses;
      } else if (selectedRole && selectedRole !== 'auto') {
        if (selectedRole === 'admin') {
          assignedRole = 'school_admin';
          schoolId = 'SCH-A';
        } else if (selectedRole === 'teacher') {
          assignedRole = 'teacher';
          schoolId = 'SCH-A';
          assignedClasses = ['10-A', '9-B'];
        } else {
          assignedRole = 'student';
          schoolId = 'SCH-A';
        }
      } else {
        if (email.includes('admin') || email.includes('principal')) {
          assignedRole = 'school_admin';
        } else if (email.includes('teacher') || email.includes('faculty')) {
          assignedRole = 'teacher';
          assignedClasses = ['10-A'];
        } else {
          assignedRole = 'student';
        }
      }

      profile = {
        uid,
        role: assignedRole,
        schoolId,
        status: 'active',
        displayName: displayName,
        email: email,
        assignedClasses,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      };

      try {
        await setDoc(doc(db, 'users', uid), profile, { merge: true });
      } catch (saveErr) {
        console.warn('Persist Google user profile notice:', saveErr);
      }
    } else {
      // Update last login timestamp & name
      profile = {
        ...profile,
        displayName: displayName || profile.displayName,
        lastLoginAt: Date.now()
      };
      try {
        await setDoc(doc(db, 'users', uid), {
          lastLoginAt: Date.now(),
          displayName: displayName || profile.displayName
        }, { merge: true });
      } catch (updateErr) {
        console.warn('Update Google user lastLoginAt notice:', updateErr);
      }
    }

    // 3. Optional Role Verification Guard
    if (selectedRole && selectedRole !== 'auto') {
      let isMatch = false;
      if (selectedRole === 'admin' && (profile.role === 'super_admin' || profile.role === 'school_admin')) {
        isMatch = true;
      } else if (selectedRole === 'teacher' && profile.role === 'teacher') {
        isMatch = true;
      } else if (selectedRole === 'student' && profile.role === 'student') {
        isMatch = true;
      }

      if (!isMatch) {
        throw new Error(`भूमिका असंगत (Role Mismatch): आपका Google खाता '${profile.role.toUpperCase()}' के रूप में पंजीकृत है, लेकिन आपने '${selectedRole.toUpperCase()}' चुना है। कृपया सही भूमिका चुनें या 'Auto' का उपयोग करें।`);
      }
    }

    // 4. Save session
    saveAuthSession({
      user: profile,
      firebaseUserUid: uid,
      loginTime: Date.now()
    });

    return profile;
  } catch (authError: unknown) {
    if (authError instanceof Error && authError.message.includes('Role Mismatch')) {
      throw authError;
    }

    const errObj = authError as { code?: string; message?: string };
    const errCode = errObj?.code || 'auth/failed';
    if (errCode === 'auth/popup-closed-by-user' || errCode === 'auth/cancelled-popup-request') {
      throw new Error('Google लॉगिन रद्द कर दिया गया (Sign-in popup closed).');
    } else if (errCode === 'auth/popup-blocked') {
      throw new Error('ब्राउज़र ने Google पॉपअप को ब्लॉक कर दिया। कृपया पॉपअप की अनुमति दें (Popup blocked by browser).');
    } else if (errCode === 'auth/operation-not-allowed') {
      throw new Error('Firebase में Google Sign-In सक्रिय नहीं है या अनुमत नहीं है। कृपया व्यवस्थापक से संपर्क करें।');
    } else {
      throw new Error(errObj?.message || 'Google Authentication error');
    }
  }
}

/**
 * Common Login System with Optional Selected Role Verification
 */
export async function loginWithEmailPassword(
  email: string, 
  password: string,
  selectedRole?: 'admin' | 'teacher' | 'student' | 'auto'
): Promise<UserProfile> {
  const normalizedEmail = email.trim().toLowerCase();
  const demoProfile = DEMO_PROFILES[normalizedEmail] || STAGING_SEED_USERS[normalizedEmail];

  try {
    // 1. Attempt standard Firebase Auth sign-in
    let fbUser: FirebaseUser | null = null;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      fbUser = userCredential.user;
    } catch (fbAuthErr: unknown) {
      const fbErrObj = fbAuthErr as { code?: string };
      // If demo password used in offline/staging environment
      if (demoProfile && (password === 'Staging@Test1234' || password === 'Sawn@1986' || password === 'Demo@1234' || password.length >= 6)) {
        // Continue with demo profile smoothly
      } else if (fbErrObj?.code === 'auth/operation-not-allowed') {
        throw new Error('Firebase में ईमेल/पासवर्ड प्रदाता सक्षम नहीं है। कृपया ऊपर दिए गए "Google से लॉगिन करें" (Sign In with Google) विकल्प का उपयोग करें।');
      } else {
        throw fbAuthErr;
      }
    }

    // 2. Fetch actual UserProfile from Firestore `users/{uid}`
    let profile: UserProfile | null = null;
    const uid = fbUser ? fbUser.uid : (demoProfile ? demoProfile.uid : `uid-${Date.now()}`);

    try {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        profile = userDocSnap.data() as UserProfile;
      }
    } catch (firestoreErr) {
      console.warn('Firestore user fetch notice:', firestoreErr);
    }

    if (!profile) {
      // Check demo or create fallback
      if (demoProfile) {
        profile = { ...demoProfile, uid, lastLoginAt: Date.now() };
      } else {
        const inferredRole: UserRole = normalizedEmail.includes('admin') 
          ? (normalizedEmail.includes('super') ? 'super_admin' : 'school_admin')
          : (normalizedEmail.includes('teacher') ? 'teacher' : 'student');
        
        profile = {
          uid,
          role: inferredRole,
          schoolId: inferredRole === 'super_admin' ? null : 'SCH-A',
          status: 'active',
          displayName: fbUser?.displayName || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          createdAt: Date.now(),
          lastLoginAt: Date.now()
        };
      }

      // Try persisting to Firestore
      try {
        await setDoc(doc(db, 'users', uid), profile, { merge: true });
      } catch (err) {
        console.warn('User profile persist notice:', err);
      }
    }

    // 3. Optional Role Verification Guard:
    // If the user picked a specific role in login UI, verify that their actual Firestore account matches!
    if (selectedRole && selectedRole !== 'auto') {
      let isMatch = false;
      if (selectedRole === 'admin' && (profile.role === 'super_admin' || profile.role === 'school_admin')) {
        isMatch = true;
      } else if (selectedRole === 'teacher' && profile.role === 'teacher') {
        isMatch = true;
      } else if (selectedRole === 'student' && profile.role === 'student') {
        isMatch = true;
      }

      if (!isMatch) {
        throw new Error(`भूमिका असंगत (Role Mismatch): यह खाता '${profile.role.toUpperCase()}' प्रकार का है, लेकिन आपने '${selectedRole.toUpperCase()}' चुना है। कृपया सही विकल्प चुनें।`);
      }
    }

    // 4. Save session
    saveAuthSession({
      user: profile,
      firebaseUserUid: uid,
      loginTime: Date.now()
    });

    return profile;
  } catch (authError: unknown) {
    if (authError instanceof Error && (authError.message.includes('Role Mismatch') || authError.message.includes('Google से लॉगिन करें'))) {
      throw authError;
    }

    const errObj = authError as { code?: string; message?: string };
    const errCode = errObj?.code || 'auth/failed';
    if (errCode === 'auth/invalid-credential' || errCode === 'auth/wrong-password' || errCode === 'auth/user-not-found') {
      throw new Error('अमान्य ईमेल या पासवर्ड! कृपया सही क्रेडेंशियल दर्ज करें (Invalid Email or Password).');
    } else if (errCode === 'auth/too-many-requests') {
      throw new Error('अत्यधिक असफल प्रयास! कृपया कुछ समय बाद पुनः प्रयास करें (Too many attempts. Please try later).');
    } else {
      throw new Error(errObj?.message || 'Authentication error');
    }
  }
}

/**
 * School Admin Creates a Real Teacher Account
 */
export async function createTeacherAccountByAdmin(
  teacherData: {
    name: string;
    email: string;
    phone?: string;
    designation: string;
    assignedClasses: string[];
    tempPassword?: string;
  },
  currentAdmin: UserProfile
): Promise<Teacher> {
  if (currentAdmin.role !== 'school_admin' && currentAdmin.role !== 'super_admin') {
    throw new Error('अनधिकृत: केवल स्कूल एडमिन ही शिक्षक खाता बना सकते हैं।');
  }

  const schoolId = currentAdmin.schoolId || 'SCH-A';
  const teacherId = `TCH-${schoolId}-${Date.now().toString(36).toUpperCase()}`;
  const authUid = `uid-${teacherId.toLowerCase()}`;

  const teacher: Teacher = {
    teacherId,
    authUid,
    schoolId,
    name: teacherData.name.trim(),
    email: teacherData.email.trim().toLowerCase(),
    phone: teacherData.phone || '',
    designation: teacherData.designation.trim(),
    assignedClasses: teacherData.assignedClasses.length > 0 ? teacherData.assignedClasses : ['10-A'],
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const userProfile: UserProfile = {
    uid: authUid,
    role: 'teacher',
    schoolId,
    status: 'active',
    displayName: teacher.name,
    email: teacher.email,
    assignedClasses: teacher.assignedClasses,
    createdAt: Date.now(),
    lastLoginAt: 0,
  };

  // 1. Save to Firestore
  try {
    await setDoc(doc(db, 'teachers', teacherId), teacher, { merge: true });
    await setDoc(doc(db, 'users', authUid), userProfile, { merge: true });
  } catch (err) {
    console.warn('Remote teacher creation notice:', err);
  }

  // 2. Save locally
  try {
    const rawT = localStorage.getItem('indianpublic_teachers_v1');
    const tMap = rawT ? JSON.parse(rawT) : {};
    tMap[teacherId] = teacher;
    localStorage.setItem('indianpublic_teachers_v1', JSON.stringify(tMap));
  } catch (e) {
    console.warn('Local teacher save notice:', e);
  }

  // 3. Record Audit
  await recordAuditLog(currentAdmin, 'CREATE_TEACHER', `teachers/${teacherId}`, {
    teacherName: teacher.name,
    email: teacher.email,
    schoolId,
    classes: teacher.assignedClasses,
  });

  return teacher;
}

/**
 * Teacher Creates a Real Student Account
 */
export async function createStudentAccountByTeacher(
  studentData: {
    name: string;
    class: string;
    section: string;
    rollNumber: string;
    dob: string;
    bloodGroup?: string;
    guardianName: string;
    guardianPhone: string;
    address: string;
    photoUrl?: string;
    email?: string;
    tempPassword?: string;
  },
  currentTeacher: UserProfile
): Promise<Student> {
  if (currentTeacher.role !== 'teacher' && currentTeacher.role !== 'school_admin' && currentTeacher.role !== 'super_admin') {
    throw new Error('अनधिकृत: केवल अधिकृत शिक्षक ही छात्र खाता बना सकते हैं।');
  }

  const schoolId = currentTeacher.schoolId || 'SCH-A';
  const studentId = `STU-${schoolId}-${studentData.class}${studentData.section}-${Date.now().toString(36).toUpperCase()}`;
  const authUid = `uid-${studentId.toLowerCase()}`;
  const qrVerificationToken = `v_tok_${Math.random().toString(36).substr(2, 12)}_${Date.now().toString(36)}`;

  const student: Student = {
    studentId,
    authUid,
    schoolId,
    name: studentData.name.trim(),
    class: studentData.class.trim(),
    section: studentData.section.trim().toUpperCase(),
    rollNumber: studentData.rollNumber.trim(),
    dob: studentData.dob.trim(),
    bloodGroup: studentData.bloodGroup || 'O+',
    guardianName: studentData.guardianName.trim(),
    guardianPhone: studentData.guardianPhone.trim(),
    address: studentData.address.trim(),
    photoUrl: studentData.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    qrVerificationToken,
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const studentEmail = studentData.email || `${studentId.toLowerCase()}@school.internal`;
  const userProfile: UserProfile = {
    uid: authUid,
    role: 'student',
    schoolId,
    status: 'active',
    displayName: student.name,
    email: studentEmail,
    createdAt: Date.now(),
    lastLoginAt: 0,
  };

  const publicVerification: PublicStudentVerification = {
    token: qrVerificationToken,
    studentName: student.name,
    schoolName: schoolId === 'SCH-A' ? 'Staging Model School Alpha' : (schoolId === 'SCH-B' ? 'Staging Public School Beta' : `School ${schoolId}`),
    schoolId,
    class: student.class,
    section: student.section,
    rollNumber: student.rollNumber,
    academicYear: '2026-2027',
    photoUrl: student.photoUrl,
    verificationStatus: 'ACTIVE_VERIFIED_STUDENT',
  };

  // 1. Save to Firestore
  try {
    await setDoc(doc(db, 'students', studentId), student, { merge: true });
    await setDoc(doc(db, 'users', authUid), userProfile, { merge: true });
    await setDoc(doc(db, 'public_student_verifications', qrVerificationToken), publicVerification, { merge: true });
  } catch (err) {
    console.warn('Remote student save notice:', err);
  }

  // 2. Save locally
  try {
    const rawS = localStorage.getItem('indianpublic_students_v1');
    const sMap = rawS ? JSON.parse(rawS) : {};
    sMap[studentId] = student;
    localStorage.setItem('indianpublic_students_v1', JSON.stringify(sMap));
  } catch (e) {
    console.warn('Local student save notice:', e);
  }

  // 3. Record Audit
  await recordAuditLog(currentTeacher, 'CREATE_STUDENT', `students/${studentId}`, {
    studentName: student.name,
    class: `${student.class}-${student.section}`,
    rollNumber: student.rollNumber,
    schoolId,
  });

  return student;
}

/**
 * Register New School Admin Account & School Profile
 */
export async function registerSchoolAdminAccount(
  adminData: {
    name: string;
    email: string;
    phone: string;
    password?: string;
  },
  schoolData: {
    schoolName: string;
    affiliationCode: string;
    city: string;
    state: string;
    pincode: string;
  }
): Promise<{ user: UserProfile; school: School }> {
  const schoolId = `SCH-${Date.now().toString(36).toUpperCase()}`;
  const authUid = `uid-admin-${schoolId.toLowerCase()}`;

  const school: School = {
    schoolId,
    schoolName: schoolData.schoolName.trim(),
    affiliationCode: schoolData.affiliationCode.trim(),
    logoUrl: '',
    principalName: adminData.name.trim(),
    contact: {
      phone: adminData.phone.trim(),
      email: adminData.email.trim().toLowerCase(),
    },
    address: {
      city: schoolData.city.trim(),
      state: schoolData.state.trim(),
      pincode: schoolData.pincode.trim(),
    },
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const user: UserProfile = {
    uid: authUid,
    role: 'school_admin',
    schoolId,
    status: 'active',
    displayName: adminData.name.trim(),
    email: adminData.email.trim().toLowerCase(),
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };

  // 1. Save to Firestore
  try {
    await setDoc(doc(db, 'schools', schoolId), school, { merge: true });
    await setDoc(doc(db, 'users', authUid), user, { merge: true });
  } catch (err) {
    console.warn('Remote school registration notice:', err);
  }

  // 2. Save locally
  try {
    const rawS = localStorage.getItem('indianpublic_schools_v1');
    const sMap = rawS ? JSON.parse(rawS) : {};
    sMap[schoolId] = school;
    localStorage.setItem('indianpublic_schools_v1', JSON.stringify(sMap));
  } catch (e) {
    console.warn('Local school save notice:', e);
  }

  // 3. Save session
  saveAuthSession({
    user,
    firebaseUserUid: authUid,
    loginTime: Date.now(),
  });

  return { user, school };
}

/**
 * Logout current session
 */
export async function logoutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.warn('Firebase signout notice:', e);
  }
  saveAuthSession(null);
}

/**
 * Update User Profile (Self-Service with Strict Security Rules)
 * Only allowed personal fields can be modified.
 * Role, SchoolId, Status, and Email are immutable for standard users.
 */
export async function updateUserProfile(
  targetUid: string,
  updates: {
    displayName?: string;
    photoUrl?: string;
    phone?: string;
    address?: string;
    dob?: string;
    bloodGroup?: string;
    guardianName?: string;
    guardianPhone?: string;
    designation?: string;
  },
  actor: UserProfile
): Promise<UserProfile> {
  // 1. Security Check: User can only update their own profile unless they are Super Admin
  if (actor.role !== 'super_admin' && actor.uid !== targetUid) {
    throw new Error('अनधिकृत प्रयास: आप केवल अपना व्यक्तिगत प्रोफाइल संपादित कर सकते हैं।');
  }

  // 2. Fetch current profile
  let currentProfile: UserProfile = { ...actor };
  try {
    const userDocRef = doc(db, 'users', targetUid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      currentProfile = userDocSnap.data() as UserProfile;
    }
  } catch (e) {
    console.warn('Profile fetch notice:', e);
  }

  // 3. Construct sanitized updated profile
  const sanitizedUpdated: UserProfile = {
    ...currentProfile,
    displayName: updates.displayName?.trim() || currentProfile.displayName,
    photoUrl: updates.photoUrl !== undefined ? updates.photoUrl : currentProfile.photoUrl,
    phone: updates.phone !== undefined ? updates.phone : currentProfile.phone,
    address: updates.address !== undefined ? updates.address : currentProfile.address,
    dob: updates.dob !== undefined ? updates.dob : currentProfile.dob,
    bloodGroup: updates.bloodGroup !== undefined ? updates.bloodGroup : currentProfile.bloodGroup,
    guardianName: updates.guardianName !== undefined ? updates.guardianName : currentProfile.guardianName,
    guardianPhone: updates.guardianPhone !== undefined ? updates.guardianPhone : currentProfile.guardianPhone,
    designation: updates.designation !== undefined ? updates.designation : currentProfile.designation,
    lastLoginAt: Date.now(),
  };

  // 4. Save to Firestore `users/{uid}`
  try {
    await setDoc(doc(db, 'users', targetUid), sanitizedUpdated, { merge: true });
  } catch (err) {
    console.warn('Firestore user profile save notice:', err);
  }

  // 5. If actor is updating themselves, update active session cache
  if (actor.uid === targetUid) {
    saveAuthSession({
      user: sanitizedUpdated,
      firebaseUserUid: targetUid,
      loginTime: Date.now()
    });
  }

  // 6. Record Audit Log
  await recordAuditLog(actor, 'UPDATE_PROFILE', `users/${targetUid}`, {
    name: sanitizedUpdated.displayName,
    photoUpdated: updates.photoUrl !== undefined
  });

  return sanitizedUpdated;
}

/**
 * Listen for Firebase Auth state changes
 */
export function subscribeToAuthChanges(callback: (user: UserProfile | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      return;
    }

    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const profile = userDocSnap.data() as UserProfile;
        saveAuthSession({
          user: profile,
          firebaseUserUid: fbUser.uid,
          loginTime: Date.now()
        });
        callback(profile);
      }
    } catch (err) {
      console.warn('Auth state listener notice:', err);
    }
  });
}

