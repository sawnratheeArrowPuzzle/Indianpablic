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
import firebaseConfig from '../../firebase-applet-config.json';
import { deleteCloudinaryImageByUrl, uploadImageToCloudinary } from './cloudinary';
import type { Package, PackageCourse, UserProfile } from '../types/savvvn';

interface FirebaseSingletons {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
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

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const singletons: FirebaseSingletons = {
    app: firebaseApp,
    db: firestoreDb,
    auth: firebaseAuth,
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
export const googleProvider = singletons.googleProvider;

export async function uploadProfilePicture(
  uid: string,
  blob: Blob,
  mimeType: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    throw new Error('Please sign in with Google before updating your profile picture.');
  }
  const idToken = await auth.currentUser.getIdToken();
  return await uploadImageToCloudinary({
    blob,
    mimeType,
    signatureEndpoint: '/api/uploads/profile-signature',
    idToken,
    onProgress,
  });
}

export async function deleteProfilePictureByUrl(url: string): Promise<void> {
  if (!auth.currentUser || !url) return;
  const idToken = await auth.currentUser.getIdToken().catch(() => '');
  if (!idToken) return;
  await deleteCloudinaryImageByUrl(url, idToken);
}

const firestoreProfileCache = new Map<string, UserProfile>();
const inFlightProfileSyncs = new Map<
  string,
  Promise<{ profile: UserProfile; syncedFromFirestore: boolean }>
>();

export function applyCachedFirestoreProfile(profile: UserProfile): UserProfile {
  const cached = firestoreProfileCache.get(profile.uid);
  if (!cached) return profile;
  const cachedRemoved = Boolean(cached.photoRemoved);
  const cachedPhoto = typeof cached.photoURL === 'string' ? cached.photoURL.trim() : '';
  return {
    ...profile,
    displayName: cached.displayName || profile.displayName,
    phone: cached.phone ?? profile.phone,
    upiId: cached.upiId ?? profile.upiId,
    photoURL: cachedRemoved ? '' : cachedPhoto || profile.photoURL || '',
    photoRemoved: cachedRemoved,
  };
}

export function hasSyncedFirestoreProfile(uid: string): boolean {
  return firestoreProfileCache.has(uid);
}

export function clearFirestoreProfileCache(uid?: string): void {
  if (uid) {
    firestoreProfileCache.delete(uid);
    inFlightProfileSyncs.delete(uid);
  } else {
    firestoreProfileCache.clear();
    inFlightProfileSyncs.clear();
  }
}

export async function loadOrSyncUserProfileWithFirestore(
  profile: UserProfile
): Promise<{ profile: UserProfile; syncedFromFirestore: boolean }> {
  if (!auth.currentUser || auth.currentUser.uid !== profile.uid) {
    return { profile, syncedFromFirestore: false };
  }

  if (firestoreProfileCache.has(profile.uid)) {
    const merged = applyCachedFirestoreProfile(profile);
    const syncedFromFirestore =
      merged.photoURL !== (profile.photoURL || '') ||
      Boolean(merged.photoRemoved) !== Boolean(profile.photoRemoved) ||
      merged.displayName !== profile.displayName ||
      (merged.phone || '') !== (profile.phone || '') ||
      (merged.upiId || '') !== (profile.upiId || '');
    return { profile: merged, syncedFromFirestore };
  }

  const existingFlight = inFlightProfileSyncs.get(profile.uid);
  if (existingFlight) {
    return existingFlight;
  }

  const syncPromise = (async () => {
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
        firestoreProfileCache.set(profile.uid, profile);
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

      firestoreProfileCache.set(profile.uid, merged);

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
    } finally {
      inFlightProfileSyncs.delete(profile.uid);
    }
  })();

  inFlightProfileSyncs.set(profile.uid, syncPromise);
  return syncPromise;
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
    firestoreProfileCache.set(profile.uid, profile);
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
  const idToken = await auth.currentUser.getIdToken();
  return await uploadImageToCloudinary({
    blob,
    mimeType,
    signatureEndpoint: '/api/admin/uploads/cover-signature',
    idToken,
    body: { packageKey },
    onProgress,
  });
}

export async function deletePackageCoverByUrl(url: string): Promise<void> {
  if (!auth.currentUser || !url) return;
  const idToken = await auth.currentUser.getIdToken().catch(() => '');
  if (!idToken) return;
  await deleteCloudinaryImageByUrl(url, idToken);
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
