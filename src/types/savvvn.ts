export type UserRole = 'member' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  referralCode: string;
  referredByUid?: string | null;
  referredByCode?: string | null;
  upiId?: string;
  unlockedPackageIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  originalPrice?: number;
  commissionRate: number; // percentage e.g. 25 means 25%
  benefits: string[];
  coverImageUrl?: string;
  accentColor: string;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string;
  summary: string;
  order: number;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  description: string;
  thumbnail: string;
  instructor: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  lessons: CourseLesson[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PackageCourse {
  id: string;
  packageId: string;
  courseId: string;
  sortOrder: number;
}

export type OrderStatus =
  | 'awaiting_payment'
  | 'pending_verification'
  | 'paid'
  | 'rejected'
  | 'refunded';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  packageId: string;
  packageName: string;
  amount: number;
  sponsorUid?: string | null;
  referralCode?: string | null;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  userEmail: string;
  packageId: string;
  packageName: string;
  amount: number;
  utr: string;
  screenshotUrl: string;
  upiIdPaidTo: string;
  status: PaymentStatus;
  adminNote?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  sponsorUid: string;
  sponsorName: string;
  sponsorEmail: string;
  referredUid: string;
  referredName: string;
  referredEmail: string;
  referralCode: string;
  createdAt: string;
}

export type CommissionStatus = 'pending' | 'approved' | 'reversed';

export interface CommissionEntry {
  id: string;
  orderId: string;
  paymentId: string;
  beneficiaryUid: string;
  beneficiaryName: string;
  beneficiaryEmail: string;
  buyerUid: string;
  buyerName: string;
  packageId: string;
  packageName: string;
  saleAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: CommissionStatus;
  adminNote?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export type WalletLedgerType =
  | 'commission_credit'
  | 'withdrawal_debit'
  | 'withdrawal_refund'
  | 'commission_reversal';

export interface WalletLedgerEntry {
  id: string;
  userId: string;
  type: WalletLedgerType;
  amount: number; // positive for credit/refund, negative for debit/reversal
  referenceId: string;
  description: string;
  createdAt: string;
}

export type WithdrawalStatus = 'pending' | 'approved' | 'paid' | 'rejected';

export interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  upiId: string;
  status: WithdrawalStatus;
  payoutReference?: string;
  adminNote?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
}

export interface WalletSummary {
  availableBalance: number;
  pendingCommission: number;
  totalEarned: number;
  totalWithdrawn: number;
  todayEarned: number;
  weekEarned: number;
  monthEarned: number;
}

export interface AdminSettings {
  id: string;
  siteName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutSummary: string;
  supportEmail: string;
  supportPhone: string;
  instagramUrl: string;
  youtubeUrl: string;
  telegramUrl: string;
  whatsappUrl: string;
  upiId: string;
  upiPayeeName: string;
  upiInstructions: string;
  customUpiQrUrl: string;
  defaultCommissionPercent: number;
  autoApproveCommission: boolean;
  minWithdrawal: number;
  maxWithdrawal: number;
  updatedAt: string;
}

export interface OfferItem {
  id: string;
  title: string;
  description: string;
  highlight: string;
  validUntil: string;
  active: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string; // 'all' or specific uid
  title: string;
  message: string;
  category: 'payment' | 'commission' | 'withdrawal' | 'announcement' | 'support';
  readBy: string[];
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  adminReply?: string;
  repliedBy?: string;
  repliedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  targetPath: string;
  details: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL?: string;
  referralCode: string;
  totalCommission: number;
  verifiedSales: number;
}

export interface PublicCatalogResponse {
  packages: Package[];
  courses: Course[];
  packageCourses: PackageCourse[];
  settings: {
    siteName: string;
    tagline: string;
    heroTitle: string;
    heroSubtitle: string;
    aboutSummary: string;
    supportEmail: string;
    supportPhone: string;
    instagramUrl: string;
    youtubeUrl: string;
    telegramUrl: string;
    whatsappUrl: string;
    upiId: string;
    upiPayeeName: string;
    upiInstructions: string;
    customUpiQrUrl: string;
    minWithdrawal: number;
    defaultCommissionPercent: number;
  };
  offers: OfferItem[];
}

export interface MemberOverviewResponse {
  user: UserProfile;
  wallet: WalletSummary;
  orders: Order[];
  payments: Payment[];
  commissions: CommissionEntry[];
  walletLedger: WalletLedgerEntry[];
  withdrawals: Withdrawal[];
  team: {
    totalMembers: number;
    activeMembers: number;
    directMembers: Array<{
      uid: string;
      displayName: string;
      email: string;
      referralCode: string;
      unlockedCount: number;
      active: boolean;
      joinedAt: string;
    }>;
  };
  leaderboard: {
    days7: LeaderboardEntry[];
    days30: LeaderboardEntry[];
    allTime: LeaderboardEntry[];
  };
  salesSeries: Array<{ label: string; amount: number }>;
  notifications: NotificationItem[];
  offers: OfferItem[];
  tickets: SupportTicket[];
}

export interface AdminOverviewResponse {
  stats: {
    totalMembers: number;
    activeMembers: number;
    totalVerifiedOrders: number;
    grossRevenue: number;
    pendingPaymentsCount: number;
    pendingCommissionsAmount: number;
    approvedCommissionsAmount: number;
    pendingWithdrawalsAmount: number;
    paidWithdrawalsAmount: number;
  };
  salesSeries: Array<{ label: string; amount: number }>;
  members: Array<UserProfile & { wallet: WalletSummary; ordersCount: number }>;
  packages: Package[];
  courses: Course[];
  packageCourses: PackageCourse[];
  orders: Order[];
  payments: Payment[];
  referrals: Referral[];
  commissionLedger: CommissionEntry[];
  walletLedger: WalletLedgerEntry[];
  withdrawals: Withdrawal[];
  leaderboard: {
    days7: LeaderboardEntry[];
    days30: LeaderboardEntry[];
    allTime: LeaderboardEntry[];
  };
  notifications: NotificationItem[];
  offers: OfferItem[];
  tickets: SupportTicket[];
  settings: AdminSettings;
  adminAllowlist: string[];
  auditLogs: AuditLog[];
}
