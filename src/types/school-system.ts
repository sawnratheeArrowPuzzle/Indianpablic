/**
 * ============================================================================
 * MULTI-SCHOOL ENTERPRISE SYSTEM - ISOLATED TYPE FOUNDATION
 * ============================================================================
 * Strict zero-trust, role-based, multi-tenant isolation architecture.
 * This file is purely declarative and decoupled from existing legacy records.
 */

// 1. SYSTEM ROLES & STATUS ENUMS
export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'student';
export type UserAccountStatus = 'active' | 'suspended' | 'pending' | 'disabled';
export type SchoolStatus = 'active' | 'inactive';
export type TeacherStatus = 'active' | 'inactive';
export type StudentStatus = 'active' | 'passed_out' | 'transferred';
export type AuditActionStatus = 'SUCCESS' | 'DENIED' | 'FAILED';

// 2. CENTRAL IDENTITY & ACCESS PROFILE (Stored in `users/{uid}`)
export interface UserProfile {
  uid: string;                 // Linked to Firebase Authentication UID
  role: UserRole;              // Verified on backend via Firestore Security Rules
  schoolId: string | null;     // null for super_admin; mandatory for school_admin, teacher, student
  status: UserAccountStatus;   // Account state (Active / Suspended / Pending)
  displayName: string;
  email: string;
  photoUrl?: string;
  phone?: string;
  address?: string;
  dob?: string;
  bloodGroup?: string;
  guardianName?: string;
  guardianPhone?: string;
  designation?: string;
  assignedClasses?: string[];  // Specifically for teachers (e.g., ["10-A", "9-B"])
  createdAt: number;           // Unix epoch timestamp (ms)
  lastLoginAt: number;          // Unix epoch timestamp (ms)
}

// 3. SCHOOL MASTER RECORD (Stored in `schools/{schoolId}`)
export interface School {
  schoolId: string;            // Unique alphanumeric identifier (e.g. "SCH-DEL-001")
  schoolName: string;          // Official institution name
  affiliationCode: string;     // CBSE/ICSE/State Board Affiliation Code
  logoUrl: string;             // Institution logo URL
  principalName: string;
  contact: {
    phone: string;
    email: string;
  };
  address: {
    street?: string;
    city: string;
    state: string;
    pincode: string;
  };
  status: SchoolStatus;
  createdAt: number;
  updatedAt?: number;
}

// 4. TEACHER RECORD (Stored in `teachers/{teacherId}`)
export interface Teacher {
  teacherId: string;           // Unique teacher ID (e.g. "TCH-DEL001-01")
  authUid: string;             // Associated Firebase Auth UID
  schoolId: string;            // Mandatory Tenant Key (Strict isolation)
  name: string;
  email: string;
  phone?: string;              // Internal contact (School admin view only)
  designation: string;         // e.g. "Senior TGT - Mathematics"
  assignedClasses: string[];   // Classes teacher has permission to view/edit
  status: TeacherStatus;
  createdAt: number;
  updatedAt?: number;
}

// 5. STUDENT RECORD (Stored in `students/{studentId}`)
export interface Student {
  studentId: string;           // Unique student identifier (e.g. "STU-DEL001-2026-1001")
  authUid?: string;            // Optional student login UID (if student portal enabled)
  schoolId: string;            // Mandatory Tenant Key (Strict isolation)
  name: string;
  class: string;               // e.g. "10"
  section: string;             // e.g. "A"
  rollNumber: string;          // e.g. "24"
  photoUrl: string;            // Profile/ID card picture URL
  dob: string;                 // Date of Birth (YYYY-MM-DD)
  bloodGroup?: string;         // Optional medical field
  guardianName: string;        // Parent / Guardian full name
  guardianPhone: string;       // Private field (Never exposed in public QR verification)
  address: string;             // Home address (Private field)
  qrVerificationToken: string; // Cryptographically random secure hash for verification
  status: StudentStatus;
  createdAt: number;
  updatedAt: number;
}

// 6. SANITIZED STUDENT PUBLIC QR VERIFICATION PROJECTION (Privacy-Preserving)
export interface PublicStudentVerification {
  token: string;               // High-entropy 32-char verification hash
  studentName: string;
  schoolName: string;
  schoolId: string;
  class: string;
  section: string;
  rollNumber: string;
  academicYear: string;
  photoUrl: string;
  verificationStatus: 'ACTIVE_VERIFIED_STUDENT' | 'REVOKED' | 'EXPIRED';
  // NOTE: Guardian phone, home address, email, passwords are STRICTLY NOT present here.
}

// 7. COMPLIANCE & AUDIT LOG ENTRY (Stored in `audit_logs/{logId}`)
export interface AuditLog {
  logId: string;
  timestamp: number;           // Server-enforced timestamp (`request.time`)
  actorUid: string;            // Admin/Teacher UID performing the action
  actorRole: UserRole;
  actorEmail: string;
  schoolId?: string;           // Scope of action
  action: string;              // e.g. "CREATE_TEACHER", "BATCH_UPLOAD_STUDENTS", "DELETE_STUDENT"
  targetResource: string;      // Resource path (e.g. "students/STU-DEL001-1001")
  status: AuditActionStatus;
  details?: Record<string, unknown>;
}
