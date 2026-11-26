import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type {
  AdminOverviewResponse,
  AdminSettings,
  AuditLog,
  CommissionEntry,
  Course,
  LeaderboardEntry,
  MemberOverviewResponse,
  NotificationItem,
  OfferItem,
  Order,
  Package,
  PackageCourse,
  Payment,
  PublicCatalogResponse,
  Referral,
  SupportTicket,
  UserProfile,
  WalletLedgerEntry,
  WalletSummary,
  Withdrawal,
} from './src/types/savvvn';

export const app = express();
const OWNER_ADMIN_EMAIL = 'sawn6849@gmail.com';
const DEFAULT_UPI_ID = '469519102@ybl';
const DEFAULT_UPI_PAYEE_NAME = 'SavvvnLab';

function isAuthorizedAdminEmail(email?: string | null): boolean {
  return (email || '').trim().toLowerCase() === OWNER_ADMIN_EMAIL;
}

app.use((req, res, next) => {
  // Normalize Netlify Function prefix (/.netlify/functions/api/...) to /api/...
  if (req.url.startsWith('/.netlify/functions/api')) {
    const suffix = req.url.slice('/.netlify/functions/api'.length);
    req.url = suffix.startsWith('/api')
      ? suffix
      : `/api${suffix.startsWith('/') ? suffix : `/${suffix}`}`;
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  return next();
});

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Load Firebase Project ID from preserved firebase-applet-config.json
const TASK_ROOT = process.env.LAMBDA_TASK_ROOT || process.cwd();
const FIREBASE_CONFIG_PATH =
  [
    path.join(process.cwd(), 'firebase-applet-config.json'),
    path.join(TASK_ROOT, 'firebase-applet-config.json'),
  ].find((p) => fs.existsSync(p)) || path.join(process.cwd(), 'firebase-applet-config.json');

let FIREBASE_PROJECT_ID = 'gen-lang-client-0627643856';
try {
  if (fs.existsSync(FIREBASE_CONFIG_PATH)) {
    const rawCfg = JSON.parse(fs.readFileSync(FIREBASE_CONFIG_PATH, 'utf-8'));
    if (rawCfg?.projectId) FIREBASE_PROJECT_ID = String(rawCfg.projectId);
  }
} catch (err) {
  console.warn('Could not read firebase-applet-config.json:', err);
}

// Persistent SavvvnLab data file (supports both local/Cloud Run disk & read-only Netlify Lambda /tmp)
const BUNDLED_DB_FILE =
  [
    path.join(process.cwd(), 'data', 'savvvnlab.json'),
    path.join(TASK_ROOT, 'data', 'savvvnlab.json'),
  ].find((p) => fs.existsSync(p)) || path.join(process.cwd(), 'data', 'savvvnlab.json');

function resolveDbPaths(): { dataDir: string; dbFile: string } {
  const localDir = path.join(process.cwd(), 'data');
  const localFile = path.join(localDir, 'savvvnlab.json');
  const isServerless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (!isServerless) {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return { dataDir: localDir, dbFile: localFile };
  }
  const tmpDir = '/tmp/savvvnlab-data';
  const tmpFile = path.join(tmpDir, 'savvvnlab.json');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  if (!fs.existsSync(tmpFile) && fs.existsSync(BUNDLED_DB_FILE)) {
    fs.copyFileSync(BUNDLED_DB_FILE, tmpFile);
  }
  return { dataDir: tmpDir, dbFile: tmpFile };
}

const { dbFile: DB_FILE } = resolveDbPaths();

interface SavvvnDatabase {
  users: UserProfile[];
  packages: Package[];
  courses: Course[];
  packageCourses: PackageCourse[];
  orders: Order[];
  payments: Payment[];
  referrals: Referral[];
  commissionLedger: CommissionEntry[];
  walletLedger: WalletLedgerEntry[];
  withdrawals: Withdrawal[];
  notifications: NotificationItem[];
  offers: OfferItem[];
  supportTickets: SupportTicket[];
  auditLogs: AuditLog[];
  settings: AdminSettings;
  adminAllowlist: string[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
}

function createInitialDatabase(): SavvvnDatabase {
  const ts = nowIso();
  const packages: Package[] = [
    {
      id: 'pkg-gold',
      slug: 'gold-package',
      name: 'Gold Package',
      subtitle: 'Essential Creative Foundation',
      description:
        'Start your digital skill journey with structured video editing, visual design, and creator growth foundations.',
      price: 499,
      originalPrice: 999,
      commissionRate: 25,
      benefits: [
        'Full lifetime access to included foundation courses',
        'Step-by-step project lessons & workflows',
        'Verified partner referral link & wallet access',
        'Community support & weekly training updates',
      ],
      accentColor: '#0D9488',
      featured: false,
      active: true,
      sortOrder: 1,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'pkg-platinum',
      slug: 'platinum-package',
      name: 'Platinum Package',
      subtitle: 'Complete Creator Toolkit',
      description:
        'Built for creators ready to produce high-retention reels, brand kits, and consistent YouTube channels.',
      price: 999,
      originalPrice: 1999,
      commissionRate: 30,
      benefits: [
        'Includes everything in Gold Package plus YouTube Mastery',
        'High-retention editing templates & color workflows',
        'Priority support ticket routing',
        'Higher referral commission eligibility (30%)',
      ],
      accentColor: '#6D28D9',
      featured: true,
      active: true,
      sortOrder: 2,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'pkg-diamond',
      slug: 'diamond-package',
      name: 'Diamond Package',
      subtitle: 'Pro Freelance & Growth System',
      description:
        'Advanced production, social distribution strategy, and client delivery workflows for serious digital professionals.',
      price: 1999,
      originalPrice: 3999,
      commissionRate: 35,
      benefits: [
        'Full access to all core & advanced creator courses',
        'Client portfolio & freelance workflow blueprints',
        'Live community webinar access',
        '35% verified partner commission rate',
      ],
      accentColor: '#0B1E36',
      featured: false,
      active: true,
      sortOrder: 3,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'pkg-premium-pro',
      slug: 'premium-pro',
      name: 'Premium Pro Package',
      subtitle: 'All-Access Studio Mastery',
      description:
        'Complete SavvvnLab library unlocking every current and future core curriculum track with maximum partner benefits.',
      price: 3999,
      originalPrice: 7999,
      commissionRate: 40,
      benefits: [
        'Unlocks every course & module across SavvvnLab',
        'Dedicated partner support & leaderboard eligibility',
        'Advanced CapCut & agency scaling workshops',
        'Maximum 40% verified partner commission rate',
      ],
      accentColor: '#0F766E',
      featured: false,
      active: true,
      sortOrder: 4,
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  const courses: Course[] = [
    {
      id: 'crs-video-editing',
      title: 'Video Editing & CapCut Mastery',
      category: 'Video Editing',
      description:
        'Master pacing, sound design, jump cuts, keyframes, and color grading for short-form reels and long-form storytelling.',
      thumbnail: '/src/assets/images/course_video_editing_1795281750455.jpg',
      instructor: 'SavvvnLab Studio Faculty',
      level: 'Beginner',
      active: true,
      createdAt: ts,
      updatedAt: ts,
      lessons: [
        {
          id: 'les-ve-1',
          title: 'Timeline Architecture & Project Organization',
          duration: '14:20',
          videoUrl: '',
          summary: 'Set up clean multi-track timelines, proxy media, and folder structures.',
          order: 1,
        },
        {
          id: 'les-ve-2',
          title: 'Retention Pacing, B-Roll & Sound Layering',
          duration: '22:10',
          videoUrl: '',
          summary: 'Combine J-cuts, L-cuts, whooshes, and dynamic captions for viewer retention.',
          order: 2,
        },
        {
          id: 'les-ve-3',
          title: 'Color Balance & Export Settings for Social',
          duration: '18:45',
          videoUrl: '',
          summary: 'Dial in skin tones, subtle contrast curves, and crisp 1080p/4K bitrate exports.',
          order: 3,
        },
      ],
    },
    {
      id: 'crs-canva-design',
      title: 'Canva & Visual Brand Design',
      category: 'Canva',
      description:
        'Create clean social carousels, high-CTR thumbnails, brand kits, and presentation decks using structured typography grids.',
      thumbnail: '/src/assets/images/course_design_canva_1795281749665.jpg',
      instructor: 'SavvvnLab Design Team',
      level: 'Beginner',
      active: true,
      createdAt: ts,
      updatedAt: ts,
      lessons: [
        {
          id: 'les-cd-1',
          title: 'Grid Systems, Contrast & Typographic Hierarchy',
          duration: '16:00',
          videoUrl: '',
          summary: 'Stop guessing layouts—apply repeatable alignment, spacing, and contrast rules.',
          order: 1,
        },
        {
          id: 'les-cd-2',
          title: 'High-CTR YouTube & Reel Cover Templates',
          duration: '19:30',
          videoUrl: '',
          summary: 'Design readable focal thumbnails with strong subject separation.',
          order: 2,
        },
        {
          id: 'les-cd-3',
          title: 'Complete Brand Kit & Carousel System',
          duration: '21:15',
          videoUrl: '',
          summary: 'Build cohesive multi-slide educational carousels in under 20 minutes.',
          order: 3,
        },
      ],
    },
    {
      id: 'crs-instagram-growth',
      title: 'Instagram Content & Organic Growth',
      category: 'Social Growth',
      description:
        'Structured content pillars, hook frameworks, analytics reading, and organic audience building without guesswork.',
      thumbnail: '/src/assets/images/hero_savvvnlab_workspace_1795281750249.jpg',
      instructor: 'SavvvnLab Growth Lab',
      level: 'Intermediate',
      active: true,
      createdAt: ts,
      updatedAt: ts,
      lessons: [
        {
          id: 'les-ig-1',
          title: 'Profile Positioning & Niche Clarity',
          duration: '15:10',
          videoUrl: '',
          summary: 'Turn profile visitors into long-term followers with clear positioning.',
          order: 1,
        },
        {
          id: 'les-ig-2',
          title: '3-Second Hook Mechanics & Script Frameworks',
          duration: '20:40',
          videoUrl: '',
          summary: 'Write opening hooks backed by visual proof rather than clickbait.',
          order: 2,
        },
      ],
    },
    {
      id: 'crs-youtube-mastery',
      title: 'YouTube Channel & Monetization Mastery',
      category: 'YouTube',
      description:
        'Plan searchable topics, script engaging long-form videos, optimize retention graphs, and build sustainable creator income.',
      thumbnail: '/src/assets/images/course_growth_youtube_1795281750943.jpg',
      instructor: 'SavvvnLab Creator Studio',
      level: 'Intermediate',
      active: true,
      createdAt: ts,
      updatedAt: ts,
      lessons: [
        {
          id: 'les-yt-1',
          title: 'Topic Research & Packaging Before Filming',
          duration: '24:00',
          videoUrl: '',
          summary: 'Validate titles and thumbnail concepts before recording a single frame.',
          order: 1,
        },
        {
          id: 'les-yt-2',
          title: 'Audience Retention Graph Diagnostics',
          duration: '17:50',
          videoUrl: '',
          summary: 'Read YouTube Studio retention curves to eliminate mid-video drop-offs.',
          order: 2,
        },
      ],
    },
  ];

  const packageCourses: PackageCourse[] = [
    // Gold -> Video Editing + Canva + Instagram Growth
    { id: 'pc-1', packageId: 'pkg-gold', courseId: 'crs-video-editing', sortOrder: 1 },
    { id: 'pc-2', packageId: 'pkg-gold', courseId: 'crs-canva-design', sortOrder: 2 },
    { id: 'pc-3', packageId: 'pkg-gold', courseId: 'crs-instagram-growth', sortOrder: 3 },
    // Platinum -> All 4
    { id: 'pc-4', packageId: 'pkg-platinum', courseId: 'crs-video-editing', sortOrder: 1 },
    { id: 'pc-5', packageId: 'pkg-platinum', courseId: 'crs-canva-design', sortOrder: 2 },
    { id: 'pc-6', packageId: 'pkg-platinum', courseId: 'crs-instagram-growth', sortOrder: 3 },
    { id: 'pc-7', packageId: 'pkg-platinum', courseId: 'crs-youtube-mastery', sortOrder: 4 },
    // Diamond -> All 4
    { id: 'pc-8', packageId: 'pkg-diamond', courseId: 'crs-video-editing', sortOrder: 1 },
    { id: 'pc-9', packageId: 'pkg-diamond', courseId: 'crs-canva-design', sortOrder: 2 },
    { id: 'pc-10', packageId: 'pkg-diamond', courseId: 'crs-instagram-growth', sortOrder: 3 },
    { id: 'pc-11', packageId: 'pkg-diamond', courseId: 'crs-youtube-mastery', sortOrder: 4 },
    // Premium Pro -> All 4
    { id: 'pc-12', packageId: 'pkg-premium-pro', courseId: 'crs-video-editing', sortOrder: 1 },
    { id: 'pc-13', packageId: 'pkg-premium-pro', courseId: 'crs-canva-design', sortOrder: 2 },
    { id: 'pc-14', packageId: 'pkg-premium-pro', courseId: 'crs-instagram-growth', sortOrder: 3 },
    { id: 'pc-15', packageId: 'pkg-premium-pro', courseId: 'crs-youtube-mastery', sortOrder: 4 },
  ];

  return {
    users: [],
    packages,
    courses,
    packageCourses,
    orders: [],
    payments: [],
    referrals: [],
    commissionLedger: [],
    walletLedger: [],
    withdrawals: [],
    notifications: [],
    offers: [],
    supportTickets: [],
    auditLogs: [],
    adminAllowlist: [OWNER_ADMIN_EMAIL],
    settings: {
      id: 'public',
      siteName: 'SavvvnLab',
      tagline: 'Learn · Create · Grow',
      heroTitle: 'Build High-Income Digital Skills with Structured Learning Packages',
      heroSubtitle:
        'Master video editing, visual design, and creator growth through practical step-by-step courses—and earn verified partner rewards when you share.',
      aboutSummary:
        'SavvvnLab is a creator-focused digital learning platform built around structured skill packages, manual transaction integrity, and transparent partner accounting.',
      supportEmail: 'support@savvvnlab.in',
      supportPhone: '+91 98765 00000',
      instagramUrl: 'https://instagram.com',
      youtubeUrl: 'https://youtube.com',
      telegramUrl: 'https://t.me',
      whatsappUrl: 'https://whatsapp.com',
      upiId: DEFAULT_UPI_ID,
      upiPayeeName: DEFAULT_UPI_PAYEE_NAME,
      upiInstructions:
        'Scan the QR code or copy the UPI ID above, pay the exact package amount, and submit your 12-digit UTR along with a clear payment screenshot.',
      customUpiQrUrl: '',
      defaultCommissionPercent: 25,
      autoApproveCommission: false,
      minWithdrawal: 500,
      maxWithdrawal: 25000,
      updatedAt: ts,
    },
  };
}

let dbCache: SavvvnDatabase | null = null;

function readDb(): SavvvnDatabase {
  if (dbCache) return dbCache;
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (parsed && Array.isArray(parsed.packages)) {
        // Enforce exclusive admin allowlist & roles while preserving all existing records
        parsed.adminAllowlist = [OWNER_ADMIN_EMAIL];
        if (Array.isArray(parsed.users)) {
          parsed.users = parsed.users.map((u: UserProfile) => ({
            ...u,
            role: isAuthorizedAdminEmail(u.email) ? 'admin' : 'member',
          }));
        }
        if (parsed.settings) {
          if (!parsed.settings.upiId || !String(parsed.settings.upiId).trim()) {
            parsed.settings.upiId = DEFAULT_UPI_ID;
          }
          if (!parsed.settings.upiPayeeName || !String(parsed.settings.upiPayeeName).trim()) {
            parsed.settings.upiPayeeName = DEFAULT_UPI_PAYEE_NAME;
          }
        }
        dbCache = parsed as SavvvnDatabase;
        return dbCache;
      }
    }
  } catch (err) {
    console.error('Failed to read savvvnlab.json, re-initializing defaults:', err);
  }
  const initial = createInitialDatabase();
  writeDbSync(initial);
  return initial;
}

function writeDbSync(db: SavvvnDatabase): void {
  dbCache = db;
  const tmpPath = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_FILE);
}

// Strict sequential async mutex for all mutations & financial transactions
let dbLockChain: Promise<void> = Promise.resolve();
function withDbLock<T>(fn: (db: SavvvnDatabase) => Promise<T> | T): Promise<T> {
  const result = dbLockChain.then(async () => {
    const db = readDb();
    const out = await fn(db);
    writeDbSync(db);
    return out;
  });
  dbLockChain = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

// Initialize DB file on boot and pre-warm Firebase x509 signing certs for fast login verification
readDb();
void fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')
  .then(async (res) => {
    if (!res.ok) return;
    const certs = (await res.json()) as Record<string, string>;
    const cacheControl = res.headers.get('cache-control') || '';
    const match = cacheControl.match(/max-age=(\d+)/);
    const ttlMs = match ? Number(match[1]) * 1000 : 3600 * 1000;
    certsCache = { certs, expiresAt: Date.now() + ttlMs };
  })
  .catch(() => undefined);

// --- Cryptographic Firebase ID Token Verification (zero IAM needed) ---
interface CachedCerts {
  certs: Record<string, string>;
  expiresAt: number;
}
let certsCache: CachedCerts | null = null;
let certsInFlight: Promise<Record<string, string>> | null = null;

export async function getGoogleCerts(forceRefresh = false): Promise<Record<string, string>> {
  if (!forceRefresh && certsCache && Date.now() < certsCache.expiresAt) {
    return certsCache.certs;
  }
  if (!forceRefresh && certsInFlight) {
    return certsInFlight;
  }
  const promise = (async () => {
    const res = await fetch(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch Firebase public keys (${res.status})`);
    }
    const certs = (await res.json()) as Record<string, string>;
    const cacheControl = res.headers.get('cache-control') || '';
    const match = cacheControl.match(/max-age=(\d+)/);
    const ttlMs = match ? Number(match[1]) * 1000 : 3600 * 1000;
    certsCache = { certs, expiresAt: Date.now() + ttlMs };
    return certs;
  })();

  certsInFlight = promise;
  try {
    return await promise;
  } finally {
    if (certsInFlight === promise) {
      certsInFlight = null;
    }
  }
}

interface VerifiedFirebaseToken {
  uid: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseToken> {
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Malformed Firebase ID token');
  const [headerB64, payloadB64, sigB64] = parts;
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf-8'));
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Invalid token algorithm or key ID');
  }

  let certs = await getGoogleCerts();
  let certPem = certs[header.kid];
  if (!certPem) {
    certs = await getGoogleCerts(true);
    certPem = certs[header.kid];
  }
  if (!certPem) {
    throw new Error('Unknown Firebase signing key');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();
  const signature = Buffer.from(sigB64, 'base64url');
  if (!verifier.verify(certPem, signature)) {
    throw new Error('Invalid Firebase token signature');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    throw new Error('Firebase token expired');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
    throw new Error('Invalid token issued-at timestamp');
  }
  if (payload.aud !== FIREBASE_PROJECT_ID) {
    throw new Error('Token audience mismatch');
  }
  if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) {
    throw new Error('Token issuer mismatch');
  }
  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Missing subject UID');
  }

  return {
    uid: payload.sub,
    email: String(payload.email || '').toLowerCase(),
    name: String(payload.name || payload.email || 'SavvvnLab Member'),
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
    emailVerified: Boolean(payload.email_verified),
  };
}

interface AuthedRequest extends Request {
  authToken?: VerifiedFirebaseToken;
  currentUser?: UserProfile;
}

async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token = authHeader.slice(7).trim();
    const verified = await verifyFirebaseIdToken(token);
    req.authToken = verified;
    return next();
  } catch (err: any) {
    return res.status(401).json({ error: err?.message || 'Invalid session token' });
  }
}

async function requireMember(req: AuthedRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    const db = readDb();
    const user = db.users.find((u) => u.uid === req.authToken?.uid);
    if (!user) {
      return res.status(403).json({ error: 'User profile not initialized' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account is currently suspended by administrator' });
    }
    req.currentUser = user;
    return next();
  });
}

async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  await requireMember(req, res, () => {
    const tokenEmail = (req.authToken?.email || '').trim().toLowerCase();
    const userEmail = (req.currentUser?.email || '').trim().toLowerCase();
    const isAllowed =
      Boolean(req.authToken?.emailVerified) &&
      isAuthorizedAdminEmail(tokenEmail) &&
      isAuthorizedAdminEmail(userEmail) &&
      req.currentUser?.role === 'admin';
    if (!isAllowed) {
      return res.status(403).json({
        error: 'Administrator access is restricted exclusively to the authorized admin account.',
      });
    }
    return next();
  });
}

// --- Server-Side Ledger & Analytics Helpers ---
function computeWalletForUser(db: SavvvnDatabase, userId: string): WalletSummary {
  const userLedger = db.walletLedger.filter((w) => w.userId === userId);
  const availableBalance = Number(
    userLedger.reduce((sum, entry) => sum + entry.amount, 0).toFixed(2)
  );

  const userCommissions = db.commissionLedger.filter((c) => c.beneficiaryUid === userId);
  const pendingCommission = Number(
    userCommissions
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + c.commissionAmount, 0)
      .toFixed(2)
  );
  const approvedCommissions = userCommissions.filter((c) => c.status === 'approved');
  const totalEarned = Number(
    approvedCommissions.reduce((sum, c) => sum + c.commissionAmount, 0).toFixed(2)
  );

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  let todayEarned = 0;
  let weekEarned = 0;
  let monthEarned = 0;

  for (const c of approvedCommissions) {
    const ts = new Date(c.approvedAt || c.createdAt).getTime();
    if (ts >= startOfToday.getTime()) todayEarned += c.commissionAmount;
    if (ts >= now - 7 * dayMs) weekEarned += c.commissionAmount;
    if (ts >= now - 30 * dayMs) monthEarned += c.commissionAmount;
  }

  const totalWithdrawn = Number(
    db.withdrawals
      .filter((w) => w.userId === userId && w.status === 'paid')
      .reduce((sum, w) => sum + w.amount, 0)
      .toFixed(2)
  );

  return {
    availableBalance: Math.max(0, availableBalance),
    pendingCommission: Math.max(0, pendingCommission),
    totalEarned: Math.max(0, totalEarned),
    totalWithdrawn: Math.max(0, totalWithdrawn),
    todayEarned: Number(todayEarned.toFixed(2)),
    weekEarned: Number(weekEarned.toFixed(2)),
    monthEarned: Number(monthEarned.toFixed(2)),
  };
}

function buildLeaderboard(db: SavvvnDatabase, days?: number): LeaderboardEntry[] {
  const cutoff = days ? Date.now() - days * 24 * 60 * 60 * 1000 : 0;
  const map = new Map<string, { totalCommission: number; verifiedSales: number }>();

  for (const entry of db.commissionLedger) {
    if (entry.status !== 'approved') continue;
    const ts = new Date(entry.approvedAt || entry.createdAt).getTime();
    if (cutoff && ts < cutoff) continue;
    const prev = map.get(entry.beneficiaryUid) || { totalCommission: 0, verifiedSales: 0 };
    prev.totalCommission += entry.commissionAmount;
    prev.verifiedSales += 1;
    map.set(entry.beneficiaryUid, prev);
  }

  const list: LeaderboardEntry[] = [];
  for (const [uid, stats] of map.entries()) {
    const user = db.users.find((u) => u.uid === uid);
    if (!user) continue;
    list.push({
      uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
      referralCode: user.referralCode,
      totalCommission: Number(stats.totalCommission.toFixed(2)),
      verifiedSales: stats.verifiedSales,
    });
  }

  return list.sort((a, b) => b.totalCommission - a.totalCommission).slice(0, 20);
}

function build7DaySeries(items: Array<{ amount: number; dateStr: string }>): Array<{ label: string; amount: number }> {
  const days: Array<{ key: string; label: string; amount: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
    days.push({ key, label, amount: 0 });
  }
  for (const item of items) {
    const dayKey = item.dateStr.slice(0, 10);
    const slot = days.find((d) => d.key === dayKey);
    if (slot) slot.amount += item.amount;
  }
  return days.map(({ label, amount }) => ({ label, amount: Number(amount.toFixed(2)) }));
}

function addAuditLog(
  db: SavvvnDatabase,
  actorUid: string,
  actorEmail: string,
  action: string,
  targetPath: string,
  details: string
): void {
  db.auditLogs.unshift({
    id: genId('aud'),
    actorUid,
    actorEmail,
    action,
    targetPath,
    details,
    createdAt: nowIso(),
  });
  if (db.auditLogs.length > 500) db.auditLogs.length = 500;
}

function addNotification(
  db: SavvvnDatabase,
  userId: string,
  title: string,
  message: string,
  category: NotificationItem['category']
): void {
  db.notifications.unshift({
    id: genId('ntf'),
    userId,
    title,
    message,
    category,
    readBy: [],
    createdAt: nowIso(),
  });
  if (db.notifications.length > 300) db.notifications.length = 300;
}

function generateUniqueReferralCode(db: SavvvnDatabase): string {
  for (let i = 0; i < 20; i++) {
    const candidate = `REF-${crypto.randomInt(1000, 9999)}`;
    if (!db.users.some((u) => u.referralCode === candidate)) return candidate;
  }
  return `REF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

// ============================================================
// PUBLIC ROUTES
// ============================================================

app.get('/api/health', (_req, res) => {
  const db = readDb();
  res.json({
    ok: true,
    activePackages: db.packages.filter((p) => p.active).length,
  });
});

app.get('/api/public/catalog', (_req, res) => {
  const db = readDb();
  const response: PublicCatalogResponse = {
    packages: db.packages.filter((p) => p.active).sort((a, b) => a.sortOrder - b.sortOrder),
    courses: db.courses.filter((c) => c.active),
    packageCourses: db.packageCourses,
    offers: db.offers.filter((o) => o.active),
    settings: {
      siteName: db.settings.siteName,
      tagline: db.settings.tagline,
      heroTitle: db.settings.heroTitle,
      heroSubtitle: db.settings.heroSubtitle,
      aboutSummary: db.settings.aboutSummary,
      supportEmail: db.settings.supportEmail,
      supportPhone: db.settings.supportPhone,
      instagramUrl: db.settings.instagramUrl,
      youtubeUrl: db.settings.youtubeUrl,
      telegramUrl: db.settings.telegramUrl,
      whatsappUrl: db.settings.whatsappUrl,
      upiId: db.settings.upiId,
      upiPayeeName: db.settings.upiPayeeName,
      upiInstructions: db.settings.upiInstructions,
      customUpiQrUrl: db.settings.customUpiQrUrl,
      minWithdrawal: db.settings.minWithdrawal,
      defaultCommissionPercent: db.settings.defaultCommissionPercent,
    },
  };
  res.json(response);
});

app.post('/api/public/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};
    if (
      typeof name !== 'string' ||
      name.trim().length < 2 ||
      typeof email !== 'string' ||
      !email.includes('@') ||
      typeof subject !== 'string' ||
      subject.trim().length < 2 ||
      typeof message !== 'string' ||
      message.trim().length < 5
    ) {
      return res.status(400).json({ error: 'Please complete all fields accurately.' });
    }

    const ticket = await withDbLock((db) => {
      const created: SupportTicket = {
        id: genId('tkt'),
        userId: null,
        name: name.trim().slice(0, 120),
        email: email.trim().toLowerCase().slice(0, 254),
        subject: subject.trim().slice(0, 160),
        message: message.trim().slice(0, 2000),
        status: 'open',
        createdAt: nowIso(),
      };
      db.supportTickets.unshift(created);
      return created;
    });

    return res.json({ success: true, ticket });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to submit inquiry' });
  }
});

// ============================================================
// AUTHENTICATED USER ROUTES
// ============================================================

app.post('/api/auth/session', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const token = req.authToken!;
    const { referralCode } = req.body || {};
    const cleanRef =
      typeof referralCode === 'string' ? referralCode.trim().toUpperCase().slice(0, 32) : '';

    // Fast-path unchanged existing users without acquiring DB write lock or rewriting disk
    const currentDb = readDb();
    const email = token.email.toLowerCase();
    const isAdminEmailFast = Boolean(token.emailVerified && isAuthorizedAdminEmail(email));
    const existingFast = currentDb.users.find((u) => u.uid === token.uid);

    if (existingFast) {
      if (existingFast.status === 'suspended') {
        return res.status(403).json({ error: 'Your account has been suspended by administrator.' });
      }
      const expectedRole: UserProfile['role'] = isAdminEmailFast ? 'admin' : 'member';
      const needsEmailUpdate = Boolean(email && existingFast.email !== email);
      const needsRoleUpdate = existingFast.role !== expectedRole;
      const needsPhotoBackfill = Boolean(
        token.picture && existingFast.photoURL === undefined && !existingFast.photoRemoved
      );
      const canBindSponsor =
        !existingFast.referredByUid &&
        Boolean(cleanRef) &&
        currentDb.users.some(
          (u) => u.referralCode === cleanRef && u.uid !== existingFast.uid && u.status === 'active'
        );

      if (!needsEmailUpdate && !needsRoleUpdate && !needsPhotoBackfill && !canBindSponsor) {
        return res.json({ user: existingFast });
      }
    }

    const user = await withDbLock((db) => {
      const isAdminEmail = Boolean(token.emailVerified && isAuthorizedAdminEmail(email));

      let existing = db.users.find((u) => u.uid === token.uid);
      const ts = nowIso();

      if (!existing) {
        let sponsor: UserProfile | undefined;
        if (cleanRef) {
          sponsor = db.users.find(
            (u) => u.referralCode === cleanRef && u.uid !== token.uid && u.status === 'active'
          );
        }

        existing = {
          uid: token.uid,
          email,
          displayName: token.name || email.split('@')[0] || 'Member',
          photoURL: token.picture || '',
          photoRemoved: false,
          phone: '',
          role: isAdminEmail ? 'admin' : 'member',
          status: 'active',
          referralCode: generateUniqueReferralCode(db),
          referredByUid: sponsor ? sponsor.uid : null,
          referredByCode: sponsor ? sponsor.referralCode : null,
          upiId: '',
          unlockedPackageIds: [],
          createdAt: ts,
          updatedAt: ts,
        };
        db.users.push(existing);

        if (sponsor) {
          const refRecord: Referral = {
            id: genId('ref'),
            sponsorUid: sponsor.uid,
            sponsorName: sponsor.displayName,
            sponsorEmail: sponsor.email,
            referredUid: existing.uid,
            referredName: existing.displayName,
            referredEmail: existing.email,
            referralCode: sponsor.referralCode,
            createdAt: ts,
          };
          db.referrals.unshift(refRecord);
          addNotification(
            db,
            sponsor.uid,
            'New Referral Joined',
            `${existing.displayName} joined SavvvnLab using your referral code ${sponsor.referralCode}.`,
            'announcement'
          );
        }

        addAuditLog(db, existing.uid, existing.email, 'USER_REGISTERED', `users/${existing.uid}`, `Role: ${existing.role}`);
      } else {
        existing.email = email || existing.email;
        existing.role = isAdminEmail ? 'admin' : 'member';
        if (token.picture && existing.photoURL === undefined && !existing.photoRemoved) {
          existing.photoURL = token.picture;
        }
        // Bind sponsor ONLY if user currently has no sponsor and no orders yet
        if (!existing.referredByUid && cleanRef) {
          const sponsor = db.users.find(
            (u) => u.referralCode === cleanRef && u.uid !== existing!.uid && u.status === 'active'
          );
          if (sponsor) {
            existing.referredByUid = sponsor.uid;
            existing.referredByCode = sponsor.referralCode;
            db.referrals.unshift({
              id: genId('ref'),
              sponsorUid: sponsor.uid,
              sponsorName: sponsor.displayName,
              sponsorEmail: sponsor.email,
              referredUid: existing.uid,
              referredName: existing.displayName,
              referredEmail: existing.email,
              referralCode: sponsor.referralCode,
              createdAt: ts,
            });
          }
        }
        existing.updatedAt = ts;
      }

      return existing;
    });

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended by administrator.' });
    }

    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to establish session' });
  }
});

app.get('/api/me/overview', requireMember, (req: AuthedRequest, res) => {
  const db = readDb();
  const user = req.currentUser!;
  const wallet = computeWalletForUser(db, user.uid);

  const orders = db.orders.filter((o) => o.userId === user.uid);
  const payments = db.payments.filter((p) => p.userId === user.uid);
  const commissions = db.commissionLedger.filter((c) => c.beneficiaryUid === user.uid);
  const walletLedger = db.walletLedger.filter((w) => w.userId === user.uid);
  const withdrawals = db.withdrawals.filter((w) => w.userId === user.uid);

  const directUsers = db.users.filter((u) => u.referredByUid === user.uid);
  const directMembers = directUsers.map((m) => ({
    uid: m.uid,
    displayName: m.displayName,
    email: m.email,
    referralCode: m.referralCode,
    unlockedCount: m.unlockedPackageIds.length,
    active: m.status === 'active' && m.unlockedPackageIds.length > 0,
    joinedAt: m.createdAt,
  }));

  const salesSeries = build7DaySeries(
    commissions
      .filter((c) => c.status === 'approved')
      .map((c) => ({ amount: c.commissionAmount, dateStr: c.approvedAt || c.createdAt }))
  );

  const notifications = db.notifications.filter(
    (n) => n.userId === user.uid || n.userId === 'all'
  );
  const tickets = db.supportTickets.filter(
    (t) => t.userId === user.uid || t.email === user.email
  );

  const overview: MemberOverviewResponse = {
    user,
    wallet,
    orders,
    payments,
    commissions,
    walletLedger,
    withdrawals,
    team: {
      totalMembers: directMembers.length,
      activeMembers: directMembers.filter((m) => m.active).length,
      directMembers,
    },
    leaderboard: {
      days7: buildLeaderboard(db, 7),
      days30: buildLeaderboard(db, 30),
      allTime: buildLeaderboard(db),
    },
    salesSeries,
    notifications,
    offers: db.offers.filter((o) => o.active),
    tickets,
  };

  res.json(overview);
});

app.patch('/api/me/profile', requireMember, async (req: AuthedRequest, res) => {
  try {
    const uid = req.currentUser!.uid;
    const { displayName, phone, upiId, photoURL, photoRemoved } = req.body || {};

    const updated = await withDbLock((db) => {
      const user = db.users.find((u) => u.uid === uid);
      if (!user) throw new Error('User not found');

      if (typeof displayName === 'string' && displayName.trim().length >= 2) {
        user.displayName = displayName.trim().slice(0, 120);
      }
      if (typeof phone === 'string') {
        user.phone = phone.trim().slice(0, 32);
      }
      if (typeof upiId === 'string') {
        const cleanUpi = upiId.trim().slice(0, 120);
        if (cleanUpi && !cleanUpi.includes('@')) {
          throw new Error('UPI ID must be in valid handle format (e.g. name@upi)');
        }
        user.upiId = cleanUpi;
      }
      if (typeof photoURL === 'string') {
        const cleanPhoto = photoURL.trim().slice(0, 2000);
        if (cleanPhoto === '') {
          user.photoURL = '';
          user.photoRemoved = true;
        } else if (cleanPhoto.startsWith('https://')) {
          user.photoURL = cleanPhoto;
          user.photoRemoved = Boolean(photoRemoved);
        } else {
          throw new Error('Profile picture URL must be a valid https:// Cloudinary or web URL.');
        }
      } else if (typeof photoRemoved === 'boolean') {
        user.photoRemoved = photoRemoved;
        if (photoRemoved) {
          user.photoURL = '';
        }
      }
      user.updatedAt = nowIso();
      return user;
    });

    return res.json({ user: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Profile update failed' });
  }
});

function getCloudinaryConfig(): { cloudName: string; apiKey: string; apiSecret: string } {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary credentials are not configured on the server. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Secrets.'
    );
  }
  return { cloudName, apiKey, apiSecret };
}

function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const serialized = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('sha1').update(`${serialized}${apiSecret}`).digest('hex');
}

