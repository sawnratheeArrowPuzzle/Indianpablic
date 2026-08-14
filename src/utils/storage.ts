import { StudentData, AdminRecord } from '../types';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

const STORAGE_KEY = 'india_id_card_records_v1';
const DB_NAME = 'GovtIdCardPermanentDB_v2';
const DB_STORE = 'student_records_store';
const FIRESTORE_COLLECTION = 'records';

// In-memory cache for ultra-fast UI rendering
let inMemoryRecordsCache: AdminRecord[] | null = null;

/**
 * Format phone number for card display:
 * Replaces the initial digits with 'XXXXXXX' and shows the user's last digits,
 * defaulting to 'XXXXXXX897' as requested.
 * E.g., '9876543897' => 'XXXXXXX897'
 */
export function formatMaskedPhone(phone?: string): string {
  if (!phone || phone.trim() === '') {
    return 'XXXXXXX897';
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const last3 = digits.slice(-3);
    return `XXXXXXX${last3}`;
  } else if (digits.length > 3) {
    const last3 = digits.slice(-3);
    const maskCount = Math.max(7, digits.length - 3);
    return `${'X'.repeat(maskCount)}${last3}`;
  } else if (digits.length > 0) {
    return `XXXXXXX${digits}`;
  }
  return 'XXXXXXX897';
}

// Initial default seed records so admin panel is never empty
const SEED_RECORDS: AdminRecord[] = [
  {
    id: 'seed-1',
    name: 'Mr Sawn Kumar',
    phone: '9876543210',
    idNumber: 'IND-15AUG-2026-08765',
    dob: '01/01/2007',
    role: 'Proud Citizen',
    date: '15 August 2026',
    place: 'India',
    state: 'Delhi',
    year: '2026',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    schoolName: 'Kendriya Vidyalaya / Government High School',
    eventTitle: 'INDEPENDENCE DAY',
    eventSubtitle: '15TH AUGUST',
    bannerText: 'CERTIFICATE OF PARTICIPATION',
    badgeTitle: 'PROUD',
    badgeSubtitle: 'TO BE AN',
    badgeCategory: 'INDIAN',
    signatoryName: 'Sawvan',
    signatoryTitle: 'AUTHORIZED SIGNATURE',
    signatoryAuthority: 'Government of India',
    mottoText: 'UNITY • DISCIPLINE • UNITY • PROGRESS',
    theme: 'independence_day',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    downloadCount: 5,
  },
  {
    id: 'seed-2',
    name: 'Aarav Sharma',
    phone: '9812345678',
    idNumber: 'IND-15AUG-2026-08766',
    dob: '05 July 2008',
    role: 'Student - Class 10-A',
    date: '15 August 2026',
    place: 'Jaipur',
    state: 'Rajasthan',
    year: '2026',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    schoolName: 'Delhi Public School',
    eventTitle: 'INDEPENDENCE DAY',
    eventSubtitle: '15TH AUGUST',
    bannerText: 'CERTIFICATE OF PARTICIPATION',
    badgeTitle: 'PROUD',
    badgeSubtitle: 'TO BE AN',
    badgeCategory: 'INDIAN',
    signatoryName: 'Principal',
    signatoryTitle: 'AUTHORIZED SIGNATURE',
    signatoryAuthority: 'Government of India',
    mottoText: 'UNITY • DISCIPLINE • UNITY • PROGRESS',
    theme: 'independence_day',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    downloadCount: 2,
  },
  {
    id: 'seed-3',
    name: 'Ananya Verma',
    phone: '9765432109',
    idNumber: 'IND-15AUG-2026-08767',
    dob: '22 October 2007',
    role: 'Head Girl - Class 11',
    date: '15 August 2026',
    place: 'Lucknow',
    state: 'Uttar Pradesh',
    year: '2026',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    schoolName: 'St. Xavier High School',
    eventTitle: 'INDEPENDENCE DAY',
    eventSubtitle: '15TH AUGUST',
    bannerText: 'CERTIFICATE OF PARTICIPATION',
    badgeTitle: 'PROUD',
    badgeSubtitle: 'TO BE AN',
    badgeCategory: 'INDIAN',
    signatoryName: 'Director',
    signatoryTitle: 'AUTHORIZED SIGNATURE',
    signatoryAuthority: 'Government of India',
    mottoText: 'UNITY • DISCIPLINE • UNITY • PROGRESS',
    theme: 'independence_day',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    downloadCount: 1,
  },
];

// --- PERMANENT INDEXEDDB ENGINE (Capable of storing 1,00,000+ records) ---
function getIndexedDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = () => resolve(null);
  });
}

export async function getAllFromIndexedDB(): Promise<AdminRecord[]> {
  try {
    const db = await getIndexedDB();
    if (!db) return [];
    return new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const store = tx.objectStore(DB_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const result = req.result || [];
        resolve(Array.isArray(result) ? result : []);
      };
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('IndexedDB read error', err);
    return [];
  }
}

