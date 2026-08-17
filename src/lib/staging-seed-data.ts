import { 
  UserProfile, 
  School, 
  Teacher, 
  Student, 
  PublicStudentVerification, 
  AuditLog 
} from '../types/school-system';

/**
 * ============================================================================
 * STAGING SEED DATA (100% SYNTHETIC / DUMMY - ZERO REAL PII)
 * ============================================================================
 */

export const STAGING_SEED_USERS: Record<string, UserProfile> = {
  'uid-superadmin': {
    uid: 'uid-superadmin',
    role: 'super_admin',
    schoolId: null,
    status: 'active',
    displayName: 'Staging Super Admin',
    email: 'superadmin@staging.internal',
    createdAt: 1770000000000,
    lastLoginAt: 1770000000000
  },
  'uid-admin-scha': {
    uid: 'uid-admin-scha',
    role: 'school_admin',
    schoolId: 'SCH-A',
    status: 'active',
    displayName: 'Admin School A',
    email: 'admin.scha@staging.internal',
    createdAt: 1770000000000,
    lastLoginAt: 1770000000000
  },
  'uid-admin-schb': {
    uid: 'uid-admin-schb',
    role: 'school_admin',
    schoolId: 'SCH-B',
    status: 'active',
    displayName: 'Admin School B',
    email: 'admin.schb@staging.internal',
    createdAt: 1770000000000,
    lastLoginAt: 1770000000000
  },
  'uid-teacher-a': {
    uid: 'uid-teacher-a',
    role: 'teacher',
    schoolId: 'SCH-A',
    status: 'active',
    displayName: 'Teacher Alpha (10-A)',
    email: 'teacher.a@staging.internal',
    assignedClasses: ['10-A'],
    createdAt: 1770000000000,
    lastLoginAt: 1770000000000
  },
  'uid-teacher-b': {
    uid: 'uid-teacher-b',
    role: 'teacher',
    schoolId: 'SCH-B',
    status: 'active',
    displayName: 'Teacher Beta (10-A)',
    email: 'teacher.b@staging.internal',
    assignedClasses: ['10-A'],
    createdAt: 1770000000000,
    lastLoginAt: 1770000000000
  },
  'uid-student-a1': {
    uid: 'uid-student-a1',
    role: 'student',
    schoolId: 'SCH-A',
    status: 'active',
    displayName: 'Student Alpha One',
    email: 'student.a1@staging.internal',
    createdAt: 1770000000000,
    lastLoginAt: 1770000000000
  },
  'uid-suspended-user': {
    uid: 'uid-suspended-user',
    role: 'teacher',
    schoolId: 'SCH-A',
    status: 'suspended',
    displayName: 'Suspended Teacher',
    email: 'suspended@staging.internal',
    assignedClasses: ['10-A'],
    createdAt: 1770000000000,
    lastLoginAt: 1770000000000
  }
};

export const STAGING_SEED_SCHOOLS: Record<string, School> = {
  'SCH-A': {
    schoolId: 'SCH-A',
    schoolName: 'Staging Model School Alpha',
    affiliationCode: 'CBSE-STG-001',
    logoUrl: 'https://staging.internal/logo-a.png',
    principalName: 'Dr. Alpha Principal',
    contact: { phone: '011-555-0101', email: 'contact@scha.staging.internal' },
    address: { street: '123 Test Road', city: 'New Delhi', state: 'Delhi', pincode: '110001' },
    status: 'active',
    createdAt: 1770000000000
  },
  'SCH-B': {
    schoolId: 'SCH-B',
    schoolName: 'Staging Public School Beta',
    affiliationCode: 'CBSE-STG-002',
    logoUrl: 'https://staging.internal/logo-b.png',
    principalName: 'Dr. Beta Principal',
    contact: { phone: '011-555-0102', email: 'contact@schb.staging.internal' },
    address: { street: '456 Test Lane', city: 'New Delhi', state: 'Delhi', pincode: '110002' },
    status: 'active',
    createdAt: 1770000000000
  }
};