function extractCloudinaryPublicId(imageUrl: string, cloudName: string): string | null {
  try {
    const parsed = new URL(imageUrl);
    if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== 'res.cloudinary.com') {
      return null;
    }
    const lowerPath = parsed.pathname.toLowerCase();
    const expectedPrefix = `/${cloudName.toLowerCase()}/image/upload/`;
    if (!lowerPath.startsWith(expectedPrefix)) {
      return null;
    }
    const restPath = parsed.pathname.slice(expectedPrefix.length);
    const segments = restPath.split('/').filter(Boolean);
    const startIdx = segments[0] && /^v\d+$/.test(segments[0]) ? 1 : 0;
    const rawPublicPath = segments.slice(startIdx).join('/');
    const publicId = decodeURIComponent(rawPublicPath).replace(/\.[a-zA-Z0-9]+$/, '');
    return publicId || null;
  } catch {
    return null;
  }
}

app.post('/api/uploads/profile-signature', requireMember, (req: AuthedRequest, res) => {
  try {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    const safeUid = req.currentUser!.uid.replace(/[^a-zA-Z0-9_-]/g, '') || 'user';
    const folder = `savvvnlab/profile-pictures/${safeUid}`;
    const publicId = `avatar-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const timestamp = Math.floor(Date.now() / 1000);

    const signature = signCloudinaryParams(
      {
        folder,
        public_id: publicId,
        timestamp,
      },
      apiSecret
    );

    return res.json({
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
      publicId,
    });
  } catch (err: any) {
    return res.status(503).json({
      error: err?.message || 'Unable to initialize profile picture upload.',
    });
  }
});

app.post('/api/admin/uploads/cover-signature', requireAdmin, (req: AuthedRequest, res) => {
  try {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    const rawKey = typeof req.body?.packageKey === 'string' ? req.body.packageKey : 'pkg';
    const safeKey = rawKey.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) || 'pkg';
    const folder = 'savvvnlab/package-covers';
    const publicId = `${safeKey}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const timestamp = Math.floor(Date.now() / 1000);

    const signature = signCloudinaryParams(
      {
        folder,
        public_id: publicId,
        timestamp,
      },
      apiSecret
    );

    return res.json({
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
      publicId,
    });
  } catch (err: any) {
    return res.status(503).json({
      error: err?.message || 'Unable to initialize package cover upload.',
    });
  }
});

