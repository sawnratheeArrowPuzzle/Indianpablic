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

  const rawConfiguredBucket =
    (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket || '')
      .trim()
      .replace(/^gs:\/\//i, '')
      .replace(/\/+$/, '');
  const bucketUrl = rawConfiguredBucket ? `gs://${rawConfiguredBucket}` : undefined;
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
export const STORAGE_BUCKET = (
  import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
  firebaseConfig.storageBucket ||
  ''
)
  .trim()
  .replace(/^gs:\/\//i, '')
  .replace(/\/+$/, '');
export const app = singletons.app;
export const db = singletons.db;
export const auth = singletons.auth;
export const storage = singletons.storage;
export const googleProvider = singletons.googleProvider;

let verifiedStorageBucket: string | null = null;

function getCandidateStorageBuckets(): string[] {
  const candidates = [
    STORAGE_BUCKET,
    `${firebaseConfig.projectId}.firebasestorage.app`,
    `${firebaseConfig.projectId}.appspot.com`,
  ]
    .map((b) => (b || '').trim())
    .filter(Boolean);
  return Array.from(new Set(candidates));
}

function getStorageForBucket(bucketName: string): FirebaseStorage {
  if (!bucketName || bucketName === STORAGE_BUCKET) {
    return storage;
  }
  const customStorage = getStorage(app, `gs://${bucketName}`);
  customStorage.maxUploadRetryTime = 15000;
  customStorage.maxOperationRetryTime = 15000;
  return customStorage;
}

function extractBucketFromDownloadUrl(url: string): string | null {
  const match = url.match(/firebasestorage\.googleapis\.com\/v0\/b\/([^/]+)\/o\//i);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function normalizeImageMime(mimeType: string): 'image/jpeg' | 'image/png' | 'image/webp' {
  const lower = (mimeType || '').toLowerCase().trim();
  if (lower === 'image/png') return 'image/png';
  if (lower === 'image/webp') return 'image/webp';
  if (lower === 'image/jpeg' || lower === 'image/jpg') return 'image/jpeg';
  throw new Error('Unsupported image format. Please use JPG, PNG, or WebP.');
}

async function probeBucketExists(bucket: string): Promise<'ready' | 'missing' | 'unknown'> {
  try {
    const res = await fetch(
      `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?maxResults=1`,
      { method: 'GET' }
    );
    if (res.status === 404) {
      return 'missing';
    }
    // HTTP 200 or 403 proves the Storage bucket exists and is linked to Firebase Storage
    return 'ready';
  } catch {
    return 'unknown';
  }
}

async function resolveActiveStorage(): Promise<{ storage: FirebaseStorage; bucket: string }> {
  if (verifiedStorageBucket) {
    return {
      storage: getStorageForBucket(verifiedStorageBucket),
      bucket: verifiedStorageBucket,
    };
  }

  const candidates = getCandidateStorageBuckets();
  if (candidates.length === 0) {
    throw new Error(
      `Firebase Storage bucket is not configured for project "${firebaseConfig.projectId}".`
    );
  }

  let sawMissing = false;
  for (const candidate of candidates) {
    const status = await probeBucketExists(candidate);
    if (status === 'ready') {
      verifiedStorageBucket = candidate;
      return {
        storage: getStorageForBucket(candidate),
        bucket: candidate,
      };
    }
    if (status === 'missing') {
      sawMissing = true;
    }
  }

  if (sawMissing) {
    throw new Error(
      `Firebase Storage has not been enabled yet for project "${firebaseConfig.projectId}" (checked ${candidates.join(
        ' & '
      )} — HTTP 404). Open Firebase Console → Project "${firebaseConfig.projectId}" → Storage → Get started to create the bucket, then publish storage.rules.`
    );
  }

  return { storage, bucket: candidates[0] };
}

function formatStorageError(err: any, unauthorizedMessage: string, bucketName: string): Error {
  const code = String(err?.code || '');
  if (code === 'storage/unauthorized' || code === 'storage/unauthenticated') {
    return new Error(unauthorizedMessage);
  }
  if (code === 'storage/bucket-not-found' || code === 'storage/project-not-found') {
    verifiedStorageBucket = null;
    return new Error(
      `Firebase Storage bucket "${bucketName}" was not found. Enable Firebase Storage in Firebase Console for "${firebaseConfig.projectId}".`
    );
  }
  if (code === 'storage/retry-limit-exceeded') {
    verifiedStorageBucket = null;
    return new Error(
      `Firebase Storage upload timed out (storage/retry-limit-exceeded) for bucket "${bucketName}". Ensure Storage is enabled in Firebase Console for "${firebaseConfig.projectId}", storage.rules are published, and your connection is active.`
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
  objectPath: string,
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

  const { storage: activeStorage, bucket } = await resolveActiveStorage();
  const objectRef: StorageReference = ref(activeStorage, objectPath);

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
        reject(formatStorageError(err, unauthorizedMessage, bucket));
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
    throw formatStorageError(err, unauthorizedMessage, bucket);
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
  const objectPath = `profile-pictures/${safeUid}/avatar-${Date.now()}.${ext}`;

  return await uploadImageResumable(
    objectPath,
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
    const urlBucket = extractBucketFromDownloadUrl(url);
    const activeStorage = urlBucket ? getStorageForBucket(urlBucket) : storage;
    const fileRef = ref(activeStorage, url);
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
  const objectPath = `package-covers/${safeKey}-${Date.now()}.${ext}`;

  return await uploadImageResumable(
    objectPath,
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
    const urlBucket = extractBucketFromDownloadUrl(url);
    const activeStorage = urlBucket ? getStorageForBucket(urlBucket) : storage;
    const fileRef = ref(activeStorage, url);
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
