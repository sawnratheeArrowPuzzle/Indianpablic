import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  type Auth,
} from 'firebase/auth';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  type FirebaseStorage,
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirebaseSingletons {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  googleProvider: GoogleAuthProvider;
}

const GLOBAL_KEY = '__SAVVVNLAB_FIREBASE_SINGLETONS__';

function createFirebaseSingletons(): FirebaseSingletons {
  const g = globalThis as Record<string, unknown>;
  const existing = g[GLOBAL_KEY] as FirebaseSingletons | undefined;
  if (existing) {
    return existing;
  }

  const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';

  let firestoreDb: Firestore;
  try {
    firestoreDb = initializeFirestore(
      firebaseApp,
      {
        localCache: memoryLocalCache(),
        experimentalAutoDetectLongPolling: true,
      },
      databaseId
    );
  } catch {
    firestoreDb = getFirestore(firebaseApp, databaseId);
  }

  // Avoid IndexedDBLocalPersistence because Firebase Auth closes IndexedDB on
  // pagehide/visibilitychange (e.g. iframe focus or Google OAuth popups), throwing
  // "Database is closing/hidden". Web Storage + Memory persistence stays open and fast.
  let firebaseAuth: Auth;
  try {
    firebaseAuth = initializeAuth(firebaseApp, {
      persistence: [
        browserLocalPersistence,
        browserSessionPersistence,
        inMemoryPersistence,
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    firebaseAuth = getAuth(firebaseApp);
  }

  const firebaseStorage = getStorage(firebaseApp);
  firebaseStorage.maxUploadRetryTime = 8000;
  firebaseStorage.maxOperationRetryTime = 8000;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const singletons: FirebaseSingletons = {
    app: firebaseApp,
    db: firestoreDb,
    auth: firebaseAuth,
    storage: firebaseStorage,
    googleProvider: provider,
  };

  g[GLOBAL_KEY] = singletons;
  return singletons;
}

const singletons = createFirebaseSingletons();

export const AUTHORIZED_ADMIN_EMAIL = 'sawn6849@gmail.com';
export const app = singletons.app;
export const db = singletons.db;
export const auth = singletons.auth;
export const storage = singletons.storage;
export const googleProvider = singletons.googleProvider;

export async function uploadProfilePicture(
  uid: string,
  blob: Blob,
  mimeType: string
): Promise<string> {
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    throw new Error('Please sign in with Google before updating your profile picture.');
  }
  const safeUid = uid.replace(/[^a-zA-Z0-9_-]/g, '') || 'user';
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const objectRef = ref(storage, `profile-pictures/${safeUid}/avatar-${Date.now()}.${ext}`);

  await uploadBytes(objectRef, blob, {
    contentType: mimeType,
    cacheControl: 'public,max-age=31536000',
  });
  return await getDownloadURL(objectRef);
}

export async function deleteProfilePictureByUrl(url: string): Promise<void> {
  if (!url || !url.includes('firebasestorage.googleapis.com') || !url.includes('profile-pictures')) {
    return;
  }
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch {
    // Non-fatal if already removed or external URL
  }
}

export async function syncUserProfileToFirestore(profile: {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: string;
  status: string;
  referralCode: string;
  referredByUid?: string | null;
  referredByCode?: string | null;
  upiId?: string;
  unlockedPackageIds: string[];
  createdAt: string;
  updatedAt: string;
}): Promise<boolean> {
  if (!auth.currentUser || auth.currentUser.uid !== profile.uid) {
    return false;
  }
  const userRef = doc(db, 'users', profile.uid);
  try {
    const snap = await getDoc(userRef);
    const now = profile.updatedAt || new Date().toISOString();
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName,
        photoURL: profile.photoURL ?? '',
        phone: profile.phone ?? '',
        role: profile.role,
        status: profile.status,
        referralCode: profile.referralCode,
        referredByUid: profile.referredByUid ?? '',
        referredByCode: profile.referredByCode ?? '',
        upiId: profile.upiId ?? '',
        unlockedPackageIds: profile.unlockedPackageIds ?? [],
        createdAt: profile.createdAt || now,
        updatedAt: now,
      });
    } else {
      await updateDoc(userRef, {
        displayName: profile.displayName,
        phone: profile.phone ?? '',
        upiId: profile.upiId ?? '',
        photoURL: profile.photoURL ?? '',
        updatedAt: now,
      });
    }
    return true;
  } catch (err) {
    console.warn('Firestore profile sync skipped:', err instanceof Error ? err.message : err);
    return false;
  }
}

export async function uploadPackageCover(
  packageKey: string,
  blob: Blob,
  mimeType: string
): Promise<string> {
  if (!auth.currentUser) {
    throw new Error('Please sign in as an administrator before uploading package covers.');
  }
  const safeKey = packageKey.replace(/[^a-zA-Z0-9_-]/g, '') || 'pkg';
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const objectRef = ref(storage, `package-covers/${safeKey}-${Date.now()}.${ext}`);

  try {
    await uploadBytes(objectRef, blob, {
      contentType: mimeType,
      cacheControl: 'public,max-age=31536000',
    });
    return await getDownloadURL(objectRef);
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'storage/unauthorized') {
      throw new Error(
        'Firebase Storage denied the upload. Ensure Firebase Storage is enabled and storage.rules allows admin writes on package-covers/.'
      );
    }
    throw new Error(err?.message || 'Failed to upload package cover to Firebase Storage.');
  }
}

export async function deletePackageCoverByUrl(url: string): Promise<void> {
  if (!url || !url.includes('firebasestorage.googleapis.com')) return;
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch {
    // Non-fatal if already removed or external URL
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    return true;
  }
}
