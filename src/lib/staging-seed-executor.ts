import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { stagingDb, stagingAuth } from './firebase-staging';
import stagingConfig from '../../firebase-staging-config.json';
import { 
  STAGING_SEED_SCHOOLS, 
  STAGING_SEED_TEACHERS, 
  STAGING_SEED_STUDENTS, 
  STAGING_SEED_PUBLIC_VERIFICATIONS 
} from './staging-seed-data';

export const REQUIRED_STAGING_PROJECT_ID = 'web-1e643';
export const FORBIDDEN_PROD_PROJECT_ID = 'gen-lang-client-0627643856';

export interface DocumentSeedResult {
  collection: 'schools' | 'teachers' | 'students' | 'public_verifications';
  docId: string;
  action: 'CREATED' | 'EXISTS_SKIPPED' | 'FAILED';
  errorCode?: string;
  details: string;
}

export interface StagingSeedSummary {
  verifiedProjectId: string;
  isTargetVerified: boolean;
  totalPlanned: number;
  createdCount: number;
  skippedCount: number;
  failedCount: number;
  authContext: string;
  results: DocumentSeedResult[];
  errorMessage?: string;
}

/**
 * Validates that the staging configuration points strictly to 'web-1e643'.
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
 * Extract exact Firebase error code and message
 */
function parseFirebaseError(err: unknown): { code: string; message: string } {
  if (typeof err === 'object' && err !== null) {
    const errorObj = err as { code?: string; message?: string; name?: string };
    const code = errorObj.code || 'UNKNOWN_ERROR';
    const message = errorObj.message || String(err);
    return { code, message };
  }
  return { code: 'UNKNOWN_ERROR', message: String(err) };
}

/**
 * Idempotently seeds demo documents to Staging Firestore ('web-1e643') in strict sequential order:
 * 1. schools/SCH-A
 * 2. schools/SCH-B
 * 3. teachers/TCH-A-01 (Verifies SCH-A exists before write)
 * 4. teachers/TCH-B-01 (Verifies SCH-B exists before write)
 * 5. students/STU-A-101 (Verifies SCH-A exists before write)
 * 6. students/STU-A-102 (Verifies SCH-A exists before write)
 * 7. students/STU-B-101 (Verifies SCH-B exists before write)
 * 8. public_verifications/v_stg_token_a1_demo
 */