app.post('/api/uploads/cloudinary/destroy', requireMember, async (req: AuthedRequest, res) => {
  try {
    const imageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl.trim() : '';
    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    const publicId = extractCloudinaryPublicId(imageUrl, cloudName);
    if (!publicId) {
      return res.status(400).json({ error: 'Invalid Cloudinary image URL' });
    }

    const safeUid = req.currentUser!.uid.replace(/[^a-zA-Z0-9_-]/g, '') || 'user';
    const isOwnProfilePic = publicId.startsWith(`savvvnlab/profile-pictures/${safeUid}/`);
    const isAdminCover =
      Boolean(req.authToken?.emailVerified) &&
      isAuthorizedAdminEmail(req.authToken?.email) &&
      req.currentUser?.role === 'admin' &&
      publicId.startsWith('savvvnlab/package-covers/');

    if (!isOwnProfilePic && !isAdminCover) {
      return res.status(403).json({ error: 'Not authorized to remove this image.' });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signCloudinaryParams(
      {
        public_id: publicId,
        timestamp,
      },
      apiSecret
    );

    const form = new URLSearchParams();
    form.set('public_id', publicId);
    form.set('timestamp', String(timestamp));
    form.set('api_key', apiKey);
    form.set('signature', signature);

    const destroyRes = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      }
    );

    const result = await destroyRes.json().catch(() => ({}));
    return res.json({ ok: destroyRes.ok, result: result?.result || 'unknown' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to delete Cloudinary image' });
  }
});

app.post('/api/orders', requireMember, async (req: AuthedRequest, res) => {
  try {
    const uid = req.currentUser!.uid;
    const { packageId, referralCode } = req.body || {};
    if (typeof packageId !== 'string' || !packageId) {
      return res.status(400).json({ error: 'Valid packageId is required' });
    }

    const order = await withDbLock((db) => {
      const user = db.users.find((u) => u.uid === uid);
      if (!user) throw new Error('User not found');
      const pkg = db.packages.find((p) => p.id === packageId && p.active);
      if (!pkg) throw new Error('Selected package is unavailable');
      if (user.unlockedPackageIds.includes(pkg.id)) {
        throw new Error('You already own this package');
      }

      // Reuse existing awaiting_payment order for same user+package to avoid clutter
      const existingPending = db.orders.find(
        (o) => o.userId === uid && o.packageId === pkg.id && o.status === 'awaiting_payment'
      );
      if (existingPending) {
        existingPending.amount = pkg.price;
        existingPending.updatedAt = nowIso();
        return existingPending;
      }

      let sponsorUid = user.referredByUid || null;
      let usedCode = user.referredByCode || null;

      if (!sponsorUid && typeof referralCode === 'string' && referralCode.trim()) {
        const cleanCode = referralCode.trim().toUpperCase();
        const sponsor = db.users.find(
          (u) => u.referralCode === cleanCode && u.uid !== user.uid && u.status === 'active'
        );
        if (sponsor) {
          sponsorUid = sponsor.uid;
          usedCode = sponsor.referralCode;
          user.referredByUid = sponsor.uid;
          user.referredByCode = sponsor.referralCode;
        }
      }

      const ts = nowIso();
      const created: Order = {
        id: genId('ORD'),
        userId: user.uid,
        userName: user.displayName,
        userEmail: user.email,
        packageId: pkg.id,
        packageName: pkg.name,
        amount: pkg.price, // strictly server-side catalog price
        sponsorUid,
        referralCode: usedCode,
        status: 'awaiting_payment',
        createdAt: ts,
        updatedAt: ts,
      };
      db.orders.unshift(created);
      addAuditLog(db, user.uid, user.email, 'ORDER_CREATED', `orders/${created.id}`, `${pkg.name} (₹${pkg.price})`);
      return created;
    });

    return res.json({ order });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Unable to create order' });
  }
});

app.post('/api/payments/submit', requireMember, async (req: AuthedRequest, res) => {
  try {
    const uid = req.currentUser!.uid;
    const { orderId, utr, screenshotUrl } = req.body || {};

    if (typeof orderId !== 'string' || !orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    const cleanUtr = typeof utr === 'string' ? utr.trim().toUpperCase() : '';
    if (!/^[A-Z0-9]{8,40}$/.test(cleanUtr)) {
      return res.status(400).json({
        error: 'Please enter a valid 8-40 character alphanumeric UTR / UPI transaction reference.',
      });
    }
    if (
      typeof screenshotUrl !== 'string' ||
      !screenshotUrl.startsWith('data:image/') ||
      screenshotUrl.length > 2_500_000
    ) {
      return res.status(400).json({
        error: 'Please upload a valid payment screenshot image (max 2MB).',
      });
    }

    const result = await withDbLock((db) => {
      if (!db.settings.upiId || !db.settings.upiId.trim()) {
        throw new Error('Admin UPI payment configuration is currently pending setup.');
      }

      const order = db.orders.find((o) => o.id === orderId && o.userId === uid);
      if (!order) throw new Error('Order not found for your account');
      if (order.status === 'paid') throw new Error('This order is already verified and paid');
      if (order.status === 'pending_verification') {
        throw new Error('Payment proof for this order is already awaiting admin verification');
      }

      // Duplicate UTR prevention across non-rejected payments
      const duplicateUtr = db.payments.find(
        (p) => p.utr.toUpperCase() === cleanUtr && p.status !== 'rejected'
      );
      if (duplicateUtr) {
        throw new Error('This UTR / reference number has already been submitted.');
      }

      const ts = nowIso();
      const payment: Payment = {
        id: genId('PAY'),
        orderId: order.id,
        userId: uid,
        userName: order.userName,
        userEmail: order.userEmail,
        packageId: order.packageId,
        packageName: order.packageName,
        amount: order.amount, // exact order amount from server
        utr: cleanUtr,
        screenshotUrl,
        upiIdPaidTo: db.settings.upiId,
        status: 'pending',
        createdAt: ts,
      };

      db.payments.unshift(payment);
      order.status = 'pending_verification';
      order.updatedAt = ts;

      addNotification(
        db,
        uid,
        'Payment Submitted for Verification',
        `Your UPI payment (UTR: ${cleanUtr}) for ${order.packageName} is pending manual admin verification.`,
        'payment'
      );
      addAuditLog(
        db,
        uid,
        order.userEmail,
        'PAYMENT_SUBMITTED',
        `payments/${payment.id}`,
        `Order ${order.id} · UTR ${cleanUtr} · ₹${order.amount}`
      );

      return { payment, order };
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Payment submission failed' });
  }
});

app.post('/api/withdrawals/request', requireMember, async (req: AuthedRequest, res) => {
  try {
    const uid = req.currentUser!.uid;
    const { amount, upiId } = req.body || {};
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Enter a valid withdrawal amount' });
    }
    const cleanUpi = typeof upiId === 'string' ? upiId.trim().slice(0, 120) : '';
    if (!cleanUpi || !cleanUpi.includes('@') || cleanUpi.length < 4) {
      return res.status(400).json({ error: 'Enter a valid UPI ID (e.g. username@okaxis)' });
    }

    const withdrawal = await withDbLock((db) => {
      const user = db.users.find((u) => u.uid === uid);
      if (!user) throw new Error('User not found');

      const minW = db.settings.minWithdrawal || 500;
      const maxW = db.settings.maxWithdrawal || 25000;
      if (parsedAmount < minW) {
        throw new Error(`Minimum withdrawal amount is ₹${minW}`);
      }
      if (parsedAmount > maxW) {
        throw new Error(`Maximum single withdrawal amount is ₹${maxW}`);
      }

      const wallet = computeWalletForUser(db, uid);
      if (parsedAmount > wallet.availableBalance) {
        throw new Error(
          `Insufficient available balance (Available: ₹${wallet.availableBalance.toLocaleString('en-IN')})`
        );
      }

      // Guard against duplicate accidental double-submission within 60 seconds
      const recentDuplicate = db.withdrawals.find(
        (w) =>
          w.userId === uid &&
          w.status === 'pending' &&
          w.amount === parsedAmount &&
          Date.now() - new Date(w.createdAt).getTime() < 60_000
      );
      if (recentDuplicate) {
        throw new Error('Duplicate withdrawal request detected. Please wait a moment.');
      }

      const ts = nowIso();
      const created: Withdrawal = {
        id: genId('WDR'),
        userId: uid,
        userName: user.displayName,
        userEmail: user.email,
        amount: Number(parsedAmount.toFixed(2)),
        upiId: cleanUpi,
        status: 'pending',
        createdAt: ts,
      };
      db.withdrawals.unshift(created);

      // Immediately debit available balance in immutable walletLedger to prevent overspending
      const debitEntry: WalletLedgerEntry = {
        id: genId('WLG'),
        userId: uid,
        type: 'withdrawal_debit',
        amount: -Number(parsedAmount.toFixed(2)),
        referenceId: created.id,
        description: `Withdrawal request to ${cleanUpi}`,
        createdAt: ts,
      };
      db.walletLedger.unshift(debitEntry);

      // Save user's preferred UPI payout handle
      user.upiId = cleanUpi;
      user.updatedAt = ts;

      addNotification(
        db,
        uid,
        'Withdrawal Request Placed',
        `Withdrawal of ₹${parsedAmount} to ${cleanUpi} has been queued for admin processing.`,
        'withdrawal'
      );
      addAuditLog(
        db,
        uid,
        user.email,
        'WITHDRAWAL_REQUESTED',
        `withdrawals/${created.id}`,
        `₹${parsedAmount} to ${cleanUpi}`
      );
      return created;
    });

    return res.json({ withdrawal });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Withdrawal request failed' });
  }
});

app.post('/api/notifications/read', requireMember, async (req: AuthedRequest, res) => {
  try {
    const uid = req.currentUser!.uid;
    const { notificationId } = req.body || {};
    await withDbLock((db) => {
      for (const n of db.notifications) {
        if ((n.userId === uid || n.userId === 'all') && (!notificationId || n.id === notificationId)) {
          if (!n.readBy.includes(uid)) n.readBy.push(uid);
        }
      }
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to mark notifications' });
  }
});

app.post('/api/support/tickets', requireMember, async (req: AuthedRequest, res) => {
  try {
    const user = req.currentUser!;
    const { subject, message } = req.body || {};
    if (
      typeof subject !== 'string' ||
      subject.trim().length < 2 ||
      typeof message !== 'string' ||
      message.trim().length < 5
    ) {
      return res.status(400).json({ error: 'Subject and detailed message are required.' });
    }

    const ticket = await withDbLock((db) => {
      const created: SupportTicket = {
        id: genId('tkt'),
        userId: user.uid,
        name: user.displayName,
        email: user.email,
        subject: subject.trim().slice(0, 160),
        message: message.trim().slice(0, 2000),
        status: 'open',
        createdAt: nowIso(),
      };
      db.supportTickets.unshift(created);
      addAuditLog(db, user.uid, user.email, 'SUPPORT_TICKET_CREATED', `supportTickets/${created.id}`, created.subject);
      return created;
    });

    return res.json({ ticket });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Ticket submission failed' });
  }
});

// ============================================================
// ADMIN ROUTES (Strictly server-verified admin role)
// ============================================================

app.get('/api/admin/overview', requireAdmin, (_req: AuthedRequest, res) => {
  const db = readDb();

  const members = db.users.map((u) => ({
    ...u,
    wallet: computeWalletForUser(db, u.uid),
    ordersCount: db.orders.filter((o) => o.userId === u.uid && o.status === 'paid').length,
  }));

  const paidOrders = db.orders.filter((o) => o.status === 'paid');
  const grossRevenue = Number(paidOrders.reduce((s, o) => s + o.amount, 0).toFixed(2));
  const pendingPaymentsCount = db.payments.filter((p) => p.status === 'pending').length;
  const pendingCommissionsAmount = Number(
    db.commissionLedger
      .filter((c) => c.status === 'pending')
      .reduce((s, c) => s + c.commissionAmount, 0)
      .toFixed(2)
  );
  const approvedCommissionsAmount = Number(
    db.commissionLedger
      .filter((c) => c.status === 'approved')
      .reduce((s, c) => s + c.commissionAmount, 0)
      .toFixed(2)
  );
  const pendingWithdrawalsAmount = Number(
    db.withdrawals
      .filter((w) => w.status === 'pending' || w.status === 'approved')
      .reduce((s, w) => s + w.amount, 0)
      .toFixed(2)
  );
  const paidWithdrawalsAmount = Number(
    db.withdrawals
      .filter((w) => w.status === 'paid')
      .reduce((s, w) => s + w.amount, 0)
      .toFixed(2)
  );

  const response: AdminOverviewResponse = {
    stats: {
      totalMembers: db.users.length,
      activeMembers: db.users.filter((u) => u.status === 'active').length,
      totalVerifiedOrders: paidOrders.length,
      grossRevenue,
      pendingPaymentsCount,
      pendingCommissionsAmount,
      approvedCommissionsAmount,
      pendingWithdrawalsAmount,
      paidWithdrawalsAmount,
    },
    salesSeries: build7DaySeries(
      paidOrders.map((o) => ({ amount: o.amount, dateStr: o.updatedAt || o.createdAt }))
    ),
    members,
    packages: [...db.packages].sort((a, b) => a.sortOrder - b.sortOrder),
    courses: db.courses,
    packageCourses: db.packageCourses,
    orders: db.orders,
    payments: db.payments,
    referrals: db.referrals,
    commissionLedger: db.commissionLedger,
    walletLedger: db.walletLedger,
    withdrawals: db.withdrawals,
    leaderboard: {
      days7: buildLeaderboard(db, 7),
      days30: buildLeaderboard(db, 30),
      allTime: buildLeaderboard(db),
    },
    notifications: db.notifications,
    offers: db.offers,
    tickets: db.supportTickets,
    settings: db.settings,
    adminAllowlist: db.adminAllowlist,
    auditLogs: db.auditLogs,
  };

  res.json(response);
});

app.post('/api/admin/payments/:id/verify', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const admin = req.currentUser!;
    const { id } = req.params;
    const { action, adminNote } = req.body || {};

    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: 'Action must be approve or reject' });
    }

    const result = await withDbLock((db) => {
      const payment = db.payments.find((p) => p.id === id);
      if (!payment) throw new Error('Payment submission not found');
      if (payment.status !== 'pending') {
        throw new Error(`Payment is already ${payment.status}`);
      }

      const order = db.orders.find((o) => o.id === payment.orderId);
      if (!order) throw new Error('Linked order not found');
      const buyer = db.users.find((u) => u.uid === payment.userId);
      if (!buyer) throw new Error('Buyer profile not found');

      const ts = nowIso();
      payment.status = action === 'approve' ? 'approved' : 'rejected';
      payment.adminNote = typeof adminNote === 'string' ? adminNote.trim().slice(0, 500) : '';
      payment.verifiedBy = admin.email;
      payment.verifiedAt = ts;

      if (action === 'approve') {
        order.status = 'paid';
        order.updatedAt = ts;

        if (!buyer.unlockedPackageIds.includes(order.packageId)) {
          buyer.unlockedPackageIds.push(order.packageId);
          buyer.updatedAt = ts;
        }

        addNotification(
          db,
          buyer.uid,
          'Package Unlocked!',
          `Your UPI payment (UTR: ${payment.utr}) for ${order.packageName} has been verified. Your courses are now unlocked.`,
          'payment'
        );

        // Commission engine (strictly idempotent per orderId & sponsor !== buyer)
        const sponsorUid = order.sponsorUid || buyer.referredByUid;
        if (sponsorUid && sponsorUid !== buyer.uid) {
          const sponsor = db.users.find((u) => u.uid === sponsorUid && u.status === 'active');
          const alreadyCreated = db.commissionLedger.some((c) => c.orderId === order.id);

          if (sponsor && !alreadyCreated) {
            const pkg = db.packages.find((p) => p.id === order.packageId);
            const rate = pkg?.commissionRate ?? db.settings.defaultCommissionPercent ?? 25;
            const commissionAmount = Number(((order.amount * rate) / 100).toFixed(2));

            if (commissionAmount > 0) {
              const autoApprove = Boolean(db.settings.autoApproveCommission);
              const commEntry: CommissionEntry = {
                id: genId('COM'),
                orderId: order.id,
                paymentId: payment.id,
                beneficiaryUid: sponsor.uid,
                beneficiaryName: sponsor.displayName,
                beneficiaryEmail: sponsor.email,
                buyerUid: buyer.uid,
                buyerName: buyer.displayName,
                packageId: order.packageId,
                packageName: order.packageName,
                saleAmount: order.amount,
                commissionRate: rate,
                commissionAmount,
                status: autoApprove ? 'approved' : 'pending',
                approvedBy: autoApprove ? 'auto_rule' : undefined,
                approvedAt: autoApprove ? ts : undefined,
                createdAt: ts,
              };
              db.commissionLedger.unshift(commEntry);

              if (autoApprove) {
                db.walletLedger.unshift({
                  id: genId('WLG'),
                  userId: sponsor.uid,
                  type: 'commission_credit',
                  amount: commissionAmount,
                  referenceId: commEntry.id,
                  description: `Commission credited for ${order.packageName} sale (${buyer.displayName})`,
                  createdAt: ts,
                });
              }

              addNotification(
                db,
                sponsor.uid,
                autoApprove ? 'Commission Credited' : 'Pending Commission Generated',
                `You earned ₹${commissionAmount} (${rate}%) from ${buyer.displayName}'s verified ${order.packageName} purchase.`,
                'commission'
              );
            }
          }
        }

        addAuditLog(
          db,
          admin.uid,
          admin.email,
          'PAYMENT_APPROVED',
          `payments/${payment.id}`,
          `Approved UTR ${payment.utr} · ₹${payment.amount} · Unlocked ${order.packageName} for ${buyer.email}`
        );
      } else {
        order.status = 'rejected';
        order.updatedAt = ts;

        addNotification(
          db,
          buyer.uid,
          'Payment Verification Rejected',
          `Your payment (UTR: ${payment.utr}) could not be verified. ${payment.adminNote ? `Reason: ${payment.adminNote}` : 'Please contact support or resubmit.'}`,
          'payment'
        );
        addAuditLog(
          db,
          admin.uid,
          admin.email,
          'PAYMENT_REJECTED',
          `payments/${payment.id}`,
          `Rejected UTR ${payment.utr} · Note: ${payment.adminNote || 'None'}`
        );
      }

      return { payment, order };
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Payment verification failed' });
  }
});

app.post('/api/admin/orders/:id/refund', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const admin = req.currentUser!;
    const { id } = req.params;
    const { reason } = req.body || {};

    const result = await withDbLock((db) => {
      const order = db.orders.find((o) => o.id === id);
      if (!order) throw new Error('Order not found');
      if (order.status !== 'paid') throw new Error('Only paid orders can be refunded');

      const ts = nowIso();
      order.status = 'refunded';
      order.updatedAt = ts;

      const buyer = db.users.find((u) => u.uid === order.userId);
      if (buyer) {
        const hasOtherPaidForPkg = db.orders.some(
          (o) => o.id !== order.id && o.userId === buyer.uid && o.packageId === order.packageId && o.status === 'paid'
        );
        if (!hasOtherPaidForPkg) {
          buyer.unlockedPackageIds = buyer.unlockedPackageIds.filter((pid) => pid !== order.packageId);
          buyer.updatedAt = ts;
        }
      }

      // Reverse associated commission if present
      const comm = db.commissionLedger.find((c) => c.orderId === order.id && c.status !== 'reversed');
      if (comm) {
        const wasApproved = comm.status === 'approved';
        comm.status = 'reversed';
        comm.adminNote = typeof reason === 'string' ? reason : 'Order refunded';
        if (wasApproved) {
          db.walletLedger.unshift({
            id: genId('WLG'),
            userId: comm.beneficiaryUid,
            type: 'commission_reversal',
            amount: -comm.commissionAmount,
            referenceId: comm.id,
            description: `Commission reversed due to order ${order.id} refund`,
            createdAt: ts,
          });
        }
        addNotification(
          db,
          comm.beneficiaryUid,
          'Commission Reversed',
          `Commission ₹${comm.commissionAmount} for order ${order.id} was reversed due to order refund.`,
          'commission'
        );
      }

      addAuditLog(db, admin.uid, admin.email, 'ORDER_REFUNDED', `orders/${order.id}`, reason || 'Order refunded');
      return { order };
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Refund processing failed' });
  }
});

app.post('/api/admin/commissions/:id/action', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const admin = req.currentUser!;
    const { id } = req.params;
    const { action, note } = req.body || {};

    if (action !== 'approve' && action !== 'reverse') {
      return res.status(400).json({ error: 'Invalid commission action' });
    }

    const updated = await withDbLock((db) => {
      const entry = db.commissionLedger.find((c) => c.id === id);
      if (!entry) throw new Error('Commission entry not found');
      const ts = nowIso();

      if (action === 'approve') {
        if (entry.status !== 'pending') {
          throw new Error(`Cannot approve commission that is already ${entry.status}`);
        }
        entry.status = 'approved';
        entry.approvedBy = admin.email;
        entry.approvedAt = ts;
        if (typeof note === 'string') entry.adminNote = note.trim();

        // Guard against duplicate walletLedger credit for same commission
        const alreadyCredited = db.walletLedger.some(
          (w) => w.referenceId === entry.id && w.type === 'commission_credit'
        );
        if (!alreadyCredited) {
          db.walletLedger.unshift({
            id: genId('WLG'),
            userId: entry.beneficiaryUid,
            type: 'commission_credit',
            amount: entry.commissionAmount,
            referenceId: entry.id,
            description: `Approved commission for ${entry.packageName} (${entry.buyerName})`,
            createdAt: ts,
          });
        }

        addNotification(
          db,
          entry.beneficiaryUid,
          'Commission Credited to Wallet',
          `₹${entry.commissionAmount} has been approved and added to your available wallet balance.`,
          'commission'
        );
        addAuditLog(
          db,
          admin.uid,
          admin.email,
          'COMMISSION_APPROVED',
          `commissionLedger/${entry.id}`,
          `Credited ₹${entry.commissionAmount} to ${entry.beneficiaryEmail}`
        );
      } else {
        if (entry.status === 'reversed') throw new Error('Commission already reversed');
        const wasApproved = entry.status === 'approved';
        entry.status = 'reversed';
        entry.adminNote = typeof note === 'string' ? note.trim() : 'Reversed by admin';

        if (wasApproved) {
          db.walletLedger.unshift({
            id: genId('WLG'),
            userId: entry.beneficiaryUid,
            type: 'commission_reversal',
            amount: -entry.commissionAmount,
            referenceId: entry.id,
            description: `Commission reversal: ${entry.adminNote}`,
            createdAt: ts,
          });
        }

        addNotification(
          db,
          entry.beneficiaryUid,
          'Commission Reversed',
          `Commission ₹${entry.commissionAmount} was reversed. ${entry.adminNote}`,
          'commission'
        );
        addAuditLog(
          db,
          admin.uid,
          admin.email,
          'COMMISSION_REVERSED',
          `commissionLedger/${entry.id}`,
          `Reversed ₹${entry.commissionAmount} (${entry.beneficiaryEmail})`
        );
      }

      return entry;
    });

    return res.json({ commission: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Commission action failed' });
  }
});

app.post('/api/admin/withdrawals/:id/action', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const admin = req.currentUser!;
    const { id } = req.params;
    const { action, payoutReference, adminNote } = req.body || {};

    if (!['approve', 'paid', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid withdrawal action' });
    }

    const updated = await withDbLock((db) => {
      const w = db.withdrawals.find((item) => item.id === id);
      if (!w) throw new Error('Withdrawal request not found');
      if (w.status === 'paid' || w.status === 'rejected') {
        throw new Error(`Withdrawal is already finalized (${w.status})`);
      }

      const ts = nowIso();

      if (action === 'approve') {
        if (w.status !== 'pending') throw new Error('Only pending withdrawals can be approved');
        w.status = 'approved';
        w.adminNote = typeof adminNote === 'string' ? adminNote.trim() : '';
        w.processedBy = admin.email;
        w.processedAt = ts;
        addAuditLog(db, admin.uid, admin.email, 'WITHDRAWAL_APPROVED', `withdrawals/${w.id}`, `₹${w.amount} for ${w.userEmail}`);
      } else if (action === 'paid') {
        const ref = typeof payoutReference === 'string' ? payoutReference.trim() : '';
        if (ref.length < 4) {
          throw new Error('Payout UTR / transaction reference is required to mark Paid');
        }
        w.status = 'paid';
        w.payoutReference = ref;
        w.adminNote = typeof adminNote === 'string' ? adminNote.trim() : '';
        w.processedBy = admin.email;
        w.processedAt = ts;

        addNotification(
          db,
          w.userId,
          'Withdrawal Paid',
          `Your withdrawal of ₹${w.amount} to ${w.upiId} has been paid (Ref: ${ref}).`,
          'withdrawal'
        );
        addAuditLog(
          db,
          admin.uid,
          admin.email,
          'WITHDRAWAL_PAID',
          `withdrawals/${w.id}`,
          `₹${w.amount} paid to ${w.upiId} · Ref: ${ref}`
        );
      } else {
        w.status = 'rejected';
        w.adminNote = typeof adminNote === 'string' ? adminNote.trim() : 'Rejected by admin';
        w.processedBy = admin.email;
        w.processedAt = ts;

        // Refund debited balance back to user's walletLedger atomically
        const alreadyRefunded = db.walletLedger.some(
          (entry) => entry.referenceId === w.id && entry.type === 'withdrawal_refund'
        );
        if (!alreadyRefunded) {
          db.walletLedger.unshift({
            id: genId('WLG'),
            userId: w.userId,
            type: 'withdrawal_refund',
            amount: w.amount,
            referenceId: w.id,
            description: `Refund for rejected withdrawal (${w.adminNote || 'Rejected'})`,
            createdAt: ts,
          });
        }

        addNotification(
          db,
          w.userId,
          'Withdrawal Rejected & Refunded',
          `Your withdrawal of ₹${w.amount} was rejected and refunded to your available wallet balance.`,
          'withdrawal'
        );
        addAuditLog(
          db,
          admin.uid,
          admin.email,
          'WITHDRAWAL_REJECTED',
          `withdrawals/${w.id}`,
          `₹${w.amount} rejected and refunded to ${w.userEmail}`
        );
      }

      return w;
    });

    return res.json({ withdrawal: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Withdrawal update failed' });
  }
});

function sanitizeCoverUrl(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.length > 2000) {
    throw new Error('Cover image URL exceeds maximum allowed length');
  }
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  throw new Error('Cover image must be a valid https:// Cloudinary or web URL');
}

// Admin CRUD: Packages
app.put('/api/admin/packages/reorder', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const admin = req.currentUser!;
    const packageIds = Array.isArray(req.body?.packageIds)
      ? req.body.packageIds.map((id: any) => String(id))
      : [];

    if (!packageIds.length) {
      return res.status(400).json({ error: 'packageIds array is required' });
    }

    const packages = await withDbLock((db) => {
      const ts = nowIso();
      packageIds.forEach((id: string, index: number) => {
        const pkg = db.packages.find((p) => p.id === id);
        if (pkg) {
          pkg.sortOrder = index + 1;
          pkg.updatedAt = ts;
        }
      });
      db.packages.sort((a, b) => a.sortOrder - b.sortOrder);
      addAuditLog(
        db,
        admin.uid,
        admin.email,
        'PACKAGES_REORDERED',
        'packages',
        `Updated display order (${packageIds.length} packages)`
      );
      return db.packages;
    });

    res.json({ packages });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to reorder packages' });
  }
});

