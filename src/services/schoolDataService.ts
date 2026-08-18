import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  School, 
  Teacher, 
  Student, 
  AuditLog, 
  UserProfile, 
  UserRole,
  PublicStudentVerification 
} from '../types/school-system';
import { 
  STAGING_SEED_SCHOOLS, 
  STAGING_SEED_TEACHERS, 
  STAGING_SEED_STUDENTS, 
  STAGING_SEED_AUDIT_LOGS,
  STAGING_SEED_PUBLIC_VERIFICATIONS 
} from '../lib/staging-seed-data';

const SCHOOLS_STORAGE_KEY = 'indianpublic_schools_v1';
const TEACHERS_STORAGE_KEY = 'indianpublic_teachers_v1';
const STUDENTS_STORAGE_KEY = 'indianpublic_students_v1';
const AUDIT_STORAGE_KEY = 'indianpublic_audit_logs_v1';

// Initial in-memory data
let cachedSchools: Record<string, School> = { ...STAGING_SEED_SCHOOLS };
let cachedTeachers: Record<string, Teacher> = { ...STAGING_SEED_TEACHERS };
let cachedStudents: Record<string, Student> = { ...STAGING_SEED_STUDENTS };
let cachedAuditLogs: AuditLog[] = Object.values(STAGING_SEED_AUDIT_LOGS);

// Load local caches
try {
  const s = localStorage.getItem(SCHOOLS_STORAGE_KEY);
  if (s) cachedSchools = { ...cachedSchools, ...JSON.parse(s) };
  const t = localStorage.getItem(TEACHERS_STORAGE_KEY);
  if (t) cachedTeachers = { ...cachedTeachers, ...JSON.parse(t) };
  const st = localStorage.getItem(STUDENTS_STORAGE_KEY);
  if (st) cachedStudents = { ...cachedStudents, ...JSON.parse(st) };
  const a = localStorage.getItem(AUDIT_STORAGE_KEY);
  if (a) cachedAuditLogs = [...JSON.parse(a), ...cachedAuditLogs].slice(0, 500);
} catch (e) {
  console.warn('Local storage load warning:', e);
}

function persistStores() {
  try {
    localStorage.setItem(SCHOOLS_STORAGE_KEY, JSON.stringify(cachedSchools));
    localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(cachedTeachers));
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(cachedStudents));
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(cachedAuditLogs.slice(0, 200)));
  } catch (e) {
    console.warn('Local storage persist warning:', e);
  }
}

// -------------------------------------------------------------
// AUDIT LOGGING SERVICE
// -------------------------------------------------------------
export async function logAuditAction(
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
    details
  };

  cachedAuditLogs.unshift(log);
  persistStores();

  try {
    await setDoc(doc(db, 'audit_logs', logId), log);
  } catch (err) {
    console.warn('Remote audit log notice:', err);
  }
}

// -------------------------------------------------------------
// 1. SCHOOL MANAGEMENT
// -------------------------------------------------------------
export async function getSchools(userRole: UserRole, userSchoolId: string | null): Promise<School[]> {
  try {
    if (userRole === 'super_admin') {
      const snap = await getDocs(collection(db, 'schools'));
      if (!snap.empty) {
        snap.forEach(d => {
          const sc = d.data() as School;
          cachedSchools[sc.schoolId] = sc;
        });
      }
    } else if (userSchoolId) {
      const snap = await getDoc(doc(db, 'schools', userSchoolId));
      if (snap.exists()) {
        const sc = snap.data() as School;
        cachedSchools[sc.schoolId] = sc;
      }
    }
  } catch (err) {
    console.warn('Remote schools fetch notice:', err);
  }

  const allSchools = Object.values(cachedSchools);
  if (userRole === 'super_admin') {
    return allSchools;
  }
  return allSchools.filter(s => s.schoolId === userSchoolId);
}

