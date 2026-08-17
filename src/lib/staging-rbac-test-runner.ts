import { doc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { stagingDb, stagingAuth } from './firebase-staging';
import stagingConfig from '../../firebase-staging-config.json';

export const REQUIRED_STAGING_PROJECT_ID = 'web-1e643';
export const FORBIDDEN_PROD_PROJECT_ID = 'gen-lang-client-0627643856';

export interface UserProfileAudit {
  authUid: string;
  docPath: string;
  exists: boolean;
  role?: string;
  status?: string;
  schoolId?: string;
  error?: string;
}

export interface SingleReadTestResult {
  docPath: string;
  expectedAccess: 'ALLOWED' | 'DENIED';
  actualOutcome: 'READ_SUCCESS' | 'DENIED' | 'ERROR';
  firebaseErrorCode?: string;
  testStatus: 'PASS' | 'FAIL';
  details: string;
}

export interface AccountRbacTestSummary {
  accountEmail: string;
  accountRole: string;
  authStatus: 'LOGGED_IN' | 'AUTH_ERROR' | 'ANONYMOUS';
  authErrorMessage?: string;
  userProfileAudit?: UserProfileAudit;
  tests: SingleReadTestResult[];
  overallStatus: 'PASS' | 'FAIL';
}

export interface FullRbacSuiteSummary {
  verifiedProjectId: string;
  isTargetVerified: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  accountSummaries: AccountRbacTestSummary[];
  errorMessage?: string;
}

/**
 * Validates that staging points strictly to web-1e643.
 */
export function verifyStagingTarget(): { isVerified: boolean; projectId: string; error?: string } {
  const currentProjectId: string = (stagingConfig as { projectId?: string }).projectId || '';
  if (currentProjectId === FORBIDDEN_PROD_PROJECT_ID) {
    return {
      isVerified: false,
      projectId: currentProjectId,
      error: 'CRITICAL SAFETY STOP: Attempted target matches PRODUCTION project ID! All operations halted.'
    };
  }
  if (!currentProjectId || currentProjectId !== REQUIRED_STAGING_PROJECT_ID) {
    return {
      isVerified: false,
      projectId: currentProjectId || 'UNKNOWN',
      error: `CRITICAL SAFETY STOP: Target project ID is '${currentProjectId}', but MUST be strictly '${REQUIRED_STAGING_PROJECT_ID}'.`
    };
  }
  return {
    isVerified: true,
    projectId: currentProjectId
  };
}

/**
 * Parses Firebase error safely
 */
function parseFirebaseError(err: unknown): { code: string; message: string } {
  if (typeof err === 'object' && err !== null) {
    const errorObj = err as { code?: string; message?: string };
    const code = errorObj.code || 'unknown-error';
    const message = errorObj.message || String(err);
    return { code, message };
  }
  return { code: 'unknown-error', message: String(err) };
}

/**
 * Reads the authenticated user's own profile doc (/users/{authUid}) to audit role/status/schoolId.
 * Pure Read-Only inspection.
 */
async function auditCurrentUserProfile(authUid: string): Promise<UserProfileAudit> {
  const docPath = `users/${authUid}`;
  try {
    const userDocRef = doc(stagingDb, 'users', authUid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        authUid,
        docPath,
        exists: true,
        role: data.role,
        status: data.status,
        schoolId: data.schoolId
      };
    } else {
      return {
        authUid,
        docPath,
        exists: false,
        error: `Document /users/${authUid} does NOT exist in staging Firestore.`
      };
    }
  } catch (err: unknown) {
    const { code, message } = parseFirebaseError(err);
    return {
      authUid,
      docPath,
      exists: false,
      error: `Cannot read own profile /users/${authUid}: [${code}] ${message}`
    };
  }
}

/**
 * Performs a PURE READ-ONLY test on a single student document.
 * NEVER writes, creates, updates, or deletes any Firestore data.
 */