app.post('/api/admin/packages', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const admin = req.currentUser!;
    const body = req.body || {};
    const price = Number(body.price);
    if (!body.name || !Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: 'Package name and positive price are required' });
    }
    const coverImageUrl = sanitizeCoverUrl(body.coverImageUrl);

    const pkg = await withDbLock((db) => {
      const ts = nowIso();
      const created: Package = {
        id: body.id && typeof body.id === 'string' ? body.id : genId('pkg'),
        slug: String(body.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: String(body.name).trim(),
        subtitle: String(body.subtitle || 'Skill Learning Package').trim(),
        description: String(body.description || '').trim(),
        price,
        originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
        commissionRate: Number.isFinite(Number(body.commissionRate))
          ? Number(body.commissionRate)
          : db.settings.defaultCommissionPercent,
        benefits: Array.isArray(body.benefits)
          ? body.benefits.map((b: any) => String(b).trim()).filter(Boolean)
          : [],
        coverImageUrl,
        accentColor: String(body.accentColor || '#0D9488'),
        featured: Boolean(body.featured),
        active: body.active !== false,
        sortOrder: Number(body.sortOrder) || db.packages.length + 1,
        createdAt: ts,
        updatedAt: ts,
      };
      db.packages.push(created);

      if (Array.isArray(body.courseIds)) {
        const validCourseIds = body.courseIds
          .map((cid: any) => String(cid))
          .filter((cid: string) => db.courses.some((c) => c.id === cid));
        validCourseIds.forEach((cid: string, idx: number) => {
          db.packageCourses.push({
            id: genId('pc'),
            packageId: created.id,
            courseId: cid,
            sortOrder: idx + 1,
          });
        });
      }

      addAuditLog(db, admin.uid, admin.email, 'PACKAGE_CREATED', `packages/${created.id}`, `${created.name} (₹${created.price})`);
      return created;
    });

    res.json({ package: pkg });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create package' });
  }
});