export const STAGING_SEED_TEACHERS: Record<string, Teacher> = {
  'TCH-A-01': {
    teacherId: 'TCH-A-01',
    authUid: 'uid-teacher-a',
    schoolId: 'SCH-A',
    name: 'Teacher Alpha',
    email: 'teacher.a@staging.internal',
    designation: 'TGT Mathematics',
    assignedClasses: ['10-A'],
    status: 'active',
    createdAt: 1770000000000
  },
  'TCH-B-01': {
    teacherId: 'TCH-B-01',
    authUid: 'uid-teacher-b',
    schoolId: 'SCH-B',
    name: 'Teacher Beta',
    email: 'teacher.b@staging.internal',
    designation: 'TGT Science',
    assignedClasses: ['10-A'],
    status: 'active',
    createdAt: 1770000000000
  }
};

export const STAGING_SEED_STUDENTS: Record<string, Student> = {
  'STU-A-101': {
    studentId: 'STU-A-101',
    authUid: 'uid-student-a1',
    schoolId: 'SCH-A',
    name: 'Dummy Student Alpha 1',
    class: '10',
    section: 'A',
    rollNumber: '01',
    photoUrl: 'https://staging.internal/student-a1.png',
    dob: '2010-01-01',
    guardianName: 'Guardian Alpha 1',
    guardianPhone: '555-0199', // Private PII
    address: '123 Fake Street', // Private PII
    qrVerificationToken: 'v_stg_token_a1_demo',
    status: 'active',
    createdAt: 1770000000000,
    updatedAt: 1770000000000
  },
  'STU-A-102': {
    studentId: 'STU-A-102',
    schoolId: 'SCH-A',
    name: 'Dummy Student Alpha 2',
    class: '10',
    section: 'A',
    rollNumber: '02',
    photoUrl: 'https://staging.internal/student-a2.png',
    dob: '2010-02-02',
    guardianName: 'Guardian Alpha 2',
    guardianPhone: '555-0198',
    address: '124 Fake Street',
    qrVerificationToken: 'v_stg_token_a2_demo',
    status: 'active',
    createdAt: 1770000000000,
    updatedAt: 1770000000000
  },
  'STU-B-101': {
    studentId: 'STU-B-101',
    schoolId: 'SCH-B',
    name: 'Dummy Student Beta 1',
    class: '10',
    section: 'A',
    rollNumber: '01',
    photoUrl: 'https://staging.internal/student-b1.png',
    dob: '2010-03-03',
    guardianName: 'Guardian Beta 1',
    guardianPhone: '555-0197',
    address: '456 Fake Avenue',
    qrVerificationToken: 'v_stg_token_b1_demo',
    status: 'active',
    createdAt: 1770000000000,
    updatedAt: 1770000000000
  }
};

export const STAGING_SEED_PUBLIC_VERIFICATIONS: Record<string, PublicStudentVerification> = {
  'v_stg_token_a1_demo': {
    token: 'v_stg_token_a1_demo',
    studentName: 'Dummy Student Alpha 1',
    schoolName: 'Staging Model School Alpha',
    schoolId: 'SCH-A',
    class: '10',
    section: 'A',
    rollNumber: '01',
    academicYear: '2026-2027',
    photoUrl: 'https://staging.internal/student-a1.png',
    verificationStatus: 'ACTIVE_VERIFIED_STUDENT'
  }
};

export const STAGING_SEED_AUDIT_LOGS: Record<string, AuditLog> = {
  'LOG-STG-001': {
    logId: 'LOG-STG-001',
    timestamp: 1770000000000,
    actorUid: 'uid-superadmin',
    actorRole: 'super_admin',
    actorEmail: 'superadmin@staging.internal',
    schoolId: 'SCH-A',
    action: 'CREATE_SCHOOL',
    targetResource: 'schools/SCH-A',
    status: 'SUCCESS'
  }
};