export async function putRecordToIndexedDB(record: AdminRecord) {
  try {
    const db = await getIndexedDB();
    if (!db) return;
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    store.put(record);
  } catch (err) {
    console.warn('IndexedDB write single record error', err);
  }
}

export async function saveAllToIndexedDB(records: AdminRecord[]) {
  try {
    const db = await getIndexedDB();
    if (!db) return;
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    store.clear();
    records.forEach((r) => store.put(r));
  } catch (err) {
    console.warn('IndexedDB bulk write error', err);
  }
}

export async function deleteFromIndexedDB(id: string) {
  try {
    const db = await getIndexedDB();
    if (!db) return;
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    store.delete(id);
  } catch (err) {
    console.warn('IndexedDB delete error', err);
  }
}

export async function clearIndexedDB() {
  try {
    const db = await getIndexedDB();
    if (!db) return;
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    store.clear();
  } catch (err) {
    console.warn('IndexedDB clear error', err);
  }
}

// Safely update localStorage without throwing QuotaExceededError
function safelySaveToLocalStorage(records: AdminRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    // If full, save lightweight versions of the records in localStorage
    try {
      const lightweight = records.slice(0, 50).map((r) => ({
        ...r,
        photoUrl: r.photoUrl.startsWith('data:') ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600' : r.photoUrl,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
    } catch {
      console.warn('LocalStorage full; using IndexedDB & server disk as primary storage.');
    }
  }
}

// Synchronously get from Memory / LocalStorage
export function getSavedRecords(): AdminRecord[] {
  if (inMemoryRecordsCache && inMemoryRecordsCache.length > 0) {
    return inMemoryRecordsCache;
  }
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      inMemoryRecordsCache = [...SEED_RECORDS];
      safelySaveToLocalStorage(SEED_RECORDS);
      return SEED_RECORDS;
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      inMemoryRecordsCache = parsed;
      return parsed;
    }
    inMemoryRecordsCache = [...SEED_RECORDS];
    return SEED_RECORDS;
  } catch (err) {
    console.error('Failed to parse records from storage', err);
    inMemoryRecordsCache = [...SEED_RECORDS];
    return SEED_RECORDS;
  }
}

// Merge records by ID & unique citizen phone+name
function mergeRecordArrays(...arrays: AdminRecord[][]): AdminRecord[] {
  const map = new Map<string, AdminRecord>();
  arrays.forEach((arr) => {
    if (Array.isArray(arr)) {
      arr.forEach((r) => {
        if (!r) return;
        const key = r.id || `${r.phone || ''}-${r.name || ''}`;
        if (!map.has(key)) {
          map.set(key, r);
        } else {
          // Keep the newer / more complete version
          const existing = map.get(key)!;
          const newer = new Date(r.createdAt || 0).getTime() >= new Date(existing.createdAt || 0).getTime() ? r : existing;
          map.set(key, { ...existing, ...newer });
        }
      });
    }
  });
  return Array.from(map.values());
}

// Asynchronously sync from Firestore Cloud DB + IndexedDB + Server API + LocalStorage
export async function syncRecordsWithServer(): Promise<AdminRecord[]> {
  const localMem = getSavedRecords();
  const idbRecords = await getAllFromIndexedDB();
  let serverRecords: AdminRecord[] = [];
  let firestoreRecords: AdminRecord[] = [];

  // 1. Fetch from Firestore Cloud Database
  try {
    const colRef = collection(db, FIRESTORE_COLLECTION);
    const snapshot = await getDocs(colRef);
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as AdminRecord;
      if (data && data.name) {
        firestoreRecords.push({ ...data, id: data.id || docSnap.id });
      }
    });
  } catch (err) {
    console.warn('Firestore cloud sync offline or skipped:', err);
  }

  // 2. Fetch from Express Server Backend API
  try {
    const res = await fetch('/api/records');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.records)) {
        serverRecords = data.records;
      }
    }
  } catch (err) {
    console.warn('Server sync offline or skipped', err);
  }

  const merged = mergeRecordArrays(firestoreRecords, serverRecords, idbRecords, localMem);
  if (merged.length > 0) {
    inMemoryRecordsCache = merged;
    safelySaveToLocalStorage(merged);
    saveAllToIndexedDB(merged);
    return merged;
  }

  return getSavedRecords();
}

/**
 * Save user record permanently across:
 * 1. In-Memory Cache (Instant UI update)
 * 2. Google Firebase Firestore (Global Cloud Database)
 * 3. Permanent IndexedDB (Unlimited browser storage)
 * 4. Server Disk JSON / API (/api/records)
 * 5. LocalStorage
 */