app.patch('/api/admin/packages/:id', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const admin = req.currentUser!;
    const { id } = req.params;
    const body = req.body || {};
    const hasCoverUpdate = body.coverImageUrl !== undefined;
    const sanitizedCover = hasCoverUpdate ? sanitizeCoverUrl(body.coverImageUrl) : undefined;

    const pkg = await withDbLock((db) => {
      const item = db.packages.find((p) => p.id === id);
      if (!item) throw new Error('Package not found');

      if (typeof body.name === 'string' && body.name.trim()) item.name = body.name.trim();
      if (typeof body.subtitle === 'string') item.subtitle = body.subtitle.trim();
      if (typeof body.description === 'string') item.description = body.description.trim();
      if (Number.isFinite(Number(body.price)) && Number(body.price) > 0) item.price = Number(body.price);
      if (body.originalPrice !== undefined) item.originalPrice = Number(body.originalPrice) || undefined;
      if (Number.isFinite(Number(body.commissionRate))) item.commissionRate = Number(body.commissionRate);
      if (Array.isArray(body.benefits)) item.benefits = body.benefits.map((b: any) => String(b).trim()).filter(Boolean);
      if (hasCoverUpdate) item.coverImageUrl = sanitizedCover;
      if (typeof body.featured === 'boolean') item.featured = body.featured;
      if (typeof body.active === 'boolean') item.active = body.active;
      if (Number.isFinite(Number(body.sortOrder))) item.sortOrder = Number(body.sortOrder);

      if (Array.isArray(body.courseIds)) {
        const validCourseIds = body.courseIds
          .map((cid: any) => String(cid))
          .filter((cid: string) => db.courses.some((c) => c.id === cid));
        db.packageCourses = db.packageCourses.filter((pc) => pc.packageId !== id);
        validCourseIds.forEach((cid: string, idx: number) => {
          db.packageCourses.push({
            id: genId('pc'),
            packageId: id,
            courseId: cid,
            sortOrder: idx + 1,
          });
        });
      }

      item.updatedAt = nowIso();

      addAuditLog(db, admin.uid, admin.email, 'PACKAGE_UPDATED', `packages/${item.id}`, `${item.name} (₹${item.price})`);
      return item;
    });

    res.json({ package: pkg });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update package' });
  }
});