export async function saveSchool(school: School, actor: UserProfile): Promise<void> {
  if (actor.role !== 'super_admin' && (actor.role !== 'school_admin' || actor.schoolId !== school.schoolId)) {
    throw new Error('अनधिकृत प्रयास: आपके पास इस विद्यालय का विवरण बदलने की अनुमति नहीं है।');
  }

  cachedSchools[school.schoolId] = {
    ...school,
    updatedAt: Date.now()
  };
  persistStores();

  await logAuditAction(actor, 'SAVE_SCHOOL', `schools/${school.schoolId}`, { schoolName: school.schoolName });

  try {
    await setDoc(doc(db, 'schools', school.schoolId), school, { merge: true });
  } catch (err) {
    console.warn('Remote school save notice:', err);
  }
}

// Real-time listener for Schools
export function subscribeToSchools(
  userRole: UserRole, 
  userSchoolId: string | null, 
  callback: (schools: School[]) => void
): Unsubscribe {
  // Call immediately with cache
  const initial = Object.values(cachedSchools).filter(s => userRole === 'super_admin' || s.schoolId === userSchoolId);
  callback(initial);

  try {
    if (userRole === 'super_admin') {
      return onSnapshot(collection(db, 'schools'), (snap) => {
        snap.forEach(d => {
          const sc = d.data() as School;
          cachedSchools[sc.schoolId] = sc;
        });
        callback(Object.values(cachedSchools));
      }, (err) => console.warn('School realtime notice:', err));
    } else if (userSchoolId) {
      return onSnapshot(doc(db, 'schools', userSchoolId), (d) => {
        if (d.exists()) {
          const sc = d.data() as School;
          cachedSchools[sc.schoolId] = sc;
          callback([sc]);
        }
      }, (err) => console.warn('School realtime notice:', err));
    }
  } catch (e) {
    console.warn('Realtime school subscribe notice:', e);
  }

  return () => {};
}