async function testStudentRead(
  studentDocId: string,
  expectedAccess: 'ALLOWED' | 'DENIED',
  userAudit?: UserProfileAudit
): Promise<SingleReadTestResult> {
  const docPath = `students/${studentDocId}`;
  try {
    const docRef = doc(stagingDb, 'students', studentDocId);
    const snap = await getDoc(docRef);

    if (expectedAccess === 'ALLOWED') {
      if (snap.exists()) {
        const studentData = snap.data();
        return {
          docPath,
          expectedAccess: 'ALLOWED',
          actualOutcome: 'READ_SUCCESS',
          testStatus: 'PASS',
          details: `Document read authorized (${studentData?.name || 'record exists'}, schoolId: ${studentData?.schoolId}). Access correctly permitted.`
        };
      } else {
        return {
          docPath,
          expectedAccess: 'ALLOWED',
          actualOutcome: 'READ_SUCCESS',
          testStatus: 'PASS',
          details: `Document read permitted by rules (snap.exists() is false, but read operation was authorized).`
        };
      }
    } else {
      // Expected DENIED, but read succeeded
      return {
        docPath,
        expectedAccess: 'DENIED',
        actualOutcome: 'READ_SUCCESS',
        testStatus: 'FAIL',
        details: `SECURITY VIOLATION: Read succeeded on cross-school document ${docPath}, but was expected to be blocked by RBAC rules.`
      };
    }
  } catch (err: unknown) {
    const { code, message } = parseFirebaseError(err);
    const isPermissionDenied = code === 'permission-denied' || message.includes('permission-denied') || message.includes('PERMISSION_DENIED');

    if (expectedAccess === 'DENIED') {
      if (isPermissionDenied) {
        return {
          docPath,
          expectedAccess: 'DENIED',
          actualOutcome: 'DENIED',
          firebaseErrorCode: code,
          testStatus: 'PASS',
          details: `Access correctly blocked with [${code}]. RBAC tenant boundary enforced.`
        };
      } else {
        return {
          docPath,
          expectedAccess: 'DENIED',
          actualOutcome: 'ERROR',
          firebaseErrorCode: code,
          testStatus: 'FAIL',
          details: `Unexpected error during read: [${code}] ${message}`
        };
      }
    } else {
      // Expected ALLOWED, but got permission-denied / error
      let diagnosticHint = '';
      if (userAudit) {
        if (!userAudit.exists) {
          diagnosticHint = ` Root Cause: /${userAudit.docPath} does not exist in staging Firestore. Create /users/${userAudit.authUid} with role='school_admin', status='active', schoolId='SCH-B'.`;
        } else if (userAudit.status !== 'active') {
          diagnosticHint = ` Root Cause: User status in /${userAudit.docPath} is '${userAudit.status}' (must be 'active').`;
        } else if (userAudit.role !== 'school_admin' && userAudit.role !== 'super_admin') {
          diagnosticHint = ` Root Cause: User role in /${userAudit.docPath} is '${userAudit.role}' (must be 'school_admin').`;
        } else if (studentDocId.startsWith('STU-B') && userAudit.schoolId !== 'SCH-B') {
          diagnosticHint = ` Root Cause: User schoolId in /${userAudit.docPath} is '${userAudit.schoolId}' (must match 'SCH-B').`;
        }
      }

      return {
        docPath,
        expectedAccess: 'ALLOWED',
        actualOutcome: 'DENIED',
        firebaseErrorCode: code,
        testStatus: 'FAIL',
        details: `Read failed with [${code}]: ${message}.${diagnosticHint}`
      };
    }
  }
}

/**
 * Runs the READ-ONLY RBAC test suite for a specific account.
 */
