import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Persistent records directory and file
const DATA_DIR = path.join(process.cwd(), 'data');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Seed Data
const DEFAULT_SEED_RECORDS = [
  {
    id: 'rec-seed-1',
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
    createdAt: new Date().toISOString(),
    downloadCount: 5,
  },
  {
    id: 'rec-seed-2',
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
    createdAt: new Date().toISOString(),
    downloadCount: 2,
  },
  {
    id: 'rec-seed-3',
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
    createdAt: new Date().toISOString(),
    downloadCount: 1,
  },
];

// Helper to read records safely from disk
function readRecordsFromDisk(): any[] {
  try {
    if (fs.existsSync(RECORDS_FILE)) {
      const raw = fs.readFileSync(RECORDS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // If not existing, write seed records
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(DEFAULT_SEED_RECORDS, null, 2), 'utf-8');
    return DEFAULT_SEED_RECORDS;
  } catch (err) {
    console.error('Error reading records file:', err);
    return DEFAULT_SEED_RECORDS;
  }
}

// Helper to write records safely to disk
function writeRecordsToDisk(records: any[]) {
  try {
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving records file:', err);
  }
}

// Initialize seed data on startup if needed
readRecordsFromDisk();

// --- API ROUTES ---

// 1. GET all records
app.get('/api/records', (req, res) => {
  const records = readRecordsFromDisk();
  res.json({ success: true, records, count: records.length });
});

// 2. POST create or upsert record
app.post('/api/records', (req, res) => {
  try {
    const student = req.body;
    if (!student || !student.name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const records = readRecordsFromDisk();
    const existingIndex = records.findIndex(
      (r) =>
        (r.idNumber && student.idNumber && r.idNumber === student.idNumber) ||
        (r.phone && student.phone && r.phone === student.phone && r.name.toLowerCase() === student.name.toLowerCase()) ||
        (r.id && student.id && r.id === student.id)
    );

    let savedRecord;
    if (existingIndex >= 0) {
      savedRecord = {
        ...records[existingIndex],
        ...student,
        downloadCount: (records[existingIndex].downloadCount || 0) + 1,
        updatedAt: new Date().toISOString(),
      };
      records[existingIndex] = savedRecord;
    } else {
      savedRecord = {
        ...student,
        id: student.id || `rec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        createdAt: student.createdAt || new Date().toISOString(),
        downloadCount: 1,
      };
      records.unshift(savedRecord);
    }

    writeRecordsToDisk(records);
    return res.json({ success: true, record: savedRecord, total: records.length });
  } catch (err: any) {
    console.error('Error in POST /api/records:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. DELETE single record
app.delete('/api/records/:id', (req, res) => {
  try {
    const { id } = req.params;
    let records = readRecordsFromDisk();
    records = records.filter((r) => r.id !== id && r.idNumber !== id);
    writeRecordsToDisk(records);
    return res.json({ success: true, records, total: records.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3b. DELETE all records (Clear all)
app.delete('/api/records', (req, res) => {
  try {
    writeRecordsToDisk([]);
    return res.json({ success: true, records: [], total: 0 });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. BULK IMPORT
app.post('/api/records/bulk', (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students)) {
      return res.status(400).json({ success: false, message: 'Invalid students list' });
    }

    const records = readRecordsFromDisk();
    students.forEach((stu) => {
      const idx = records.findIndex(
        (r) =>
          (r.idNumber && stu.idNumber && r.idNumber === stu.idNumber) ||
          (r.phone && stu.phone && r.phone === stu.phone && r.name.toLowerCase() === stu.name.toLowerCase())
      );
      if (idx >= 0) {
        records[idx] = { ...records[idx], ...stu };
      } else {
        records.unshift({
          ...stu,
          id: stu.id || `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          createdAt: stu.createdAt || new Date().toISOString(),
          downloadCount: 1,
        });
      }
    });

    writeRecordsToDisk(records);
    return res.json({ success: true, count: records.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// --- VITE DEV / PRODUCTION MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`National ID Portal Server running on http://localhost:${PORT}`);
  });
}

startServer();