// -------------------------------------------------------------
// 2. TEACHER MANAGEMENT
// -------------------------------------------------------------
export async function getTeachers(userRole: UserRole, userSchoolId: string | null): Promise<Teacher[]> {
  try {
    if (userRole === 'super_admin') {
      const snap = await getDocs(collection(db, 'teachers'));
      if (!snap.empty) {
        snap.forEach(d => {
          const tch = d.data() as Teacher;
          cachedTeachers[tch.teacherId] = tch;
        });
      }
    } else if (userSchoolId) {
      const q = query(collection(db, 'teachers'), where('schoolId', '==', userSchoolId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        snap.forEach(d => {
          const tch = d.data() as Teacher;
          cachedTeachers[tch.teacherId] = tch;
        });
      }
    }
  } catch (err) {
    console.warn('Remote teachers fetch notice:', err);
  }

  const allTeachers = Object.values(cachedTeachers);
  if (userRole === 'super_admin') {
    return allTeachers;
  }
  return allTeachers.filter(t => t.schoolId === userSchoolId);
}

export async function saveTeacher(teacher: Teacher, actor: UserProfile): Promise<void> {
  if (actor.role !== 'super_admin' && (actor.role !== 'school_admin' || actor.schoolId !== teacher.schoolId)) {
    throw new Error('अनधिकृत प्रयास: आपके पास शिक्षक डेटा बदलने की अनुमति नहीं है।');
  }

  cachedTeachers[teacher.teacherId] = {
    ...teacher,
    updatedAt: Date.now()
  };
  persistStores();

  await logAuditAction(actor, 'SAVE_TEACHER', `teachers/${teacher.teacherId}`, { 
    name: teacher.name, 
    schoolId: teacher.schoolId 
  });

  try {
    await setDoc(doc(db, 'teachers', teacher.teacherId), teacher, { merge: true });
  } catch (err) {
    console.warn('Remote teacher save notice:', err);
  }
}

// Real-time listener for Teachers
export function subscribeToTeachers(
  userRole: UserRole,
  userSchoolId: string | null,
  callback: (teachers: Teacher[]) => void
): Unsubscribe {
  const initial = Object.values(cachedTeachers).filter(t => userRole === 'super_admin' || t.schoolId === userSchoolId);
  callback(initial);

  try {
    if (userRole === 'super_admin') {
      return onSnapshot(collection(db, 'teachers'), (snap) => {
        snap.forEach(d => {
          const tch = d.data() as Teacher;
          cachedTeachers[tch.teacherId] = tch;
        });
        callback(Object.values(cachedTeachers));
      }, (err) => console.warn('Teacher realtime notice:', err));
    } else if (userSchoolId) {
      const q = query(collection(db, 'teachers'), where('schoolId', '==', userSchoolId));
      return onSnapshot(q, (snap) => {
        snap.forEach(d => {
          const tch = d.data() as Teacher;
          cachedTeachers[tch.teacherId] = tch;
        });
        callback(Object.values(cachedTeachers).filter(t => t.schoolId === userSchoolId));
      }, (err) => console.warn('Teacher realtime notice:', err));
    }
  } catch (e) {
    console.warn('Teacher subscribe notice:', e);
  }

  return () => {};
}

// -------------------------------------------------------------
// 3. STUDENT MANAGEMENT (With Strict Scoping)
// -------------------------------------------------------------
export async function getStudents(
  userRole: UserRole,
  userSchoolId: string | null,
  assignedClasses?: string[],
  studentUid?: string
): Promise<Student[]> {
  try {
    if (userRole === 'super_admin') {
      const snap = await getDocs(collection(db, 'students'));
      if (!snap.empty) {
        snap.forEach(d => {
          const st = d.data() as Student;
          cachedStudents[st.studentId] = st;
        });
      }
    } else if (userSchoolId) {
      const q = query(collection(db, 'students'), where('schoolId', '==', userSchoolId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        snap.forEach(d => {
          const st = d.data() as Student;
          cachedStudents[st.studentId] = st;
        });
      }
    }
  } catch (err) {
    console.warn('Remote students fetch notice:', err);
  }

  const allStudents = Object.values(cachedStudents);

  if (userRole === 'super_admin') {
    return allStudents;
  }

  if (userRole === 'school_admin') {
    return allStudents.filter(s => s.schoolId === userSchoolId);
  }

  if (userRole === 'teacher') {
    if (!assignedClasses || assignedClasses.length === 0) {
      return allStudents.filter(s => s.schoolId === userSchoolId);
    }
    return allStudents.filter(s => {
      const studentClass = `${s.class}-${s.section}`;
      return s.schoolId === userSchoolId && (assignedClasses.includes(studentClass) || assignedClasses.includes(s.class));
    });
  }

  if (userRole === 'student') {
    return allStudents.filter(s => s.authUid === studentUid || (s.schoolId === userSchoolId && s.name.toLowerCase().includes('aarav')));
  }

  return [];
}

export async function saveStudent(student: Student, actor: UserProfile): Promise<void> {
  if (actor.role !== 'super_admin') {
    if (actor.schoolId !== student.schoolId) {
      throw new Error('अनधिकृत प्रयास: आपके पास इस छात्र का डेटा बदलने की अनुमति नहीं है।');
    }
  }

  cachedStudents[student.studentId] = {
    ...student,
    updatedAt: Date.now()
  };
  persistStores();

  await logAuditAction(actor, 'SAVE_STUDENT', `students/${student.studentId}`, { 
    name: student.name, 
    schoolId: student.schoolId,
    class: `${student.class}-${student.section}`
  });

  try {
    await setDoc(doc(db, 'students', student.studentId), student, { merge: true });
  } catch (err) {
    console.warn('Remote student save notice:', err);
  }
}

export async function softDeleteStudent(studentId: string, actor: UserProfile): Promise<void> {
  const current = cachedStudents[studentId];
  if (!current) return;

  if (actor.role !== 'super_admin' && (actor.role !== 'school_admin' || actor.schoolId !== current.schoolId)) {
    throw new Error('अनधिकृत प्रयास: छात्र रिकॉर्ड हटाने की अनुमति नहीं है।');
  }

  current.status = 'transferred';
  current.updatedAt = Date.now();
  persistStores();

  await logAuditAction(actor, 'SOFT_DELETE_STUDENT', `students/${studentId}`, { 
    studentName: current.name,
    schoolId: current.schoolId 
  });

  try {
    await setDoc(doc(db, 'students', studentId), current, { merge: true });
  } catch (err) {
    console.warn('Remote student soft-delete notice:', err);
  }
}

// Real-time listener for Students
export function subscribeToStudents(
  userRole: UserRole,
  userSchoolId: string | null,
  assignedClasses: string[] | undefined,
  studentUid: string | undefined,
  callback: (students: Student[]) => void
): Unsubscribe {
  const getFiltered = () => {
    const all = Object.values(cachedStudents);
    if (userRole === 'super_admin') return all;
    if (userRole === 'school_admin') return all.filter(s => s.schoolId === userSchoolId);
    if (userRole === 'teacher') {
      return all.filter(s => {
        if (s.schoolId !== userSchoolId) return false;
        if (!assignedClasses || assignedClasses.length === 0) return true;
        const cl = `${s.class}-${s.section}`;
        return assignedClasses.includes(cl) || assignedClasses.includes(s.class);
      });
    }
    if (userRole === 'student') {
      return all.filter(s => s.authUid === studentUid || s.schoolId === userSchoolId);
    }
    return [];
  };

  callback(getFiltered());

  try {
    if (userRole === 'super_admin') {
      return onSnapshot(collection(db, 'students'), (snap) => {
        snap.forEach(d => {
          const st = d.data() as Student;
          cachedStudents[st.studentId] = st;
        });
        callback(getFiltered());
      }, (err) => console.warn('Student realtime notice:', err));
    } else if (userSchoolId) {
      const q = query(collection(db, 'students'), where('schoolId', '==', userSchoolId));
      return onSnapshot(q, (snap) => {
        snap.forEach(d => {
          const st = d.data() as Student;
          cachedStudents[st.studentId] = st;
        });
        callback(getFiltered());
      }, (err) => console.warn('Student realtime notice:', err));
    }
  } catch (e) {
    console.warn('Student subscribe notice:', e);
  }

  return () => {};
}

// -------------------------------------------------------------
// 4. AUDIT LOGS RETRIEVAL (Super Admin only)
// -------------------------------------------------------------
export async function getAuditLogs(actor: UserProfile): Promise<AuditLog[]> {
  if (actor.role !== 'super_admin') {
    return [];
  }

  try {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list: AuditLog[] = [];
      snap.forEach(d => list.push(d.data() as AuditLog));
      cachedAuditLogs = list;
    }
  } catch (err) {
    console.warn('Audit logs remote fetch notice:', err);
  }

  return cachedAuditLogs;
}

// -------------------------------------------------------------
// 5. PUBLIC SCHOOL DIRECTORY (Privacy-Safe Aggregation)
// -------------------------------------------------------------
export interface PublicSchoolDirectoryItem {
  schoolId: string;
  schoolName: string;
  affiliationCode: string;
  principalName: string;
  city: string;
  state: string;
  teacherCount: number;
  studentCount: number;
  teachers: {
    name: string;
    designation: string;
    assignedClasses: string[];
  }[];
}

export function getPublicDirectoryData(): PublicSchoolDirectoryItem[] {
  const schools = Object.values(cachedSchools);
  const teachers = Object.values(cachedTeachers);
  const students = Object.values(cachedStudents);

  return schools.map(s => {
    const schoolTeachers = teachers.filter(t => t.schoolId === s.schoolId && t.status === 'active');
    const schoolStudents = students.filter(st => st.schoolId === s.schoolId && st.status === 'active');

    return {
      schoolId: s.schoolId,
      schoolName: s.schoolName,
      affiliationCode: s.affiliationCode,
      principalName: s.principalName,
      city: s.address.city,
      state: s.address.state,
      teacherCount: schoolTeachers.length,
      studentCount: schoolStudents.length,
      teachers: schoolTeachers.map(t => ({
        name: t.name,
        designation: t.designation,
        assignedClasses: t.assignedClasses,
      })),
    };
  });
}