app.delete('/api/admin/packages/:id', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const admin = req.currentUser!;
    const { id } = req.params;
    await withDbLock((db) => {
      db.packages = db.packages.filter((p) => p.id !== id);
      db.packageCourses = db.packageCourses.filter((pc) => pc.packageId !== id);
      addAuditLog(db, admin.uid, admin.email, 'PACKAGE_DELETED', `packages/${id}`, 'Deleted package');
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to delete package' });
  }
});

// Admin CRUD: Courses & Lessons + PackageCourse Mapping
app.post('/api/admin/courses', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const admin = req.currentUser!;
    const body = req.body || {};
    if (!body.title) return res.status(400).json({ error: 'Course title is required' });

    const course = await withDbLock((db) => {
      const ts = nowIso();
      const created: Course = {
        id: genId('crs'),
        title: String(body.title).trim(),
        category: String(body.category || 'Digital Skills').trim(),
        description: String(body.description || '').trim(),
        thumbnail:
          typeof body.thumbnail === 'string' && body.thumbnail.trim()
            ? body.thumbnail.trim()
            : '/src/assets/images/course_video_editing_1795281750455.jpg',
        instructor: String(body.instructor || 'SavvvnLab Faculty').trim(),
        level: ['Beginner', 'Intermediate', 'Advanced'].includes(body.level) ? body.level : 'Beginner',
        lessons: Array.isArray(body.lessons) ? body.lessons : [],
        active: body.active !== false,
        createdAt: ts,
        updatedAt: ts,
      };
      db.courses.push(created);
      addAuditLog(db, admin.uid, admin.email, 'COURSE_CREATED', `courses/${created.id}`, created.title);
      return created;
    });

    res.json({ course });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create course' });
  }
});