export async function runAccountRbacTest(
  email: string,
  password?: string,
  role = 'school_admin'
): Promise<AccountRbacTestSummary> {
  let authStatus: 'LOGGED_IN' | 'AUTH_ERROR' | 'ANONYMOUS' = 'LOGGED_IN';
  let authErrorMessage: string | undefined;

  // Authenticate if password provided
  if (password) {
    try {
      await signInWithEmailAndPassword(stagingAuth, email.trim(), password);
      authStatus = 'LOGGED_IN';
    } catch (err: unknown) {
      const { code, message } = parseFirebaseError(err);
      authStatus = 'AUTH_ERROR';
      authErrorMessage = `[${code}] ${message}`;
      return {
        accountEmail: email,
        accountRole: role,
        authStatus: 'AUTH_ERROR',
        authErrorMessage: `Login failed for ${email} with [${code}]: ${message}`,
        tests: [],
        overallStatus: 'FAIL'
      };
    }
  } else {
    const current = stagingAuth.currentUser;
    if (!current || current.email?.toLowerCase() !== email.toLowerCase()) {
      authStatus = 'ANONYMOUS';
      authErrorMessage = `Not currently signed in as ${email}. Provide password to authenticate before testing.`;
      return {
        accountEmail: email,
        accountRole: role,
        authStatus: 'ANONYMOUS',
        authErrorMessage,
        tests: [],
        overallStatus: 'FAIL'
      };
    }
  }

  // Perform user profile audit if authenticated
  let userAudit: UserProfileAudit | undefined;
  if (stagingAuth.currentUser) {
    userAudit = await auditCurrentUserProfile(stagingAuth.currentUser.uid);
  }

  const tests: SingleReadTestResult[] = [];

  if (email.toLowerCase().includes('superadmin')) {
    // 1. Super Admin Account: Expected to read all 3 students
    tests.push(await testStudentRead('STU-A-101', 'ALLOWED', userAudit));
    tests.push(await testStudentRead('STU-A-102', 'ALLOWED', userAudit));
    tests.push(await testStudentRead('STU-B-101', 'ALLOWED', userAudit));
  } else if (email.toLowerCase().includes('admin.scha')) {
    // 2. School A Admin: Can read STU-A-101 & STU-A-102; CANNOT read STU-B-101
    tests.push(await testStudentRead('STU-A-101', 'ALLOWED', userAudit));
    tests.push(await testStudentRead('STU-A-102', 'ALLOWED', userAudit));
    tests.push(await testStudentRead('STU-B-101', 'DENIED', userAudit));
  } else if (email.toLowerCase().includes('admin.schb')) {
    // 3. School B Admin: Can read STU-B-101; CANNOT read STU-A-101 or STU-A-102
    tests.push(await testStudentRead('STU-B-101', 'ALLOWED', userAudit));
    tests.push(await testStudentRead('STU-A-101', 'DENIED', userAudit));
    tests.push(await testStudentRead('STU-A-102', 'DENIED', userAudit));
  } else {
    // Generic user test
    tests.push(await testStudentRead('STU-A-101', 'DENIED', userAudit));
    tests.push(await testStudentRead('STU-B-101', 'DENIED', userAudit));
  }

  const overallStatus = tests.every(t => t.testStatus === 'PASS') ? 'PASS' : 'FAIL';

  return {
    accountEmail: email,
    accountRole: role,
    authStatus,
    authErrorMessage,
    userProfileAudit: userAudit,
    tests,
    overallStatus
  };
}

/**
 * Runs the full 3-account READ-ONLY Staging RBAC Test Suite.
 */
export async function runFullStagingRbacSuite(passwords: {
  superadminPassword?: string;
  adminSchaPassword?: string;
  adminSchbPassword?: string;
}): Promise<FullRbacSuiteSummary> {
  const targetCheck = verifyStagingTarget();
  if (!targetCheck.isVerified) {
    return {
      verifiedProjectId: targetCheck.projectId,
      isTargetVerified: false,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      accountSummaries: [],
      errorMessage: targetCheck.error
    };
  }

  const accountSummaries: AccountRbacTestSummary[] = [];

  // Account 1: superadmin@staging.internal
  const superadminRes = await runAccountRbacTest(
    'superadmin@staging.internal',
    passwords.superadminPassword,
    'super_admin'
  );
  accountSummaries.push(superadminRes);

  // Account 2: admin.scha@staging.internal
  const schaRes = await runAccountRbacTest(
    'admin.scha@staging.internal',
    passwords.adminSchaPassword,
    'school_admin (SCH-A)'
  );
  accountSummaries.push(schaRes);

  // Account 3: admin.schb@staging.internal
  const schbRes = await runAccountRbacTest(
    'admin.schb@staging.internal',
    passwords.adminSchbPassword,
    'school_admin (SCH-B)'
  );
  accountSummaries.push(schbRes);

  const allTests = accountSummaries.flatMap(a => a.tests);
  const totalTests = allTests.length;
  const passedTests = allTests.filter(t => t.testStatus === 'PASS').length;
  const failedTests = allTests.filter(t => t.testStatus === 'FAIL').length;

  return {
    verifiedProjectId: REQUIRED_STAGING_PROJECT_ID,
    isTargetVerified: true,
    totalTests,
    passedTests,
    failedTests,
    accountSummaries
  };
}
