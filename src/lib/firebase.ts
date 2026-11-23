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
  deleteDoc,
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
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type FirebaseStorage,
  type StorageReference,
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import type { Package, PackageCourse, UserProfile } from '../types/savvvn';

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

  const bucketUrl = firebaseConfig.storageBucket
    ? `gs://${firebaseConfig.storageBucket}`
    : undefined;
  const firebaseStorage = bucketUrl
    ? getStorage(firebaseApp, bucketUrl)
    : getStorage(firebaseApp);
  firebaseStorage.maxUploadRetryTime = 15000;
  firebaseStorage.maxOperationRetryTime = 15000;

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
export const STORAGE_BUCKET = firebaseConfig.storageBucket || '';
export const app = singletons.app;
export const db = singletons.db;
export const auth = singletons.auth;
export const storage = singletons.storage;
export const googleProvider = singletons.googleProvider;

function normalizeImageMime(mimeType: string): 'image/jpeg' | 'image/png' | 'image/webp' {
  const lower = (mimeType || '').toLowerCase().trim();
  if (lower === 'image/png') return 'image/png';
  if (lower === 'image/webp') return 'image/webp';
  if (lower === 'image/jpeg' || lower === 'image/jpg') return 'image/jpeg';
  throw new Error('Unsupported image format. Please use JPG, PNG, or WebP.');
}

async function assertStorageBucketReady(): Promise<void> {
  if (!STORAGE_BUCKET) {
    throw new Error(
      'Firebase Storage bucket is missing in firebase-applet-config.json. Please configure storageBucket.'
    );
  }
  try {
    const res = await fetch(
      `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(STORAGE_BUCKET)}/o?maxResults=1`,
      { method: 'GET' }
    );
    if (res.status === 404) {
      throw new Error(
        `Firebase Storage bucket "${STORAGE_BUCKET}" has not been created/enabled in Firebase Console yet (HTTP 404). Open Firebase Console → Storage → Get started to enable Storage for project "${firebaseConfig.projectId}", then deploy storage.rules.`
      );
    }
  } catch (err: any) {
    if (err?.message && err.message.includes('HTTP 404')) {
      throw err;
    }
    // Network errors or CORS transient issues fall through to SDK resumable upload for detailed handling
  }
}

function formatStorageError(err: any, unauthorizedMessage: string): Error {
  const code = String(err?.code || '');
  if (code === 'storage/unauthorized' || code === 'storage/unauthenticated') {
    return new Error(unauthorizedMessage);
  }
  if (code === 'storage/bucket-not-found' || code === 'storage/project-not-found') {
    return new Error(
      `Firebase Storage bucket "${STORAGE_BUCKET}" was not found. Enable Firebase Storage in Firebase Console for "${firebaseConfig.projectId}".`
    );
  }
  if (code === 'storage/retry-limit-exceeded') {
    return new Error(
      `Firebase Storage upload timed out (storage/retry-limit-exceeded). Ensure Firebase Storage is enabled for "${STORAGE_BUCKET}" in Firebase Console, storage.rules are deployed, and your internet connection is active.`
    );
  }
  if (code === 'storage/canceled') {
    return new Error('Image upload was canceled.');
  }
  if (code === 'storage/quota-exceeded') {
    return new Error('Firebase Storage quota exceeded for this project.');
  }
  return new Error(err?.message || 'Failed to upload image to Firebase Storage.');
}

async function uploadImageResumable(
  objectRef: StorageReference,
  blob: Blob,
  mimeType: string,
  unauthorizedMessage: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const normalizedMime = normalizeImageMime(mimeType);
  if (blob.size <= 0) {
    throw new Error('Selected image file is empty.');
  }
  if (blob.size >= 5 * 1024 * 1024) {
    throw new Error('Image must be smaller than 5 MB to upload.');
  }

  await assertStorageBucketReady();

  onProgress?.(5);
  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(objectRef, blob, {
      contentType: normalizedMime,
      cacheControl: 'public,max-age=31536000',
    });

    task.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          const pct = Math.min(
            99,
            Math.max(5, Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100))
          );
          onProgress?.(pct);
        }
      },
      (err) => {
        reject(formatStorageError(err, unauthorizedMessage));
      },
      () => {
        onProgress?.(100);
        resolve();
      }
    );
  });

  try {
    return await getDownloadURL(objectRef);
  } catch (err: any) {
    throw formatStorageError(err, unauthorizedMessage);
  }
}

export async function uploadProfilePicture(
  uid: string,
  blob: Blob,
  mimeType: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    throw new Error('Please sign in with Google before updating your profile picture.');
  }
  const normalizedMime = normalizeImageMime(mimeType);
  const safeUid = uid.replace(/[^a-zA-Z0-9_-]/g, '') || 'user';
  const ext =
    normalizedMime === 'image/png' ? 'png' : normalizedMime === 'image/webp' ? 'webp' : 'jpg';
  const objectRef = ref(storage, `profile-pictures/${safeUid}/avatar-${Date.now()}.${ext}`);

  return await uploadImageResumable(
    objectRef,
    blob,
    normalizedMime,
    'Firebase Storage denied profile picture upload. Ensure you are signed in and storage.rules allows writes to profile-pictures/{uid}/.',
    onProgress
  );
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