app.patch('/api/admin/courses/:id', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const admin = req.currentUser!;
    const { id } = req.params;
    const body = req.body || {};

    const course = await withDbLock((db) => {
      const item = db.courses.find((c) => c.id === id);
      if (!item) throw new Error('Course not found');

      if (typeof body.title === 'string' && body.title.trim()) item.title = body.title.trim();
      if (typeof body.category === 'string') item.category = body.category.trim();
      if (typeof body.description === 'string') item.description = body.description.trim();
      if (typeof body.thumbnail === 'string' && body.thumbnail.trim()) item.thumbnail = body.thumbnail.trim();
      if (typeof body.instructor === 'string') item.instructor = body.instructor.trim();
      if (['Beginner', 'Intermediate', 'Advanced'].includes(body.level)) item.level = body.level;
      if (Array.isArray(body.lessons)) item.lessons = body.lessons;
      if (typeof body.active === 'boolean') item.active = body.active;
      item.updatedAt = nowIso();

      addAuditLog(db, admin.uid, admin.email, 'COURSE_UPDATED', `courses/${item.id}`, item.title);
      return item;
    });

    res.json({ course });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update course' });
  }
});

app.delete('/api/admin/courses/:id', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const admin = req.currentUser!;
    const { id } = req.params;
    await withDbLock((db) => {
      db.courses = db.courses.filter((c) => c.id !== id);
      db.packageCourses = db.packageCourses.filter((pc) => pc.courseId !== id);
      addAuditLog(db, admin.uid, admin.email, 'COURSE_DELETED', `courses/${id}`, 'Deleted course');
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to delete course' });
  }
});

