import type { User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type {
  AdminOverviewResponse,
  AdminSettings,
  Course,
  MemberOverviewResponse,
  OfferItem,
  Order,
  Package,
  PackageCourse,
  Payment,
  PublicCatalogResponse,
  UserProfile,
  Withdrawal,
} from '../types/savvvn';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

async function getAuthHeaders(targetUser?: User | null): Promise<HeadersInit> {
  const user = targetUser || auth.currentUser;
  if (!user) {
    throw new Error('Please sign in with Google to continue.');
  }
  const idToken = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${idToken}`,
  };
}

async function requestJson<T>(
  url: string,
  options: RequestInit = {},
  authenticated = false,
  targetUser?: User | null
): Promise<T> {
  const headers: HeadersInit = authenticated
    ? await getAuthHeaders(targetUser)
    : { 'Content-Type': 'application/json' };

  const targetUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;

  const res = await fetch(targetUrl, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  }
  return data as T;
}

async function fetchPublicCatalogFromFirestore(): Promise<PublicCatalogResponse> {
  const [pkgSnap, crsSnap, pcSnap, settingsSnap] = await Promise.all([
    getDocs(query(collection(db, 'packages'), where('active', '==', true))),
    getDocs(query(collection(db, 'courses'), where('active', '==', true))),
    getDocs(collection(db, 'packageCourses')),
    getDoc(doc(db, 'adminSettings', 'public')),
  ]);

  const packages = pkgSnap.docs
    .map((d) => ({ ...(d.data() as Package), id: d.id }))
    .filter((p) => p.active !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (!packages.length) {
    throw new Error('No published packages found in Firestore.');
  }

  const courses = crsSnap.docs.map((d) => ({ ...(d.data() as Course), id: d.id }));
  const packageCourses = pcSnap.docs.map((d) => ({ ...(d.data() as PackageCourse), id: d.id }));
  const rawSettings = settingsSnap.exists() ? (settingsSnap.data() as Partial<AdminSettings>) : {};

  return {
    packages,
    courses,
    packageCourses,
    offers: [] as OfferItem[],
    settings: {
      siteName: rawSettings.siteName || 'SavvvnLab',
      tagline: rawSettings.tagline || 'Learn · Create · Grow',
      heroTitle:
        rawSettings.heroTitle ||
        'Build High-Income Digital Skills with Structured Learning Packages',
      heroSubtitle:
        rawSettings.heroSubtitle ||
        'Master video editing, visual design, and creator growth through practical step-by-step courses.',
      aboutSummary:
        rawSettings.aboutSummary ||
        'SavvvnLab is a creator-focused digital learning platform built around structured skill packages.',
      supportEmail: rawSettings.supportEmail || 'support@savvvnlab.in',
      supportPhone: rawSettings.supportPhone || '+91 98765 00000',
      instagramUrl: rawSettings.instagramUrl || '',
      youtubeUrl: rawSettings.youtubeUrl || '',
      telegramUrl: rawSettings.telegramUrl || '',
      whatsappUrl: rawSettings.whatsappUrl || '',
      upiId: rawSettings.upiId || '',
      upiPayeeName: rawSettings.upiPayeeName || 'SavvvnLab Official',
      upiInstructions:
        rawSettings.upiInstructions ||
        'Scan the QR code or copy the UPI ID above, pay the exact package amount, and submit your 12-digit UTR.',
      customUpiQrUrl: rawSettings.customUpiQrUrl || '',
      minWithdrawal: Number(rawSettings.minWithdrawal) || 500,
      defaultCommissionPercent: Number(rawSettings.defaultCommissionPercent) || 25,
    },
  };
}

const inFlightSessionRequests = new Map<string, Promise<{ user: UserProfile }>>();

export const api = {
  // Public
  getPublicCatalog: async (): Promise<PublicCatalogResponse> => {
    try {
      const catalog = await requestJson<PublicCatalogResponse>('/api/public/catalog');
      if (catalog && Array.isArray(catalog.packages)) {
        return {
          ...catalog,
          packages: catalog.packages
            .filter((p) => p.active !== false)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
        };
      }
      throw new Error('Invalid catalog response format');
    } catch (apiError) {
      // If deployed statically without backend API, try real Firestore catalog if rules allow; otherwise surface actual API error
      try {
        return await fetchPublicCatalogFromFirestore();
      } catch {
        throw apiError;
      }
    }
  },

  submitPublicContact: (payload: { name: string; email: string; subject: string; message: string }) =>
    requestJson<{ success: boolean }>('/api/public/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Session & Member (single-flight deduplicated per UID to prevent double DB writes)
  establishSession: (referralCode?: string | null, targetUser?: User | null) => {
    const activeUser = targetUser || auth.currentUser;
    if (!activeUser) {
      return Promise.reject(new Error('Please sign in with Google to continue.'));
    }
    const cleanRef = (referralCode || '').trim().toUpperCase();
    const key = `${activeUser.uid}:${cleanRef}`;
    const existing = inFlightSessionRequests.get(key) || inFlightSessionRequests.get(activeUser.uid);
    if (existing) {
      return existing;
    }

    const promise = requestJson<{ user: UserProfile }>(
      '/api/auth/session',
      { method: 'POST', body: JSON.stringify({ referralCode: cleanRef }) },
      true,
      activeUser
    ).finally(() => {
      inFlightSessionRequests.delete(key);
      inFlightSessionRequests.delete(activeUser.uid);
    });

    inFlightSessionRequests.set(key, promise);
    inFlightSessionRequests.set(activeUser.uid, promise);
    return promise;
  },

  getMemberOverview: () => requestJson<MemberOverviewResponse>('/api/me/overview', {}, true),

  updateProfile: (payload: { displayName: string; phone: string; upiId: string }) =>
    requestJson<{ user: UserProfile }>(
      '/api/me/profile',
      { method: 'PATCH', body: JSON.stringify(payload) },
      true
    ),

  createOrder: (packageId: string, referralCode?: string | null) =>
    requestJson<{ order: Order }>(
      '/api/orders',
      { method: 'POST', body: JSON.stringify({ packageId, referralCode: referralCode || '' }) },
      true
    ),

  submitUpiPayment: (payload: { orderId: string; utr: string; screenshotUrl: string }) =>
    requestJson<{ payment: Payment; order: Order }>(
      '/api/payments/submit',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),

  requestWithdrawal: (payload: { amount: number; upiId: string }) =>
    requestJson<{ withdrawal: Withdrawal }>(
      '/api/withdrawals/request',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),

  markNotificationRead: (notificationId?: string) =>
    requestJson<{ success: boolean }>(
      '/api/notifications/read',
      { method: 'POST', body: JSON.stringify({ notificationId }) },
      true
    ),

  createSupportTicket: (payload: { subject: string; message: string }) =>
    requestJson<{ success: boolean }>(
      '/api/support/tickets',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),

  // Admin
  getAdminOverview: () => requestJson<AdminOverviewResponse>('/api/admin/overview', {}, true),

  verifyPayment: (paymentId: string, action: 'approve' | 'reject', adminNote?: string) =>
    requestJson<{ payment: Payment; order: Order }>(
      `/api/admin/payments/${paymentId}/verify`,
      { method: 'POST', body: JSON.stringify({ action, adminNote }) },
      true
    ),

  refundOrder: (orderId: string, reason: string) =>
    requestJson<{ order: Order }>(
      `/api/admin/orders/${orderId}/refund`,
      { method: 'POST', body: JSON.stringify({ reason }) },
      true
    ),

  commissionAction: (id: string, action: 'approve' | 'reverse', note?: string) =>
    requestJson<{ success: boolean }>(
      `/api/admin/commissions/${id}/action`,
      { method: 'POST', body: JSON.stringify({ action, note }) },
      true
    ),

  withdrawalAction: (
    id: string,
    action: 'approve' | 'paid' | 'reject',
    payload?: { payoutReference?: string; adminNote?: string }
  ) =>
    requestJson<{ withdrawal: Withdrawal }>(
      `/api/admin/withdrawals/${id}/action`,
      { method: 'POST', body: JSON.stringify({ action, ...(payload || {}) }) },
      true
    ),

  createPackage: (payload: Partial<Package> & { courseIds?: string[] }) =>
    requestJson<{ package: Package }>(
      '/api/admin/packages',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),

  updatePackage: (id: string, payload: Partial<Package> & { courseIds?: string[] }) =>
    requestJson<{ package: Package }>(
      `/api/admin/packages/${id}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      true
    ),

  reorderPackages: (packageIds: string[]) =>
    requestJson<{ packages: Package[] }>(
      '/api/admin/packages/reorder',
      { method: 'PUT', body: JSON.stringify({ packageIds }) },
      true
    ),

  deletePackage: (id: string) =>
    requestJson<{ success: boolean }>(`/api/admin/packages/${id}`, { method: 'DELETE' }, true),

  createCourse: (payload: Partial<Course>) =>
    requestJson<{ course: Course }>(
      '/api/admin/courses',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),

  updateCourse: (id: string, payload: Partial<Course>) =>
    requestJson<{ course: Course }>(
      `/api/admin/courses/${id}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      true
    ),

  deleteCourse: (id: string) =>
    requestJson<{ success: boolean }>(`/api/admin/courses/${id}`, { method: 'DELETE' }, true),

  updatePackageCourses: (packageId: string, courseIds: string[]) =>
    requestJson<{ success: boolean }>(
      '/api/admin/package-courses',
      { method: 'PUT', body: JSON.stringify({ packageId, courseIds }) },
      true
    ),

  updateMemberStatus: (uid: string, status: 'active' | 'suspended') =>
    requestJson<{ user: UserProfile }>(
      `/api/admin/members/${uid}`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      true
    ),

  createOffer: (payload: { title: string; description: string; highlight: string; validUntil: string }) =>
    requestJson<{ success: boolean }>(
      '/api/admin/offers',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),

  deleteOffer: (id: string) =>
    requestJson<{ success: boolean }>(`/api/admin/offers/${id}`, { method: 'DELETE' }, true),

  broadcastNotification: (payload: { userId: string; title: string; message: string }) =>
    requestJson<{ success: boolean }>(
      '/api/admin/notifications/broadcast',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),

  replySupportTicket: (id: string, payload: { status: 'open' | 'in_progress' | 'resolved'; adminReply: string }) =>
    requestJson<{ success: boolean }>(
      `/api/admin/support/${id}/reply`,
      { method: 'POST', body: JSON.stringify(payload) },
      true
    ),

  updateSettings: (payload: Partial<AdminSettings>) =>
    requestJson<{ settings: AdminSettings }>(
      '/api/admin/settings',
      { method: 'PUT', body: JSON.stringify(payload) },
      true
    ),

  updateAdminAllowlist: (action: 'add' | 'remove', email: string) =>
    requestJson<{ adminAllowlist: string[] }>(
      '/api/admin/security/admins',
      { method: 'PUT', body: JSON.stringify({ action, email }) },
      true
    ),
};
