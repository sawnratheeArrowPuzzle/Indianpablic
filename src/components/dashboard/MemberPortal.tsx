import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Package as PackageIcon,
  Link2,
  Users,
  Trophy,
  Wallet,
  ArrowDownToLine,
  Gift,
  MessageSquare,
  Bell,
  User as UserIcon,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  PlayCircle,
  AlertCircle,
  CheckCircle2,
  Menu,
  X,
  Shield,
  Camera,
  Trash2,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  AUTHORIZED_ADMIN_EMAIL,
  deleteProfilePictureByUrl,
  syncUserProfileToFirestore,
  uploadProfilePicture,
} from '../../lib/firebase';
import { BrandLogo } from '../common/BrandLogo';
import type {
  Course,
  MemberOverviewResponse,
  Package,
  PublicCatalogResponse,
  UserProfile,
} from '../../types/savvvn';

function prepareProfileAvatarImage(
  file: File
): Promise<{ blob: Blob; mimeType: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read selected image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Unsupported or corrupted image file'));
      img.onload = () => {
        const maxSize = 512;
        const scale = Math.min(1, maxSize / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not initialize image processor'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.86);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not prepare image for upload'));
              return;
            }
            resolve({ blob, mimeType, dataUrl });
          },
          mimeType,
          0.86
        );
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

type MemberTab =
  | 'dashboard'
  | 'courses'
  | 'packages'
  | 'affiliate'
  | 'team'
  | 'leaderboard'
  | 'wallet'
  | 'withdrawals'
  | 'offers'
  | 'community'
  | 'support'
  | 'profile';

interface MemberPortalProps {
  user: UserProfile;
  catalog: PublicCatalogResponse;
  onRefreshUser: (updated: UserProfile) => void;
  onBuyPackage: (pkg: Package) => void;
  onOpenAdmin: () => void;
  onGoPublicHome: () => void;
  onLogout: () => Promise<void>;
}