app.put('/api/admin/package-courses', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const admin = req.currentUser!;
    const { packageId, courseIds } = req.body || {};
    if (typeof packageId !== 'string' || !Array.isArray(courseIds)) {
      return res.status(400).json({ error: 'packageId and courseIds[] are required' });
    }

    const updated = await withDbLock((db) => {
      db.packageCourses = db.packageCourses.filter((pc) => pc.packageId !== packageId);
      courseIds.forEach((cid: string, index: number) => {
        if (db.courses.some((c) => c.id === cid)) {
          db.packageCourses.push({
            id: `pc-${packageId}-${cid}`,
            packageId,
            courseId: cid,
            sortOrder: index + 1,
          });
        }
      });
      addAuditLog(db, admin.uid, admin.email, 'PACKAGE_COURSES_UPDATED', `packages/${packageId}`, `Mapped ${courseIds.length} courses`);
      return db.packageCourses;
    });

    res.json({ packageCourses: updated });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update mapping' });
  }
});

// Admin Members, Offers, Notifications, Support, Settings, Security
app.patch('/api/admin/members/:uid', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const admin = req.currentUser!;
    const { uid } = req.params;
    const { status } = req.body || {};
    if (status !== 'active' && status !== 'suspended') {
      return res.status(400).json({ error: 'Status must be active or suspended' });
    }

    const member = await withDbLock((db) => {
      const user = db.users.find((u) => u.uid === uid);
      if (!user) throw new Error('Member not found');
      if (user.email.toLowerCase() === OWNER_ADMIN_EMAIL) {
        throw new Error('Cannot suspend primary platform owner');
      }
      user.status = status;
      user.updatedAt = nowIso();
      addAuditLog(db, admin.uid, admin.email, 'MEMBER_STATUS_CHANGED', `users/${uid}`, `Set status to ${status}`);
      return user;
    });

    res.json({ member });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update member' });
  }
});

app.post('/api/admin/offers', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const admin = req.currentUser!;
    const { title, description, highlight, validUntil } = req.body || {};
    if (!title || !description) return res.status(400).json({ error: 'Title and description required' });

    const offer = await withDbLock((db) => {
      const created: OfferItem = {
        id: genId('ofr'),
        title: String(title).trim(),
        description: String(description).trim(),
        highlight: String(highlight || 'Limited Offer').trim(),
        validUntil: String(validUntil || 'Ongoing').trim(),
        active: true,
        createdAt: nowIso(),
      };
      db.offers.unshift(created);
      addAuditLog(db, admin.uid, admin.email, 'OFFER_CREATED', `offers/${created.id}`, created.title);
      return created;
    });

    res.json({ offer });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create offer' });
  }
});

app.delete('/api/admin/offers/:id', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const admin = req.currentUser!;
    const { id } = req.params;
    await withDbLock((db) => {
      db.offers = db.offers.filter((o) => o.id !== id);
      addAuditLog(db, admin.uid, admin.email, 'OFFER_DELETED', `offers/${id}`, 'Removed offer');
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to delete offer' });
  }
});

app.post('/api/admin/notifications/broadcast', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const admin = req.currentUser!;
    const { userId, title, message } = req.body || {};
    if (!title || !message) return res.status(400).json({ error: 'Title and message are required' });

    const notification = await withDbLock((db) => {
      const created: NotificationItem = {
        id: genId('ntf'),
        userId: userId && typeof userId === 'string' ? userId : 'all',
        title: String(title).trim(),
        message: String(message).trim(),
        category: 'announcement',
        readBy: [],
        createdAt: nowIso(),
      };
      db.notifications.unshift(created);
      addAuditLog(db, admin.uid, admin.email, 'NOTIFICATION_SENT', `notifications/${created.id}`, `To: ${created.userId} · ${created.title}`);
      return created;
    });

    res.json({ notification });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Broadcast failed' });
  }
});

app.post('/api/admin/support/:id/reply', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const admin = req.currentUser!;
    const { id } = req.params;
    const { status, adminReply } = req.body || {};

    const ticket = await withDbLock((db) => {
      const t = db.supportTickets.find((item) => item.id === id);
      if (!t) throw new Error('Ticket not found');
      if (['open', 'in_progress', 'resolved'].includes(status)) t.status = status;
      if (typeof adminReply === 'string') t.adminReply = adminReply.trim();
      t.repliedBy = admin.email;
      t.repliedAt = nowIso();
      if (t.userId) {
        addNotification(
          db,
          t.userId,
          `Support Update: ${t.subject}`,
          t.adminReply || `Ticket status updated to ${t.status}.`,
          'support'
        );
      }
      addAuditLog(db, admin.uid, admin.email, 'SUPPORT_REPLIED', `supportTickets/${t.id}`, `Status: ${t.status}`);
      return t;
    });

    res.json({ ticket });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Reply failed' });
  }
});

app.put('/api/admin/settings', requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const admin = req.currentUser!;
    const body = req.body || {};

    const settings = await withDbLock((db) => {
      const s = db.settings;
      if (typeof body.siteName === 'string' && body.siteName.trim()) s.siteName = body.siteName.trim();
      if (typeof body.tagline === 'string') s.tagline = body.tagline.trim();
      if (typeof body.heroTitle === 'string') s.heroTitle = body.heroTitle.trim();
      if (typeof body.heroSubtitle === 'string') s.heroSubtitle = body.heroSubtitle.trim();
      if (typeof body.aboutSummary === 'string') s.aboutSummary = body.aboutSummary.trim();
      if (typeof body.supportEmail === 'string') s.supportEmail = body.supportEmail.trim();
      if (typeof body.supportPhone === 'string') s.supportPhone = body.supportPhone.trim();
      if (typeof body.instagramUrl === 'string') s.instagramUrl = body.instagramUrl.trim();
      if (typeof body.youtubeUrl === 'string') s.youtubeUrl = body.youtubeUrl.trim();
      if (typeof body.telegramUrl === 'string') s.telegramUrl = body.telegramUrl.trim();
      if (typeof body.whatsappUrl === 'string') s.whatsappUrl = body.whatsappUrl.trim();
      if (typeof body.upiId === 'string') s.upiId = body.upiId.trim();
      if (typeof body.upiPayeeName === 'string') s.upiPayeeName = body.upiPayeeName.trim();
      if (typeof body.upiInstructions === 'string') s.upiInstructions = body.upiInstructions.trim();
      if (typeof body.customUpiQrUrl === 'string') s.customUpiQrUrl = body.customUpiQrUrl.trim();
      if (Number.isFinite(Number(body.defaultCommissionPercent))) {
        s.defaultCommissionPercent = Math.max(0, Math.min(80, Number(body.defaultCommissionPercent)));
      }
      if (typeof body.autoApproveCommission === 'boolean') {
        s.autoApproveCommission = body.autoApproveCommission;
      }
      if (Number.isFinite(Number(body.minWithdrawal)) && Number(body.minWithdrawal) >= 1) {
        s.minWithdrawal = Number(body.minWithdrawal);
      }
      if (Number.isFinite(Number(body.maxWithdrawal)) && Number(body.maxWithdrawal) >= s.minWithdrawal) {
        s.maxWithdrawal = Number(body.maxWithdrawal);
      }
      s.updatedAt = nowIso();

      addAuditLog(db, admin.uid, admin.email, 'SETTINGS_UPDATED', 'adminSettings/public', 'Updated platform settings');
      return s;
    });

    res.json({ settings });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Settings update failed' });
  }
});

app.put('/api/admin/security/admins', requireAdmin, async (_req: AuthedRequest, res) => {
  return res.status(403).json({
    error: `Administrator access is strictly locked exclusively to ${OWNER_ADMIN_EMAIL}.`,
  });
});

// Explicit JSON 404 for unknown API paths
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});