export function saveUserRecord(
  student: StudentData,
  options?: { isDownload?: boolean }
): AdminRecord {
  const existing = [...getSavedRecords()];
  const isDownload = options?.isDownload ?? false;

  const isDefaultSample = student.id === 'default-mr-sawn-kumar' || student.id === 'seed-1';

  // Find if this exact citizen already exists
  const foundIndex = existing.findIndex((r) => {
    if (!isDefaultSample && student.id && r.id && r.id === student.id) {
      return true;
    }
    if (
      r.phone &&
      student.phone &&
      r.phone.trim() === student.phone.trim() &&
      r.name &&
      student.name &&
      r.name.trim().toLowerCase() === student.name.trim().toLowerCase()
    ) {
      return true;
    }
    if (
      student.idNumber &&
      r.idNumber &&
      r.idNumber === student.idNumber &&
      !isDefaultSample &&
      student.idNumber !== 'IND-15AUG-2026-08765'
    ) {
      return true;
    }
    return false;
  });

  let updatedRecord: AdminRecord;

  if (foundIndex >= 0) {
    const currentDownloads = existing[foundIndex].downloadCount || 0;
    updatedRecord = {
      ...existing[foundIndex],
      ...student,
      id: existing[foundIndex].id,
      downloadCount: isDownload ? currentDownloads + 1 : currentDownloads,
      createdAt: existing[foundIndex].createdAt || new Date().toISOString(),
    };
    existing[foundIndex] = updatedRecord;
  } else {
    const generatedId = `rec-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`;
    let finalIdNumber = student.idNumber;
    if (!finalIdNumber || finalIdNumber === 'IND-15AUG-2026-08765') {
      finalIdNumber = `IND-15AUG-${student.year || '2026'}-${Math.floor(10000 + Math.random() * 90000)}`;
    }

    updatedRecord = {
      ...student,
      id: student.id && !isDefaultSample ? student.id : generatedId,
      idNumber: finalIdNumber,
      createdAt: student.createdAt || new Date().toISOString(),
      downloadCount: isDownload ? 1 : 0,
    };
    existing.unshift(updatedRecord);
  }

  // 1. Update in-memory cache
  inMemoryRecordsCache = existing;

  // 2. Update LocalStorage
  safelySaveToLocalStorage(existing);

  // 3. Update IndexedDB permanently
  putRecordToIndexedDB(updatedRecord);

  // 4. Save to Google Firebase Firestore Cloud Database
  if (updatedRecord.id) {
    const docRef = doc(db, FIRESTORE_COLLECTION, updatedRecord.id);
    setDoc(docRef, updatedRecord, { merge: true }).catch((err) => {
      console.warn('Firebase Firestore save notice:', err);
    });
  }

  // 5. Update Server Disk API
  fetch('/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...updatedRecord, isDownload }),
  }).catch((err) => console.warn('Server record save warning:', err));

  return updatedRecord;
}

export function deleteUserRecord(id: string): AdminRecord[] {
  const records = getSavedRecords().filter((r) => r.id !== id && r.idNumber !== id);
  inMemoryRecordsCache = records;
  safelySaveToLocalStorage(records);
  deleteFromIndexedDB(id);

  // Delete from Firebase Firestore
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, id);
    deleteDoc(docRef).catch(() => {});
  } catch (err) {
    console.warn('Firebase deleteDoc error:', err);
  }

  // Delete on server
  fetch(`/api/records/${id}`, { method: 'DELETE' }).catch(() => {});

  return records;
}

export function clearAllRecords(): AdminRecord[] {
  const existing = [...getSavedRecords()];
  inMemoryRecordsCache = [];
  safelySaveToLocalStorage([]);
  clearIndexedDB();

  // Clear from Firebase Firestore
  try {
    const batch = writeBatch(db);
    existing.forEach((r) => {
      if (r.id) {
        batch.delete(doc(db, FIRESTORE_COLLECTION, r.id));
      }
    });
    batch.commit().catch(() => {});
  } catch (err) {
    console.warn('Firebase clear batch error:', err);
  }

  // Clear on server
  fetch('/api/records', { method: 'DELETE' }).catch(() => {});

  return [];
}

export function exportRecordsToCSV(records: AdminRecord[]): void {
  const headers = ['ID Number', 'Name', 'Phone (Mobile)', 'DOB', 'Role', 'Place', 'State', 'Event', 'Date Created', 'Downloads'];
  const rows = records.map((r) => [
    `"${r.idNumber || ''}"`,
    `"${r.name || ''}"`,
    `"${r.phone || ''}"`,
    `"${r.dob || ''}"`,
    `"${r.role || ''}"`,
    `"${r.place || ''}"`,
    `"${r.state || 'India'}"`,
    `"${r.eventTitle || '15th August'}"`,
    `"${new Date(r.createdAt).toLocaleString('en-IN')}"`,
    r.downloadCount || 1,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `National_ID_Card_Records_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