const MiniSalesChart: React.FC<{ data: Array<{ label: string; amount: number }> }> = ({
  data,
}) => {
  const maxVal = Math.max(100, ...data.map((d) => d.amount));
  const width = 560;
  const height = 140;
  const padX = 24;
  const padY = 18;

  const points = data.map((d, i) => {
    const x =
      data.length > 1 ? padX + (i * (width - padX * 2)) / (data.length - 1) : width / 2;
    const y = height - padY - (d.amount / maxVal) * (height - padY * 2);
    return { x, y, ...d };
  });

  const pathD = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height + 24}`} className="w-full min-w-[360px] h-44">
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="#E2E8F0" strokeWidth="1" />
        <line x1={padX} y1={padY} x2={width - padX} y2={padY} stroke="#F1F5F9" strokeWidth="1" />
        {pathD && (
          <path d={pathD} fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#FFFFFF" stroke="#6D28D9" strokeWidth="2" />
            <text
              x={p.x}
              y={height + 16}
              textAnchor="middle"
              className="fill-slate-500 text-[11px]"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export const MemberPortal: React.FC<MemberPortalProps> = ({
  user,
  catalog,
  onRefreshUser,
  onBuyPackage,
  onOpenAdmin,
  onGoPublicHome,
  onLogout,
}) => {
  const [tab, setTab] = useState<MemberTab>('dashboard');
  const [overview, setOverview] = useState<MemberOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Course viewer state
  const [courseFilter, setCourseFilter] = useState('All');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);

  // Leaderboard filter
  const [lbRange, setLbRange] = useState<'days7' | 'days30' | 'allTime'>('days7');

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Withdrawal form
  const [wdAmount, setWdAmount] = useState('');
  const [wdUpi, setWdUpi] = useState(user.upiId || '');
  const [wdBusy, setWdBusy] = useState(false);
  const [wdMsg, setWdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Profile form
  const [profName, setProfName] = useState(user.displayName);
  const [profPhone, setProfPhone] = useState(user.phone || '');
  const [profUpi, setProfUpi] = useState(user.upiId || '');
  const [stagedAvatarBlob, setStagedAvatarBlob] = useState<Blob | null>(null);
  const [stagedAvatarMime, setStagedAvatarMime] = useState<string>('image/jpeg');
  const [stagedAvatarPreview, setStagedAvatarPreview] = useState<string>('');
  const [stagedAvatarRemove, setStagedAvatarRemove] = useState(false);
  const [profBusy, setProfBusy] = useState(false);
  const [profMsg, setProfMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Support ticket form
  const [tktSubject, setTktSubject] = useState('');
  const [tktMessage, setTktMessage] = useState('');
  const [tktBusy, setTktBusy] = useState(false);
  const [tktMsg, setTktMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMemberOverview();
      setOverview(data);
      onRefreshUser(data.user);
      setProfName(data.user.displayName);
      setProfPhone(data.user.phone || '');
      setProfUpi(data.user.upiId || '');
      if (data.user.upiId && !wdUpi) setWdUpi(data.user.upiId);
    } catch (err: any) {
      setError(err?.message || 'Could not load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const unlockedCourseIds = new Set<string>();
  for (const pkgId of overview?.user.unlockedPackageIds || user.unlockedPackageIds || []) {
    catalog.packageCourses
      .filter((pc) => pc.packageId === pkgId)
      .forEach((pc) => unlockedCourseIds.add(pc.courseId));
  }

  const unlockedCourses = catalog.courses.filter((c) => unlockedCourseIds.has(c.id));
  const courseCategories = ['All', ...Array.from(new Set(catalog.courses.map((c) => c.category)))];
  const filteredCourses = unlockedCourses.filter(
    (c) => courseFilter === 'All' || c.category === courseFilter
  );

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const refCode = overview?.user.referralCode || user.referralCode;
  const commonRefLink = `${originUrl}/?ref=${encodeURIComponent(refCode)}`;

  const unreadCount = (overview?.notifications || []).filter(
    (n) => !n.readBy.includes(user.uid)
  ).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationRead();
      await loadOverview();
    } catch {
      // ignore
    }
  };

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWdBusy(true);
    setWdMsg(null);
    try {
      await api.requestWithdrawal({
        amount: Number(wdAmount),
        upiId: wdUpi.trim(),
      });
      setWdAmount('');
      setWdMsg({ type: 'ok', text: 'Withdrawal request submitted and locked in wallet ledger.' });
      await loadOverview();
    } catch (err: any) {
      setWdMsg({ type: 'err', text: err?.message || 'Withdrawal failed' });
    } finally {
      setWdBusy(false);
    }
  };

  const handleProfilePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setProfMsg(null);
    if (!file.type.startsWith('image/')) {
      setProfMsg({ type: 'err', text: 'Please select a valid JPG, PNG, or WebP image.' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setProfMsg({ type: 'err', text: 'Selected image must be smaller than 10 MB.' });
      return;
    }
    try {
      const prepared = await prepareProfileAvatarImage(file);
      setStagedAvatarBlob(prepared.blob);
      setStagedAvatarMime(prepared.mimeType);
      setStagedAvatarPreview(prepared.dataUrl);
      setStagedAvatarRemove(false);
    } catch (err: any) {
      setProfMsg({ type: 'err', text: err?.message || 'Could not process image.' });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfBusy(true);
    setProfMsg(null);
    const previousPhotoUrl = overview?.user.photoURL || user.photoURL || '';
    try {
      let nextPhotoUrl: string | undefined = undefined;
      if (stagedAvatarRemove) {
        nextPhotoUrl = '';
      } else if (stagedAvatarBlob) {
        try {
          nextPhotoUrl = await uploadProfilePicture(user.uid, stagedAvatarBlob, stagedAvatarMime);
        } catch {
          const uploaded = await api.uploadAvatarFallback(stagedAvatarPreview);
          nextPhotoUrl = uploaded.url;
        }
      }

      const res = await api.updateProfile({
        displayName: profName.trim(),
        phone: profPhone.trim(),
        upiId: profUpi.trim(),
        ...(nextPhotoUrl !== undefined ? { photoURL: nextPhotoUrl } : {}),
      });
      await syncUserProfileToFirestore(res.user);
      if (
        previousPhotoUrl &&
        (stagedAvatarRemove || (nextPhotoUrl && nextPhotoUrl !== previousPhotoUrl))
      ) {
        await deleteProfilePictureByUrl(previousPhotoUrl);
      }

      setStagedAvatarBlob(null);
      setStagedAvatarPreview('');
      setStagedAvatarRemove(false);
      onRefreshUser(res.user);
      setProfMsg({ type: 'ok', text: 'Profile and photo updated.' });
      await loadOverview();
    } catch (err: any) {
      setProfMsg({ type: 'err', text: err?.message || 'Profile update failed' });
    } finally {
      setProfBusy(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTktBusy(true);
    setTktMsg(null);
    try {
      await api.createSupportTicket({ subject: tktSubject, message: tktMessage });
      setTktSubject('');
      setTktMessage('');
      setTktMsg({ type: 'ok', text: 'Support ticket logged.' });
      await loadOverview();
    } catch (err: any) {
      setTktMsg({ type: 'err', text: err?.message || 'Failed to create ticket' });
    } finally {
      setTktBusy(false);
    }
  };

  const sidebarItems: Array<{ id: MemberTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'courses', label: 'My Courses', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'packages', label: 'Packages', icon: <PackageIcon className="w-4 h-4" /> },
    { id: 'affiliate', label: 'Affiliate Link', icon: <Link2 className="w-4 h-4" /> },
    { id: 'team', label: 'My Team', icon: <Users className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" /> },
    { id: 'wallet', label: 'Wallet', icon: <Wallet className="w-4 h-4" /> },
    { id: 'withdrawals', label: 'Withdrawals', icon: <ArrowDownToLine className="w-4 h-4" /> },
    { id: 'offers', label: 'Offers', icon: <Gift className="w-4 h-4" /> },
    { id: 'community', label: 'Community', icon: <ExternalLink className="w-4 h-4" /> },
    { id: 'support', label: 'Support', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'profile', label: 'My Profile', icon: <UserIcon className="w-4 h-4" /> },
  ];

  const selectTab = (t: MemberTab) => {
    setTab(t);
    setDrawerOpen(false);
    setActiveCourse(null);
  };

  const activeUser = overview?.user || user;
  const activePhotoUrl = activeUser.photoURL || '';
  const canOpenAdmin =
    user.role === 'admin' && user.email.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL;

  const ownedPackageNames = (overview?.user.unlockedPackageIds || [])
    .map((pid) => catalog.packages.find((p) => p.id === pid)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Desktop Navy Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-[#0B1E36] text-slate-200 shrink-0">
        <div className="h-16 px-5 flex items-center border-b border-slate-800">
          <button type="button" onClick={onGoPublicHome} className="cursor-pointer">
            <BrandLogo variant="sidebar" surface="dark" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                tab === item.id
                  ? 'bg-[#0D9488] text-white'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          {canOpenAdmin && (
            <div className="pt-3 mt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onOpenAdmin}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold bg-[#6D28D9] hover:bg-[#5b21b6] text-white transition-colors cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>Admin Panel</span>
              </button>
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-1">
          <button
            type="button"
            onClick={onGoPublicHome}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Website</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs text-red-300 hover:text-white hover:bg-red-900/40 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 bg-[#0B1E36] text-slate-200 flex flex-col h-full">
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
              <button type="button" onClick={onGoPublicHome} className="cursor-pointer">
                <BrandLogo variant="sidebar" surface="dark" />
              </button>
              <button type="button" onClick={() => setDrawerOpen(false)} className="p-1.5 text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-3 space-y-1 overflow-y-auto">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    tab === item.id ? 'bg-[#0D9488] text-white' : 'text-slate-300'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
              {canOpenAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-[#6D28D9] text-white mt-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Panel</span>
                </button>
              )}
            </div>
            <div className="p-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-300"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Top Context Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 rounded-lg text-[#0B1E36] hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-display text-lg font-bold text-[#0B1E36] capitalize">
              {sidebarItems.find((i) => i.id === tab)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3 relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((v) => !v);
                if (unreadCount > 0) handleMarkAllRead();
              }}
              aria-label="Notifications"
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-[#0B1E36] relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#6D28D9] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-40 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-[#0B1E36]">Notifications</span>
                  <button type="button" onClick={() => setNotifOpen(false)} className="text-xs text-slate-400">
                    Close
                  </button>
                </div>
                {(overview?.notifications || []).length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">No notifications yet.</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2.5">
                    {(overview?.notifications || []).slice(0, 8).map((n) => (
                      <div key={n.id} className="text-xs border-b border-slate-100 pb-2">
                        <div className="font-semibold text-[#0B1E36]">{n.title}</div>
                        <p className="text-slate-600 mt-0.5">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => selectTab('profile')}
              className="flex items-center gap-2 text-left cursor-pointer"
            >
              {activePhotoUrl ? (
                <img
                  src={activePhotoUrl}
                  alt={activeUser.displayName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#0B1E36] text-white text-xs font-bold flex items-center justify-center">
                  {activeUser.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline text-sm font-medium text-[#0B1E36] truncate max-w-[140px]">
                {activeUser.displayName}
              </span>
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="p-4 sm:p-6 max-w-6xl w-full mx-auto space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between gap-4">
              <span>{error}</span>
              <button type="button" onClick={loadOverview} className="text-xs font-semibold underline cursor-pointer">
                Retry
              </button>
            </div>
          )}

          {loading && !overview ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
              <BrandLogo variant="full" className="mx-auto" />
              <div className="text-sm text-slate-500">Loading your SavvvnLab account...</div>
            </div>
          ) : (
            <>
              {/* TAB: DASHBOARD */}
              {tab === 'dashboard' && overview && (
                <div className="space-y-6">
                  {/* Welcome Strip */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {activePhotoUrl ? (
                        <img
                          src={activePhotoUrl}
                          alt={overview.user.displayName}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#0B1E36] text-white text-base font-bold flex items-center justify-center shrink-0">
                          {overview.user.displayName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-slate-500">
                          {overview.user.referralCode} · {ownedPackageNames || 'No active package yet'}
                        </div>
                        <h2 className="font-display text-2xl font-bold text-[#0B1E36] mt-0.5">
                          Welcome back, {overview.user.displayName}
                        </h2>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => selectTab('courses')}
                        className="px-4 py-2 rounded-lg bg-[#0B1E36] text-white text-xs font-semibold cursor-pointer"
                      >
                        My Courses ({unlockedCourses.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => selectTab('wallet')}
                        className="px-4 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-semibold cursor-pointer"
                      >
                        Wallet (₹{overview.wallet.availableBalance.toLocaleString('en-IN')})
                      </button>
                    </div>
                  </div>

                  {/* 4 KPI Summary Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <div className="text-xs text-slate-500">Today</div>
                      <div className="font-mono-num text-2xl font-bold text-[#0B1E36] mt-1">
                        ₹{overview.wallet.todayEarned.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <div className="text-xs text-slate-500">This Week</div>
                      <div className="font-mono-num text-2xl font-bold text-[#0B1E36] mt-1">
                        ₹{overview.wallet.weekEarned.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <div className="text-xs text-slate-500">This Month</div>
                      <div className="font-mono-num text-2xl font-bold text-[#0B1E36] mt-1">
                        ₹{overview.wallet.monthEarned.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <div className="text-xs text-slate-500">Total Earned</div>
                      <div className="font-mono-num text-2xl font-bold text-[#0D9488] mt-1">
                        ₹{overview.wallet.totalEarned.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Sales Overview Chart */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-base font-bold text-[#0B1E36]">
                        7-Day Approved Earnings Overview
                      </h3>
                      <span className="text-xs text-slate-500 font-mono-num">
                        Pending: ₹{overview.wallet.pendingCommission.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <MiniSalesChart data={overview.salesSeries} />
                  </div>

                  {/* Recent Orders / Payment Status */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-base font-bold text-[#0B1E36]">
                        Your Package Orders
                      </h3>
                      <button
                        type="button"
                        onClick={() => selectTab('packages')}
                        className="text-xs font-semibold text-[#0D9488] cursor-pointer"
                      >
                        Browse Packages
                      </button>
                    </div>
                    {overview.orders.length === 0 ? (
                      <div className="py-6 text-sm text-slate-500">
                        You have not placed a package order yet. Visit Packages to get started.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-xs text-slate-500">
                              <th className="py-2 pr-4">Order ID</th>
                              <th className="py-2 pr-4">Package</th>
                              <th className="py-2 pr-4">Amount</th>
                              <th className="py-2 pr-4">Status</th>
                              <th className="py-2">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {overview.orders.map((ord) => (
                              <tr key={ord.id} className="h-11">
                                <td className="py-2 pr-4 font-mono-num text-xs text-[#0B1E36]">{ord.id}</td>
                                <td className="py-2 pr-4 font-medium text-[#0B1E36]">{ord.packageName}</td>
                                <td className="py-2 pr-4 font-mono-num">₹{ord.amount.toLocaleString('en-IN')}</td>
                                <td className="py-2 pr-4 text-xs font-semibold capitalize">
                                  <span
                                    className={
                                      ord.status === 'paid'
                                        ? 'text-[#16A34A]'
                                        : ord.status === 'rejected' || ord.status === 'refunded'
                                        ? 'text-[#DC2626]'
                                        : 'text-amber-700'
                                    }
                                  >
                                    {ord.status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="py-2 text-xs font-mono-num text-slate-500">
                                  {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: MY COURSES */}
              {tab === 'courses' && (
                <div className="space-y-6">
                  {activeCourse ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
                      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                          <div className="text-xs text-slate-500">
                            {activeCourse.category} · {activeCourse.level}
                          </div>
                          <h2 className="font-display text-xl font-bold text-[#0B1E36]">
                            {activeCourse.title}
                          </h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveCourse(null)}
                          className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-[#0B1E36] cursor-pointer"
                        >
                          Back to Courses
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8 space-y-4">
                          {activeCourse.lessons[activeLessonIndex] ? (
                            <>
                              <div className="aspect-video bg-[#0B1E36] rounded-xl flex flex-col items-center justify-center text-white p-6 text-center">
                                <PlayCircle className="w-12 h-12 text-teal-300 mb-3" />
                                <h3 className="font-display text-lg font-bold">
                                  {activeCourse.lessons[activeLessonIndex].title}
                                </h3>
                                <p className="text-xs text-slate-300 mt-1 max-w-md">
                                  {activeCourse.lessons[activeLessonIndex].summary}
                                </p>
                                {activeCourse.lessons[activeLessonIndex].videoUrl && (
                                  <a
                                    href={activeCourse.lessons[activeLessonIndex].videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                                  >
                                    <span>Open Lesson Video</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                              <div className="text-sm text-slate-600">
                                Duration: <span className="font-mono-num font-semibold">{activeCourse.lessons[activeLessonIndex].duration}</span>
                              </div>
                            </>
                          ) : (
                            <div className="p-8 text-sm text-slate-500">No lessons added to this course yet.</div>
                          )}
                        </div>

                        <div className="lg:col-span-4 space-y-2">
                          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Lessons ({activeCourse.lessons.length})
                          </h3>
                          {activeCourse.lessons.map((les, idx) => (
                            <button
                              key={les.id}
                              type="button"
                              onClick={() => setActiveLessonIndex(idx)}
                              className={`w-full text-left p-3 rounded-lg border text-sm transition-colors cursor-pointer ${
                                activeLessonIndex === idx
                                  ? 'border-[#0D9488] bg-teal-50/40 text-[#0B1E36] font-semibold'
                                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="font-mono-num text-xs text-slate-400">
                                Lesson {idx + 1} · {les.duration}
                              </div>
                              <div className="mt-0.5">{les.title}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit overflow-x-auto max-w-full">
                        {courseCategories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCourseFilter(cat)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                              courseFilter === cat
                                ? 'bg-white text-[#0B1E36] shadow-xs'
                                : 'text-slate-600 hover:text-[#0B1E36]'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {unlockedCourses.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
                          <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                          <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                            No Unlocked Courses Yet
                          </h2>
                          <p className="text-sm text-slate-600 max-w-md mx-auto">
                            Purchase a SavvvnLab package via UPI to unlock all included courses once your payment is verified by an administrator.
                          </p>
                          <button
                            type="button"
                            onClick={() => selectTab('packages')}
                            className="px-5 py-2.5 rounded-lg bg-[#0B1E36] text-white text-sm font-semibold cursor-pointer"
                          >
                            Explore Packages
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredCourses.map((course) => (
                            <div
                              key={course.id}
                              className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between"
                            >
                              <div>
                                <img
                                  src={course.thumbnail}
                                  alt={course.title}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-44 object-cover"
                                />
                                <div className="p-5 space-y-1.5">
                                  <div className="text-xs text-slate-500">
                                    {course.category} · {course.lessons.length} Lessons
                                  </div>
                                  <h3 className="font-display text-base font-bold text-[#0B1E36]">
                                    {course.title}
                                  </h3>
                                  <p className="text-xs text-slate-600">{course.description}</p>
                                </div>
                              </div>
                              <div className="px-5 pb-5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveCourse(course);
                                    setActiveLessonIndex(0);
                                  }}
                                  className="w-full py-2.5 rounded-lg bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-semibold cursor-pointer"
                                >
                                  Start Learning
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* TAB: PACKAGES */}
              {tab === 'packages' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {catalog.packages.map((pkg) => {
                    const owned = (overview?.user.unlockedPackageIds || []).includes(pkg.id);
                    return (
                      <div
                        key={pkg.id}
                        className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-display text-xl font-bold text-[#0B1E36]">{pkg.name}</h3>
                            <span className="font-mono-num text-xl font-bold text-[#0B1E36]">
                              ₹{pkg.price.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{pkg.description}</p>
                          <div className="text-xs text-[#0D9488] font-medium">
                            Partner Commission: {pkg.commissionRate}%
                          </div>
                        </div>

                        {owned ? (
                          <div className="py-2.5 px-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 text-center">
                            Active Package Unlocked
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onBuyPackage(pkg)}
                            className="w-full py-2.5 rounded-lg bg-[#0B1E36] hover:bg-[#132f53] text-white text-sm font-semibold cursor-pointer"
                          >
                            Buy / Upgrade via UPI
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB: AFFILIATE LINK */}
              {tab === 'affiliate' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
                  <div>
                    <div className="text-xs text-slate-500">Your Referral Code</div>
                    <div className="flex items-center justify-between gap-4 mt-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-mono-num text-xl font-bold text-[#0B1E36]">
                        {refCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyText('code', refCode)}
                        className="px-4 py-2 rounded-lg bg-[#0B1E36] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedKey === 'code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'code' ? 'Copied' : 'Copy Code'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">General Referral Link</div>
                    <div className="flex items-center justify-between gap-4 mt-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-mono-num text-xs text-slate-700 truncate">
                        {commonRefLink}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyText('common', commonRefLink)}
                        className="px-4 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedKey === 'common' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'common' ? 'Copied' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <h3 className="font-display text-sm font-bold text-[#0B1E36]">
                      Direct Package Checkout Links
                    </h3>
                    {catalog.packages.map((pkg) => {
                      const link = `${originUrl}/?pkg=${encodeURIComponent(pkg.id)}&ref=${encodeURIComponent(refCode)}`;
                      return (
                        <div
                          key={pkg.id}
                          className="flex items-center justify-between gap-4 p-3 border border-slate-200 rounded-lg"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#0B1E36]">{pkg.name}</div>
                            <div className="font-mono-num text-xs text-slate-500 truncate">{link}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyText(pkg.id, link)}
                            className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:border-[#0B1E36] text-xs font-semibold text-[#0B1E36] shrink-0 cursor-pointer"
                          >
                            {copiedKey === pkg.id ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: MY TEAM */}
              {tab === 'team' && overview && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <div className="text-xs text-slate-500">Total Direct Referrals</div>
                      <div className="font-mono-num text-3xl font-bold text-[#0B1E36] mt-1">
                        {overview.team.totalMembers}
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <div className="text-xs text-slate-500">Active Enrolled Members</div>
                      <div className="font-mono-num text-3xl font-bold text-[#0D9488] mt-1">
                        {overview.team.activeMembers}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h3 className="font-display text-base font-bold text-[#0B1E36] mb-4">
                      Direct Members
                    </h3>
                    {overview.team.directMembers.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No referred members yet. Share your affiliate link to build your team.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-xs text-slate-500">
                              <th className="py-2 pr-4">Member</th>
                              <th className="py-2 pr-4">Code</th>
                              <th className="py-2 pr-4">Packages</th>
                              <th className="py-2 pr-4">Status</th>
                              <th className="py-2">Joined</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {overview.team.directMembers.map((m) => (
                              <tr key={m.uid} className="h-11">
                                <td className="py-2 pr-4 font-medium text-[#0B1E36]">{m.displayName}</td>
                                <td className="py-2 pr-4 font-mono-num text-xs text-slate-600">{m.referralCode}</td>
                                <td className="py-2 pr-4 font-mono-num text-xs">{m.unlockedCount}</td>
                                <td className="py-2 pr-4 text-xs font-semibold">
                                  <span className={m.active ? 'text-[#16A34A]' : 'text-slate-500'}>
                                    {m.active ? 'Active' : 'Registered'}
                                  </span>
                                </td>
                                <td className="py-2 text-xs font-mono-num text-slate-500">
                                  {new Date(m.joinedAt).toLocaleDateString('en-IN')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: LEADERBOARD */}
              {tab === 'leaderboard' && overview && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                      Verified Partner Leaderboard
                    </h2>
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
                      {(
                        [
                          { id: 'days7', label: '7 Days' },
                          { id: 'days30', label: '30 Days' },
                          { id: 'allTime', label: 'All Time' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setLbRange(opt.id)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer ${
                            lbRange === opt.id
                              ? 'bg-[#0B1E36] text-white'
                              : 'text-slate-600 hover:text-[#0B1E36]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {overview.leaderboard[lbRange].length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-500">
                      No verified commissions recorded in this timeframe yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {overview.leaderboard[lbRange].map((entry, idx) => (
                        <div key={entry.uid} className="py-3.5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="font-mono-num text-sm font-bold w-6 text-slate-500">
                              #{idx + 1}
                            </span>
                            {entry.photoURL ? (
                              <img
                                src={entry.photoURL}
                                alt={entry.displayName}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-100 text-[#0B1E36] text-xs font-bold flex items-center justify-center shrink-0">
                                {entry.displayName.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-sm text-[#0B1E36]">
                                {entry.displayName}
                              </div>
                              <div className="text-xs text-slate-500 font-mono-num">
                                {entry.referralCode} · {entry.verifiedSales} Verified Sales
                              </div>
                            </div>
                          </div>
                          <div className="font-mono-num text-base font-bold text-[#0D9488]">
                            ₹{entry.totalCommission.toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: WALLET */}
              {tab === 'wallet' && overview && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0B1E36] text-white rounded-xl p-5">
                      <div className="text-xs text-slate-300">Available Balance</div>
                      <div className="font-mono-num text-2xl font-bold mt-1">
                        ₹{overview.wallet.availableBalance.toLocaleString('en-IN')}
                      </div>
                      <button
                        type="button"
                        onClick={() => selectTab('withdrawals')}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-[#0D9488] text-white text-xs font-semibold cursor-pointer"
                      >
                        Request Withdrawal
                      </button>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <div className="text-xs text-slate-500">Pending Commission</div>
                      <div className="font-mono-num text-2xl font-bold text-amber-700 mt-1">
                        ₹{overview.wallet.pendingCommission.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <div className="text-xs text-slate-500">Total Earned</div>
                      <div className="font-mono-num text-2xl font-bold text-[#16A34A] mt-1">
                        ₹{overview.wallet.totalEarned.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <div className="text-xs text-slate-500">Total Paid Out</div>
                      <div className="font-mono-num text-2xl font-bold text-[#0B1E36] mt-1">
                        ₹{overview.wallet.totalWithdrawn.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Commission History */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                    <h3 className="font-display text-base font-bold text-[#0B1E36]">
                      Commission History
                    </h3>
                    {overview.commissions.length === 0 ? (
                      <p className="text-sm text-slate-500">No commissions recorded yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-xs text-slate-500">
                              <th className="py-2 pr-4">Date</th>
                              <th className="py-2 pr-4">Buyer & Package</th>
                              <th className="py-2 pr-4">Rate</th>
                              <th className="py-2 pr-4">Commission</th>
                              <th className="py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {overview.commissions.map((c) => (
                              <tr key={c.id} className="h-11">
                                <td className="py-2 pr-4 font-mono-num text-xs text-slate-500">
                                  {new Date(c.createdAt).toLocaleDateString('en-IN')}
                                </td>
                                <td className="py-2 pr-4 text-xs text-[#0B1E36]">
                                  {c.buyerName} · {c.packageName}
                                </td>
                                <td className="py-2 pr-4 font-mono-num text-xs">{c.commissionRate}%</td>
                                <td className="py-2 pr-4 font-mono-num font-semibold text-[#0B1E36]">
                                  ₹{c.commissionAmount.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2 text-xs font-semibold capitalize">
                                  <span
                                    className={
                                      c.status === 'approved'
                                        ? 'text-[#16A34A]'
                                        : c.status === 'reversed'
                                        ? 'text-[#DC2626]'
                                        : 'text-amber-700'
                                    }
                                  >
                                    {c.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Wallet Transaction Ledger */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                    <h3 className="font-display text-base font-bold text-[#0B1E36]">
                      Wallet Transaction Ledger
                    </h3>
                    {overview.walletLedger.length === 0 ? (
                      <p className="text-sm text-slate-500">No wallet transactions yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-xs text-slate-500">
                              <th className="py-2 pr-4">Date</th>
                              <th className="py-2 pr-4">Description</th>
                              <th className="py-2 pr-4">Reference</th>
                              <th className="py-2 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {overview.walletLedger.map((tx) => (
                              <tr key={tx.id} className="h-11">
                                <td className="py-2 pr-4 font-mono-num text-xs text-slate-500">
                                  {new Date(tx.createdAt).toLocaleDateString('en-IN')}
                                </td>
                                <td className="py-2 pr-4 text-xs text-[#0B1E36]">{tx.description}</td>
                                <td className="py-2 pr-4 font-mono-num text-xs text-slate-500">
                                  {tx.referenceId}
                                </td>
                                <td
                                  className={`py-2 text-right font-mono-num font-semibold ${
                                    tx.amount >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                                  }`}
                                >
                                  {tx.amount >= 0 ? '+' : ''}₹{tx.amount.toLocaleString('en-IN')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: WITHDRAWALS */}
              {tab === 'withdrawals' && overview && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <form
                    onSubmit={handleRequestWithdrawal}
                    className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
                  >
                    <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                      Request UPI Withdrawal
                    </h2>
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span className="text-xs text-slate-600">Available Balance</span>
                      <span className="font-mono-num text-lg font-bold text-[#0B1E36]">
                        ₹{overview.wallet.availableBalance.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Withdrawal Amount (Min ₹{catalog.settings.minWithdrawal})
                      </label>
                      <input
                        type="number"
                        min={catalog.settings.minWithdrawal}
                        step="1"
                        required
                        value={wdAmount}
                        onChange={(e) => setWdAmount(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 font-mono-num text-sm focus:outline-none focus:border-[#0D9488]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Your UPI ID
                      </label>
                      <input
                        type="text"
                        required
                        value={wdUpi}
                        onChange={(e) => setWdUpi(e.target.value)}
                        placeholder="name@okicici"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 font-mono-num text-sm focus:outline-none focus:border-[#0D9488]"
                      />
                    </div>

                    {wdMsg && (
                      <div
                        className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                          wdMsg.type === 'ok'
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                            : 'bg-red-50 border border-red-200 text-red-700'
                        }`}
                      >
                        {wdMsg.type === 'ok' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{wdMsg.text}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={wdBusy}
                      className="w-full py-2.5 rounded-lg bg-[#0B1E36] hover:bg-[#132f53] text-white text-sm font-semibold disabled:opacity-60 cursor-pointer"
                    >
                      {wdBusy ? 'Processing...' : 'Submit Withdrawal Request'}
                    </button>
                  </form>

                  <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <h3 className="font-display text-base font-bold text-[#0B1E36]">
                      Withdrawal History
                    </h3>
                    {overview.withdrawals.length === 0 ? (
                      <p className="text-sm text-slate-500">No withdrawal requests submitted yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-xs text-slate-500">
                              <th className="py-2 pr-4">Date</th>
                              <th className="py-2 pr-4">UPI ID</th>
                              <th className="py-2 pr-4">Amount</th>
                              <th className="py-2 pr-4">Status</th>
                              <th className="py-2">Payout UTR</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {overview.withdrawals.map((w) => (
                              <tr key={w.id} className="h-11">
                                <td className="py-2 pr-4 font-mono-num text-xs text-slate-500">
                                  {new Date(w.createdAt).toLocaleDateString('en-IN')}
                                </td>
                                <td className="py-2 pr-4 font-mono-num text-xs">{w.upiId}</td>
                                <td className="py-2 pr-4 font-mono-num font-semibold">
                                  ₹{w.amount.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2 pr-4 text-xs font-semibold capitalize">
                                  <span
                                    className={
                                      w.status === 'paid'
                                        ? 'text-[#16A34A]'
                                        : w.status === 'rejected'
                                        ? 'text-[#DC2626]'
                                        : 'text-amber-700'
                                    }
                                  >
                                    {w.status}
                                  </span>
                                </td>
                                <td className="py-2 font-mono-num text-xs text-slate-600">
                                  {w.payoutReference || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: OFFERS */}
              {tab === 'offers' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                    Active Partner & Learner Offers
                  </h2>
                  {(overview?.offers || []).length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No promotional offers published right now. Check back soon.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(overview?.offers || []).map((o) => (
                        <div key={o.id} className="border border-slate-200 rounded-xl p-5 space-y-2">
                          <div className="text-xs font-semibold text-[#6D28D9]">
                            {o.highlight} · Valid: {o.validUntil}
                          </div>
                          <h3 className="font-display text-base font-bold text-[#0B1E36]">{o.title}</h3>
                          <p className="text-sm text-slate-600">{o.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: COMMUNITY */}
              {tab === 'community' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                    Official SavvvnLab Community Channels
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Instagram', url: catalog.settings.instagramUrl },
                      { label: 'YouTube', url: catalog.settings.youtubeUrl },
                      { label: 'Telegram', url: catalog.settings.telegramUrl },
                      { label: 'WhatsApp', url: catalog.settings.whatsappUrl },
                    ].map((ch) => (
                      <a
                        key={ch.label}
                        href={ch.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-5 rounded-xl border border-slate-200 hover:border-[#0D9488] flex items-center justify-between text-sm font-semibold text-[#0B1E36] transition-colors"
                      >
                        <span>{ch.label}</span>
                        <ExternalLink className="w-4 h-4 text-[#0D9488]" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: SUPPORT */}
              {tab === 'support' && overview && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <form
                    onSubmit={handleCreateTicket}
                    className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
                  >
                    <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                      Create Support Ticket
                    </h2>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                      <input
                        type="text"
                        required
                        value={tktSubject}
                        onChange={(e) => setTktSubject(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0D9488]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Message</label>
                      <textarea
                        rows={4}
                        required
                        value={tktMessage}
                        onChange={(e) => setTktMessage(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0D9488]"
                      />
                    </div>
                    {tktMsg && (
                      <div className={`text-xs ${tktMsg.type === 'ok' ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                        {tktMsg.text}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={tktBusy}
                      className="w-full py-2.5 rounded-lg bg-[#0B1E36] text-white text-sm font-semibold cursor-pointer"
                    >
                      {tktBusy ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                  </form>

                  <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <h3 className="font-display text-base font-bold text-[#0B1E36]">Your Tickets</h3>
                    {overview.tickets.length === 0 ? (
                      <p className="text-sm text-slate-500">No support tickets yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {overview.tickets.map((t) => (
                          <div key={t.id} className="border border-slate-200 rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-sm text-[#0B1E36]">{t.subject}</span>
                              <span className="text-xs font-semibold capitalize text-[#0D9488]">
                                {t.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">{t.message}</p>
                            {t.adminReply && (
                              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                                <strong>Admin Reply:</strong> {t.adminReply}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: PROFILE */}
              {tab === 'profile' && (
                <form
                  onSubmit={handleSaveProfile}
                  className="max-w-xl bg-white border border-slate-200 rounded-xl p-6 space-y-5"
                >
                  <h2 className="font-display text-lg font-bold text-[#0B1E36]">
                    Member Profile & UPI Payout Details
                  </h2>

                  {/* Profile Picture Uploader */}
                  {(() => {
                    const previewSrc = stagedAvatarRemove
                      ? ''
                      : stagedAvatarPreview || activePhotoUrl;
                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="relative shrink-0 w-20 h-20">
                          {previewSrc ? (
                            <img
                              src={previewSrc}
                              alt={profName || activeUser.displayName}
                              referrerPolicy="no-referrer"
                              className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-xs"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-[#0B1E36] text-white text-2xl font-bold flex items-center justify-center border-2 border-white shadow-xs">
                              {(profName || activeUser.displayName).slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <div>
                            <div className="text-sm font-semibold text-[#0B1E36]">Profile Picture</div>
                            <p className="text-xs text-slate-500">
                              Upload from mobile gallery, camera, or computer (JPG, PNG, WebP).
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1E36] hover:bg-[#132f53] text-white text-xs font-semibold cursor-pointer">
                              <Camera className="w-3.5 h-3.5" />
                              <span>{previewSrc ? 'Replace Photo' : 'Upload Photo'}</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleProfilePhotoSelect}
                                className="sr-only"
                              />
                            </label>

                            {previewSrc && (
                              <button
                                type="button"
                                onClick={() => {
                                  setStagedAvatarBlob(null);
                                  setStagedAvatarPreview('');
                                  setStagedAvatarRemove(true);
                                  setProfMsg(null);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 text-xs font-semibold cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            )}

                            {(stagedAvatarPreview || stagedAvatarRemove) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setStagedAvatarBlob(null);
                                  setStagedAvatarPreview('');
                                  setStagedAvatarRemove(false);
                                }}
                                className="px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-[#0B1E36] cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>

                          {stagedAvatarPreview && (
                            <div className="text-[11px] font-medium text-[#0D9488]">
                              Preview ready — click Save Profile to apply.
                            </div>
                          )}
                          {stagedAvatarRemove && (
                            <div className="text-[11px] font-medium text-amber-700">
                              Photo will be removed when you click Save Profile.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="text-xs text-slate-500">
                    Email: <strong className="text-[#0B1E36]">{user.email}</strong> · Code:{' '}
                    <span className="font-mono-num font-semibold">{refCode}</span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={profName}
                      onChange={(e) => setProfName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0D9488]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={profPhone}
                      onChange={(e) => setProfPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 font-mono-num text-sm focus:outline-none focus:border-[#0D9488]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Saved Payout UPI ID</label>
                    <input
                      type="text"
                      value={profUpi}
                      onChange={(e) => setProfUpi(e.target.value)}
                      placeholder="username@upi"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 font-mono-num text-sm focus:outline-none focus:border-[#0D9488]"
                    />
                  </div>
                  {profMsg && (
                    <div className={`text-xs ${profMsg.type === 'ok' ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                      {profMsg.text}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={profBusy}
                    className="px-5 py-2.5 rounded-lg bg-[#0B1E36] text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
                  >
                    {profBusy ? 'Saving...' : 'Save Profile'}
                  </button>
                </form>
              )}
            </>
          )}
        </main>
      </div>

      {/* Compact Mobile Bottom Nav (strictly <= 15% height) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-white border-t border-slate-200 grid grid-cols-4">
        {[
          { id: 'dashboard' as MemberTab, label: 'Home', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'courses' as MemberTab, label: 'Courses', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'team' as MemberTab, label: 'Team', icon: <Users className="w-4 h-4" /> },
          { id: 'wallet' as MemberTab, label: 'Wallet', icon: <Wallet className="w-4 h-4" /> },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectTab(item.id)}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
              tab === item.id ? 'text-[#0D9488] font-semibold' : 'text-slate-500'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