export async function executeStagingSeed(options?: {
  adminEmail?: string;
  adminPassword?: string;
}): Promise<StagingSeedSummary> {
  const targetCheck = verifyStagingTarget();
  
  if (!targetCheck.isVerified) {
    return {
      verifiedProjectId: targetCheck.projectId,
      isTargetVerified: false,
      totalPlanned: 8,
      createdCount: 0,
      skippedCount: 0,
      failedCount: 8,
      authContext: 'Unverified Target',
      results: [],
      errorMessage: targetCheck.error
    };
  }

  // 1. Authenticate staging session if credentials supplied
  let currentAuthUser = stagingAuth.currentUser;
  let authContextDesc = currentAuthUser ? `Authenticated (${currentAuthUser.email})` : 'Unauthenticated (Anonymous)';

  if (options?.adminEmail && options?.adminPassword) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        stagingAuth, 
        options.adminEmail.trim(), 
        options.adminPassword
      );
      currentAuthUser = userCredential.user;
      authContextDesc = `Authenticated via UI (${currentAuthUser.email})`;
    } catch (authErr: unknown) {
      const { code, message } = parseFirebaseError(authErr);
      return {
        verifiedProjectId: REQUIRED_STAGING_PROJECT_ID,
        isTargetVerified: true,
        totalPlanned: 8,
        createdCount: 0,
        skippedCount: 0,
        failedCount: 8,
        authContext: `Auth Login Failed (${code})`,
        results: [],
        errorMessage: `Staging Admin Authentication Failed (${code}): ${message}. Ensure superadmin user exists in staging project web-1e643.`
      };
    }
  }

  const results: DocumentSeedResult[] = [];
  const successfulSchools = new Set<string>();

  // Helper to process a single doc idempotently
  async function processDoc<T extends Record<string, any>>(
    colName: 'schools' | 'teachers' | 'students' | 'public_verifications',
    docId: string,
    data: T,
    requiredSchoolId?: string
  ): Promise<boolean> {
    // Check school dependency if specified
    if (requiredSchoolId) {
      try {
        const schoolDocRef = doc(stagingDb, 'schools', requiredSchoolId);
        const schoolSnap = await getDoc(schoolDocRef);
        if (!schoolSnap.exists()) {
          results.push({
            collection: colName,
            docId,
            action: 'FAILED',
            errorCode: 'missing-dependency',
            details: `Cannot write ${colName}/${docId}: Required parent school schools/${requiredSchoolId} does not exist in staging Firestore.`
          });
          return false;
        }
      } catch (depErr: unknown) {
        const { code, message } = parseFirebaseError(depErr);
        // If read gets blocked, record failure
        if (code === 'permission-denied' && !successfulSchools.has(requiredSchoolId)) {
          results.push({
            collection: colName,
            docId,
            action: 'FAILED',
            errorCode: 'permission-denied',
            details: `Dependency check failed on schools/${requiredSchoolId}: [${code}] ${message}`
          });
          return false;
        }
      }
    }

    try {
      const docRef = doc(stagingDb, colName, docId);
      
      // Step A: Check existence idempotently
      let exists = false;
      try {
        const snap = await getDoc(docRef);
        exists = snap.exists();
      } catch (readErr: unknown) {
        // If read gets permission-denied, document might not exist or rules block read
        const { code, message } = parseFirebaseError(readErr);
        if (code === 'permission-denied' || message.includes('permission-denied')) {
          exists = false;
        } else {
          throw readErr;
        }
      }

      if (exists) {
        results.push({
          collection: colName,
          docId,
          action: 'EXISTS_SKIPPED',
          details: 'Document already exists in staging Firestore. Overwrite skipped to preserve idempotency.'
        });
        if (colName === 'schools') {
          successfulSchools.add(docId);
        }
        return true;
      } else {
        await setDoc(docRef, data);
        results.push({
          collection: colName,
          docId,
          action: 'CREATED',
          details: 'Document successfully created in staging Firestore.'
        });
        if (colName === 'schools') {
          successfulSchools.add(docId);
        }
        return true;
      }
    } catch (err: unknown) {
      const { code, message } = parseFirebaseError(err);
      results.push({
        collection: colName,
        docId,
        action: 'FAILED',
        errorCode: code,
        details: `[${code}] ${message}`
      });
      return false;
    }
  }

  // STRICT SEQUENTIAL EXECUTION ORDER:
  // Step 1: schools/SCH-A
  if (STAGING_SEED_SCHOOLS['SCH-A']) {
    await processDoc('schools', 'SCH-A', STAGING_SEED_SCHOOLS['SCH-A']);
  }

  // Step 2: schools/SCH-B
  if (STAGING_SEED_SCHOOLS['SCH-B']) {
    await processDoc('schools', 'SCH-B', STAGING_SEED_SCHOOLS['SCH-B']);
  }

  // Step 3: teachers/TCH-A-01 (Requires SCH-A)
  if (STAGING_SEED_TEACHERS['TCH-A-01']) {
    await processDoc('teachers', 'TCH-A-01', STAGING_SEED_TEACHERS['TCH-A-01'], 'SCH-A');
  }

  // Step 4: teachers/TCH-B-01 (Requires SCH-B)
  if (STAGING_SEED_TEACHERS['TCH-B-01']) {
    await processDoc('teachers', 'TCH-B-01', STAGING_SEED_TEACHERS['TCH-B-01'], 'SCH-B');
  }

  // Step 5: students/STU-A-101 (Requires SCH-A)
  if (STAGING_SEED_STUDENTS['STU-A-101']) {
    await processDoc('students', 'STU-A-101', STAGING_SEED_STUDENTS['STU-A-101'], 'SCH-A');
  }

  // Step 6: students/STU-A-102 (Requires SCH-A)
  if (STAGING_SEED_STUDENTS['STU-A-102']) {
    await processDoc('students', 'STU-A-102', STAGING_SEED_STUDENTS['STU-A-102'], 'SCH-A');
  }

  // Step 7: students/STU-B-101 (Requires SCH-B)
  if (STAGING_SEED_STUDENTS['STU-B-101']) {
    await processDoc('students', 'STU-B-101', STAGING_SEED_STUDENTS['STU-B-101'], 'SCH-B');
  }

  // Step 8: public_verifications/v_stg_token_a1_demo
  if (STAGING_SEED_PUBLIC_VERIFICATIONS['v_stg_token_a1_demo']) {
    await processDoc('public_verifications', 'v_stg_token_a1_demo', STAGING_SEED_PUBLIC_VERIFICATIONS['v_stg_token_a1_demo']);
  }

  const createdCount = results.filter(r => r.action === 'CREATED').length;
  const skippedCount = results.filter(r => r.action === 'EXISTS_SKIPPED').length;
  const failedCount = results.filter(r => r.action === 'FAILED').length;

  let topErrorMessage: string | undefined = undefined;
  if (failedCount > 0) {
    const permDenied = results.filter(r => r.errorCode === 'permission-denied' || r.details.includes('permission-denied'));
    if (permDenied.length > 0) {
      topErrorMessage = `Firestore Security Rules rejected write operations with [permission-denied]. Staging Firestore rules require an authenticated super_admin or school_admin user to write schools, teachers, and students. Current auth context: ${authContextDesc}.`;
    }
  }

  return {
    verifiedProjectId: REQUIRED_STAGING_PROJECT_ID,
    isTargetVerified: true,
    totalPlanned: results.length,
    createdCount,
    skippedCount,
    failedCount,
    authContext: authContextDesc,
    results,
    errorMessage: topErrorMessage
  };
}