export async function loadOrSyncUserProfileWithFirestore(
  profile: UserProfile
): Promise<{ profile: UserProfile; syncedFromFirestore: boolean }> {
  if (!auth.currentUser || auth.currentUser.uid !== profile.uid) {
    return { profile, syncedFromFirestore: false };
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
        photoRemoved: Boolean(profile.photoRemoved),
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
      return { profile, syncedFromFirestore: false };
    }

    const fsData = snap.data() as Partial<UserProfile>;
    const fsPhotoRemoved = Boolean(fsData.photoRemoved);
    const fsPhotoUrl = typeof fsData.photoURL === 'string' ? fsData.photoURL.trim() : '';
    const merged: UserProfile = {
      ...profile,
      displayName:
        typeof fsData.displayName === 'string' && fsData.displayName.trim()
          ? fsData.displayName.trim()
          : profile.displayName,
      phone: typeof fsData.phone === 'string' ? fsData.phone : profile.phone,
      upiId: typeof fsData.upiId === 'string' ? fsData.upiId : profile.upiId,
      photoURL: fsPhotoRemoved ? '' : fsPhotoUrl || profile.photoURL || '',
      photoRemoved: fsPhotoRemoved,
    };

    const syncedFromFirestore =
      merged.photoURL !== (profile.photoURL || '') ||
      Boolean(merged.photoRemoved) !== Boolean(profile.photoRemoved) ||
      merged.displayName !== profile.displayName ||
      (merged.phone || '') !== (profile.phone || '') ||
      (merged.upiId || '') !== (profile.upiId || '');

    return { profile: merged, syncedFromFirestore };
  } catch (err) {
    console.warn('Firestore profile sync skipped:', err instanceof Error ? err.message : err);
    return { profile, syncedFromFirestore: false };
  }
}

export async function saveUserProfileToFirestore(profile: UserProfile): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== profile.uid) {
    throw new Error('Please sign in with Google before saving your profile.');
  }
  const userPath = `users/${profile.uid}`;
  const userRef = doc(db, 'users', profile.uid);
  const now = profile.updatedAt || new Date().toISOString();
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName,
        photoURL: profile.photoURL ?? '',
        photoRemoved: Boolean(profile.photoRemoved),
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
        photoRemoved: Boolean(profile.photoRemoved),
        updatedAt: now,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('insufficient')) {
      handleFirestoreError(err, OperationType.WRITE, userPath);
    }
    throw new Error(`Could not save profile to Firestore: ${message}`);
  }
}

export async function uploadPackageCover(
  packageKey: string,
  blob: Blob,
  mimeType: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!auth.currentUser) {
    throw new Error('Please sign in as an administrator before uploading package covers.');
  }
  const email = (auth.currentUser.email || '').trim().toLowerCase();
  if (email !== AUTHORIZED_ADMIN_EMAIL) {
    throw new Error(
      `Only the authorized administrator (${AUTHORIZED_ADMIN_EMAIL}) can upload package covers.`
    );
  }
  const normalizedMime = normalizeImageMime(mimeType);
  const safeKey = packageKey.replace(/[^a-zA-Z0-9_-]/g, '') || 'pkg';
  const ext =
    normalizedMime === 'image/png' ? 'png' : normalizedMime === 'image/webp' ? 'webp' : 'jpg';
  const objectRef = ref(storage, `package-covers/${safeKey}-${Date.now()}.${ext}`);

  return await uploadImageResumable(
    objectRef,
    blob,
    normalizedMime,
    'Firebase Storage denied package cover upload. Ensure storage.rules are deployed and allow writes by sawn6849@gmail.com on package-covers/.',
    onProgress
  );
}

export async function deletePackageCoverByUrl(url: string): Promise<void> {
  if (!url || !url.includes('firebasestorage.googleapis.com') || !url.includes('package-covers')) {
    return;
  }
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch {
    // Non-fatal if already removed or external URL
  }
}

export async function syncPackageToFirestore(
  pkg: Package,
  packageCourses?: PackageCourse[]
): Promise<void> {
  if (!auth.currentUser) return;
  const email = (auth.currentUser.email || '').trim().toLowerCase();
  if (email !== AUTHORIZED_ADMIN_EMAIL) return;

  try {
    const pkgRef = doc(db, 'packages', pkg.id);
    await setDoc(
      pkgRef,
      {
        id: pkg.id,
        slug: pkg.slug,
        name: pkg.name,
        subtitle: pkg.subtitle || '',
        description: pkg.description || '',
        price: pkg.price,
        ...(pkg.originalPrice ? { originalPrice: pkg.originalPrice } : {}),
        commissionRate: pkg.commissionRate,
        benefits: pkg.benefits || [],
        coverImageUrl: pkg.coverImageUrl || '',
        accentColor: pkg.accentColor || '#0D9488',
        featured: Boolean(pkg.featured),
        active: pkg.active !== false,
        sortOrder: pkg.sortOrder || 1,
        createdAt: pkg.createdAt || new Date().toISOString(),
        updatedAt: pkg.updatedAt || new Date().toISOString(),
      },
      { merge: true }
    );

    if (Array.isArray(packageCourses)) {
      await Promise.all(
        packageCourses
          .filter((pc) => pc.packageId === pkg.id)
          .map((pc) =>
            setDoc(doc(db, 'packageCourses', pc.id), {
              id: pc.id,
              packageId: pc.packageId,
              courseId: pc.courseId,
              sortOrder: pc.sortOrder,
            })
          )
      );
    }
  } catch (err) {
    console.warn('Firestore package sync skipped:', err instanceof Error ? err.message : err);
  }
}

export async function deletePackageFromFirestore(packageId: string): Promise<void> {
  if (!auth.currentUser) return;
  const email = (auth.currentUser.email || '').trim().toLowerCase();
  if (email !== AUTHORIZED_ADMIN_EMAIL) return;

  try {
    await deleteDoc(doc(db, 'packages', packageId));
  } catch (err) {
    console.warn('Firestore package delete skipped:', err instanceof Error ? err.message : err);
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
