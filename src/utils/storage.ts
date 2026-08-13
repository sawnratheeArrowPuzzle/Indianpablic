import { StudentData, AdminRecord } from '../types';

const STORAGE_KEY = 'india_id_card_records_v1';
const DB_NAME = 'GovtIdCardPermanentDB';
const DB_STORE = 'student_records';

/**
 * Format phone number for card display:
 * Replaces the first 6 digits with 'XXXXXX' and shows only the last 4 digits!
 * E.g., '9876546789' => 'XXXXXX6789'
 */
export function formatMaskedPhone(phone?: string): string {
  if (!phone || phone.trim() === '') {
    return 'XXXXXX0000';
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const last4 = digits.slice(-4);
    return `XXXXXX${last4}`;
  } else if (digits.length > 4) {
    const last4 = digits.slice(-4);
    const maskCount = Math.max(0, digits.length - 4);
    return `${'X'.repeat(maskCount)}${last4}`;
  } else if (digits.length > 0) {
    return `XXXXXX${digits}`;
  }
  return 'XXXXXX0000';
}

// Initial default seed records so admin panel is never empty
const SEED_RECORDS: AdminRecord[] = [
  {
    id: 'seed-1',
    name: 'Sawvan Kumar',
    phone: '9876543210',
    idNumber: 'IND-15AUG-2026-08765',
    dob: '14 February 2006',
    role: 'Proud Citizen',
    date: '15 August 2026',
    place: 'India',
    state: 'Delhi',
    year: '2026',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
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

// --- PERMANENT INDEXEDDB HELPER ---
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

async function saveToIndexedDB(records: AdminRecord[]) {
  try {
    const db = await getIndexedDB();
    if (!db) return;
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    store.clear();
    records.forEach((r) => store.put(r));
  } catch (err) {
    console.warn('IndexedDB write error', err);
  }
}

// Synchronously get from localStorage
export function getSavedRecords(): AdminRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_RECORDS));
      return SEED_RECORDS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_RECORDS;
  } catch (err) {
    console.error('Failed to parse records from storage', err);
    return SEED_RECORDS;
  }
}

// Asynchronously sync from server API and update local storage
export async function syncRecordsWithServer(): Promise<AdminRecord[]> {
  try {
    const res = await fetch('/api/records');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.records) && data.records.length > 0) {
        const local = getSavedRecords();
        // Merge without duplicates
        const map = new Map<string, AdminRecord>();
        data.records.forEach((r: AdminRecord) => map.set(r.id || r.idNumber, r));
        local.forEach((r: AdminRecord) => {
          const key = r.id || r.idNumber;
          if (!map.has(key)) map.set(key, r);
        });
        const merged = Array.from(map.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        saveToIndexedDB(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn('Server sync skipped (running offline/local mode)', err);
  }
  return getSavedRecords();
}

// Save user record both locally and to persistent server API
export function saveUserRecord(student: StudentData): AdminRecord {
  const existing = getSavedRecords();

  const foundIndex = existing.findIndex(
    (r) =>
      (r.idNumber && student.idNumber && r.idNumber === student.idNumber) ||
      (r.phone && student.phone && r.phone === student.phone && r.name.toLowerCase() === student.name.toLowerCase()) ||
      (r.id && student.id && r.id === student.id)
  );

  let updatedRecord: AdminRecord;

  if (foundIndex >= 0) {
    updatedRecord = {
      ...existing[foundIndex],
      ...student,
      downloadCount: (existing[foundIndex].downloadCount || 0) + 1,
      createdAt: new Date().toISOString(),
    };
    existing[foundIndex] = updatedRecord;
  } else {
    updatedRecord = {
      ...student,
      id: student.id || `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      downloadCount: 1,
    };
    existing.unshift(updatedRecord);
  }

  // 1. LocalStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('Storage error, keeping 100 items', err);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 100)));
  }

  // 2. IndexedDB
  saveToIndexedDB(existing);

  // 3. Persistent Server API (disk JSON)
  fetch('/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedRecord),
  }).catch((err) => console.warn('Background server save warning:', err));

  return updatedRecord;
}

export function deleteUserRecord(id: string): AdminRecord[] {
  const records = getSavedRecords().filter((r) => r.id !== id && r.idNumber !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  saveToIndexedDB(records);

  // Delete on server
  fetch(`/api/records/${id}`, { method: 'DELETE' }).catch(() => {});

  return records;
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
